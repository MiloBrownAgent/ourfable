import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";
import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the account email from Convex using the session familyId
  const account = await internalConvexQuery<{ email?: string } | null>(
    "ourfable:getOurFableFamilyById", { familyId: session.familyId }
  );

  return NextResponse.json({
    familyId: session.familyId,
    email: account?.email ?? null,
  });
}
