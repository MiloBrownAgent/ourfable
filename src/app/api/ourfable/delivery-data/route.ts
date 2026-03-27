import { NextRequest, NextResponse } from "next/server";
import { CONVEX_URL } from "@/lib/convex";


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

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // Look up delivery token
  const tokenData = await convexQuery("ourfable:getOurFableDeliveryToken", { token }) as {
    familyId: string;
    type: string;
    usedAt?: number;
  } | null;

  if (!tokenData) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  // Get family data
  const family = await convexQuery("ourfable:getOurFableFamilyById", { familyId: tokenData.familyId }) as {
    childName: string;
    parentNames?: string;
    birthDate?: string;
  } | null;

  if (!family) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  // Get vault entries and letters
  const [entries, letters] = await Promise.all([
    convexQuery("ourfable:listOurFableVaultEntries", { familyId: tokenData.familyId }),
    convexQuery("ourfable:listOurFableLetters", { familyId: tokenData.familyId }),
  ]);

  return NextResponse.json({
    childName: family.childName,
    parentNames: family.parentNames,
    familyId: tokenData.familyId,
    entries: entries ?? [],
    letters: letters ?? [],
  });
}
