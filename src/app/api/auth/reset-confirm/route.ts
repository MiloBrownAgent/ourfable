import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { CONVEX_URL } from "@/lib/convex";

const BCRYPT_ROUNDS = 12;

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
  if (!res.ok) throw new Error(`Convex mutation failed: ${await res.text()}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Look up the reset token
    const resetRecord = await convexQuery("ourfable:getPasswordReset", { token }) as {
      email: string;
      token: string;
      expiresAt: number;
    } | null;

    if (!resetRecord) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    // Check expiry
    if (Date.now() > resetRecord.expiresAt) {
      // Clean up expired token
      await convexMutation("ourfable:deletePasswordReset", { token }).catch(() => {});
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    // Hash new password
    const passwordHash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);

    // Update password in Convex
    await convexMutation("ourfable:updateOurFablePassword", {
      email: resetRecord.email,
      passwordHash,
    });

    // Delete the used reset token
    await convexMutation("ourfable:deletePasswordReset", { token }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[auth/reset-confirm]", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
