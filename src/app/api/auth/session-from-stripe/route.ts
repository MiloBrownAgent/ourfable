import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSession, COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { getAccount } from "@/lib/accounts";

const CHECKOUT_CLAIM_COOKIE = "of_checkout_claim";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.session_id === "string" ? body.session_id : "";

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const stripeSession = await getStripe().checkout.sessions.retrieve(sessionId);
    if (stripeSession.payment_status !== "paid" && stripeSession.status !== "complete") {
      return NextResponse.json({ error: "Payment not yet confirmed" }, { status: 402 });
    }

    const meta = stripeSession.metadata ?? {};
    const checkoutClaim = req.cookies.get(CHECKOUT_CLAIM_COOKIE)?.value ?? "";
    if (!meta.signup_token || checkoutClaim !== meta.signup_token) {
      return NextResponse.json({ error: "Checkout session could not be verified for this browser" }, { status: 403 });
    }

    const email = (meta.email ?? stripeSession.customer_email ?? "").toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: "Checkout session missing email" }, { status: 400 });
    }

    const account = await getAccount(email);

    if (!account?.familyId) {
      return NextResponse.json(
        {
          error: "Account is still being provisioned",
          pending: true,
          retryAfterMs: 1000,
          childName: meta.childName ?? "your child",
          childDob: meta.childDob ?? "",
        },
        { status: 409 }
      );
    }

    const token = await createSession(account.familyId, {
      userId: account.userId,
      email,
      name: account.userName ?? account.parentNames,
      passwordChangedAt: Math.floor((account.passwordChangedAt ?? Date.now()) / 1000),
    });

    const res = NextResponse.json({
      success: true,
      familyId: account.familyId,
      childName: meta.childName ?? account.childName ?? "your child",
      childDob: meta.childDob ?? "",
      redirect: `/${account.familyId}`,
    });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    res.cookies.set(CHECKOUT_CLAIM_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[auth/session-from-stripe]", err);
    return NextResponse.json({ error: "Failed to create session from Stripe checkout" }, { status: 500 });
  }
}
