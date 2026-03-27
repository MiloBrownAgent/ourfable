import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { CONVEX_URL } from "@/lib/convex";
import { dispatchEmail } from "@/lib/email-templates/dispatch";
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
    const { subject, messageBody, mediaUrls, mediaType, memberIds, sentToAll } = body;
    const familyId = body.familyId ?? session.familyId;
    const sentByName = body.sentByName;

    if (!familyId) return NextResponse.json({ error: "familyId is required" }, { status: 400 });
    if (!sentByName) return NextResponse.json({ error: "sentByName is required" }, { status: 400 });
    if (!subject) return NextResponse.json({ error: "subject is required" }, { status: 400 });

    // ── Fetch family ──────────────────────────────────────────────────────────
    const familyRes = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId }, format: "json" }),
    });
    const familyData = await familyRes.json();
    const family = familyData.value;
    if (!family) return NextResponse.json({ error: "Family not found" }, { status: 404 });

    // planType lives on ourfable_families, plan on ourfable_vault_families — check both
    let isPlus = family.planType === "plus" || family.plan === "plus" || family.plan === "pilot";
    if (!isPlus) {
      // Fall back to ourfable_families for planType
      const accountRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:getOurFableFamilyById", args: { familyId }, format: "json" }),
      });
      const accountData = await accountRes.json();
      isPlus = accountData.value?.planType === "plus" || accountData.value?.planType === "pilot";
    }

    // ── Fetch circle ──────────────────────────────────────────────────────────
    const circleRes = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:listCircle", args: { familyId }, format: "json" }),
    });
    const circleData = await circleRes.json();
    const allMembers: Array<{
      _id: string; name: string; email?: string; isInnerRing?: boolean;
    }> = circleData.value ?? [];

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

    const cFirst = family.childName.split(" ")[0];
    const viewToken = generateViewToken();
    const viewUrl = `https://ourfable.ai/view/${viewToken}`;
    const results: Array<{ name: string; success: boolean; error?: string }> = [];

    // ── Send to each recipient ────────────────────────────────────────────────
    for (const member of recipients) {
      try {
        const { subject: emailSubject, html, text } = dispatchEmail({
          recipientName: member.name,
          childName: family.childName,
          sentByName,
          subject,
          body: messageBody ?? "",
          mediaUrls: mediaUrls ?? [],
          mediaType: mediaType ?? "",
          viewUrl: mediaType === "video" ? viewUrl : undefined,
        });

        await sendEmail({
          from: `${cFirst} via Our Fable <hello@ourfable.ai>`,
          to: member.email!,
          subject: emailSubject,
          html,
          text,
          replyTo: "hello@ourfable.ai",
          headers: {
            "List-Unsubscribe": "<https://ourfable.ai/unsubscribe>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        results.push({ name: member.name, success: true });
      } catch (e) {
        results.push({ name: member.name, success: false, error: String(e) });
      }
    }

    // ── Record dispatch in Convex ─────────────────────────────────────────────
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "ourfable:createOurFableDispatch",
        args: {
          familyId,
          type: mediaType || "text",
          content: subject,
          body: messageBody ?? "",
          mediaUrls: mediaUrls ?? [],
          sentTo: sentToAll ? "all" : "selected",
          sentByName,
          recipientCount: results.filter(r => r.success).length,
          viewToken,
        },
        format: "json",
      }),
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
