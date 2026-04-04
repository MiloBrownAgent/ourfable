import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { convexQuery } from "@/lib/convex";
import { internalConvexQuery } from "@/lib/convex-internal";
import { guardianAssignedEmail } from "@/lib/email-templates/guardian-assigned";
import { buildUnsubscribeHeaders, buildUnsubscribeUrl } from "@/lib/unsubscribe-token";

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? process.env.RESEND_API_KEY ?? "";

interface GuardianRecipient {
  name: string;
  email: string;
  relationship?: string;
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(COOKIE)?.value;
    const session = sessionToken ? await verifySession(sessionToken) : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const guardians = Array.isArray((body as { guardians?: unknown[] }).guardians)
      ? ((body as { guardians: GuardianRecipient[] }).guardians)
      : [];

    if (guardians.length === 0) {
      return NextResponse.json({ error: "No guardians provided" }, { status: 400 });
    }

    const family = await convexQuery<{
      childName: string;
      parentNames?: string;
    } | null>("ourfable:getFamily", { familyId: session.familyId });
    if (!family) return NextResponse.json({ error: "Family not found" }, { status: 404 });

    if (!RESEND_API_KEY) {
      console.warn("[guardian-assigned] Missing Resend API key");
      return NextResponse.json({ success: true, skipped: true, sent: 0 });
    }

    const activeChild = await internalConvexQuery<{ childName?: string }>("ourfable:getActiveChildProfile", { familyId });
    const resolvedChildName = activeChild?.childName ?? family.childName;
    const parentNames = family.parentNames?.trim() || session.name || "A parent";
    let sent = 0;

    for (const guardian of guardians) {
      const email = guardian.email.trim().toLowerCase();
      if (!email) continue;

      const { subject, html } = guardianAssignedEmail({
        guardianName: guardian.name?.trim() || "Vault Guardian",
        guardianRelationship: guardian.relationship?.trim(),
        childName: resolvedChildName,
        parentNames,
        unsubscribeUrl: buildUnsubscribeUrl(email),
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Our Fable <hello@ourfable.ai>",
          to: [email],
          subject,
          html,
          reply_to: "hello@ourfable.ai",
          headers: buildUnsubscribeHeaders(email),
        }),
      });

      sent += 1;
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("[guardian-assigned]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
