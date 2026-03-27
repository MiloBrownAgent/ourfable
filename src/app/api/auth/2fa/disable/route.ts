import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { getAccount, verifyPassword } from "@/lib/accounts";
import * as OTPAuth from "otpauth";
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
  await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.34.0" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
}

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
  const family = await convexQuery("ourfable:getOurFableFamilyById", { familyId: session.familyId }) as {
    email: string;
  } | null;
  if (!family) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const account = await getAccount(family.email);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Verify TOTP code
  const twoFA = await convexQuery("ourfable:getOurFable2FAStatus", { familyId: session.familyId }) as {
    totpSecret?: string;
    totpEnabled: boolean;
  } | null;

  if (!twoFA?.totpSecret) {
    return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
  }

  const totp = new OTPAuth.TOTP({
    issuer: "Our Fable",
    label: session.familyId,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(twoFA.totpSecret),
  });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  // Disable 2FA
  await convexMutation("ourfable:updateOurFable2FA", {
    familyId: session.familyId,
    totpEnabled: false,
    totpSecret: "",
  });

  return NextResponse.json({ success: true });
}
