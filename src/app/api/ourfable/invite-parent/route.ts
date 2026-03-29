import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { verifySession, COOKIE } from "@/lib/auth";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ourfable.ai";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { email, encryptedFamilyKeyForInvite, inviteKeySalt } = body as {
    email?: string;
    encryptedFamilyKeyForInvite?: string;
    inviteKeySalt?: string;
  };

  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // Check if this email is already a user in this family
  const existingUser = await internalConvexQuery<{ familyId: string } | null>(
    "ourfable:getOurFableUserByEmail", { email: email.toLowerCase() }
  );
  if (existingUser && existingUser.familyId === session.familyId) {
    return NextResponse.json({ error: "This person already has an account for this family" }, { status: 400 });
  }

  // Check if there are already 2 users in this family
  const familyUsers = await internalConvexQuery<Array<{ _id: string }>>(
    "ourfable:listOurFableUsersByFamily", { familyId: session.familyId }
  );
  if (familyUsers && familyUsers.length >= 2) {
    return NextResponse.json({ error: "This family already has two parent accounts" }, { status: 400 });
  }

  // Get inviter info
  const inviterName = session.name ?? "A parent";
  const inviterUserId = session.userId ?? "";

  // Get family info for the email
  const family = await internalConvexQuery<{
    childName: string;
    parentNames?: string;
  } | null>("ourfable:getOurFableFamilyById", { familyId: session.familyId });

  const childFirst = family?.childName?.split(" ")[0] ?? "your child";

  // Generate invite token
  const inviteToken = crypto.randomBytes(32).toString("hex");

  // Create invite record
  await internalConvexMutation("ourfable:createParentInvite", {
    familyId: session.familyId,
    invitedByUserId: inviterUserId,
    invitedByName: inviterName,
    email: email.toLowerCase(),
    token: inviteToken,
    encryptedFamilyKeyForInvite,
    inviteKeySalt,
  });

  // Send invite email
  const joinUrl = `${BASE_URL}/join-parent/${inviteToken}`;
  try {
    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Our Fable <hello@ourfable.ai>",
          to: [email.toLowerCase()],
          subject: `${inviterName} invited you to co-manage ${childFirst}'s Fable`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #1A1A18;">
              <h1 style="color: #4A5E4C; font-size: 24px;">${inviterName} invited you to join ${childFirst}'s Fable</h1>
              <p style="font-size: 16px; line-height: 1.7; color: #444;">
                You've been invited to co-manage ${childFirst}'s memory vault on Our Fable. 
                You'll have your own login and can write letters, send dispatches, and manage the circle — 
                all while sharing the same vault.
              </p>
              <a href="${joinUrl}" style="display: inline-block; padding: 14px 32px; background: #4A5E4C; color: #fff; text-decoration: none; border-radius: 100px; font-weight: 600; font-size: 15px; margin: 20px 0;">
                Accept invite
              </a>
              <p style="font-size: 13px; color: #888; margin-top: 24px;">
                This invite expires in 7 days. If you didn't expect this, you can safely ignore it.
              </p>
            </div>
          `,
        }),
      });
    }
  } catch (err) {
    console.warn("[invite-parent] Failed to send email:", err);
  }

  return NextResponse.json({ success: true, token: inviteToken });
}
