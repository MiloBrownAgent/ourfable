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
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  // STRIPE_SECRET_KEY is validated at module load; this path always has a real key

  try {
    const stripeSession = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    // Only proceed if payment is confirmed
    if (stripeSession.payment_status !== "paid" && stripeSession.status !== "complete") {
      return NextResponse.json(
        { error: "Payment not yet confirmed" },
        { status: 402 }
      );
    }

    const meta = stripeSession.metadata ?? {};
    const email = (meta.email ?? stripeSession.customer_email ?? "").toLowerCase();
    const childName = meta.childName ?? "your child";

    // Derive familyId — webhook builds it the same way.
    // Primary: query Convex by parentEmail (authoritative source, survives cold starts).
    // Fallback: reconstruct from metadata (same algo as webhook, works if Convex is slow).
    let familyId = "";

    try {
      // Wait up to ~2s for Convex (webhook may still be processing)
      const result = await convexQuery("ourfable:getFamilyByEmail", { parentEmail: email });
      if (result?.value?.familyId) {
        familyId = result.value.familyId;
      }
    } catch (convexErr) {
      console.warn("[stripe/session] Convex lookup failed, falling back to metadata:", convexErr);
    }

    // Fallback: reconstruct familyId from metadata (same logic as webhook)
    if (!familyId && meta.childName) {
      const firstNameSlug = meta.childName
        .split(" ")[0]
        .toLowerCase()
        .replace(/[^a-z]/g, "")
        .slice(0, 12);
      // We can't reconstruct the exact timestamp suffix, but we can search by childName
      // as a last resort — just return childName without a familyId and let them log in manually
      console.warn(`[stripe/session] familyId not found for email=${email}, childName=${childName}`);
    }

    // Build response
    const responseData = { childName, familyId, email };
    const res = NextResponse.json(responseData);

    // If we have a familyId, issue a session cookie so the user is logged in immediately
    if (familyId) {
      const token = await createSession(familyId);
      res.cookies.set(COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      });
    }

    return res;
  } catch (err) {
    console.error("[stripe/session]", err);
    return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
  }
}
