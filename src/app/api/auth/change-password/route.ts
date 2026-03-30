import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { verifyPassword, hashPassword } from "@/lib/accounts";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both current and new password are required" }, { status: 400 });
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 });
  }

  const family = await internalConvexQuery<{
    email: string;
    passwordHash: string;
  } | null>("ourfable:getOurFableFamilyById", { familyId: session.familyId });

  if (!family) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const user = session.userId
    ? await internalConvexQuery<{
        email: string;
        passwordHash: string;
      } | null>("ourfable:getOurFableUserById", { userId: session.userId })
    : null;

  const matchesUser = user ? verifyPassword(currentPassword, user.passwordHash) : false;
  const matchesFamily = verifyPassword(currentPassword, family.passwordHash);
  if ((user && !matchesUser && !matchesFamily) || (!user && !matchesFamily)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  // Hash new password and update
  const newHash = hashPassword(newPassword);
  const passwordChangedAt = Date.now();
  await internalConvexMutation("ourfable:updateOurFablePasswordHash", {
    email: family.email,
    passwordHash: newHash,
    passwordChangedAt,
  });
  if (user) {
    await internalConvexMutation("ourfable:updateOurFableUserPasswordHash", {
      email: user.email,
      passwordHash: newHash,
      passwordChangedAt,
    });
  }

  return NextResponse.json({ success: true });
}
