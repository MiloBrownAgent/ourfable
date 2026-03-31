import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { verifySession, COOKIE } from "@/lib/auth";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";
import { parentInviteEmail } from "@/lib/email-templates/parent-invite";
import { buildUnsubscribeHeaders, buildUnsubscribeUrl } from "@/lib/unsubscribe-token";

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? process.env.RESEND_API_KEY;
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
      const { subject, html, text } = parentInviteEmail({
        inviterName,
        childName: family?.childName ?? childFirst,
        joinUrl,
        unsubscribeUrl: buildUnsubscribeUrl(email.toLowerCase()),
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Our Fable <hello@ourfable.ai>",
          to: [email.toLowerCase()],
          subject,
          html,
          text,
          reply_to: "hello@ourfable.ai",
          headers: buildUnsubscribeHeaders(email.toLowerCase()),
        }),
      });
    }
  } catch (err) {
    console.warn("[invite-parent] Failed to send email:", err);
  }

  return NextResponse.json({ success: true, token: inviteToken });
}
