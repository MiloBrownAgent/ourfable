import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";
import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // If session has userId (new dual-parent system), use it
  if (session.userId) {
    const user = await internalConvexQuery<{
      email: string;
      name: string;
      role: string;
      familyId: string;
    } | null>("ourfable:getOurFableUserById", { userId: session.userId });

    return NextResponse.json({
      familyId: session.familyId,
      userId: session.userId,
      email: user?.email ?? session.email ?? null,
      name: user?.name ?? session.name ?? null,
      role: user?.role ?? null,
    });
  }

  // Fall back to family-based auth (legacy)
  const account = await internalConvexQuery<{ email?: string; parentNames?: string } | null>(
    "ourfable:getOurFableFamilyById", { familyId: session.familyId }
  );

  return NextResponse.json({
    familyId: session.familyId,
    email: account?.email ?? null,
    name: account?.parentNames ?? null,
  });
}
