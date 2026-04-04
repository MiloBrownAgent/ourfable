import { internalConvexQuery } from "@/lib/convex-internal";
import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { convexQuery, convexMutation } from "@/lib/convex";
import { dispatchEmail } from "@/lib/email-templates/dispatch";
import { buildUnsubscribeHeaders, buildUnsubscribeUrl } from "@/lib/unsubscribe-token";
import crypto from "crypto";

function generateViewToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? "";

async function sendEmail({
  from, to, subject, html, text, replyTo, headers,
}: {
  from: string; to: string; subject: string; html: string; text: string;
  replyTo?: string; headers?: Record<string, string>;
}) {
  if (!RESEND_API_KEY) throw new Error("RESEND_FULL_API_KEY not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from, to, subject, html, text, reply_to: replyTo, headers }),
  });
  if (!res.ok) throw new Error(`Resend API error: ${await res.text()}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const sessionToken = req.cookies.get(COOKIE)?.value;
    const session = sessionToken ? await verifySession(sessionToken) : null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, messageBody, mediaUrls, mediaType, memberIds, sentToAll, childId, dispatchTarget } = body;
    const familyId = session.familyId;
    const sentByName = body.sentByName;

    if (!familyId) return NextResponse.json({ error: "familyId is required" }, { status: 400 });
    if (!sentByName) return NextResponse.json({ error: "sentByName is required" }, { status: 400 });
    if (!subject) return NextResponse.json({ error: "subject is required" }, { status: 400 });

    // ── Fetch family ──────────────────────────────────────────────────────────
    const family = await convexQuery<Record<string, unknown>>("ourfable:getFamily", { familyId });
    if (!family) return NextResponse.json({ error: "Family not found" }, { status: 404 });

    // planType lives on ourfable_families, plan on ourfable_vault_families — check both
    let isPlus = family.planType === "plus" || family.plan === "plus" || family.plan === "pilot";
    if (!isPlus) {
      // Fall back to ourfable_families for planType
      const accountData = await internalConvexQuery<{ planType?: string; email?: string } | null>(
        "ourfable:getOurFableFamilyById", { familyId }
      );
      isPlus = accountData?.planType === "plus" || accountData?.planType === "pilot";
    }

    const accountData = await internalConvexQuery<{ planType?: string; email?: string } | null>(
      "ourfable:getOurFableFamilyById", { familyId }
    ).catch(() => null);
    const parentReplyTo = accountData?.email || session.email || "hello@ourfable.ai";

    // ── Fetch circle ──────────────────────────────────────────────────────────
    let allMembers = await convexQuery<Array<{
      _id: string; name: string; email?: string; isInnerRing?: boolean;
    }>>(
      childId && dispatchTarget !== "family" ? "ourfable:listOurFableCircleMembersForChild" : "ourfable:listCircle",
      childId && dispatchTarget !== "family" ? { familyId, childId } : { familyId }
    ).catch(() => []);

    // Child-scoped circle data is still being migrated. If a child-targeted lookup
    // returns nothing, fall back to the legacy family-level circle so Dispatches
    // keep working for existing families.
    if (allMembers.length === 0 && childId && dispatchTarget !== "family") {
      allMembers = await convexQuery<Array<{
        _id: string; name: string; email?: string; isInnerRing?: boolean;
      }>>("ourfable:listCircle", { familyId }).catch(() => []);
    }

    // ── Tier gating ───────────────────────────────────────────────────────────
    // Base plan: inner ring members only
    // Plus plan: full circle
    let eligibleMembers = allMembers.filter(m => m.email);
    if (!isPlus) {
      eligibleMembers = eligibleMembers.filter(m => m.isInnerRing === true);
      if (eligibleMembers.length === 0) {
        return NextResponse.json({
          error: "no_inner_ring",
          message: "Dispatches to your full circle require Our Fable+. Add inner ring members to dispatch to them on your current plan.",
        }, { status: 403 });
      }
    }

    // ── Filter by selected recipients ─────────────────────────────────────────
    const recipients = sentToAll
      ? eligibleMembers
      : eligibleMembers.filter(m => memberIds?.includes(m._id));

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No eligible recipients" }, { status: 400 });
    }

    const viewToken = generateViewToken();
    const viewUrl = `https://ourfable.ai/view/${viewToken}`;
    const activeChild = await internalConvexQuery<{ childName?: string }>("ourfable:getActiveChildProfile", { familyId, childId: childId ?? undefined });
    const resolvedChildName = activeChild?.childName ?? family.childName;
    const results: Array<{ name: string; success: boolean; error?: string }> = [];

    // ── Send to each recipient ────────────────────────────────────────────────
    for (const member of recipients) {
      try {
        const { subject: emailSubject, html, text } = dispatchEmail({
          recipientName: member.name,
          childName: resolvedChildName,
          sentByName,
          subject,
          body: messageBody ?? "",
          mediaUrls: mediaUrls ?? [],
          mediaType: mediaType ?? "",
          viewUrl: mediaType === "video" ? viewUrl : undefined,
          unsubscribeUrl: buildUnsubscribeUrl(member.email!),
        });

        await sendEmail({
          from: `${sentByName} via Our Fable <hello@ourfable.ai>`,
          to: member.email!,
          subject: emailSubject,
          html,
          text,
          replyTo: parentReplyTo,
          headers: buildUnsubscribeHeaders(member.email!),
        });

        results.push({ name: member.name, success: true });
      } catch (e) {
        results.push({ name: member.name, success: false, error: String(e) });
      }
    }

    // ── Record dispatch in Convex ─────────────────────────────────────────────
    await convexMutation("ourfable:createOurFableDispatch", {
      familyId,
      childId: childId ?? undefined,
      type: mediaType || "text",
      content: subject,
      body: messageBody ?? "",
      mediaUrls: mediaUrls ?? [],
      sentTo: dispatchTarget === "family" ? "family" : sentToAll ? "all" : "selected",
      sentByName,
      recipientCount: results.filter(r => r.success).length,
      viewToken,
    }).catch(() => {}); // non-blocking

    return NextResponse.json({
      success: true,
      sent: results.filter(r => r.success).length,
      total: recipients.length,
      planGated: !isPlus,
      results,
    });

  } catch (e) {
    console.error("[ourfable/send-outgoing]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
