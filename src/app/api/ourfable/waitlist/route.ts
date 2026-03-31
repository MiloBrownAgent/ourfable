import { NextRequest, NextResponse } from "next/server";
import { waitlistWelcomeEmail } from "../../../../lib/email-templates/waitlist-welcome";
import { buildUnsubscribeHeaders, buildUnsubscribeUrl } from "@/lib/unsubscribe-token";
import { escapeHtml } from "@/lib/email-templates/escape-html";
import { convexMutation } from "@/lib/convex";
import { appendWaitlistRow, ensureSheetHeaders } from "@/lib/google-sheets";
import crypto from "crypto";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FULL_KEY = process.env.RESEND_FULL_API_KEY ?? "";
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN ?? "";

const FOUNDING_OFFER = {
  standardAnnualPrice: 79,
  standardAnnualCompareAt: 99,
  plusAnnualPrice: 99,
  plusAnnualCompareAt: 149,
} as const;

type NonCriticalWarning = string;

async function responseError(name: string, response: Response): Promise<Error> {
  const body = await response.text().catch(() => "");
  return new Error(`${name} failed with ${response.status}${body ? `: ${body}` : ""}`);
}

async function runNonCritical(
  name: string,
  effect: () => Promise<void | { ok: boolean; skipped?: boolean; reason?: string }>
): Promise<NonCriticalWarning | undefined> {
  try {
    const result = await effect();
    if (result && result.ok === false) {
      const message = result.reason ?? `${name} did not complete`;
      const logger = result.skipped ? console.warn : console.error;
      logger(`[waitlist] ${name}: ${message}`);
      return `${name}: ${message}`;
    }
    return undefined;
  } catch (err) {
    console.error(`[waitlist] ${name} failed`, err);
    return `${name} failed`;
  }
}

// ── Meta Conversions API (server-side) ─────────────────────────────────────
async function sendCapiEvent(email: string, req: NextRequest, source: string, eventId?: string) {
  if (!META_PIXEL_ID || !META_CAPI_TOKEN) return;

  const hashedEmail = crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ua = req.headers.get("user-agent") ?? "";
  const fbc = req.cookies.get("_fbc")?.value ?? "";
  const fbp = req.cookies.get("_fbp")?.value ?? "";

  const eventData = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId || undefined,
        event_source_url: req.headers.get("referer") ?? "https://ourfable.ai",
        action_source: "website",
        user_data: {
          em: [hashedEmail],
          client_ip_address: ip || undefined,
          client_user_agent: ua || undefined,
          fbc: fbc || undefined,
          fbp: fbp || undefined,
        },
        custom_data: {
          source,
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      }
    );
    if (!res.ok) {
      throw await responseError("Meta CAPI", res);
    }
  } catch (err) {
    console.error("Meta CAPI error:", err);
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      email,
      childName,
      childBirthday,
      source,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      eventId,
      referralCode,
      requestedPlanType,
    } = await req.json();

    if (!email || !String(email).includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanSource = source || "homepage";
    const cleanReferralCode = referralCode ? String(referralCode).trim().toUpperCase() : undefined;
    const normalizedPlanType = requestedPlanType ? String(requestedPlanType).trim().toLowerCase() : undefined;
    const cleanRequestedPlanType =
      normalizedPlanType === "standard" || normalizedPlanType === "plus"
        ? normalizedPlanType
        : undefined;
    const foundingPriceLockedAt = Date.now();

    // 1. Save to Convex (deduplicates)
    const convexBody: Record<string, string> = {
      email: cleanEmail,
      source: cleanSource,
    };
    if (childName) convexBody.childName = String(childName).trim();
    if (childBirthday) convexBody.childBirthday = String(childBirthday);
    if (utm_source) convexBody.utm_source = String(utm_source);
    if (utm_medium) convexBody.utm_medium = String(utm_medium);
    if (utm_campaign) convexBody.utm_campaign = String(utm_campaign);
    if (utm_content) convexBody.utm_content = String(utm_content);
    if (utm_term) convexBody.utm_term = String(utm_term);
    if (cleanReferralCode) convexBody.referredBy = cleanReferralCode;
    if (cleanRequestedPlanType) convexBody.requestedPlanType = cleanRequestedPlanType;

    try {
      await convexMutation("ourfable:addWaitlistEntry", {
        ...convexBody,
        foundingMember: true,
        foundingPriceLockedAt,
        foundingStandardAnnualPrice: FOUNDING_OFFER.standardAnnualPrice,
        foundingStandardAnnualCompareAt: FOUNDING_OFFER.standardAnnualCompareAt,
        foundingPlusAnnualPrice: FOUNDING_OFFER.plusAnnualPrice,
        foundingPlusAnnualCompareAt: FOUNDING_OFFER.plusAnnualCompareAt,
      });
    } catch (err) {
      console.error("Convex error:", err);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // 2. Best-effort side effects with explicit logging.
    const childLabel = childName ? ` for ${childName}` : "";
    const utmLabel = utm_source ? ` (via ${utm_source})` : "";
    const referralLabel = cleanReferralCode ? ` · ref: ${cleanReferralCode}` : "";
    const warnings = (await Promise.all([
      runNonCritical("Google Sheets sync", async () => {
        await ensureSheetHeaders();
        return appendWaitlistRow({
          timestamp: new Date(foundingPriceLockedAt).toISOString(),
          email: cleanEmail,
          childName: childName ? String(childName).trim() : undefined,
          childBirthday: childBirthday ? String(childBirthday) : undefined,
          source: cleanSource,
          utm_source: utm_source ? String(utm_source) : undefined,
          utm_medium: utm_medium ? String(utm_medium) : undefined,
          utm_campaign: utm_campaign ? String(utm_campaign) : undefined,
          utm_content: utm_content ? String(utm_content) : undefined,
          utm_term: utm_term ? String(utm_term) : undefined,
          foundingMember: "yes",
        });
      }),
      runNonCritical("Resend audience sync", async () => {
        if (!RESEND_FULL_KEY || !AUDIENCE_ID) {
          return {
            ok: false,
            skipped: true,
            reason: "Resend audience sync not configured: missing RESEND_FULL_API_KEY or RESEND_AUDIENCE_ID",
          };
        }
        const audienceRes = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_FULL_KEY}`,
          },
          body: JSON.stringify({ email: cleanEmail, unsubscribed: false }),
        });
        if (!audienceRes.ok && audienceRes.status !== 409) {
          throw await responseError("Resend audience sync", audienceRes);
        }
      }),
      runNonCritical("Welcome email", async () => {
        if (!RESEND_API_KEY) {
          return {
            ok: false,
            skipped: true,
            reason: "Welcome email not configured: missing RESEND_API_KEY",
          };
        }
        const { subject, html, text } = waitlistWelcomeEmail(
          childName ? String(childName).trim() : undefined,
          cleanEmail,
          buildUnsubscribeUrl(cleanEmail)
        );
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Our Fable <hello@ourfable.ai>",
            to: [cleanEmail],
            subject,
            html,
            text,
            headers: buildUnsubscribeHeaders(cleanEmail),
          }),
        });
        if (!emailRes.ok) {
          throw await responseError("Welcome email", emailRes);
        }
      }),
      runNonCritical("Meta CAPI", async () => {
        await sendCapiEvent(cleanEmail, req, cleanSource, eventId);
      }),
      runNonCritical("Telegram alert", async () => {
        const ALERT_BOT = process.env.TELEGRAM_ALERT_BOT_TOKEN;
        const ALERT_CHAT = process.env.TELEGRAM_ALERT_CHAT_ID;
        if (!ALERT_BOT || !ALERT_CHAT) {
          return {
            ok: false,
            skipped: true,
            reason: "Telegram alerting not configured: missing TELEGRAM_ALERT_BOT_TOKEN or TELEGRAM_ALERT_CHAT_ID",
          };
        }
        const telegramRes = await fetch(`https://api.telegram.org/bot${ALERT_BOT}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: ALERT_CHAT,
            text: `🎉 New waitlist signup!\n\n${cleanEmail}${childLabel}${utmLabel}${referralLabel}`,
            disable_web_page_preview: true,
          }),
        });
        if (!telegramRes.ok) {
          throw await responseError("Telegram alert", telegramRes);
        }
      }),
      runNonCritical("Alert email", async () => {
        if (!RESEND_FULL_KEY) {
          return {
            ok: false,
            skipped: true,
            reason: "Alert email not configured: missing RESEND_FULL_API_KEY",
          };
        }
        const alertRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_FULL_KEY}` },
          body: JSON.stringify({
            from: "OurFable Alerts <hello@ourfable.ai>",
            to: process.env.ALERT_EMAIL ?? "hello@ourfable.ai",
            subject: `🎉 New waitlist signup: ${cleanEmail}`,
            html: `<p style="font-family:sans-serif;font-size:15px;"><strong>${escapeHtml(cleanEmail)}</strong> just reserved a spot${escapeHtml(childLabel)}.${escapeHtml(utmLabel)}${escapeHtml(referralLabel)}</p>`,
          }),
        });
        if (!alertRes.ok) {
          throw await responseError("Alert email", alertRes);
        }
      }),
    ])).filter((warning): warning is NonCriticalWarning => Boolean(warning));
    return NextResponse.json({ ok: true, warnings });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
