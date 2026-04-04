import { NextRequest, NextResponse } from "next/server";
import { hashPassword, addAccount } from "@/lib/accounts";
import { createSession, COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

function buildFamilyId(childName: string): string {
  const firstNameSlug = childName
    .split(" ")[0]
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 12);
  return `${firstNameSlug}-${Date.now().toString(36)}`;
}

export async function POST(req: NextRequest) {
  let redeemedGiftCode: string | null = null;
  let redeemedFamilyId: string | null = null;

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

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedGiftCode = giftCode.toUpperCase();

    const gift = await internalConvexQuery("ourfable:getGift", { giftCode: normalizedGiftCode }) as {
      giftCode: string;
      status?: string;
      redeemedAt?: number;
      planType?: string;
      billingPeriod?: string;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      giftMode?: string;
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

    const existing = await internalConvexQuery("ourfable:getOurFableFamilyByEmail", { email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const familyId = buildFamilyId(childName);
    const redeemResult = await internalConvexMutation("ourfable:redeemGift", {
      giftCode: normalizedGiftCode,
      familyId,
    }) as {
      success?: boolean;
      error?: string;
      planType?: string;
      billingPeriod?: string;
    };

    if (!redeemResult?.success) {
      return NextResponse.json({ error: redeemResult?.error ?? "This gift code could not be redeemed" }, { status: 400 });
    }

    redeemedGiftCode = normalizedGiftCode;
    redeemedFamilyId = familyId;

    const planType = redeemResult.planType ?? gift.planType ?? "standard";
    const billingPeriod = redeemResult.billingPeriod ?? gift.billingPeriod ?? "annual";
    const passwordHash = hashPassword(password);

    await internalConvexMutation("ourfable:createFamily", {
      familyId,
      childName,
      childDob,
      parentNames,
      parentEmail: normalizedEmail,
      plan: billingPeriod,
    });

    await internalConvexMutation("ourfable:seedCircle", { familyId }).catch(() => {});
    await internalConvexMutation("ourfable:seedMilestones", { familyId }).catch(() => {});
    await internalConvexMutation("ourfable:seedFirstLetter", { familyId }).catch(() => {});

    await addAccount({
      email: normalizedEmail,
      passwordHash,
      familyId,
      childName,
      parentNames,
      planType,
      stripeCustomerId: gift.stripeCustomerId,
      stripeSubscriptionId: gift.stripeSubscriptionId,
      birthDate: childDob,
    });

    if (facilitator1Name || facilitator1Email) {
      await internalConvexMutation("ourfable:updateOurFableFacilitators", {
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

    await internalConvexMutation("ourfable:updateOurFableLapseNotification", {
      familyId,
      notifyFacilitatorOnLapse: notifyFacilitatorOnLapse !== false,
    }).catch(() => {});

    if (childDob) {
      await internalConvexMutation("ourfable:createOurFableDeliveryMilestones", {
        familyId,
        childDob,
      }).catch(() => {});
    }

    console.log(`[create-gifted-account] ✅ Account created via gift: familyId=${familyId} email=${normalizedEmail} giftCode=${normalizedGiftCode} planType=${planType}`);

    const sessionToken = createSession(familyId, {
      email: normalizedEmail,
      name: parentNames,
    });

    const res = NextResponse.json({ success: true, familyId });
    res.cookies.set(COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return res;
  } catch (err) {
    if (redeemedGiftCode && redeemedFamilyId) {
      await internalConvexMutation("ourfable:rollbackGiftRedemption", {
        giftCode: redeemedGiftCode,
        familyId: redeemedFamilyId,
      }).catch(() => {});
    }

    console.error("[create-gifted-account]", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
