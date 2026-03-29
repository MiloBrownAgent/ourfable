import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { internalConvexMutation } from "@/lib/convex-internal";

const BCRYPT_ROUNDS = 12;

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // H5 SECURITY: Atomically consume the token BEFORE updating password (TOCTOU fix).
    // This prevents a race condition where parallel requests could use the same token.
    const resetRecord = await internalConvexMutation<{ email: string; token: string } | null>(
      "ourfable:consumePasswordResetToken", { token }
    );
    if (!resetRecord) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    // Hash new password
    const passwordHash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);

    // Update password in Convex
    await internalConvexMutation("ourfable:updateOurFablePassword", {
      email: resetRecord.email,
      passwordHash,
    });

    // Clean up the consumed token
    await internalConvexMutation("ourfable:deletePasswordReset", { token }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[auth/reset-confirm]", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
