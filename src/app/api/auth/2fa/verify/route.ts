import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createSession, COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { verifyTOTP } from "@/lib/totp";
import { decryptTOTPSecret } from "@/lib/totp-encryption";
import { CONVEX_URL } from "@/lib/convex";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "";

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
  await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.34.0" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
}

/**
 * HMAC-sign a device token to prevent forgery (H2 fix).
 */
function createDeviceToken(familyId: string): string {
  const payload = `${familyId}:${Date.now()}`;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${hmac}`;
}

/**
 * Verify an HMAC-signed device token (H2 fix).
 */
function verifyDeviceToken(token: string, expectedFamilyId: string): boolean {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return false;
    const payload = Buffer.from(payloadB64, "base64url").toString();
    const [familyId, tsStr] = payload.split(":");
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
  const { familyId, code, rememberDevice } = await req.json();

  if (!familyId || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // H1: Convex-backed rate limiting for 2FA
  const rateLimit = await convexQuery("ourfable:check2FARateLimit", { familyId }) as {
    allowed: boolean;
    remaining: number;
    lockedUntil?: number;
  } | null;

  if (rateLimit && !rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  // Get 2FA secret
  const twoFA = await convexQuery("ourfable:getOurFable2FAStatus", { familyId }) as {
    totpSecret?: string;
    totpEnabled: boolean;
  } | null;

  if (!twoFA?.totpSecret || !twoFA.totpEnabled) {
    return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
  }

  // C3: Decrypt TOTP secret (handles both encrypted and legacy plaintext)
  const plaintextSecret = decryptTOTPSecret(twoFA.totpSecret);

  // Verify TOTP code using our custom implementation (no external libraries)
  const isValid = await verifyTOTP(code, plaintextSecret);
  if (!isValid) {
    // H1: Record failed attempt
    await convexMutation("ourfable:record2FAFailure", { familyId });
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  // H1: Reset failed attempts on success
  await convexMutation("ourfable:reset2FAAttempts", { familyId });

  // Fetch encryption keys to return alongside session
  let encryptionKeys: { encryptedFamilyKey: string | null; keySalt: string | null } | null = null;
  try {
    const encData = await convexQuery("ourfable:getFamilyEncryptionKeys", { familyId });
    if (encData?.encryptedFamilyKey) {
      encryptionKeys = {
        encryptedFamilyKey: encData.encryptedFamilyKey,
        keySalt: encData.keySalt,
      };
    }
  } catch {
    // Non-fatal
  }

  // Issue session
  const sessionToken = await createSession(familyId);
  const redirectPath = `/${familyId}`;

  const res = NextResponse.json({ redirect: redirectPath, familyId, encryptionKeys });
  res.cookies.set(COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  // H2: HMAC-signed device token (prevents forgery)
  if (rememberDevice) {
    const deviceToken = createDeviceToken(familyId);
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
