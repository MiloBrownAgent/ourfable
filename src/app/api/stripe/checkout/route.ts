import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import crypto from "node:crypto";
import { hashPassword } from "@/lib/accounts";
import { internalConvexMutation, internalConvexQuery } from "@/lib/convex-internal";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://ourfable.ai";
const CHECKOUT_CLAIM_COOKIE = "of_checkout_claim";

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

const FOUNDING_ANNUAL_COUPON_MAP: Record<PlanType, string | undefined> = {
  standard: process.env.STRIPE_COUPON_FOUNDING_STANDARD_ANNUAL,
  plus: process.env.STRIPE_COUPON_FOUNDING_PLUS_ANNUAL,
};

const FOUNDING_OFFER = {
  standardAnnualPrice: 99,
  plusAnnualPrice: 149,
} as const;

function normalizePlanType(value: unknown): PlanType | undefined {
  return value === "standard" || value === "plus" ? value : undefined;
}

function getCheckoutDiscounts(
  planType: PlanType,
  billingPeriod: BillingPeriod,
  founding: boolean,
): Stripe.Checkout.SessionCreateParams.Discount[] | undefined {
  if (!founding || billingPeriod !== "annual") {
    return undefined;
  }

  const coupon = FOUNDING_ANNUAL_COUPON_MAP[planType];
  if (!coupon) {
    throw new Error(`Missing founding annual coupon for ${planType} plan`);
  }

  return [{ coupon }];
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, password, childName, childDob, parentNames, planType, billingPeriod, plan,
      founding,
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
      founding?: boolean;
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
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Resolve plan type and billing period (support both new and legacy params)
    const resolvedPlanType: PlanType = planType ?? "standard";
    const resolvedBilling: BillingPeriod = billingPeriod ?? plan ?? "annual";
    const isFoundingMember = founding === true;

    const priceId = PRICE_MAP[resolvedPlanType][resolvedBilling];
    const discounts = getCheckoutDiscounts(resolvedPlanType, resolvedBilling, isFoundingMember);
    const waitlistEntry = isFoundingMember
      ? await internalConvexQuery<Record<string, unknown> | null>("ourfable:getWaitlistEntryByEmail", {
          email: email.toLowerCase().trim(),
        }).catch((err) => {
          console.warn("[stripe/checkout] Failed to load waitlist entry for founding metadata:", err);
          return null;
        })
      : null;
    const foundingPriceLockedAt = isFoundingMember
      ? String(
          typeof waitlistEntry?.foundingPriceLockedAt === "number"
            ? waitlistEntry.foundingPriceLockedAt
            : Date.now()
        )
      : undefined;
    const foundingSource = isFoundingMember
      ? String(typeof waitlistEntry?.source === "string" ? waitlistEntry.source : "signup")
      : undefined;
    const foundingRequestedPlanType = isFoundingMember
      ? normalizePlanType(waitlistEntry?.requestedPlanType) ?? resolvedPlanType
      : undefined;
    const cancelUrl = new URL("/signup", BASE_URL);
    if (isFoundingMember) {
      cancelUrl.searchParams.set("founding", "true");
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // Intentionally omit payment_method_types so Stripe can surface Apple Pay
      // and any other enabled payment methods automatically.
      // Stripe doesn't allow both allow_promotion_codes and discounts
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
      success_url: `${BASE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}&child=${encodeURIComponent(childName.split(" ")[0])}&dob=${encodeURIComponent(childDob)}`,
      cancel_url: cancelUrl.toString(),
      customer_email: email,
      metadata: {
        email,
        childName,
        childDob,
        parentNames,
        founding: isFoundingMember ? "true" : "false",
        ...(foundingPriceLockedAt ? { foundingPriceLockedAt } : {}),
        ...(foundingSource ? { foundingSource } : {}),
        ...(foundingRequestedPlanType ? { foundingRequestedPlanType } : {}),
        ...(isFoundingMember ? { foundingStandardAnnualPrice: String(FOUNDING_OFFER.standardAnnualPrice) } : {}),
        ...(isFoundingMember ? { foundingPlusAnnualPrice: String(FOUNDING_OFFER.plusAnnualPrice) } : {}),
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

    const response = NextResponse.json({ url: session.url });
    response.cookies.set(CHECKOUT_CLAIM_COOKIE, signupToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe/checkout]", message, err);
    return NextResponse.json({ error: "Checkout error: " + message }, { status: 500 });
  }
}
