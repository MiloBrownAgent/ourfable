import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createSession, verifyPreAuthChallenge, COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { verifyTOTP } from "@/lib/totp";
import { decryptTOTPSecret } from "@/lib/totp-encryption";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "";

/**
 * HMAC-sign a device token to prevent forgery (H2 fix).
 */
function createDeviceToken(userId: string, familyId: string): string {
  const payload = `${userId}:${familyId}:${Date.now()}`;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${hmac}`;
}

/**
 * Verify an HMAC-signed device token (H2 fix).
 */
function verifyDeviceToken(token: string, expectedUserId: string, expectedFamilyId: string): boolean {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return false;
    const payload = Buffer.from(payloadB64, "base64url").toString();
    const [userId, familyId, tsStr] = payload.split(":");
    if (userId !== expectedUserId) return false;
    if (familyId !== expectedFamilyId) return false;
    const ts = parseInt(tsStr);
    if (isNaN(ts) || Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return false; // expired
    const expectedHmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
    // Constant-time comparison
    if (expectedHmac.length !== sig.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(sig));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const { familyId, code, rememberDevice, email: loginEmail, challengeToken } = await req.json();
  const normalizedLoginEmail = typeof loginEmail === "string" ? loginEmail.toLowerCase().trim() : undefined;

  if (!familyId || !code || !challengeToken || typeof challengeToken !== "string") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const challenge = await verifyPreAuthChallenge(challengeToken);
  if (!challenge || challenge.familyId !== familyId || challenge.email !== normalizedLoginEmail) {
    return NextResponse.json({ error: "Invalid or expired 2FA challenge" }, { status: 401 });
  }

  // H1: Convex-backed rate limiting for 2FA
  const rateLimit = await internalConvexQuery<{
    allowed: boolean;
    remaining: number;
    lockedUntil?: number;
  } | null>("ourfable:check2FARateLimit", { familyId });

  if (rateLimit && !rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  // Try user-level 2FA first, fall back to family-level
  let twoFA: { totpSecret?: string; totpEnabled: boolean } | null = null;
  let userId: string | undefined;
  let userName: string | undefined;
  let userEmail: string | undefined;
  let passwordChangedAt: number | undefined;

  if (normalizedLoginEmail) {
    const user = await internalConvexQuery<{
      _id: string;
      familyId: string;
      totpSecret?: string;
      totpEnabled?: boolean;
      passwordChangedAt?: number;
      name: string;
      email: string;
    } | null>("ourfable:getOurFableUserByEmail", { email: normalizedLoginEmail });
    if (user && user.familyId === familyId && user.totpEnabled && user.totpSecret) {
      twoFA = { totpSecret: user.totpSecret, totpEnabled: true };
      userId = user._id;
      userName = user.name;
      userEmail = user.email;
      passwordChangedAt = user.passwordChangedAt;
    }
  }

  if (!twoFA) {
    const familyTwoFA = await internalConvexQuery<{
      totpSecret?: string;
      totpEnabled: boolean;
    } | null>("ourfable:getOurFable2FAStatus", { familyId });
    twoFA = familyTwoFA;
    if (!userId) {
      const family = await internalConvexQuery<{ passwordChangedAt?: number } | null>(
        "ourfable:getOurFableFamilyById",
        { familyId }
      ).catch(() => null);
      passwordChangedAt = family?.passwordChangedAt;
    }
  }

  if (!twoFA?.totpSecret || !twoFA.totpEnabled) {
    return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
  }

  // C3: Decrypt TOTP secret (handles both encrypted and legacy plaintext)
  const plaintextSecret = decryptTOTPSecret(twoFA.totpSecret);

  // Verify TOTP code using our custom implementation (no external libraries)
  const isValid = await verifyTOTP(code, plaintextSecret);
  if (!isValid) {
    // H1: Record failed attempt
    await internalConvexMutation("ourfable:record2FAFailure", { familyId });
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  // H1: Reset failed attempts on success
  await internalConvexMutation("ourfable:reset2FAAttempts", { familyId });

  // Fetch encryption keys — prefer user-level, fall back to family
  let encryptionKeys: { encryptedFamilyKey: string | null; keySalt: string | null } | null = null;
  try {
    if (userId) {
      const userEnc = await internalConvexQuery<{
        encryptedFamilyKey: string | null;
        keySalt: string | null;
      } | null>("ourfable:getUserEncryptionKeys", { userId });
      if (userEnc?.encryptedFamilyKey) {
        encryptionKeys = { encryptedFamilyKey: userEnc.encryptedFamilyKey, keySalt: userEnc.keySalt };
      }
    }
    if (!encryptionKeys) {
      const encData = await internalConvexQuery<{
        encryptedFamilyKey: string | null;
        keySalt: string | null;
      } | null>("ourfable:getFamilyEncryptionKeys", { familyId });
      if (encData?.encryptedFamilyKey) {
        encryptionKeys = { encryptedFamilyKey: encData.encryptedFamilyKey, keySalt: encData.keySalt };
      }
    }
  } catch {
    // Non-fatal
  }

  // Issue session with userId
  const sessionToken = await createSession(familyId, {
    userId,
    email: userEmail ?? normalizedLoginEmail,
    name: userName,
    passwordChangedAt: Math.floor((passwordChangedAt ?? Date.now()) / 1000),
  });
  const redirectPath = `/${familyId}`;

  const res = NextResponse.json({ redirect: redirectPath, familyId, userId, encryptionKeys });
  res.cookies.set(COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  // H2: HMAC-signed device token (prevents forgery)
  if (rememberDevice) {
    if (!userId) {
      return NextResponse.json({ error: "Remembered devices require a user account" }, { status: 400 });
    }
    const deviceToken = createDeviceToken(userId, familyId);
    res.cookies.set("ourfable_2fa_device", deviceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  return res;
}

// Export for use in auth route
export { verifyDeviceToken };
