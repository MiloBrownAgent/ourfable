import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";
import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/accounts";
import Stripe from "stripe";
import { buildUnsubscribeHeaders, buildUnsubscribeUrl } from "@/lib/unsubscribe-token";
import { escapeHtml } from "@/lib/email-templates/escape-html";

// STRIPE_SECRET_KEY checked at request time
function getStripe() { if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY required"); return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" }); }
export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: string };

  if (!password) {
    return NextResponse.json({ error: "Password required for confirmation" }, { status: 400 });
  }

  // Get account
  const family = await internalConvexQuery("ourfable:getOurFableFamilyById", { familyId: session.familyId }) as {
    email: string;
    passwordHash: string;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
  } | null;

  if (!family) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Verify password
  if (!verifyPassword(password, family.passwordHash)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Cancel Stripe subscription if active
  if (family.stripeSubscriptionId) {
    try {
      await getStripe().subscriptions.cancel(family.stripeSubscriptionId);
      console.log(`[delete-account] Cancelled Stripe subscription ${family.stripeSubscriptionId}`);
    } catch (err) {
      console.warn("[delete-account] Failed to cancel Stripe subscription (may already be cancelled):", err);
    }
  }

  // Soft delete in Convex
  await internalConvexMutation("ourfable:softDeleteOurFableFamily", { familyId: session.familyId });

  // Delete Stripe customer if exists
  if (family.stripeCustomerId) {
    try {
      await getStripe().customers.del(family.stripeCustomerId);
      console.log(`[delete-account] Deleted Stripe customer ${family.stripeCustomerId}`);
    } catch (e) {
      console.error("[delete-account] Stripe customer delete failed:", e);
    }
  }

  // Send deletion confirmation email with export link
  try {
    const RESEND_KEY = process.env.RESEND_FULL_API_KEY;
    if (RESEND_KEY && family.email) {
      const childName = (await internalConvexQuery("ourfable:getOurFableFamilyById", { familyId: session.familyId }) as { childName?: string } | null)?.childName ?? "your child";
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Our Fable <hello@ourfable.ai>",
          to: family.email,
          subject: `Your Our Fable account has been deleted — download ${childName.split(" ")[0]}'s vault`,
          html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="color-scheme" content="light"/></head><body style="margin:0;padding:0;background:#FDFBF7;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px;background:#FDFBF7;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;"><tr><td align="center" style="padding-bottom:28px;"><div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#4A5E4C;letter-spacing:-0.01em;">Our Fable</div><div style="width:32px;height:1.5px;background:#C8A87A;margin:10px auto 0;"></div></td></tr><tr><td style="background:#FFFFFF;border-radius:16px;border:1px solid #EAE7E1;padding:40px;"><p style="margin:0 0 24px;font-family:Georgia,serif;font-size:24px;color:#1A1A1A;line-height:1.3;">Your account has been deleted.</p><p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">We're sorry to see you go. Your data will be permanently removed in <strong>60 days</strong>.</p><p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">Before that happens, you can download everything — every letter, photo, voice memo, and video in ${escapeHtml(childName.split(" ")[0])}'s vault.</p><table cellpadding="0" cellspacing="0"><tr><td style="border-radius:100px;background:#4A5E4C;"><a href="https://ourfable.ai/api/ourfable/export" style="display:inline-block;padding:14px 32px;font-family:-apple-system,sans-serif;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">Download your vault</a></td></tr></table><p style="margin:24px 0 0;font-family:-apple-system,sans-serif;font-size:13px;color:#9A9590;line-height:1.6;">We'll send you weekly reminders until day 60. If you change your mind, just sign up again with the same email — we'll restore everything.</p></td></tr><tr><td align="center" style="padding-top:20px;"><p style="font-family:-apple-system,sans-serif;font-size:11px;color:#B0A9A0;">Our Fable · ourfable.ai</p><p style="margin:8px 0 0;font-family:-apple-system,sans-serif;font-size:10px;color:#B0A9A0;"><a href="${buildUnsubscribeUrl(family.email)}" style="color:#B0A9A0;text-decoration:underline;">Unsubscribe</a></p></td></tr></table></td></tr></table></body></html>`,
          headers: buildUnsubscribeHeaders(family.email),
        }),
      });
      console.log(`[delete-account] Sent deletion confirmation email to ${family.email}`);
    }
  } catch (emailErr) {
    console.error("[delete-account] Failed to send deletion email:", emailErr);
  }

  // Clear session cookie
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  console.log(`[delete-account] Soft deleted family ${session.familyId}`);
  return res;
}
