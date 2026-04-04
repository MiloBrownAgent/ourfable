import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { internalConvexMutation, internalConvexQuery } from "@/lib/convex-internal";
import { buildUnsubscribeHeaders, buildUnsubscribeUrl } from "@/lib/unsubscribe-token";
import { escapeHtml } from "@/lib/email-templates/escape-html";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

function formatAmount(cents: number | null | undefined, currency: string | null | undefined): string {
  if (typeof cents !== "number") return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "USD").toUpperCase(),
  }).format(cents / 100);
}

function formatDate(timestampSeconds: number | null | undefined): string {
  if (!timestampSeconds) return "";
  return new Date(timestampSeconds * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function sendReminderEmail(args: {
  email: string;
  childFirst: string;
  planLabel: string;
  amountLabel: string;
  renewsOn: string;
}) {
  const apiKey = process.env.RESEND_FULL_API_KEY ?? "";
  if (!apiKey) throw new Error("RESEND_FULL_API_KEY required");
  const headers = buildUnsubscribeHeaders(args.email);
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Your annual renewal is coming up</title></head>
<body style="margin:0;padding:0;background:#F5F2ED;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F2ED" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#4A5E4C;letter-spacing:-0.01em;">Our Fable</div>
          <div style="width:32px;height:1.5px;background:#C8A87A;margin:10px auto 0;"></div>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Annual renewal reminder</p>
            <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1A1A18;line-height:1.25;">${escapeHtml(args.childFirst)}'s vault renews soon.</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">Just a note that your annual ${escapeHtml(args.planLabel)} subscription is set to renew on ${escapeHtml(args.renewsOn)} for ${escapeHtml(args.amountLabel)}.</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">Nothing needs your attention if you&apos;d like everything to continue normally. We just want billing to feel clear, calm, and unsurprising.</p>
            <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#9A9590;line-height:1.75;">Your vault remains active, your memories stay protected, and your family can keep adding to it without interruption.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:100px;background:#4A5E4C;">
              <a href="https://ourfable.ai/login" style="display:inline-block;padding:13px 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Review your account →</a>
            </td></tr></table>
          </td></tr></table>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9A9590;">ourfable.ai</p>
          <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#B0A9A0;"><a href="https://ourfable.ai/unsubscribe" style="color:#B0A9A0;text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Our Fable <hello@ourfable.ai>",
      to: args.email,
      subject: `Your annual Our Fable renewal is coming up`,
      html: html.replaceAll("https://ourfable.ai/unsubscribe", buildUnsubscribeUrl(args.email)),
      headers,
    }),
  });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const families = await internalConvexQuery<Array<{
    familyId: string;
    email: string;
    childName: string;
    planType: string;
    stripeSubscriptionId?: string;
    subscriptionStatus: string;
    lastAnnualRenewalReminderFor?: string;
  }>>("ourfable:listActiveOurFableFamilies", {});

  const stripe = getStripe();
  const now = Math.floor(Date.now() / 1000);
  const remindWindowStart = 13 * 24 * 60 * 60;
  const remindWindowEnd = 15 * 24 * 60 * 60;
  let sent = 0;

  for (const family of families) {
    if (!family.stripeSubscriptionId || !family.email) continue;
    try {
      const subscription = await stripe.subscriptions.retrieve(family.stripeSubscriptionId);
      const item = subscription.items.data[0];
      const interval = item?.price?.recurring?.interval;
      if (interval !== "year") continue;
      const currentPeriodEnd = subscription.items.data[0]?.current_period_end ?? subscription.current_period_end;
      if (!currentPeriodEnd) continue;
      const secondsUntilRenewal = currentPeriodEnd - now;
      if (secondsUntilRenewal < remindWindowStart || secondsUntilRenewal > remindWindowEnd) continue;
      const reminderKey = String(currentPeriodEnd);
      if (family.lastAnnualRenewalReminderFor === reminderKey) continue;
      const activeChild = await internalConvexQuery<{ childName?: string }>("ourfable:getActiveChildProfile", { familyId: family.familyId });
      await sendReminderEmail({
        email: family.email,
        childFirst: (activeChild?.childName ?? family.childName).split(" ")[0],
        planLabel: family.planType === "plus" ? "Our Fable+" : "Our Fable",
        amountLabel: formatAmount(item?.price?.unit_amount ?? 0, item?.price?.currency ?? "usd"),
        renewsOn: formatDate(currentPeriodEnd),
      });
      await internalConvexMutation("ourfable:updateOurFableBillingEmailState", {
        familyId: family.familyId,
        lastAnnualRenewalReminderFor: reminderKey,
      });
      sent += 1;
    } catch (err) {
      console.warn("[renewal-reminders] skipped family", family.familyId, err);
    }
  }

  return NextResponse.json({ success: true, sent });
}
