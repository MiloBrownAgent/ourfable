import { NextRequest, NextResponse } from "next/server";
import { foundingInviteEmail } from "@/lib/email-templates/founding-invite";
import { CONVEX_URL } from "@/lib/convex";

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
      headers: {
        "List-Unsubscribe": `<https://ourfable.ai/unsubscribe?email=${encodeURIComponent(to)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
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
    const secret = req.headers.get("x-admin-secret");
    if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
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
      const convexRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.33.0" },
        body: JSON.stringify({
          path: "ourfable:listWaitlist",
          args: {},
          format: "json",
        }),
      });

      if (!convexRes.ok) {
        return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 });
      }

      const data = await convexRes.json();
      const entries: WaitlistEntry[] = data.value ?? [];

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
    });

    const info = await sendEmail(email, subject, html, text);
    return NextResponse.json({ success: true, messageId: info.id, sentTo: email });
  } catch (err) {
    console.error("[send-founding-invite]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
