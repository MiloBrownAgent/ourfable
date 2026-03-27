import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { verifyPassword, hashPassword } from "@/lib/accounts";
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

async function convexMutation(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.34.0" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) throw new Error(`Convex mutation ${path} failed`);
  return res.json();
}

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

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }

  // Get the family account by familyId
  const family = await convexQuery("ourfable:getOurFableFamilyById", { familyId: session.familyId }) as {
    email: string;
    passwordHash: string;
  } | null;

  if (!family) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Verify current password
  if (!verifyPassword(currentPassword, family.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  // Hash new password and update
  const newHash = hashPassword(newPassword);
  await convexMutation("ourfable:updateOurFablePasswordHash", {
    email: family.email,
    passwordHash: newHash,
  });

  return NextResponse.json({ success: true });
}
