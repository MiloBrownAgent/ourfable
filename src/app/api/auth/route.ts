import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  createSession,
  createPreAuthChallenge,
  COOKIE,
  SESSION_MAX_AGE,
  checkLoginRateLimit,
  clearLoginRateLimit,
  recordLoginFailure,
} from "@/lib/auth";
import { getAccount, verifyPassword, needsHashUpgrade, hashPassword } from "@/lib/accounts";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Rate limit: 5 attempts per 15 minutes per IP (Convex-backed for serverless)
  const loginRateLimit = await checkLoginRateLimit(ip);
  if (!loginRateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  // Look up account (now async — queries Convex)
  const account = await getAccount(email);
  if (!account) {
    await recordLoginFailure(ip);
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // Verify password
  if (!verifyPassword(password, account.passwordHash)) {
    await recordLoginFailure(ip);
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // Auth success — clear rate limit
  await clearLoginRateLimit(ip);

  // Check if 2FA is enabled — user-level takes priority, fall back to family-level
  let twoFAStatus: { totpEnabled: boolean } | null = null;
  if (account.userId) {
    twoFAStatus = await internalConvexQuery<{ totpEnabled: boolean } | null>(
      "ourfable:getOurFableUser2FAStatus", { userId: account.userId }
    ).catch(() => null);
  }
  if (!twoFAStatus?.totpEnabled) {
    twoFAStatus = await internalConvexQuery<{ totpEnabled: boolean } | null>(
      "ourfable:getOurFable2FAStatus", { familyId: account.familyId }
    ).catch(() => null);
  }

  if (twoFAStatus?.totpEnabled) {
    // H2: Check for HMAC-signed remembered device token (prevents forgery)
    const deviceCookie = req.cookies.get("ourfable_2fa_device")?.value;
    const isRemembered = deviceCookie && (() => {
      try {
        const [payloadB64, sig] = deviceCookie.split(".");
        if (!payloadB64 || !sig) return false;
        const payload = Buffer.from(payloadB64, "base64url").toString();
        const [devUserId, devFamilyId, tsStr] = payload.split(":");
        if (devFamilyId !== account.familyId) return false;
        if (devUserId !== (account.userId ?? "")) return false;
        const ts = parseInt(tsStr);
        if (isNaN(ts) || Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return false;
        const expectedHmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
        if (expectedHmac.length !== sig.length) return false;
        return crypto.timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(sig));
      } catch { return false; }
    })();

    if (!isRemembered) {
      const challengeToken = await createPreAuthChallenge(
        account.familyId,
        email.toLowerCase().trim(),
        account.userId
      );
      return NextResponse.json({
        requires2fa: true,
        familyId: account.familyId,
        email: email.toLowerCase().trim(),
        challengeToken,
      });
    }
  }

  // Migrate legacy HMAC-SHA256 hash to bcrypt on successful login
  if (needsHashUpgrade(account.passwordHash)) {
    try {
      const newHash = hashPassword(password);
      // Update in user table if user-based, otherwise family table
      if (account.userId) {
        await internalConvexMutation("ourfable:updateOurFableUserPasswordHash", {
          email: email.toLowerCase().trim(),
          passwordHash: newHash,
        });
      } else {
        await internalConvexMutation("ourfable:updateOurFablePasswordHash", {
          email: email.toLowerCase().trim(),
          passwordHash: newHash,
        });
      }
      console.log(`[auth] Migrated password hash to bcrypt for ${email}`);
    } catch (err) {
      // Non-fatal — old hash still works
      console.warn("[auth] Failed to migrate password hash:", err);
    }
  }

  // Lazy migration: if logged in via family (no userId), create a user record
  if (!account.userId) {
    try {
      const userId = await internalConvexMutation("ourfable:createOurFableUser", {
        email: email.toLowerCase().trim(),
        passwordHash: account.passwordHash,
        familyId: account.familyId,
        name: account.parentNames || "Parent",
        role: "owner" as const,
      });
      if (userId) {
        (account as Record<string, unknown>).userId = String(userId);
        (account as Record<string, unknown>).userName = account.parentNames || "Parent";
        console.log(`[auth] Lazy-migrated user for ${email}`);
      }
    } catch (err) {
      // Non-fatal
      console.warn("[auth] Failed to lazy-migrate user:", err);
    }
  }

  // Fetch encryption key material — prefer user-level keys, fall back to family
  let encryptionKeys: { encryptedFamilyKey: string | null; keySalt: string | null } | null = null;
  try {
    if (account.userId) {
      const userEnc = await internalConvexQuery<{
        encryptedFamilyKey: string | null;
        keySalt: string | null;
      } | null>("ourfable:getUserEncryptionKeys", { userId: account.userId });
      if (userEnc?.encryptedFamilyKey) {
        encryptionKeys = { encryptedFamilyKey: userEnc.encryptedFamilyKey, keySalt: userEnc.keySalt };
      }
    }
    if (!encryptionKeys) {
      const encData = await internalConvexQuery<{
        encryptedFamilyKey: string | null;
        keySalt: string | null;
      } | null>("ourfable:getFamilyEncryptionKeys", { familyId: account.familyId });
      if (encData?.encryptedFamilyKey) {
        encryptionKeys = { encryptedFamilyKey: encData.encryptedFamilyKey, keySalt: encData.keySalt };
      }
    }
  } catch {
    // Non-fatal — encryption may not be set up
  }

  const token = await createSession(account.familyId, {
    userId: account.userId,
    email: email.toLowerCase().trim(),
    name: account.userName ?? account.parentNames,
    passwordChangedAt: Math.floor((account.passwordChangedAt ?? Date.now()) / 1000),
  });
  const redirectPath = `/${account.familyId}`;

  const res = NextResponse.json({
    redirect: redirectPath,
    familyId: account.familyId,
    userId: account.userId,
    encryptionKeys,
  });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return res;
}

// Logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
