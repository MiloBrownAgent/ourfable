import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { foundingInviteEmail } from "@/lib/email-templates/founding-invite";
import { convexQuery } from "@/lib/convex";
import { buildUnsubscribeHeaders, buildUnsubscribeUrl } from "@/lib/unsubscribe-token";

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? process.env.RESEND_API_KEY ?? "";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

interface WaitlistEntry {
  email: string;
  childName?: string;
  // parentName is not stored in waitlist — we use "friend" as fallback
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Our Fable <hello@ourfable.ai>",
        to: [to],
        subject,
        html,
        text,
        headers: buildUnsubscribeHeaders(to),
      }),
    });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    // Admin auth
    // SECURITY: Use constant-time comparison to prevent timing attacks (HIGH-2 fix)
    const secret = req.headers.get("x-admin-secret") ?? "";
    if (!ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const secretBuf = Buffer.from(ADMIN_SECRET);
    const headerBuf = Buffer.from(secret);
    if (secretBuf.length !== headerBuf.length || !crypto.timingSafeEqual(secretBuf, headerBuf)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { email, childName, parentName, all } = body as {
      email?: string;
      childName?: string;
      parentName?: string;
      all?: boolean;
    };

    const results: { email: string; success: boolean; error?: string }[] = [];

    if (all) {
      // Fetch all waitlist entries from Convex
      const entries = await convexQuery<WaitlistEntry[]>("ourfable:listWaitlist", {}).catch(() => [] as WaitlistEntry[]);

      if (entries.length === 0) {
        return NextResponse.json({ sent: 0, message: "No waitlist entries found" });
      }

      // Send emails with a small delay to respect rate limits
      for (const entry of entries) {
        try {
          const { subject, html, text } = foundingInviteEmail({
            parentName: undefined, // waitlist doesn't store parent name
            childName: entry.childName,
            email: entry.email,
            unsubscribeUrl: buildUnsubscribeUrl(entry.email),
          });
          await sendEmail(entry.email, subject, html, text);
          results.push({ email: entry.email, success: true });
        } catch (err) {
          results.push({ email: entry.email, success: false, error: String(err) });
        }
        // Small delay between sends (Resend rate limit friendly)
        await new Promise((r) => setTimeout(r, 200));
      }

      const sent = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      return NextResponse.json({ sent, failed, total: entries.length, results });
    }

    // Single email send
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const { subject, html, text } = foundingInviteEmail({
      parentName,
      childName,
      email,
      unsubscribeUrl: buildUnsubscribeUrl(email),
    });

    const info = await sendEmail(email, subject, html, text);
    return NextResponse.json({ success: true, messageId: info.id, sentTo: email });
  } catch (err) {
    console.error("[send-founding-invite]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
