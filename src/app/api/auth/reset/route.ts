import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { CONVEX_URL } from "@/lib/convex";

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? "";

async function convexQuery(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

async function convexMutation(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.34.0" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) throw new Error(`Convex mutation failed: ${await res.text()}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    // Check if account exists (don't reveal if it doesn't — always return success)
    const account = await convexQuery("ourfable:getOurFableFamilyByEmail", { email: normalized });

    if (account) {
      // Generate reset token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

      await convexMutation("ourfable:createPasswordReset", {
        email: normalized,
        token,
        expiresAt,
      });

      // Send reset email
      const resetUrl = `https://ourfable.ai/reset-password?token=${token}&email=${encodeURIComponent(normalized)}`;

      if (RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Our Fable <hello@ourfable.ai>",
            to: normalized,
            subject: "Reset your Our Fable password",
            headers: {
              "List-Unsubscribe": "<https://ourfable.ai/unsubscribe>",
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
            html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Reset your password</title></head>
<body style="margin:0;padding:0;background:#F5F2ED;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F2ED" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background:#F0F5F0;display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#4A5E4C;">Our Fable</span>
          </div>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.3;">Reset your password</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">We received a request to reset your Our Fable password. Click the button below to choose a new one.</p>
            <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6A6660;line-height:1.7;">This link expires in 1 hour.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4A5E4C;">
              <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Reset password →</a>
            </td></tr></table>
            <p style="margin:28px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9A9590;line-height:1.7;">If you didn't request this, you can safely ignore this email.</p>
          </td></tr></table>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A09890;">Our Fable · Made with love</p>
          <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#B0A9A0;"><a href="https://ourfable.ai/unsubscribe" style="color:#B0A9A0;text-decoration:underline;">Unsubscribe</a></p>
          <p style="margin:4px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#B0A9A0;">Our Fable · New York, NY</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
          }),
        });
      }
    }

    // Always return success (don't reveal whether email exists)
    return NextResponse.json({ success: true, message: "If an account exists with that email, a reset link has been sent." });
  } catch (e) {
    console.error("[auth/reset]", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
