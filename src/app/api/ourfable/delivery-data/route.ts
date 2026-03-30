import { internalConvexMutation, internalConvexQuery } from "@/lib/convex-internal";
import { NextRequest, NextResponse } from "next/server";

const DELIVERY_REVISIT_GRACE_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const tokenData = await internalConvexQuery<{
    familyId: string;
    type: string;
    usedAt?: number;
  } | null>("ourfable:getOurFableDeliveryToken", { token });

  if (!tokenData) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  const now = Date.now();
  if (tokenData.usedAt && now - tokenData.usedAt > DELIVERY_REVISIT_GRACE_MS) {
    return NextResponse.json({ error: "This delivery link has expired" }, { status: 410 });
  }

  if (!tokenData.usedAt) {
    await internalConvexMutation("ourfable:markOurFableDeliveryTokenUsed", { token });
  }

  const family = await internalConvexQuery<{
    childName: string;
    parentNames?: string;
    birthDate?: string;
  } | null>("ourfable:getOurFableFamilyById", { familyId: tokenData.familyId });

  if (!family) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  const [entries, letters] = await Promise.all([
    internalConvexQuery("ourfable:listOurFableVaultEntries", { familyId: tokenData.familyId }).catch(() => []),
    internalConvexQuery("ourfable:listOurFableLetters", { familyId: tokenData.familyId }).catch(() => []),
  ]);

  return NextResponse.json({
    childName: family.childName,
    parentNames: family.parentNames,
    familyId: tokenData.familyId,
    firstUsedAt: tokenData.usedAt ?? now,
    gracePeriodHours: 24,
    entries: entries ?? [],
    letters: letters ?? [],
  });
}
