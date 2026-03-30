import { NextRequest, NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

const RESEND_FULL_KEY = process.env.RESEND_FULL_API_KEY ?? "";
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "";

async function handleUnsubscribe(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token : req.nextUrl.searchParams.get("token") ?? "";
    if (!token) return NextResponse.json({ error: "Unsubscribe token required" }, { status: 400 });

    const cleanEmail = verifyUnsubscribeToken(token);
    if (!cleanEmail) return NextResponse.json({ error: "Invalid unsubscribe token" }, { status: 400 });

    // Mark unsubscribed in Resend Audience
    if (RESEND_FULL_KEY && AUDIENCE_ID) {
      await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_FULL_KEY}` },
        body: JSON.stringify({ email: cleanEmail, unsubscribed: true }),
      });
    }

    // Remove from Convex waitlist
    await convexMutation("ourfable:removeWaitlistEntry", { email: cleanEmail });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleUnsubscribe(req);
}

export async function GET(req: NextRequest) {
  return handleUnsubscribe(req);
}
