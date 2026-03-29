import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { getAccount, verifyPassword } from "@/lib/accounts";
import { verifyTOTP } from "@/lib/totp";
import { decryptTOTPSecret } from "@/lib/totp-encryption";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { password, code } = await req.json();
  if (!password || !code) {
    return NextResponse.json({ error: "Password and code required" }, { status: 400 });
  }

  // Get family account to verify password
  const family = await internalConvexQuery<{ email: string } | null>(
    "ourfable:getOurFableFamilyById", { familyId: session.familyId }
  );
  if (!family) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const account = await getAccount(family.email);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Verify TOTP code using our custom implementation (no external libraries)
  const twoFA = await internalConvexQuery<{
    totpSecret?: string;
    totpEnabled: boolean;
  } | null>("ourfable:getOurFable2FAStatus", { familyId: session.familyId });

  if (!twoFA?.totpSecret) {
    return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
  }

  // C3: Decrypt TOTP secret before verification
  const plaintextSecret = decryptTOTPSecret(twoFA.totpSecret);
  const isValid = await verifyTOTP(code, plaintextSecret);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  // Disable 2FA
  await internalConvexMutation("ourfable:updateOurFable2FA", {
    familyId: session.familyId,
    totpEnabled: false,
    totpSecret: "",
  });

  return NextResponse.json({ success: true });
}
