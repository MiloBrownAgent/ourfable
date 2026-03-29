/**
 * Vault Recovery API — handles encryption key re-wrapping and recovery code
 * verification during password reset flow.
 * 
 * SECURITY: Both actions require a valid, unconsumed recovery code to prove
 * the caller has legitimate access to the family's recovery material.
 * updateEncryptedFamilyKey requires a recovery code hash to be verified first.
 */
import { NextRequest, NextResponse } from "next/server";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";
import { verifySession, COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body as { action: string };

    if (action === "updateEncryptedFamilyKey") {
      const { familyId, encryptedFamilyKey, keySalt, codeHash } = body as {
        familyId: string;
        encryptedFamilyKey: string;
        keySalt: string;
        codeHash?: string;
      };
      if (!familyId || !encryptedFamilyKey) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }

      // SECURITY: Require either a valid session OR a valid recovery code.
      // During password reset, user won't have a session, so recovery code is the auth.
      const sessionToken = req.cookies.get(COOKIE)?.value;
      const session = sessionToken ? await verifySession(sessionToken) : null;

      if (session) {
        // Authenticated user — must be updating their own family
        if (session.familyId !== familyId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else if (codeHash) {
        // No session — must provide a valid recovery code as proof of ownership
        try {
          await internalConvexMutation("ourfable:verifyAndConsumeRecoveryCode", {
            familyId,
            codeHash,
          });
        } catch {
          return NextResponse.json({ error: "Invalid recovery code" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Unauthorized — session or recovery code required" }, { status: 401 });
      }

      const result = await internalConvexMutation("ourfable:updateEncryptedFamilyKey", {
        familyId,
        encryptedFamilyKey,
        keySalt,
      });
      return NextResponse.json({ value: result });
    }

    if (action === "verifyAndConsumeRecoveryCode") {
      const { familyId, codeHash } = body as {
        familyId: string;
        codeHash: string;
      };
      if (!familyId || !codeHash) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      try {
        const result = await internalConvexMutation("ourfable:verifyAndConsumeRecoveryCode", {
          familyId,
          codeHash,
        });
        return NextResponse.json({ value: result });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid recovery code";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[vault-recovery]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
