import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifySession, COOKIE } from "@/lib/auth";
import { CONVEX_URL } from "@/lib/convex";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ourfable.ai";

async function convexQuery(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

// Plus plan prices
const PLUS_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY ?? "price_1TEs5XPhcoXpcvebExblvzXp",
  annual: process.env.STRIPE_PRICE_PLUS_ANNUAL ?? "price_1TEs5uPhcoXpcvebKqvMBSjk",
};

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { billingPeriod } = body as { billingPeriod?: "monthly" | "annual" };
  const period = billingPeriod ?? "annual";

  const { familyId } = session;

  try {
    // Get family data from both tables
    const [legacyFamily, ourfableFamily] = await Promise.all([
      convexQuery("ourfable:getFamily", { familyId }),
      internalConvexQuery("ourfable:getOurFableFamilyById", { familyId }),
    ]) as [
      { stripeCustomerId?: string; parentEmail?: string } | null,
      { email: string; planType: string; stripeCustomerId?: string } | null,
    ];

    if (!ourfableFamily) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (ourfableFamily.planType === "plus") {
      return NextResponse.json({ error: "Already on Plus plan" }, { status: 400 });
    }

    const customerEmail = ourfableFamily.email;
    const stripeCustomerId = ourfableFamily.stripeCustomerId ?? legacyFamily?.stripeCustomerId;

    const priceId = PLUS_PRICE_IDS[period];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${BASE_URL}/${familyId}/settings?upgraded=true`,
      cancel_url: `${BASE_URL}/${familyId}/settings`,
      metadata: {
        familyId,
        email: customerEmail,
        upgradeFrom: ourfableFamily.planType,
        upgradeTo: "plus",
        billingPeriod: period,
      },
    };

    // Attach existing customer if we have one
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else {
      sessionParams.customer_email = customerEmail;
    }

    const checkoutSession = await getStripe().checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[stripe/upgrade]", err);
    return NextResponse.json({ error: "Failed to create upgrade session" }, { status: 500 });
  }
}
