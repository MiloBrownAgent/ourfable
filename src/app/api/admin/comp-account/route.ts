import { NextRequest, NextResponse } from "next/server";
import { hashPassword, addAccount } from "@/lib/accounts";
import { CONVEX_URL } from "@/lib/convex";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/comp-account
//
// Creates a comped (free) Our Fable account — no Stripe, no payment.
// Used for F&F beta testers, internal testing, press, etc.
//
// Auth: requires ADMIN_SECRET header or ADMIN_SECRET env var match.
// Body: { email, password, childName, childDob, parentNames, planType?, note? }
// Returns: { success: true, familyId }
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_SECRET = process.env.ADMIN_SECRET;

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
  // ── Auth check ──
  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin endpoint not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("x-admin-secret");
  if (!authHeader || authHeader !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      email,
      password,
      childName,
      childDob,
      parentNames,
      planType = "plus", // default comped accounts to plus — they're testers
      note,
    } = body as {
      email: string;
      password: string;
      childName: string;
      childDob: string;
      parentNames: string;
      planType?: "standard" | "plus";
      note?: string;
    };

    if (!email || !password || !childName || !childDob || !parentNames) {
      return NextResponse.json({ error: "Missing required fields: email, password, childName, childDob, parentNames" }, { status: 400 });
    }

    // Idempotency: block duplicates
    const existing = await convexQuery("ourfable:getOurFableFamilyByEmail", { email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "Account already exists for this email" }, { status: 400 });
    }

    const firstNameSlug = childName
      .split(" ")[0]
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .slice(0, 12);
    const familyId = `${firstNameSlug}-${Date.now().toString(36)}`;
    const passwordHash = hashPassword(password);

    // 1. Create family in Convex — no stripeCustomerId (comped)
    await convexMutation("ourfable:createFamily", {
      familyId,
      childName,
      childDob,
      parentNames,
      parentEmail: email.toLowerCase().trim(),
      plan: "annual",           // treat as annual for feature access
      subscriptionStatus: "comped",
    });

    // 2. Seed default content
    await convexMutation("ourfable:seedCircle", { familyId }).catch(() => {});
    await convexMutation("ourfable:seedMilestones", { familyId }).catch(() => {});
    await convexMutation("ourfable:seedFirstLetter", { familyId }).catch(() => {});

    // 3. Create account record — no Stripe IDs
    await addAccount({
      email: email.toLowerCase().trim(),
      passwordHash,
      familyId,
      childName,
      parentNames,
      planType,
      birthDate: childDob,
    });

    // 4. Create delivery milestones if DOB provided
    if (childDob) {
      await convexMutation("ourfable:createOurFableDeliveryMilestones", {
        familyId,
        childDob,
      }).catch(() => {});
    }

    console.log(`[comp-account] ✅ Comped account created: familyId=${familyId} email=${email} planType=${planType} note="${note ?? ""}"`);

    return NextResponse.json({
      success: true,
      familyId,
      loginUrl: `https://ourfable.ai/login`,
      dashboardUrl: `https://ourfable.ai/${familyId}`,
      note: "No Stripe subscription — account is comped. Subscription status: comped.",
    });
  } catch (err) {
    console.error("[comp-account]", err);
    return NextResponse.json({ error: "Failed to create comped account" }, { status: 500 });
  }
}
