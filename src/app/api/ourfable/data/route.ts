/**
 * Authenticated Convex proxy — all client ourfable reads go through here.
 * Session cookie validated before any data is returned.
 *
 * SECURITY: familyId enforcement — authenticated requests have their familyId
 * overridden with session.familyId to prevent IDOR attacks.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE, type SessionPayload } from "@/lib/auth";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";


const ALLOWED_QUERIES = new Set([
  "ourfable:getFamily",
  "ourfable:listChronicle",
  "ourfable:getChronicleEntry",
  "ourfable:listMilestones",
  "ourfable:markMilestoneReached",
  "ourfable:addMilestone",
  "ourfable:listLetters",
  "ourfable:writeLetter",
  "ourfable:listCircle",
  "ourfable:addCircleMember",
  "ourfable:getShareData",
  "ourfable:getMemberByInviteToken",
  "ourfable:getMemberByShareToken",
  "ourfable:patchFamily",
  "ourfable:unlockEntry",
  "ourfable:listVaultEntries",
  "ourfable:createOutgoing",
  "ourfable:listOutgoings",
  "ourfable:listSnapshots",
  "ourfable:upsertSnapshot",
  "ourfable:createNotification",
  "ourfable:listNotifications",
  "ourfable:markNotificationsRead",
  "ourfable:seedBeforeBorn",
  "ourfable:listBeforeBorn",
  "ourfable:answerBeforeBorn",
  "ourfable:generateBirthdayLetter",
  "ourfable:listBirthdayLetters",
  "ourfable:patchBirthdayLetterParentNote",
  "ourfable:getGift",
  "ourfable:requestPrintBook",
  "ourfable:listPrintOrders",
  "ourfable:createVoiceSubmission",
  "ourfable:listVoiceSubmissions",
  "ourfable:getPromptByToken",
  "ourfable:getDeliveryMilestones",
  "ourfable:setDeliveryMilestone",
  "ourfable:deleteDeliveryMilestone",
  "ourfable:getUpcomingDeliveries",
  "ourfable:listOurFableVaultEntries",
  "ourfable:getOurFableVaultEntry",
  "ourfable:getOurFableDispatchDetail",
  "ourfable:addOurFableVaultEntry",
  "ourfable:unlockOurFableVaultEntry",
  "ourfable:unlockVaultEntryEarly",
  "ourfable:listOurFableLetters",
  "ourfable:listOurFableSnapshots",
  "ourfable:listOurFableMilestones",
  // SECURITY: Use safe version that strips passwordHash, totpSecret, recoveryCodeHashes, etc.
  "ourfable:getOurFableFamilyByIdSafe",
  "ourfable:getOurFableStorageUsage",
  "ourfable:getOurFableFacilitators",
  "ourfable:getOurFable2FAStatusPublic",
  "ourfable:listOurFableDeliveryMilestones",
  "ourfable:listChildren",
  "ourfable:getLegacySettings",
  "ourfable:listOurFableUsersByFamily",
  "ourfable:updateOurFableFacilitators",
  "ourfable:updateOurFableLapseNotification",
  // SERVER_ONLY — NEVER add these to ALLOWED_QUERIES:
  // - getOurFableFamilyByEmail (email-based lookup, returns passwordHash — CRIT-1)
  // - updateOurFablePasswordHash (email-based mutation — CRIT-1)
  // - getOurFableFamilyById (returns full record including passwordHash)
  // - setupFamilyEncryption, updateEncryptedFamilyKey, storeRecoveryCodeHashes
  // - verifyAndConsumeRecoveryCode, markRecoverySetupComplete, storeGuardianKeyShare
  // - createSignupToken, getSignupToken, consumeSignupToken
  // - reset2FAAttempts, record2FAFailure, check2FARateLimit
  // - createPasswordReset, getPasswordReset, deletePasswordReset
  // - consumePasswordResetToken, updateOurFablePassword
  // - createOurFableFamily, updateOurFable2FA, getOurFable2FAStatus
  // - getFamilyEncryptionKeys
  // These are called ONLY from server-side API routes via internalConvexQuery/internalConvexMutation.
  "ourfable:getDispatchByViewToken",
  "ourfable:getReferralByCode",
  "ourfable:listReferralCodes",
  "ourfable:createReferralCodes",
  "ourfable:redeemReferral",
  "ourfable:sealParentLetter",
  "ourfable:getMediaUrl",
  "ourfable:addCustomDeliveryMilestone",
  "ourfable:deleteOurFableDeliveryMilestone",
  "ourfable:listDeliveryMilestones",
  // Recovery codes & vault protection — safe read-only queries (public)
  "ourfable:isRecoverySetupComplete",
  "ourfable:getRecoveryCodeStatus",
  "ourfable:getGuardianKeyShares",
]);

// Public — no session required (join/share flows)
// SECURITY: These queries do NOT use familyId from the session.
// Only token-based lookups and read-only public data belong here.
const PUBLIC_QUERIES = new Set([
  "ourfable:getDispatchByViewToken",
  "ourfable:getShareData",
  "ourfable:getMemberByInviteToken",
  "ourfable:getMemberByShareToken",
  "ourfable:getGift",
  "ourfable:getPromptByToken",
  "ourfable:getReferralByCode",
]);

export async function POST(req: NextRequest) {
  let body: { path?: string; args?: Record<string, unknown>; type?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { path, args = {}, type = "query" } = body;
  if (!path || typeof path !== "string") return NextResponse.json({ error: "Missing path" }, { status: 400 });
  if (!ALLOWED_QUERIES.has(path)) return NextResponse.json({ error: "Not permitted" }, { status: 403 });

  // Auth check + IDOR prevention
  let session: SessionPayload | null = null;
  if (!PUBLIC_QUERIES.has(path)) {
    const token = req.cookies.get(COOKIE)?.value;
    session = token ? await verifySession(token) : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // SECURITY: Inject familyId from session for authenticated requests that are family-scoped.
    // Some safe utility queries (e.g. getMediaUrl) are not familyId-based and reject extra args.
    if (path !== "ourfable:getMediaUrl") {
      args.familyId = session.familyId;
    }
  }

  const endpoint = type === "mutation" ? "mutation" : "query";

  try {
    let data: { value?: unknown; [key: string]: unknown };

    // ALL functions are now internal — route through the authenticated HTTP action gateway
    const result = type === "mutation"
      ? await internalConvexMutation(path, args as Record<string, unknown>)
      : await internalConvexQuery(path, args as Record<string, unknown>);
    data = { value: result };

    // Server-side vault sealing enforcement:
    // Never return sealed content to the client if child hasn't reached unlockAge
    const VAULT_PATHS = ["ourfable:listVaultEntries", "ourfable:listOurFableVaultEntries"];
    if (VAULT_PATHS.includes(path) && data.value && Array.isArray(data.value)) {
      const familyId = args.familyId as string;
      let childBirthDate: string | null = null;

      // Try to get birth date from ourfable_families first, then ourfable_vault_families
      try {
        const ourfableData = await internalConvexQuery<{ birthDate?: string } | null>(
          "ourfable:getOurFableFamilyById", { familyId }
        );
        childBirthDate = ourfableData?.birthDate ?? null;

        if (!childBirthDate) {
          const legacyData = await internalConvexQuery<{ childDob?: string } | null>(
            "ourfable:getFamily", { familyId }
          );
          childBirthDate = legacyData?.childDob ?? null;
        }
      } catch { /* non-fatal */ }

      if (childBirthDate) {
        const dob = new Date(childBirthDate + "T00:00:00");
        const now = new Date();
        const childAgeYears = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

        data = {
          ...data,
          value: data.value.map((entry: Record<string, unknown>) => {
            const isSealed = entry.isOpen === false || entry.isSealed === true;
            const unlockAge = (entry.unlocksAtAge ?? entry.unlockAge ?? null) as number | null;

            if (isSealed && unlockAge !== null && childAgeYears < unlockAge) {
              // Strip content — return locked placeholder
              return {
                ...entry,
                body: null,
                content: null,
                subject: entry.subject ? "🔒 Sealed" : undefined,
                audioUrl: null,
                photoUrl: null,
                videoUrl: null,
                isLocked: true,
              };
            }
            return entry;
          }),
        };
      }
    }

    // Strip sensitive fields from public query responses
    if (PUBLIC_QUERIES.has(path) && data.value && typeof data.value === "object") {
      const SENSITIVE_FIELDS = [
        "parentEmail", "stripeCustomerId", "stripeSubscriptionId",
        "passwordHash", "testIntervalMinutes", "childEmailAlias",
      ];
      const strip = (obj: Record<string, unknown>) => {
        for (const field of SENSITIVE_FIELDS) delete obj[field];
        return obj;
      };
      if (Array.isArray(data.value)) {
        data = { ...data, value: data.value.map((v: Record<string, unknown>) => strip({ ...v })) };
      } else {
        data = { ...data, value: strip({ ...data.value }) };
      }
    }

    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upstream error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
