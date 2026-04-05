import { NextRequest, NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;
const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY || process.env.RESEND_API_KEY;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!CRON_SECRET || authHeader !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing Resend API key" }, { status: 500 });
  }

  const body = await req.json();
  const { to, subject, html, text } = body as { to: string; subject: string; html: string; text?: string };
  if (!to || !subject || !html) {
    return NextResponse.json({ error: "Missing to/subject/html" }, { status: 400 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Our Fable <hello@ourfable.ai>",
      to,
      subject,
      html,
      text,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    return NextResponse.json({ error: responseText }, { status: response.status });
  }

  return NextResponse.json({ success: true, result: responseText ? JSON.parse(responseText) : null });
}
