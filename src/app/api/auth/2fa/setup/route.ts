import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import * as OTPAuth from "otpauth";
import { CONVEX_URL } from "@/lib/convex";


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

  // Generate TOTP secret
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: "Our Fable",
    label: session.familyId,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  const otpauthUri = totp.toString();

  // Store secret (not yet enabled — will be enabled after confirmation)
  await convexMutation("ourfable:updateOurFable2FA", {
    familyId: session.familyId,
    totpSecret: secret.base32,
    totpEnabled: false,
  });

  // Generate QR code data URL using a simple SVG-based approach
  // The client can use the URI to display or scan
  return NextResponse.json({
    otpauthUri,
    secret: secret.base32,
  });
}
