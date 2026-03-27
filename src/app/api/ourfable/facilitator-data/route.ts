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

  const tokenData = await convexQuery("ourfable:getOurFableFacilitatorToken", { token }) as {
    familyId: string;
    milestoneId: string;
    facilitatorEmail: string;
    facilitatorName: string;
    usedAt?: number;
  } | null;

  if (!tokenData || tokenData.usedAt) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  const family = await convexQuery("ourfable:getOurFableFamilyById", { familyId: tokenData.familyId }) as {
    childName: string;
  } | null;

  if (!family) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  // Get milestone info
  const milestones = await convexQuery("ourfable:listOurFableDeliveryMilestones", { familyId: tokenData.familyId }) as Array<{
    _id: string;
    milestoneName: string;
    milestoneDate: number;
  }> | null;

  const milestone = milestones?.find(m => m._id === tokenData.milestoneId);

  return NextResponse.json({
    facilitatorName: tokenData.facilitatorName,
    facilitatorEmail: tokenData.facilitatorEmail,
    childName: family.childName,
    milestoneName: milestone?.milestoneName ?? "milestone birthday",
    milestoneDate: milestone?.milestoneDate ?? 0,
    familyId: tokenData.familyId,
    milestoneId: tokenData.milestoneId,
  });
}
