import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
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

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  // Get the stored secret
  const twoFA = await convexQuery("ourfable:getOurFable2FAStatus", { familyId: session.familyId }) as {
    totpSecret?: string;
    totpEnabled: boolean;
  } | null;

  if (!twoFA?.totpSecret) {
    return NextResponse.json({ error: "2FA not set up" }, { status: 400 });
  }

  // Verify the code using our custom implementation (no external libraries)
  const isValid = await verifyTOTP(code, twoFA.totpSecret);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 });
  }

  // Enable 2FA
  await convexMutation("ourfable:updateOurFable2FA", {
    familyId: session.familyId,
    totpEnabled: true,
  });

  return NextResponse.json({ success: true });
}
