import { NextRequest, NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex";

const RESEND_FULL_KEY = process.env.RESEND_FULL_API_KEY ?? "";
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const cleanEmail = String(email).toLowerCase().trim();

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
