/**
 * POST /api/stripe/add-child
 *
 * Creates a new child for a family and initiates Stripe Checkout for the
 * per-child add-on subscription. Our Fable+ accounts get their first
 * additional child for free.
 *
 * Body:
 *   familyId        — string (required)
 *   childName       — string (required)
 *   childDob        — string (required, YYYY-MM-DD)
 *   billingPeriod   — "monthly" | "annual" (default: "monthly")
 *   copyCircleFrom  — string (optional childId to copy circle members from)
 *   selectedMemberIds — string[] (optional, used with copyCircleFrom)
 *   successUrl      — string (optional, defaults to dashboard)
 *   cancelUrl       — string (optional, defaults to dashboard)
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { CONVEX_URL } from "@/lib/convex";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

async function convexMutation(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Convex-Client": "npm-1.34.0",
    },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex mutation ${path} failed: ${text}`);
  }
  return res.json();
}

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      familyId,
      childName,
      childDob,
      billingPeriod = "monthly",
      copyCircleFrom,
      selectedMemberIds,
      successUrl,
      cancelUrl,
    } = body as {
      familyId: string;
      childName: string;
      childDob: string;
      billingPeriod?: "monthly" | "annual";
      copyCircleFrom?: string;
      selectedMemberIds?: string[];
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!familyId || !childName || !childDob) {
      return NextResponse.json(
        { error: "familyId, childName, and childDob are required" },
        { status: 400 },
      );
    }

    // Look up family
    const family = (await convexQuery("ourfable:getOurFableFamilyById", { familyId })) as {
      familyId: string;
      email: string;
      childName: string;
      planType: string;
      stripeCustomerId?: string;
      subscriptionStatus: string;
    } | null;

    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Count existing additional children (non-first)
    const existingChildren = (await convexQuery("ourfable:listChildren", { familyId })) as Array<{
      childId: string;
      isFirst: boolean;
      isActive: boolean;
    }> | null;

    const additionalActiveChildren = (existingChildren ?? []).filter(
      (c) => !c.isFirst && c.isActive,
    ).length;

    // Our Fable+ accounts: first additional child is free
    const isPlus = family.planType === "plus";
    const isFree = isPlus && additionalActiveChildren === 0;

    // 1. Create child in Convex
    const insertResult = await convexMutation("ourfable:addChild", {
      familyId,
      childName,
      childDob,
    });
    const childDocId = (insertResult as { value?: string }).value ?? insertResult;

    // Retrieve the new childId slug
    const allChildren = (await convexQuery("ourfable:listChildren", { familyId })) as Array<{
      childId: string;
      childName: string;
      childDob: string;
      isFirst: boolean;
    }> | null;
    const newChild = (allChildren ?? []).find(
      (c) => !c.isFirst && c.childName === childName && c.childDob === childDob,
    );

    if (!newChild) {
      return NextResponse.json({ error: "Failed to create child record" }, { status: 500 });
    }

    // 2. Copy circle if requested
    if (copyCircleFrom && selectedMemberIds && selectedMemberIds.length > 0) {
      await convexMutation("ourfable:copyCircleToChild", {
        sourceChildId: copyCircleFrom,
        targetChildId: newChild.childId,
        memberIds: selectedMemberIds,
      });
    }

    // 3. Free path: Our Fable+ first additional child
    if (isFree) {
      return NextResponse.json({
        free: true,
        childId: newChild.childId,
        message: "First additional child added at no charge (Our Fable+)",
      });
    }

    // 4. Paid path: create Stripe Checkout session
    const stripe = getStripe();

    const priceId =
      billingPeriod === "annual"
        ? process.env.STRIPE_PRICE_CHILD_ANNUAL
        : process.env.STRIPE_PRICE_CHILD_MONTHLY;

    if (!priceId || priceId.startsWith("price_placeholder")) {
      // Price IDs not yet configured — return the child was created, skip checkout
      console.warn("[add-child] Stripe price ID not configured for child add-on");
      return NextResponse.json({
        childId: newChild.childId,
        checkoutUrl: null,
        warning: "Stripe price not configured — child created but billing not started",
      });
    }

    const dashboardUrl = `https://ourfable.ai/${familyId}`;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: family.stripeCustomerId,
      customer_email: family.stripeCustomerId ? undefined : family.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        type: "child_addon",
        familyId,
        childId: newChild.childId,
        childName,
        childDob,
      },
      success_url: successUrl ?? `${dashboardUrl}/children?added=true`,
      cancel_url: cancelUrl ?? `${dashboardUrl}/children?cancelled=true`,
      subscription_data: {
        metadata: {
          type: "child_addon",
          familyId,
          childId: newChild.childId,
        },
      },
    });

    return NextResponse.json({
      childId: newChild.childId,
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
