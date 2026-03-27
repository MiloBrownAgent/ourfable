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
    headers: {
      "Content-Type": "application/json",
      "Convex-Client": "npm-1.34.0",
    },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex query ${path} failed: ${text}`);
  }
  return res.json();
}

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
