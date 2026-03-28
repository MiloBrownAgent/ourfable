/**
 * Authenticated Convex proxy — all client ourfable reads go through here.
 * Session cookie validated before any data is returned.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { CONVEX_URL } from "@/lib/convex";


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
  "ourfable:submitContribution",
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
  "ourfable:createGift",
  "ourfable:getGift",
  "ourfable:redeemGift",
  "ourfable:requestPrintBook",
  "ourfable:listPrintOrders",
  "ourfable:createVoiceSubmission",
  "ourfable:listVoiceSubmissions",
  "ourfable:getPromptByToken",
  "ourfable:generateUploadUrl",
  "ourfable:submitVaultEntry",
  "ourfable:getDeliveryMilestones",
  "ourfable:setDeliveryMilestone",
  "ourfable:deleteDeliveryMilestone",
  "ourfable:getUpcomingDeliveries",
  "ourfable:listOurFableVaultEntries",
  "ourfable:addOurFableVaultEntry",
  "ourfable:listOurFableLetters",
  "ourfable:listOurFableSnapshots",
  "ourfable:listOurFableMilestones",
  "ourfable:getOurFableFamilyById",
  "ourfable:getOurFableStorageUsage",
  "ourfable:getOurFableFacilitators",
  "ourfable:getOurFable2FAStatus",
  "ourfable:listOurFableDeliveryMilestones",
  "ourfable:updateOurFableFacilitators",
  "ourfable:updateOurFableLapseNotification",
  "ourfable:getOurFableFamilyByEmail",
  "ourfable:updateOurFablePasswordHash",
  "ourfable:getReferralByCode",
  "ourfable:listReferralCodes",
  "ourfable:createReferralCodes",
  "ourfable:redeemReferral",
  "ourfable:sealParentLetter",
  "ourfable:getMediaUrl",
  "ourfable:addCustomDeliveryMilestone",
  "ourfable:deleteOurFableDeliveryMilestone",
  "ourfable:listDeliveryMilestones",
]);

// Public — no session required (join/share flows)
const PUBLIC_QUERIES = new Set([
  "ourfable:getShareData",
  "ourfable:getMemberByInviteToken",
  "ourfable:getMemberByShareToken",
  "ourfable:getFamily",
  "ourfable:submitContribution",
  "ourfable:getGift",
  "ourfable:getPromptByToken",
  "ourfable:generateUploadUrl",
  "ourfable:submitVaultEntry",
  "ourfable:getReferralByCode",
]);

export async function POST(req: NextRequest) {
  let body: { path?: string; args?: Record<string, unknown>; type?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { path, args = {}, type = "query" } = body;
  if (!path || typeof path !== "string") return NextResponse.json({ error: "Missing path" }, { status: 400 });
  if (!ALLOWED_QUERIES.has(path)) return NextResponse.json({ error: "Not permitted" }, { status: 403 });

  // Auth check
  if (!PUBLIC_QUERIES.has(path)) {
    const token = req.cookies.get(COOKIE)?.value;
    const session = token ? await verifySession(token) : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const endpoint = type === "mutation" ? "mutation" : "query";

  try {
    const res = await fetch(`${CONVEX_URL}/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.33.0" },
      body: JSON.stringify({ path, args, format: "json" }),
    });
    let data = await res.json();

    // Server-side vault sealing enforcement:
    // Never return sealed content to the client if child hasn't reached unlockAge
    const VAULT_PATHS = ["ourfable:listVaultEntries", "ourfable:listOurFableVaultEntries"];
    if (VAULT_PATHS.includes(path) && data.value && Array.isArray(data.value)) {
      const familyId = args.familyId as string;
      let childBirthDate: string | null = null;

      // Try to get birth date from ourfable_families first, then ourfable_vault_families
      try {
        const ourfableRes = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "ourfable:getOurFableFamilyById", args: { familyId }, format: "json" }),
        });
        const ourfableData = await ourfableRes.json();
        childBirthDate = ourfableData.value?.birthDate ?? null;

        if (!childBirthDate) {
          const legacyRes = await fetch(`${CONVEX_URL}/api/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId }, format: "json" }),
          });
          const legacyData = await legacyRes.json();
          childBirthDate = legacyData.value?.childDob ?? null;
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
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
