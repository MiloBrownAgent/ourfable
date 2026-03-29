import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { generateTOTPSecret, generateTOTPUri } from "@/lib/totp";
import { CONVEX_URL } from "@/lib/convex";


async function convexMutation(path: string, args: Record<string, unknown>) {
  await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.34.0" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
}

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
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  // Get the family email for the TOTP URI label
  const family = await convexQuery("ourfable:getOurFableFamilyById", { familyId: session.familyId }) as { email?: string } | null;
  const email = family?.email ?? session.familyId;

  // Generate TOTP secret using our custom implementation (no external libraries)
  const secret = generateTOTPSecret();
  const otpauthUri = generateTOTPUri(secret, email, "Our Fable");

  // Store secret (not yet enabled — will be enabled after confirmation)
  await convexMutation("ourfable:updateOurFable2FA", {
    familyId: session.familyId,
    totpSecret: secret,
    totpEnabled: false,
  });

  return NextResponse.json({
    otpauthUri,
    secret,
  });
}
