import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "../../../../lib/auth";
import { convexQuery } from "@/lib/convex";

// Export everything in a family's vault as a JSON manifest
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const familyId = session.familyId;
  if (!familyId) {
    return NextResponse.json({ error: "No family found" }, { status: 404 });
  }

  try {
    const [contributions, letters, snapshots, vaultEntries, dispatches, deliveryMilestones] = await Promise.all([
      convexQuery<unknown[]>("ourfable:listContributionsByFamily", { familyId }).catch(() => []),
      convexQuery<unknown[]>("ourfable:listLettersByFamily", { familyId }).catch(() => []),
      convexQuery<unknown[]>("ourfable:listSnapshotsByFamily", { familyId }).catch(() => []),
      convexQuery<unknown[]>("ourfable:listOurFableVaultEntries", { familyId }).catch(() => []),
      convexQuery<unknown[]>("ourfable:listOurFableDispatches", { familyId }).catch(() => []),
      convexQuery<unknown[]>("ourfable:listOurFableDeliveryMilestones", { familyId }).catch(() => []),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      familyId,
      summary: {
        contributions: contributions.length,
        letters: letters.length,
        snapshots: snapshots.length,
        vaultEntries: vaultEntries.length,
        dispatches: dispatches.length,
        deliveryMilestones: deliveryMilestones.length,
      },
      contributions,
      letters,
      snapshots,
      vaultEntries,
      dispatches,
      deliveryMilestones,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="ourfable-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
