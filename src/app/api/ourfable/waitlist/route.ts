import { NextRequest, NextResponse } from "next/server";
import { waitlistWelcomeEmail } from "../../../../lib/email-templates/waitlist-welcome";
import { CONVEX_URL } from "@/lib/convex";
import crypto from "crypto";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FULL_KEY = process.env.RESEND_FULL_API_KEY ?? "";
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN ?? "";

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
    await fetch(
      `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      }
    );
  } catch (err) {
    console.error("Meta CAPI error:", err);
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
    } = await req.json();

    if (!email || !String(email).includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanSource = source || "homepage";

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

    const convexRes = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.33.0" },
      body: JSON.stringify({
        path: "ourfable:addWaitlistEntry",
        args: convexBody,
        format: "json",
      }),
    });

    if (!convexRes.ok) {
      console.error("Convex error:", await convexRes.text());
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // 2. Add to Resend Audience
    if (RESEND_FULL_KEY && AUDIENCE_ID) {
      fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_FULL_KEY}`,
        },
        body: JSON.stringify({ email: cleanEmail, unsubscribed: false }),
      }).catch((err) => console.error("Resend audience error:", err));
    }

    // 3. Send welcome email
    if (RESEND_API_KEY) {
      const { subject, html, text } = waitlistWelcomeEmail(
        childName ? String(childName).trim() : undefined
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
          headers: {
            "List-Unsubscribe": `<https://ourfable.ai/unsubscribe?email=${encodeURIComponent(cleanEmail)}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });

      if (!emailRes.ok) {
        console.error("Resend error:", await emailRes.text());
      }
    }

    // 4. Fire Meta Conversions API (server-side Lead event, deduped via eventId)
    sendCapiEvent(cleanEmail, req, cleanSource, eventId).catch((err) =>
      console.error("CAPI fire-and-forget error:", err)
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
