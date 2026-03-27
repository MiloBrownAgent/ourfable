import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/accounts";
import Stripe from "stripe";
import { CONVEX_URL } from "@/lib/convex";

// STRIPE_SECRET_KEY checked at request time
function getStripe() { if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY required"); return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" }); }

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

async function convexMutation(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.34.0" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) throw new Error(`Convex mutation ${path} failed`);
  return res.json();
}

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
  const { password } = body as { password?: string };

  if (!password) {
    return NextResponse.json({ error: "Password required for confirmation" }, { status: 400 });
  }

  // Get account
  const family = await convexQuery("ourfable:getOurFableFamilyById", { familyId: session.familyId }) as {
    email: string;
    passwordHash: string;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
  } | null;

  if (!family) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Verify password
  if (!verifyPassword(password, family.passwordHash)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Cancel Stripe subscription if active
  if (family.stripeSubscriptionId) {
    try {
      await getStripe().subscriptions.cancel(family.stripeSubscriptionId);
      console.log(`[delete-account] Cancelled Stripe subscription ${family.stripeSubscriptionId}`);
    } catch (err) {
      console.warn("[delete-account] Failed to cancel Stripe subscription (may already be cancelled):", err);
    }
  }

  // Soft delete in Convex
  await convexMutation("ourfable:softDeleteOurFableFamily", { familyId: session.familyId });

  // Delete Stripe customer if exists
  if (family.stripeCustomerId) {
    try {
      await getStripe().customers.del(family.stripeCustomerId);
      console.log(`[delete-account] Deleted Stripe customer ${family.stripeCustomerId}`);
    } catch (e) {
      console.error("[delete-account] Stripe customer delete failed:", e);
    }
  }

  // Clear session cookie
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  console.log(`[delete-account] Soft deleted family ${session.familyId}`);
  return res;
}
