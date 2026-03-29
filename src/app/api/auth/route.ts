import { NextRequest, NextResponse } from "next/server";
import { createSession, COOKIE, SESSION_MAX_AGE, checkRateLimit, clearRateLimit } from "@/lib/auth";
import { getAccount, verifyPassword, needsHashUpgrade, hashPassword } from "@/lib/accounts";
import { CONVEX_URL } from "@/lib/convex";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Rate limit: 5 attempts per 15 minutes per IP
  const { allowed } = checkRateLimit(`auth:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
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
    return NextResponse.json({ error: "No account found for that email." }, { status: 401 });
  }

  // Verify password
  if (!verifyPassword(password, account.passwordHash)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  // Auth success — clear rate limit
  clearRateLimit(`auth:${ip}`);

  // Check if 2FA is enabled
  const twoFAStatus = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: "ourfable:getOurFable2FAStatus", args: { familyId: account.familyId }, format: "json" }),
  }).then(r => r.json()).then(d => d.value).catch(() => null) as { totpEnabled: boolean } | null;

  if (twoFAStatus?.totpEnabled) {
    // Check for remembered device
    const deviceCookie = req.cookies.get("ourfable_2fa_device")?.value;
    const isRemembered = deviceCookie && (() => {
      try {
        const decoded = Buffer.from(deviceCookie, "base64url").toString();
        const [devFamilyId, ts] = decoded.split(":");
        return devFamilyId === account.familyId && (Date.now() - parseInt(ts)) < 30 * 24 * 60 * 60 * 1000;
      } catch { return false; }
    })();

    if (!isRemembered) {
      return NextResponse.json({ requires2fa: true, familyId: account.familyId });
    }
  }

  // Migrate legacy HMAC-SHA256 hash to bcrypt on successful login
  if (needsHashUpgrade(account.passwordHash)) {
    try {
      const newHash = hashPassword(password);
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.34.0" },
        body: JSON.stringify({
          path: "ourfable:updateOurFablePasswordHash",
          args: { email: email.toLowerCase().trim(), passwordHash: newHash },
          format: "json",
        }),
      });
      console.log(`[auth] Migrated password hash to bcrypt for ${email}`);
    } catch (err) {
      // Non-fatal — old hash still works
      console.warn("[auth] Failed to migrate password hash:", err);
    }
  }

  // Fetch encryption key material for client-side key derivation
  let encryptionKeys: { encryptedFamilyKey: string | null; keySalt: string | null } | null = null;
  try {
    const encRes = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:getFamilyEncryptionKeys", args: { familyId: account.familyId }, format: "json" }),
    });
    const encData = await encRes.json();
    if (encData.value?.encryptedFamilyKey) {
      encryptionKeys = {
        encryptedFamilyKey: encData.value.encryptedFamilyKey,
        keySalt: encData.value.keySalt,
      };
    }
  } catch {
    // Non-fatal — encryption may not be set up
  }

  const token = await createSession(account.familyId);
  const redirectPath = `/${account.familyId}`;

  const res = NextResponse.json({
    redirect: redirectPath,
    familyId: account.familyId,
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
