import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { hashPassword } from "@/lib/accounts";

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

    // Hash password and store in Stripe metadata (bcrypt hash — not plaintext)
    // This is the only reliable way to pass data from checkout to webhook on serverless
    const passwordHash = hashPassword(password);

    // Resolve plan type and billing period (support both new and legacy params)
    const resolvedPlanType: PlanType = planType ?? "standard";
    const resolvedBilling: BillingPeriod = billingPeriod ?? plan ?? "annual";

    const priceId = PRICE_MAP[resolvedPlanType][resolvedBilling];

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${BASE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
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
        password_hash: passwordHash,
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
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
