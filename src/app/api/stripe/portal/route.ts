import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifySession, COOKIE } from "@/lib/auth";
import { internalConvexQuery as convexQuery } from "@/lib/convex-internal";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ourfable.ai";
// POST /api/stripe/portal
// Returns a Stripe Customer Portal session URL for the authenticated family
export async function POST(req: NextRequest) {
  // Auth check
  const sessionToken = req.cookies.get(COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const { familyId } = session;

  try {
    // Get family from Convex to find stripeCustomerId
    const family = await convexQuery("ourfable:getFamily", { familyId });

    if (!family?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing record found. Contact support@ourfable.ai" },
        { status: 404 }
      );
    }

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: family.stripeCustomerId,
      return_url: `${BASE_URL}/${familyId}`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return NextResponse.json({ error: "Failed to create billing portal session" }, { status: 500 });
  }
}
