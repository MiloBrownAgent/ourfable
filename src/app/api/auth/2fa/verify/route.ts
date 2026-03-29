import { NextRequest, NextResponse } from "next/server";
import { createSession, COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { verifyTOTP } from "@/lib/totp";
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

export async function POST(req: NextRequest) {
  const { familyId, code, rememberDevice } = await req.json();

  if (!familyId || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Get 2FA secret
  const twoFA = await convexQuery("ourfable:getOurFable2FAStatus", { familyId }) as {
    totpSecret?: string;
    totpEnabled: boolean;
  } | null;

  if (!twoFA?.totpSecret || !twoFA.totpEnabled) {
    return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
  }

  // Verify TOTP code using our custom implementation (no external libraries)
  const isValid = await verifyTOTP(code, twoFA.totpSecret);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

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

  // Remember device for 30 days if requested
  if (rememberDevice) {
    const deviceToken = Buffer.from(`${familyId}:${Date.now()}`).toString("base64url");
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
