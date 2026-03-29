import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { generateTOTPSecret, generateTOTPUri } from "@/lib/totp";
import { encryptTOTPSecret } from "@/lib/totp-encryption";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  // Get the family email for the TOTP URI label
  const family = await internalConvexQuery<{ email?: string } | null>(
    "ourfable:getOurFableFamilyById", { familyId: session.familyId }
  );
  const email = family?.email ?? session.familyId;

  // Generate TOTP secret using our custom implementation (no external libraries)
  const secret = generateTOTPSecret();
  const otpauthUri = generateTOTPUri(secret, email, "Our Fable");

  // C3 SECURITY: Encrypt TOTP secret at rest before storing in database
  const encryptedSecret = encryptTOTPSecret(secret);

  // Store encrypted secret (not yet enabled — will be enabled after confirmation)
  await internalConvexMutation("ourfable:updateOurFable2FA", {
    familyId: session.familyId,
    totpSecret: encryptedSecret,
    totpEnabled: false,
  });

  // Return plaintext secret to client for QR code display (one-time)
  return NextResponse.json({
    otpauthUri,
    secret,
  });
}
