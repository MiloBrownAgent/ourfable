import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSession, COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { internalConvexQuery as convexQuery } from "@/lib/convex-internal";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}
// GET /api/stripe/session?session_id=...
// Called by /welcome after Stripe redirect — verifies payment and issues a session cookie
export async function GET(req: NextRequest) {
  return NextResponse.json({ error: "Deprecated route" }, { status: 410 });
}
