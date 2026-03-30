import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import crypto from "node:crypto";
import { hashPassword } from "@/lib/accounts";
import { internalConvexMutation } from "@/lib/convex-internal";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://ourfable.ai";

type PlanType = "standard" | "plus";
type BillingPeriod = "monthly" | "annual";

const PRICE_MAP: Record<PlanType, Record<BillingPeriod, string>> = {
  standard: {
    monthly: process.env.STRIPE_PRICE_STANDARD_MONTHLY ?? "price_1TEs4gPhcoXpcvebjadSHaAZ",
    annual: process.env.STRIPE_PRICE_STANDARD_ANNUAL ?? "price_1TEs58PhcoXpcvebONIcTyJr",
  },
  plus: {
    monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY ?? "price_1TEs5XPhcoXpcvebExblvzXp",
    annual: process.env.STRIPE_PRICE_PLUS_ANNUAL ?? "price_1TEs5uPhcoXpcvebKqvMBSjk",
  },
};
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, password, childName, childDob, parentNames, planType, billingPeriod, plan,
      facilitator1Name, facilitator1Email, facilitator1Relationship,
      facilitator2Name, facilitator2Email, facilitator2Relationship,
      childEmail, notifyFacilitatorOnLapse,
    } = body as {
      email: string;
      password: string;
      childName: string;
      childDob: string;
      parentNames: string;
      planType?: PlanType;
      billingPeriod?: BillingPeriod;
      plan?: "annual" | "monthly";
      facilitator1Name?: string;
      facilitator1Email?: string;
      facilitator1Relationship?: string;
      facilitator2Name?: string;
      facilitator2Email?: string;
      facilitator2Relationship?: string;
      childEmail?: string;
      notifyFacilitatorOnLapse?: boolean;
    };

    if (!email || !password || !childName || !childDob || !parentNames) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // SECURITY (C4): Hash password and store in Convex temp table, NOT in Stripe metadata.
    // Only pass a random token in Stripe metadata. Webhook retrieves hash via token.
    const passwordHash = hashPassword(password);
    const signupToken = crypto.randomBytes(32).toString("hex");
    await internalConvexMutation("ourfable:createSignupToken", {
      token: signupToken,
      passwordHash,
      email: email.toLowerCase().trim(),
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // Resolve plan type and billing period (support both new and legacy params)
    const resolvedPlanType: PlanType = planType ?? "standard";
    const resolvedBilling: BillingPeriod = billingPeriod ?? plan ?? "annual";

    const priceId = PRICE_MAP[resolvedPlanType][resolvedBilling];

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${BASE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}&child=${encodeURIComponent(childName.split(" ")[0])}&dob=${encodeURIComponent(childDob)}`,
      cancel_url: `${BASE_URL}/signup`,
      customer_email: email,
      metadata: {
        email,
        childName,
        childDob,
        parentNames,
        planType: resolvedPlanType,
        billingPeriod: resolvedBilling,
        plan: resolvedBilling, // legacy compat
        signup_token: signupToken, // C4: reference token instead of password hash
        notifyFacilitatorOnLapse: notifyFacilitatorOnLapse !== false ? "true" : "false",
        ...(facilitator1Name ? { facilitator1Name } : {}),
        ...(facilitator1Email ? { facilitator1Email } : {}),
        ...(facilitator1Relationship ? { facilitator1Relationship } : {}),
        ...(facilitator2Name ? { facilitator2Name } : {}),
        ...(facilitator2Email ? { facilitator2Email } : {}),
        ...(facilitator2Relationship ? { facilitator2Relationship } : {}),
        ...(childEmail ? { childEmail } : {}),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe/checkout]", message, err);
    return NextResponse.json({ error: "Checkout error: " + message }, { status: 500 });
  }
}
