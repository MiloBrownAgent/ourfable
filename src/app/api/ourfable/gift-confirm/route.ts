import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/auth";
import { convexMutation } from "@/lib/convex";
import { buildUnsubscribeHeaders, buildUnsubscribeUrl } from "@/lib/unsubscribe-token";
import { escapeHtml } from "@/lib/email-templates/escape-html";

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? "";

async function sendEmail({ from, to, subject, html, headers }: { from: string; to: string; subject: string; html: string; headers?: Record<string, string> }) {
  if (!RESEND_API_KEY) throw new Error("RESEND_FULL_API_KEY not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from, to, subject, html, headers }),
  });
  if (!res.ok) throw new Error(`Resend API error: ${await res.text()}`);
  return res.json();
}

function purchaserHtml({ purchaserName, recipientName, giftCode, unsubscribeUrl }: { purchaserName: string; recipientName?: string; giftCode: string; unsubscribeUrl: string }) {
  const recipient = recipientName ?? "them";
  const redeemUrl = `https://ourfable.ai/redeem/${giftCode}`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Your Our Fable gift</title></head>
<body style="margin:0;padding:0;background:#F5F2ED;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F2ED" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;"><span style="font-family:Georgia,serif;font-size:12px;color:#6B7C6E;letter-spacing:0.22em;text-transform:uppercase;">Our Fable</span></td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            <p style="margin:0 0 8px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Your Our Fable gift is ready</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.3;">Hi ${escapeHtml(purchaserName)} —</p>
            <p style="margin:0 0 20px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">You've given ${escapeHtml(recipient)} something that will last 18 years. Their gift code is below.</p>
            <div style="background:#F8F5F0;border:1px solid #E0DDD7;border-radius:12px;padding:20px 24px;text-align:center;margin:0 0 28px;">
              <p style="margin:0 0 4px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">Gift Code</p>
              <p style="margin:0;font-family:Georgia,serif;font-size:32px;font-weight:400;color:#4A5E4C;letter-spacing:0.08em;">${escapeHtml(giftCode)}</p>
            </div>
            <p style="margin:0 0 28px;font-family:-apple-system,sans-serif;font-size:14px;color:#6A6660;line-height:1.7;">Share this code with ${escapeHtml(recipient)}, or send them this link:</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4A5E4C;">
              <a href="${redeemUrl}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Give them this link →</a>
            </td></tr></table>
          </td></tr></table>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#A09890;">Our Fable · Made with love</p>
          <p style="margin:8px 0 0;font-family:-apple-system,sans-serif;font-size:10px;color:#B0A9A0;"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#B0A9A0;text-decoration:underline;">Unsubscribe</a></p>
          <p style="margin:6px 0 0;font-family:-apple-system,sans-serif;font-size:10px;color:#B0A9A0;">Our Fable · New York, NY</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function recipientHtml({ purchaserName, recipientName, message, giftCode, unsubscribeUrl }: { purchaserName: string; recipientName?: string; message?: string; giftCode: string; unsubscribeUrl: string }) {
  const redeemUrl = `https://ourfable.ai/redeem/${giftCode}`;
  const rFirst = (recipientName ?? "").split(" ")[0] || "there";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>You've been given Our Fable</title></head>
<body style="margin:0;padding:0;background:#F5F2ED;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F2ED" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;"><span style="font-family:Georgia,serif;font-size:12px;color:#6B7C6E;letter-spacing:0.22em;text-transform:uppercase;">Our Fable</span></td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            <p style="margin:0 0 8px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">A gift from ${escapeHtml(purchaserName)}</p>
            <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.3;">Hi ${escapeHtml(rFirst)} —</p>
            <p style="margin:0 0 20px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">${escapeHtml(purchaserName)} gave your child Our Fable — a private memory vault that interviews the people in your child's life, every month, and holds every answer until your child is ready.</p>
            ${message ? `<div style="border-left:3px solid #C8D4C9;padding:12px 16px;margin:0 0 24px;"><p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#4A4A4A;line-height:1.75;font-style:italic;">"${escapeHtml(message)}"</p></div>` : ""}
            <p style="margin:0 0 28px;font-family:-apple-system,sans-serif;font-size:14px;color:#6A6660;line-height:1.7;">Start their vault with your gift code:</p>
            <div style="background:#F8F5F0;border:1px solid #E0DDD7;border-radius:12px;padding:20px 24px;text-align:center;margin:0 0 28px;">
              <p style="margin:0 0 4px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">Gift Code</p>
              <p style="margin:0;font-family:Georgia,serif;font-size:32px;font-weight:400;color:#4A5E4C;letter-spacing:0.08em;">${escapeHtml(giftCode)}</p>
            </div>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4A5E4C;">
              <a href="${redeemUrl}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Begin their story →</a>
            </td></tr></table>
          </td></tr></table>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#A09890;">Our Fable · Made with love</p>
          <p style="margin:8px 0 0;font-family:-apple-system,sans-serif;font-size:10px;color:#B0A9A0;"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#B0A9A0;text-decoration:underline;">Unsubscribe</a></p>
          <p style="margin:6px 0 0;font-family:-apple-system,sans-serif;font-size:10px;color:#B0A9A0;">Our Fable · New York, NY</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP — 5 gift confirmations per 15 minutes
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    const { allowed } = checkRateLimit(`gift-confirm:${ip}`, 5, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const { purchaserName, purchaserEmail, recipientName, recipientEmail, message } = body;
    if (!purchaserName || !purchaserEmail) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    // Create gift in Convex
    const giftCode = await convexMutation<string>("ourfable:createGift", { purchaserName, purchaserEmail, recipientName, recipientEmail, message });
    if (!giftCode) return NextResponse.json({ error: "Failed to create gift" }, { status: 500 });

    // Email purchaser
    await sendEmail({
      from: `Our Fable <hello@ourfable.ai>`,
      to: purchaserEmail,
      subject: `Your Our Fable gift code: ${giftCode}`,
      html: purchaserHtml({ purchaserName, recipientName, giftCode, unsubscribeUrl: buildUnsubscribeUrl(purchaserEmail) }),
      headers: buildUnsubscribeHeaders(purchaserEmail),
    });

    // Email recipient if provided
    if (recipientEmail) {
      await sendEmail({
        from: `Our Fable <hello@ourfable.ai>`,
        to: recipientEmail,
        subject: `${purchaserName} gave your child Our Fable`,
        html: recipientHtml({ purchaserName, recipientName, message, giftCode, unsubscribeUrl: buildUnsubscribeUrl(recipientEmail) }),
        headers: buildUnsubscribeHeaders(recipientEmail),
      });
    }

    return NextResponse.json({ success: true, giftCode });
  } catch (e) {
    console.error("[gift-confirm]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
