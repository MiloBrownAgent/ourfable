import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifySession, COOKIE } from "@/lib/auth";
import { internalConvexMutation, internalConvexQuery } from "@/lib/convex-internal";
import {
  FOUNDING_CHILD_ADDON_PRICES,
  REGULAR_CHILD_ADDON_PRICES,
  getIncludedAdditionalChildren,
  type BillingPeriod,
  type PlanType,
} from "@/lib/ourfable-pricing";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://ourfable.ai";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

function getChildAddonPriceId(billingPeriod: BillingPeriod): string | undefined {
  return billingPeriod === "annual"
    ? process.env.STRIPE_PRICE_CHILD_ANNUAL
    : process.env.STRIPE_PRICE_CHILD_MONTHLY;
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(COOKIE)?.value;
    const session = sessionToken ? await verifySession(sessionToken) : null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      childName,
      childDob,
      billingPeriod = "monthly",
      copyCircleFrom,
      selectedMemberIds,
      successUrl,
      cancelUrl,
    } = body as {
      childName?: string;
      childDob?: string;
      billingPeriod?: BillingPeriod;
      copyCircleFrom?: string;
      selectedMemberIds?: string[];
      successUrl?: string;
      cancelUrl?: string;
    };

    const familyId = session.familyId;
    if (!familyId || !childName?.trim() || !childDob) {
      return NextResponse.json({ error: "childName and childDob are required" }, { status: 400 });
    }

    const family = await internalConvexQuery("ourfable:getOurFableFamilyById", { familyId }) as {
      familyId: string;
      email?: string;
      planType?: string;
      stripeCustomerId?: string;
    } | null;

    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    const resolvedPlanType: PlanType = family.planType === "plus" ? "plus" : "standard";
    const activeChildren = await internalConvexQuery("ourfable:listChildren", { familyId }) as Array<{
      childId: string;
      isFirst: boolean;
      isActive?: boolean;
      childName: string;
      childDob: string;
    }> | null;

    const additionalActiveChildren = (activeChildren ?? []).filter((child) => !child.isFirst).length;
    const includedAdditionalChildren = getIncludedAdditionalChildren(resolvedPlanType);
    const isIncluded = additionalActiveChildren < includedAdditionalChildren;

    const insertResult = await internalConvexMutation("ourfable:addChild", {
      familyId,
      childName: childName.trim(),
      childDob,
    }) as { childId: string; _id: string };

    const newChildId = insertResult.childId;

    if (copyCircleFrom && Array.isArray(selectedMemberIds) && selectedMemberIds.length > 0) {
      await internalConvexMutation("ourfable:copyCircleToChild", {
        sourceChildId: copyCircleFrom,
        targetChildId: newChildId,
        memberIds: selectedMemberIds,
      });
    }

    if (isIncluded) {
      return NextResponse.json({
        childId: newChildId,
        included: true,
        message: "Additional child added to your plan.",
      });
    }

    await internalConvexMutation("ourfable:removeChild", { childId: newChildId });

    const priceId = getChildAddonPriceId(billingPeriod);
    if (!priceId || priceId.startsWith("price_placeholder")) {
      return NextResponse.json(
        {
          error: `Child add-on Stripe price is not configured yet. Recommended pricing is $${FOUNDING_CHILD_ADDON_PRICES.monthly}/mo founders, then $${REGULAR_CHILD_ADDON_PRICES.monthly}/mo after founders.`,
        },
        { status: 500 },
      );
    }

    const stripe = getStripe();
    const settingsUrl = new URL(`/${familyId}/settings`, BASE_URL).toString();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: family.stripeCustomerId,
      customer_email: family.stripeCustomerId ? undefined : family.email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: {
        type: "child_addon",
        familyId,
        childId: newChildId,
        childName: childName.trim(),
        childDob,
      },
      success_url: successUrl ?? `${settingsUrl}?child_added=true`,
      cancel_url: cancelUrl ?? `${settingsUrl}?child_addon_cancelled=true`,
      subscription_data: {
        metadata: {
          type: "child_addon",
          familyId,
          childId: newChildId,
        },
      },
    });

    return NextResponse.json({
      childId: newChildId,
      included: false,
      checkoutUrl: checkoutSession.url,
    });
  } catch (err) {
    console.error("[add-child] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
