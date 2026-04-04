import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { verifySession, COOKIE } from "@/lib/auth";
import { convexQuery, convexMutation } from "@/lib/convex";
import { escapeHtml } from "@/lib/email-templates/escape-html";
import { buildUnsubscribeHeaders, buildUnsubscribeUrl } from "@/lib/unsubscribe-token";

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? "";

// Rate limiting via Convex: max 3 deliveries per hour per family
const MAX_DELIVERIES_PER_HOUR = 3;

async function checkDeliveryRateLimit(familyId: string): Promise<{ allowed: boolean }> {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  try {
    const count = await convexQuery<number>("ourfable:countRecentDeliveries", { familyId, since: oneHourAgo });
    return { allowed: (count ?? 0) < MAX_DELIVERIES_PER_HOUR };
  } catch {
    // If Convex is down, allow delivery (fail open for this critical feature)
    return { allowed: true };
  }
}
export async function POST(req: NextRequest) {
  // ── Authentication ──────────────────────────────────────────────────────────
  const sessionToken = req.cookies.get(COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const { familyId: sessionFamilyId } = session;

  const { familyId, milestoneId, childEmail } = await req.json();

  if (!familyId || !childEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Ensure the authenticated user owns this family
  if (familyId !== sessionFamilyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Rate limiting ───────────────────────────────────────────────────────────
  const { allowed } = await checkDeliveryRateLimit(familyId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many deliveries. Max 3 per hour." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  const family = await convexQuery("ourfable:getOurFableFamilyById", { familyId }) as {
    childName: string;
    parentNames?: string;
  } | null;

  if (!family) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  const childFirst = family.childName.split(" ")[0];
  const token = crypto.randomBytes(16).toString("hex");

  // Create delivery token
  await convexMutation("ourfable:createOurFableDeliveryToken", {
    token,
    familyId,
    milestoneId: milestoneId || undefined,
    type: "delivery",
    childEmail,
  });

  // Update milestone status if provided
  if (milestoneId) {
    await convexMutation("ourfable:updateOurFableDeliveryMilestoneStatus", {
      milestoneId,
      deliveryStatus: "delivered",
      deliveredAt: Date.now(),
      deliveryToken: token,
      notificationTimestamp: new Date().toISOString(),
    });
  }

  // Send delivery email to child — THE most important email in the product
  if (RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Our Fable <hello@ourfable.ai>",
        to: childEmail,
        subject: "Someone's been writing to you",
        headers: buildUnsubscribeHeaders(childEmail),
        html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0D0F0B;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0D0F0B" style="padding:80px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:40px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#F5F2ED;letter-spacing:-0.01em;">Our Fable</div>
          <div style="width:36px;height:1.5px;background:#C8A87A;margin:12px auto 0;"></div>
        </td></tr>
        <tr><td style="background:rgba(255,255,255,0.04);border-radius:20px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          <table width="100%"><tr><td style="background:linear-gradient(135deg,#4A5E4C,#6B8F6F);height:2px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:56px 44px;">
            <p style="margin:0 0 32px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#F5F2ED;line-height:1.25;">Someone&rsquo;s been writing to you.</p>
            <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:rgba(245,242,237,0.7);line-height:1.8;">Before you could read. Before you could walk. Before you knew any of their names — the people who love you most have been leaving you letters, photos, and voice memos.</p>
            <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:rgba(245,242,237,0.7);line-height:1.8;">They sealed them away, waiting for this exact moment.</p>
            <p style="margin:0 0 40px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:rgba(245,242,237,0.7);line-height:1.8;">Your vault is ready, ${escapeHtml(childFirst)}.</p>
            <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
              <a href="https://ourfable.ai/delivery/${token}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#4A5E4C,#6B8F6F);color:#F5F2ED;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;letter-spacing:0.02em;">Open your vault</a>
            </td></tr></table>
          </td></tr></table>
        </td></tr>
        <tr><td align="center" style="padding-top:32px;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:rgba(245,242,237,0.3);">Our Fable · New York, NY</p>
          <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:rgba(245,242,237,0.2);"><a href="${buildUnsubscribeUrl(childEmail)}" style="color:rgba(245,242,237,0.2);text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      }),
    });
  }

  return NextResponse.json({ success: true, token }, {
    headers: { "X-RateLimit-Remaining": "ok" },
  });
}
