import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";

type RecoveryBody = {
  action?: string;
  args?: Record<string, unknown>;
};

const QUERY_ACTIONS = new Set([
  "ourfable:getFamilyEncryptionKeys",
  "ourfable:getRecoveryCodeStatus",
  "ourfable:isRecoverySetupComplete",
  "ourfable:getGuardianKeyShares",
]);

const MUTATION_ACTIONS = new Set([
  "ourfable:storeRecoveryCodeHashes",
  "ourfable:markRecoverySetupComplete",
  "ourfable:updateEncryptedFamilyKey",
  "ourfable:storeGuardianKeyShare",
  "ourfable:setupFamilyEncryption",
]);

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(COOKIE)?.value;
  const session = sessionToken ? await verifySession(sessionToken) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as RecoveryBody));
  const { action, args = {} } = body;
  if (!action || typeof action !== "string") {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const scopedArgs = { ...args, familyId: session.familyId };

  try {
    if (QUERY_ACTIONS.has(action)) {
      const value = await internalConvexQuery(action, scopedArgs);
      return NextResponse.json({ value });
    }

    if (MUTATION_ACTIONS.has(action)) {
      const value = await internalConvexMutation(action, scopedArgs);
      return NextResponse.json({ value });
    }

    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  } catch (error) {
    console.error("[ourfable/recovery]", error);
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
}
