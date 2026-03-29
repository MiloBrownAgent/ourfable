import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { verifyTOTP } from "@/lib/totp";
import { decryptTOTPSecret } from "@/lib/totp-encryption";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  // Get the stored secret
  const twoFA = await internalConvexQuery<{
    totpSecret?: string;
    totpEnabled: boolean;
  } | null>("ourfable:getOurFable2FAStatus", { familyId: session.familyId });

  if (!twoFA?.totpSecret) {
    return NextResponse.json({ error: "2FA not set up" }, { status: 400 });
  }

  // C3: Decrypt TOTP secret before verification
  const plaintextSecret = decryptTOTPSecret(twoFA.totpSecret);
  // Verify the code using our custom implementation (no external libraries)
  const isValid = await verifyTOTP(code, plaintextSecret);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 });
  }

  // Enable 2FA
  await internalConvexMutation("ourfable:updateOurFable2FA", {
    familyId: session.familyId,
    totpEnabled: true,
  });

  return NextResponse.json({ success: true });
}
