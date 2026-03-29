import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { internalConvexMutation as convexMutation } from "@/lib/convex-internal";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://ourfable.ai";

type PlanType = "standard" | "plus";

// Founding member pricing — one-time annual gift (always annual)
const GIFT_PRICE_MAP: Record<PlanType, string> = {
  standard: process.env.STRIPE_PRICE_STANDARD_ANNUAL ?? "price_1TEs58PhcoXpcvebONIcTyJr",
  plus: process.env.STRIPE_PRICE_PLUS_ANNUAL ?? "price_1TEs5uPhcoXpcvebKqvMBSjk",
};
// POST /api/stripe/gift-checkout
// Body: { recipientEmail, gifterName, gifterEmail, gifterMessage, planType }
// Returns: { url: stripeCheckoutUrl }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipientEmail,
      gifterName,
      gifterEmail,
      gifterMessage,
      planType = "standard",
    } = body as {
      recipientEmail: string;
      gifterName: string;
      gifterEmail?: string;
      gifterMessage?: string;
      planType?: PlanType;
    };

    if (!recipientEmail || !gifterName) {
      return NextResponse.json({ error: "Recipient email and your name are required" }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return NextResponse.json({ error: "Invalid recipient email" }, { status: 400 });
    }

    const billingPeriod = "annual";
    const resolvedPlanType: PlanType = planType === "plus" ? "plus" : "standard";

    // 1. Create gift record in Convex BEFORE Stripe session (so we have the code)
    const giftCode: string = await convexMutation("ourfable:createStripeGift", {
      gifterName,
      gifterEmail: gifterEmail ?? "",
      gifterMessage: gifterMessage ?? undefined,
      recipientEmail,
      planType: resolvedPlanType,
      billingPeriod,
    });

    if (!giftCode) {
      return NextResponse.json({ error: "Failed to create gift record" }, { status: 500 });
    }

    // 2. Create Stripe Checkout session (payment mode for one-time annual gift)
    const priceId = GIFT_PRICE_MAP[resolvedPlanType];

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${BASE_URL}/gift/success?code=${giftCode}&email=${encodeURIComponent(recipientEmail)}`,
      cancel_url: `${BASE_URL}/gift`,
      customer_email: gifterEmail || undefined,
      metadata: {
        type: "gift",
        giftCode,
        recipientEmail,
        gifterName,
        gifterEmail: gifterEmail ?? "",
        gifterMessage: gifterMessage?.slice(0, 499) ?? "",
        planType: resolvedPlanType,
        billingPeriod,
      },
    });

    // 3. Update the gift with the Stripe session ID
    await convexMutation("ourfable:updateGiftStatus", {
      giftCode,
      status: "pending",
      stripeSessionId: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/gift-checkout]", err);
    return NextResponse.json({ error: "Failed to create gift checkout session" }, { status: 500 });
  }
}
