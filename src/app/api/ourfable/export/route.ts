import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "../../../../lib/auth";
import { CONVEX_URL } from "@/lib/convex";


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
    // Fetch all contributions for this family
    const [contribRes, lettersRes, snapshotsRes] = await Promise.all([
      fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.33.0" },
        body: JSON.stringify({ path: "ourfable:listContributionsByFamily", args: { familyId }, format: "json" }),
      }),
      fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.33.0" },
        body: JSON.stringify({ path: "ourfable:listLettersByFamily", args: { familyId }, format: "json" }),
      }),
      fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.33.0" },
        body: JSON.stringify({ path: "ourfable:listSnapshotsByFamily", args: { familyId }, format: "json" }),
      }),
    ]);

    const contributions = contribRes.ok ? (await contribRes.json()).value ?? [] : [];
    const letters = lettersRes.ok ? (await lettersRes.json()).value ?? [] : [];
    const snapshots = snapshotsRes.ok ? (await snapshotsRes.json()).value ?? [] : [];

    const exportData = {
      exportedAt: new Date().toISOString(),
      familyId,
      summary: {
        contributions: contributions.length,
        letters: letters.length,
        snapshots: snapshots.length,
      },
      contributions,
      letters,
      snapshots,
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
