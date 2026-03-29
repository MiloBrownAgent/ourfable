/**
 * Vault Recovery API — handles encryption key re-wrapping and recovery code
 * verification during password reset flow.
 * 
 * SECURITY: These operations use internal Convex functions. The familyId
 * must be validated (exists in ourfable_families). The recovery code
 * consumption provides its own authorization (code must be valid).
 */
import { NextRequest, NextResponse } from "next/server";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body as { action: string };

    if (action === "updateEncryptedFamilyKey") {
      const { familyId, encryptedFamilyKey, keySalt } = body as {
        familyId: string;
        encryptedFamilyKey: string;
        keySalt: string;
      };
      if (!familyId || !encryptedFamilyKey) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      // Verify family exists
      const family = await internalConvexQuery("ourfable:getOurFableFamilyById", { familyId });
      if (!family) {
        return NextResponse.json({ error: "Family not found" }, { status: 404 });
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
