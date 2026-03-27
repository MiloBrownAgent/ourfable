/**
 * OurFable Delivery Notification Engine
 * Daily cron checks delivery milestones and sends appropriate notifications:
 * - 30 days before: email parent
 * - On milestone date: email parent
 * - 60 days after (no action): email facilitator #1
 * - 90 days after (no action): email facilitator #2
 * Content never auto-deletes. Vault stays sealed if nobody acts within 1 year.
 */

import { internalAction } from "./_generated/server";

const CONVEX_URL = process.env.CONVEX_URL ?? "https://rightful-eel-502.convex.cloud";

async function convexQuery(path: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

async function convexMutation(path: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.34.0" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

async function sendResendEmail(apiKey: string, to: string, subject: string, html: string) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Our Fable <hello@ourfable.ai>",
      to,
      subject,
      html,
      headers: {
        "List-Unsubscribe": "<https://ourfable.ai/unsubscribe>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
}

function emailWrapper(content: string, footerName?: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F5F2ED;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F2ED" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background:#F0F5F0;display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#4A5E4C;">OF</span>
          </div>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            ${content}
          </td></tr></table>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A09890;">Our Fable · Made with love</p>
          <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#B0A9A0;"><a href="https://ourfable.ai/unsubscribe" style="color:#B0A9A0;text-decoration:underline;">Unsubscribe</a></p>
          <p style="margin:4px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#B0A9A0;">Our Fable · Minneapolis, MN</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export const checkDeliveryMilestones = internalAction({
  args: {},
  handler: async () => {
    const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY;
    if (!RESEND_API_KEY) {
      console.error("[ourfableDelivery] RESEND_FULL_API_KEY not set — skipping");
      return;
    }

    const milestones = (await convexQuery("ourfable:getAllPendingOurFableDeliveryMilestones", {})) as Array<{
      _id: string;
      familyId: string;
      milestoneName: string;
      milestoneDate: number;
      deliveryStatus: string;
      notificationsSent: string[];
    }> | null;

    if (!milestones || milestones.length === 0) {
      console.log("[ourfableDelivery] No pending milestones");
      return;
    }

    const now = Date.now();
    const DAY_MS = 86400000;

    for (const milestone of milestones) {
      try {
        const daysUntil = Math.floor((milestone.milestoneDate - now) / DAY_MS);
        const daysAfter = -daysUntil;

        const family = (await convexQuery("ourfable:getOurFableFamilyById", { familyId: milestone.familyId })) as {
          email: string;
          childName: string;
          parentNames?: string;
          facilitator1Name?: string;
          facilitator1Email?: string;
          facilitator2Name?: string;
          facilitator2Email?: string;
          childEmail?: string;
        } | null;

        if (!family) continue;
        const childFirst = family.childName.split(" ")[0];
        const age = milestone.milestoneName.replace(" birthday", "");

        // 30 days before milestone
        if (daysUntil <= 30 && daysUntil > 0 && milestone.deliveryStatus === "pending") {
          const html = emailWrapper(`
            <p style="margin:0 0 8px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">30 days away</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.3;">${childFirst}'s ${milestone.milestoneName} is 30 days away</p>
            <p style="margin:0 0 20px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">${childFirst} turns ${age} in 30 days. Their vault is almost ready — letters, photos, and voice memos from the people who love them most, waiting to be opened.</p>
            <p style="margin:0 0 28px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">Now's the time to preview what's inside and schedule the delivery.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4A5E4C;">
              <a href="https://ourfable.ai/${milestone.familyId}/delivery" style="display:inline-block;padding:13px 28px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Preview & schedule delivery →</a>
            </td></tr></table>
          `);

          await sendResendEmail(RESEND_API_KEY, family.email, `${childFirst}'s ${milestone.milestoneName} is 30 days away`, html);
          await convexMutation("ourfable:updateOurFableDeliveryMilestoneStatus", {
            milestoneId: milestone._id,
            deliveryStatus: "notified_30d",
            notificationTimestamp: new Date().toISOString(),
          });
          console.log(`[ourfableDelivery] Sent 30-day notice for ${milestone.familyId} (${milestone.milestoneName})`);
        }

        // On milestone date
        else if (daysUntil <= 0 && daysAfter < 1 && milestone.deliveryStatus === "notified_30d") {
          const html = emailWrapper(`
            <p style="margin:0 0 8px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Today's the day</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.3;">${childFirst}'s vault is ready to open.</p>
            <p style="margin:0 0 20px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">Happy ${milestone.milestoneName} to ${childFirst}. The letters, the photos, the voice memos — everything the people who love them wrote, sealed since before they could read — it's all waiting.</p>
            <p style="margin:0 0 28px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">This is the moment you've been building toward.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4A5E4C;">
              <a href="https://ourfable.ai/${milestone.familyId}/delivery" style="display:inline-block;padding:13px 28px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Deliver the vault now →</a>
            </td></tr></table>
          `);

          await sendResendEmail(RESEND_API_KEY, family.email, `Today's the day — ${childFirst}'s vault is ready`, html);
          await convexMutation("ourfable:updateOurFableDeliveryMilestoneStatus", {
            milestoneId: milestone._id,
            deliveryStatus: "notified_day",
            notificationTimestamp: new Date().toISOString(),
          });
          console.log(`[ourfableDelivery] Sent milestone-day notice for ${milestone.familyId} (${milestone.milestoneName})`);
        }

        // 60 days after — notify facilitator #1
        else if (daysAfter >= 60 && daysAfter < 61 && milestone.deliveryStatus === "notified_day" && family.facilitator1Email) {
          const facToken = generateToken();
          await convexMutation("ourfable:createOurFableFacilitatorToken", {
            token: facToken,
            familyId: milestone.familyId,
            milestoneId: milestone._id,
            facilitatorEmail: family.facilitator1Email,
            facilitatorName: family.facilitator1Name ?? "Vault Guardian",
          });

          const html = emailWrapper(`
            <p style="margin:0 0 8px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Vault Guardian</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.3;">You're needed — ${childFirst}'s vault is waiting</p>
            <p style="margin:0 0 20px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">${family.parentNames ?? "The family"} hasn't delivered ${childFirst}'s vault yet. Their ${milestone.milestoneName} was 60 days ago.</p>
            <p style="margin:0 0 20px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">As a designated vault guardian, you can trigger the delivery. You won't be able to see any sealed content — only ensure ${childFirst} receives what was written for them.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4A5E4C;">
              <a href="https://ourfable.ai/facilitate/${facToken}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">View guardian options →</a>
            </td></tr></table>
          `);

          await sendResendEmail(RESEND_API_KEY, family.facilitator1Email, `You're needed — ${childFirst}'s vault is waiting`, html);
          await convexMutation("ourfable:updateOurFableDeliveryMilestoneStatus", {
            milestoneId: milestone._id,
            deliveryStatus: "facilitator1_notified",
            notificationTimestamp: new Date().toISOString(),
          });
          console.log(`[ourfableDelivery] Sent facilitator #1 notice for ${milestone.familyId}`);
        }

        // 90 days after — notify facilitator #2
        else if (daysAfter >= 90 && daysAfter < 91 && milestone.deliveryStatus === "facilitator1_notified" && family.facilitator2Email) {
          const facToken = generateToken();
          await convexMutation("ourfable:createOurFableFacilitatorToken", {
            token: facToken,
            familyId: milestone.familyId,
            milestoneId: milestone._id,
            facilitatorEmail: family.facilitator2Email,
            facilitatorName: family.facilitator2Name ?? "Vault Guardian",
          });

          const html = emailWrapper(`
            <p style="margin:0 0 8px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Vault Guardian</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.3;">You're needed — ${childFirst}'s vault is waiting</p>
            <p style="margin:0 0 20px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">${childFirst}'s ${milestone.milestoneName} was 90 days ago, and their vault hasn't been delivered yet.</p>
            <p style="margin:0 0 20px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">As a designated vault guardian, you can trigger the delivery. You won't be able to see any sealed content — only ensure ${childFirst} receives what was written for them.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4A5E4C;">
              <a href="https://ourfable.ai/facilitate/${facToken}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">View guardian options →</a>
            </td></tr></table>
          `);

          await sendResendEmail(RESEND_API_KEY, family.facilitator2Email, `You're needed — ${childFirst}'s vault is waiting`, html);
          await convexMutation("ourfable:updateOurFableDeliveryMilestoneStatus", {
            milestoneId: milestone._id,
            deliveryStatus: "facilitator2_notified",
            notificationTimestamp: new Date().toISOString(),
          });
          console.log(`[ourfableDelivery] Sent facilitator #2 notice for ${milestone.familyId}`);
        }
      } catch (err) {
        console.error(`[ourfableDelivery] Error for milestone ${milestone._id}:`, err);
      }
    }
  },
});

// ── Re-engagement: Circle member missed 2+ prompts ──────────────────────────

export const checkCircleReEngagement = internalAction({
  args: {},
  handler: async () => {
    const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY;
    if (!RESEND_API_KEY) return;

    const families = (await convexQuery("ourfable:listActiveOurFableFamilies", {})) as Array<{
      familyId: string;
      email: string;
      childName: string;
    }> | null;
    if (!families) return;

    for (const family of families) {
      const members = (await convexQuery("ourfable:listOurFableCircleMembers", {
        familyId: family.familyId,
      })) as Array<{
        _id: string;
        email: string;
        name: string;
        missedPrompts?: number;
      }> | null;
      if (!members) continue;

      const childFirst = family.childName.split(" ")[0];
      for (const member of members) {
        if ((member.missedPrompts ?? 0) >= 2) {
          const html = emailWrapper(`
            <p style="margin:0 0 8px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">We miss you</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.3;">${childFirst}'s vault misses your voice</p>
            <p style="margin:0 0 20px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">Life gets busy. We get it. But ${childFirst} will read these someday — your words, your stories, your voice. It doesn't have to be long. Just real.</p>
            <p style="margin:0 0 28px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">Write something now?</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4A5E4C;">
              <a href="https://ourfable.ai/login" style="display:inline-block;padding:13px 28px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Contribute to ${childFirst}'s vault →</a>
            </td></tr></table>
          `);

          await sendResendEmail(RESEND_API_KEY, member.email, `${childFirst}'s vault misses your voice`, html);
          // Reset missed count after re-engagement email
          await convexMutation("ourfable:updateOurFableCircleMemberMissedPrompts", {
            memberId: member._id,
            missedPrompts: 0,
          });
          console.log(`[ourfableDelivery] Sent re-engagement to ${member.email} for ${family.familyId}`);
        }
      }
    }
  },
});

// ── Annual Recap Email ──────────────────────────────────────────────────────

export const sendAnnualRecap = internalAction({
  args: {},
  handler: async () => {
    const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY;
    if (!RESEND_API_KEY) return;

    const families = (await convexQuery("ourfable:listActiveOurFableFamilies", {})) as Array<{
      familyId: string;
      email: string;
      childName: string;
      birthDate?: string;
    }> | null;
    if (!families) return;

    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    for (const family of families) {
      if (!family.birthDate) continue;
      const dob = new Date(family.birthDate + "T00:00:00");
      if (dob.getMonth() !== todayMonth || dob.getDate() !== todayDay) continue;

      const childFirst = family.childName.split(" ")[0];

      // Get vault stats
      const entries = (await convexQuery("ourfable:listOurFableVaultEntries", { familyId: family.familyId })) as Array<{
        type: string;
        authorName: string;
      }> | null;
      const letters = (await convexQuery("ourfable:listOurFableLetters", { familyId: family.familyId })) as Array<unknown> | null;
      const members = (await convexQuery("ourfable:listOurFableCircleMembers", { familyId: family.familyId })) as Array<unknown> | null;

      const letterCount = (letters?.length ?? 0);
      const photoCount = entries?.filter(e => e.type === "photo").length ?? 0;
      const voiceCount = entries?.filter(e => e.type === "voice").length ?? 0;
      const uniqueAuthors = new Set(entries?.map(e => e.authorName) ?? []).size;
      const memberCount = members?.length ?? 0;

      const html = emailWrapper(`
        <p style="margin:0 0 8px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Happy Birthday</p>
        <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.3;">One year of ${childFirst}'s vault</p>
        <p style="margin:0 0 20px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">Another year of ${childFirst}'s story, preserved by the people who love them most.</p>
        <div style="background:#F8F5F0;border:1px solid #E0DDD7;border-radius:12px;padding:24px;margin:0 0 28px;">
          <p style="margin:0 0 12px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#1A1A1A;">This year in the vault:</p>
          <p style="margin:0;font-family:-apple-system,sans-serif;font-size:14px;color:#4A4A4A;line-height:2;">
            📝 ${letterCount} letter${letterCount !== 1 ? "s" : ""}<br/>
            📷 ${photoCount} photo${photoCount !== 1 ? "s" : ""}<br/>
            🎤 ${voiceCount} voice memo${voiceCount !== 1 ? "s" : ""}<br/>
            👥 From ${uniqueAuthors > 0 ? uniqueAuthors : memberCount} people
          </p>
        </div>
        <p style="margin:0 0 28px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">The vault is growing. ${childFirst} will thank you someday.</p>
        <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4A5E4C;">
          <a href="https://ourfable.ai/${family.familyId}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">View the vault →</a>
        </td></tr></table>
      `);

      await sendResendEmail(RESEND_API_KEY, family.email, `One year of ${childFirst}'s vault`, html);
      await convexMutation("ourfable:createOurFableDispatch", {
        familyId: family.familyId,
        type: "annual_recap",
        content: `Annual recap: ${letterCount} letters, ${photoCount} photos, ${voiceCount} voice memos`,
        sentTo: family.email,
      }).catch(() => {});
      console.log(`[ourfableDelivery] Sent annual recap for ${family.familyId}`);
    }
  },
});

// ── Cancellation Save Email ─────────────────────────────────────────────────
// Called from webhook when customer.subscription.deleted fires

export const sendCancellationSaveEmail = internalAction({
  args: {},
  handler: async () => {
    // This is triggered inline from webhook, not as a standalone cron
    // Left as a reusable action
  },
});
