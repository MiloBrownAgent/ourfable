import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { CONVEX_URL } from "@/lib/convex";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the account email from Convex using the session familyId
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.33.0" },
    body: JSON.stringify({ path: "ourfable:getOurFableFamilyById", args: { familyId: session.familyId }, format: "json" }),
  });
  const data = await res.json();
  const account = data.value;

  return NextResponse.json({
    familyId: session.familyId,
    email: account?.email ?? null,
  });
}
