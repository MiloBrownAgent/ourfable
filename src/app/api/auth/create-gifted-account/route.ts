import { NextRequest, NextResponse } from "next/server";
import { hashPassword, addAccount } from "@/lib/accounts";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";
// POST /api/auth/create-gifted-account
// Creates a new OurFable family account using a gift code (no Stripe payment needed)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      childName,
      childDob,
      parentNames,
      giftCode,
      facilitator1Name,
      facilitator1Email,
      facilitator1Relationship,
      facilitator2Name,
      facilitator2Email,
      facilitator2Relationship,
      childEmail,
      notifyFacilitatorOnLapse,
    } = body as {
      email: string;
      password: string;
      childName: string;
      childDob: string;
      parentNames: string;
      giftCode: string;
      facilitator1Name?: string;
      facilitator1Email?: string;
      facilitator1Relationship?: string;
      facilitator2Name?: string;
      facilitator2Email?: string;
      facilitator2Relationship?: string;
      childEmail?: string;
      notifyFacilitatorOnLapse?: boolean;
    };

    if (!email || !password || !childName || !childDob || !parentNames || !giftCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Look up and validate the gift
    const gift = await convexQuery("ourfable:getGift", { giftCode: giftCode.toUpperCase() }) as {
      giftCode: string;
      status?: string;
      redeemedAt?: number;
      planType?: string;
      billingPeriod?: string;
    } | null;

    if (!gift) {
      return NextResponse.json({ error: "Invalid gift code" }, { status: 400 });
    }

    if (gift.status === "redeemed" || gift.redeemedAt) {
      return NextResponse.json({ error: "This gift code has already been redeemed" }, { status: 400 });
    }

    if (gift.status === "expired") {
      return NextResponse.json({ error: "This gift code has expired" }, { status: 400 });
    }

    if (gift.status === "pending") {
      return NextResponse.json({ error: "Payment for this gift is still processing. Please try again in a moment." }, { status: 400 });
    }

    // 2. Check if account already exists
    const existing = await internalConvexQuery("ourfable:getOurFableFamilyByEmail", { email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    // 3. Generate familyId
    const firstNameSlug = childName
      .split(" ")[0]
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .slice(0, 12);
    const familyId = `${firstNameSlug}-${Date.now().toString(36)}`;

    const planType = gift.planType ?? "standard";
    const billingPeriod = gift.billingPeriod ?? "annual";
    const passwordHash = hashPassword(password);

    // 4. Create the family in Convex
    await convexMutation("ourfable:createFamily", {
      familyId,
      childName,
      childDob,
      parentNames,
      parentEmail: email.toLowerCase().trim(),
      plan: billingPeriod,
    });

    // 5. Seed default content
    await convexMutation("ourfable:seedCircle", { familyId }).catch(() => {});
    await convexMutation("ourfable:seedMilestones", { familyId }).catch(() => {});
    await convexMutation("ourfable:seedFirstLetter", { familyId }).catch(() => {});

    // 6. Create account record
    await addAccount({
      email: email.toLowerCase().trim(),
      passwordHash,
      familyId,
      childName,
      parentNames,
      planType,
      birthDate: childDob,
    });

    // 7. Save facilitators if provided
    if (facilitator1Name || facilitator1Email) {
      await convexMutation("ourfable:updateOurFableFacilitators", {
        familyId,
        facilitator1Name: facilitator1Name || undefined,
        facilitator1Email: facilitator1Email || undefined,
        facilitator1Relationship: facilitator1Relationship || undefined,
        facilitator2Name: facilitator2Name || undefined,
        facilitator2Email: facilitator2Email || undefined,
        facilitator2Relationship: facilitator2Relationship || undefined,
        childEmail: childEmail || undefined,
      }).catch(() => {});
    }

    await convexMutation("ourfable:updateOurFableLapseNotification", {
      familyId,
      notifyFacilitatorOnLapse: notifyFacilitatorOnLapse !== false,
    }).catch(() => {});

    // 8. Create delivery milestones
    if (childDob) {
      await convexMutation("ourfable:createOurFableDeliveryMilestones", {
        familyId,
        childDob,
      }).catch(() => {});
    }

    // 9. Mark gift as redeemed
    await convexMutation("ourfable:redeemGift", {
      giftCode: giftCode.toUpperCase(),
      familyId,
    }).catch(() => {});

    console.log(`[create-gifted-account] ✅ Account created via gift: familyId=${familyId} email=${email} giftCode=${giftCode} planType=${planType}`);

    return NextResponse.json({ success: true, familyId });
  } catch (err) {
    console.error("[create-gifted-account]", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
