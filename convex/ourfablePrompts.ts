/**
 * OurFable Prompt Engine — self-scheduling architecture
 *
 * No crons. No batches. No fan-out.
 *
 * When a member is added to a circle:
 *   → scheduleNextPrompt() fires immediately
 *   → schedules sendPrompt() 30 days out via ctx.scheduler.runAt()
 *
 * When sendPrompt() runs:
 *   → sends the email
 *   → immediately schedules the NEXT sendPrompt() 30 days out
 *   → self-perpetuating, forever
 *
 * 25,000 families = 25,000 independent chains.
 * One chain failing has zero effect on any other.
 * Cost: ~$0 (Convex Actions are free tier for this volume).
 */

import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  internalAction,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";

const PROMPT_INTERVAL_DAYS = 30;

// Multi-tenant: each family has their own OurFable URL
// For sweeney.family (the Sweeney's private instance): sweeney.family
// For ourfable.ai (the product, when launched): ourfable.ai
// Stored per-family in ourfable_vault_families.siteUrl, falls back to env var
function getOurFableUrl(familySiteUrl?: string | null): string {
  return familySiteUrl ?? process.env.OURFABLE_BASE_URL ?? "https://ourfable.ai";
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Called when a circle member is added
// Kicks off their prompt chain — schedules first send 30 days out
// ─────────────────────────────────────────────────────────────────────────────

export const kickoffMemberChain = internalMutation({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    familyId: v.string(),
    delayDays: v.optional(v.number()), // override for testing (e.g. 0 = send now)
  },
  handler: async (ctx, { memberId, familyId, delayDays }) => {
    const days = delayDays ?? PROMPT_INTERVAL_DAYS;
    const fireAt = Date.now() + days * 24 * 60 * 60 * 1000;

    await ctx.scheduler.runAt(
      fireAt,
      internal.ourfablePrompts.sendNextPrompt,
      { memberId, familyId, promptIndex: 0 }
    );

    console.log(`[ourfable] Chain started for member ${memberId}, fires in ${days}d`);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL ACTION: The perpetual engine
// Sends one email, then immediately schedules the next one
// ─────────────────────────────────────────────────────────────────────────────

export const sendNextPrompt = internalAction({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    familyId: v.string(),
    promptIndex: v.number(),
  },
  handler: async (ctx, { memberId, familyId, promptIndex }) => {

    // 1. Load context
    const context = await ctx.runQuery(internal.ourfablePrompts.getMemberContext, {
      memberId,
      familyId,
    });

    if (!context) {
      console.log(`[ourfable] Member ${memberId} not found or family missing — chain stopped`);
      return;
    }

    const { member, family } = context;

    // Stop chain if member has no email and never accepted (orphaned)
    // In future: check an unsubscribed flag when added to schema
    if (!member.hasAccepted && !member.email) {
      console.log(`[ourfable] Member ${member.name} has no email and never accepted — chain paused`);
      // Still continue — they might add email later. Don't kill the chain.
    }

    // 2. Get the prompt for this index (AI-generated first, static fallback)
    const prompt = await ctx.runQuery(internal.ourfablePrompts.getPromptForIndex, {
      memberId,
      relationshipKey: member.relationshipKey,
      childName: family.childName,
      parentNames: family.parentNames ?? "their parents",
      index: promptIndex,
    });

    // 3. If stock is low (< 3 prompts ahead), kick off regeneration in background
    const lookahead = await ctx.runQuery(internal.ourfableAI.getStoredPromptsForMember, {
      memberId,
      afterIndex: promptIndex + 1,
    });
    if (lookahead.length < 3) {
      // Non-blocking — runs in background, chain continues regardless
      await ctx.scheduler.runAfter(0, internal.ourfableAI.generatePromptsForMember, {
        memberId,
        familyId,
      });
      console.log(`[ourfable] Stock low for ${member.name} — queued AI regeneration`);
    }

    // 3. Send the email (if member has an email address)
    let emailSent = false;
    if (member.email && prompt) {
      emailSent = await sendPromptEmail({
        member: {
          name: member.name,
          email: member.email,
          relationshipKey: member.relationshipKey,
        },
        family,
        prompt,
        familyId,
        promptIndex,
        siteUrl: getOurFableUrl((family as { siteUrl?: string }).siteUrl),
      });
    } else if (!member.email) {
      console.log(`[ourfable] ${member.name} has no email — recording miss, chain continues`);
    }

    // 4. Record this send in the DB
    if (prompt) {
      await ctx.runMutation(internal.ourfablePrompts.recordPromptSend, {
        memberId,
        familyId,
        promptIndex,
        promptText: prompt.text,
        promptCategory: prompt.category,
        promptUnlocksAtAge: prompt.unlocksAtAge,
        promptUnlocksAtEvent: prompt.unlocksAtEvent,
        emailSent,
        sentAt: Date.now(),
      });
    }

    // 5. Schedule the NEXT prompt — regardless of whether this one succeeded
    // The chain must continue. If email failed, next month's will retry.
    const nextFireAt = Date.now() + PROMPT_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
    await ctx.scheduler.runAt(
      nextFireAt,
      internal.ourfablePrompts.sendNextPrompt,
      {
        memberId,
        familyId,
        promptIndex: promptIndex + 1,
      }
    );

    console.log(`[ourfable] Sent prompt ${promptIndex} to ${member.name}, next scheduled in ${PROMPT_INTERVAL_DAYS}d`);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export const getMemberContext = internalQuery({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    familyId: v.string(),
  },
  handler: async (ctx, { memberId, familyId }) => {
    const member = await ctx.db.get(memberId);
    if (!member) return null;

    const family = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;

    return { member, family };
  },
});

export const getPromptForIndex = internalQuery({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    relationshipKey: v.string(),
    childName: v.string(),
    parentNames: v.string(),
    index: v.number(),
  },
  handler: async (ctx, { memberId, relationshipKey, childName, parentNames, index }) => {
    // 1. Try AI-generated prompts first
    const generated = await ctx.db
      .query("ourfable_vault_generated_prompts")
      .withIndex("by_memberId_index", (q) =>
        q.eq("memberId", memberId).eq("promptIndex", index)
      )
      .first();

    if (generated) {
      return {
        text: generated.text,
        category: generated.category,
        unlocksAtAge: generated.unlocksAtAge,
        unlocksAtEvent: generated.unlocksAtEvent,
      };
    }

    // 2. Fall back to static library if AI prompts not yet generated
    const { getPromptsForRelationship } = await import("./ourfable");
    const prompts = getPromptsForRelationship(relationshipKey, childName, parentNames);
    if (!prompts.length) return null;
    return prompts[index % prompts.length];
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL MUTATION: Record each send for audit + response tracking
// ─────────────────────────────────────────────────────────────────────────────

export const recordPromptSend = internalMutation({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    familyId: v.string(),
    promptIndex: v.number(),
    promptText: v.string(),
    promptCategory: v.string(),
    promptUnlocksAtAge: v.optional(v.number()),
    promptUnlocksAtEvent: v.optional(v.string()),
    emailSent: v.boolean(),
    sentAt: v.number(),
  },
  handler: async (ctx, args) => {
    const token = generateToken();
    await ctx.db.insert("ourfable_vault_prompt_queue", {
      familyId: args.familyId,
      memberId: args.memberId,
      promptText: args.promptText,
      promptCategory: args.promptCategory,
      promptUnlocksAtAge: args.promptUnlocksAtAge,
      promptUnlocksAtEvent: args.promptUnlocksAtEvent,
      scheduledFor: new Date(args.sentAt).toISOString().slice(0, 10),
      status: args.emailSent ? "sent" : "skipped",
      sentAt: args.sentAt,
      submissionToken: token,
    });
    return token;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC MUTATION: Add member and kick off their chain immediately
// Call this instead of inserting into ourfable_vault_circle directly
// ─────────────────────────────────────────────────────────────────────────────

export const addMemberAndStart = mutation({
  args: {
    familyId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    relationshipKey: v.string(),
    delayDays: v.optional(v.number()),
  },
  handler: async (ctx, { familyId, name, email, relationshipKey, delayDays }) => {
    // Verify family exists
    const family = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) throw new Error(`Family ${familyId} not found`);

    // Insert member
    const memberId = await ctx.db.insert("ourfable_vault_circle", {
      familyId,
      name,
      email,
      relationshipKey,
      relationship: relationshipKey, // schema requires both
      inviteToken: generateToken(),
      shareToken: generateToken(),
      hasAccepted: false,
      contributionCount: 0,
    });

    // Generate their AI prompts immediately (non-blocking)
    await ctx.scheduler.runAfter(0, internal.ourfableAI.generatePromptsForMember, {
      memberId,
      familyId,
    });

    // Kick off their prompt chain — first send fires in N days
    const days = delayDays ?? PROMPT_INTERVAL_DAYS;
    const fireAt = Date.now() + days * 24 * 60 * 60 * 1000;

    await ctx.scheduler.runAt(
      fireAt,
      internal.ourfablePrompts.sendNextPrompt,
      { memberId, familyId, promptIndex: 0 }
    );

    return memberId;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC QUERY: What prompts has this member received?
// ─────────────────────────────────────────────────────────────────────────────

export const getMemberHistory = query({
  args: { memberId: v.id("ourfable_vault_circle") },
  handler: async (ctx, { memberId }) => {
    return await ctx.db
      .query("ourfable_vault_prompt_queue")
      .withIndex("by_memberId", (q) => q.eq("memberId", memberId))
      .order("desc")
      .take(24);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL SENDER
// ─────────────────────────────────────────────────────────────────────────────

async function sendPromptEmail({
  member,
  family,
  prompt,
  familyId,
  promptIndex,
  siteUrl,
}: {
  member: { name: string; email: string; relationshipKey: string };
  family: { childName: string; parentNames?: string | null; childEmailAlias?: string | null };
  prompt: { text: string; category: string; unlocksAtAge?: number; unlocksAtEvent?: string };
  familyId: string;
  promptIndex: number;
  siteUrl: string;
}): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[ourfable] No RESEND_API_KEY");
    return false;
  }

  const childFirst = family.childName.split(" ")[0];
  const recipientFirst = member.name.split(" ")[0];
  const parentNames = family.parentNames ?? "their parents";

  // Unique token for this specific prompt send
  const token = generateToken();
  const submitUrl = `${siteUrl}/respond/${token}`;

  const unlockLine = prompt.unlocksAtAge
    ? `${childFirst} will receive this when they turn ${prompt.unlocksAtAge}.`
    : prompt.unlocksAtEvent === "graduation"
    ? `${childFirst} will receive this when they graduate.`
    : prompt.unlocksAtEvent === "wedding"
    ? `${childFirst} will receive this on their wedding day.`
    : `Sealed until ${parentNames} decide the time is right.`;

  const html = buildEmailHtml({
    recipientFirst,
    childFirst,
    parentNames,
    promptText: prompt.text,
    promptCategory: prompt.category,
    unlockLine,
    submitUrl,
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: family.childEmailAlias
          ? `${childFirst} <${family.childEmailAlias}>`
          : `${childFirst} via Our Fable <hello@ourfable.ai>`,
      to: member.email,
      subject: `${childFirst} has a question for you`,
      html,
      reply_to: family.childEmailAlias ?? `hello@ourfable.ai`,
      tags: [
        { name: "family_id", value: familyId },
        { name: "prompt_index", value: String(promptIndex) },
        { name: "relationship", value: member.relationshipKey },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[ourfable] Resend failed for ${member.name}: ${res.status} ${err}`);
    // Don't throw — chain continues regardless, logs the failure
    return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

function buildEmailHtml({
  recipientFirst,
  childFirst,
  parentNames,
  promptText,
  promptCategory,
  unlockLine,
  submitUrl,
}: {
  recipientFirst: string;
  childFirst: string;
  parentNames: string;
  promptText: string;
  promptCategory: string;
  unlockLine: string;
  submitUrl: string;
}): string {
  const mediaNote =
    promptCategory === "photo" ? "Upload a photo using the link below."
    : promptCategory === "voice" ? "Record a voice memo and upload it using the link below."
    : promptCategory === "video" ? "Upload a short video using the link below."
    : "Write your response, or upload a photo, voice memo, or video.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${childFirst} has a question for you</title>
</head>
<body style="margin:0;padding:0;background:#F7F4EE;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;">${childFirst} has a question for you — from ${parentNames}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:40px 20px 56px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Wordmark -->
        <tr><td align="center" style="padding-bottom:28px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#B8965A;letter-spacing:-0.01em;">Our Fable</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1.5px solid #E8E2D8;">

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#B8965A;height:4px;font-size:0;">&nbsp;</td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:32px 36px 20px;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#B8965A;margin:0 0 12px;">${childFirst} has a question for you</p>
              <p style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#1A1A18;line-height:1.2;margin:0;">Hi, ${recipientFirst}.</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 36px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #F0ECE6;font-size:0;height:1px;">&nbsp;</td></tr></table>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 36px 24px;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A8880;margin:0 0 14px;">This month&rsquo;s prompt</p>
              <p style="font-family:Georgia,serif;font-size:20px;font-style:italic;color:#1A1A18;line-height:1.65;margin:0 0 16px;">&ldquo;${promptText}&rdquo;</p>
              <p style="font-size:14px;color:#4A4A45;line-height:1.7;margin:0 0 8px;">${mediaNote}</p>
              <p style="font-size:13px;color:#8A8880;font-style:italic;margin:0;">${unlockLine}</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 36px 28px;">
              <table cellpadding="0" cellspacing="0">
                <tr><td style="border-radius:100px;background:#B8965A;">
                  <a href="${submitUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:0.01em;">Submit my response &rarr;</a>
                </td></tr>
              </table>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 36px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #F0ECE6;font-size:0;height:1px;">&nbsp;</td></tr></table>
              <p style="font-size:12px;color:#C4C0B8;line-height:1.7;margin:16px 0 0;">Everything you share is private and sealed until ${childFirst} is ready. Set up by ${parentNames}.</p>
            </td></tr>
          </table>

        </td></tr>

        <tr><td align="center" style="padding-top:24px;">
          <p style="font-size:11px;color:#C4C0B8;line-height:1.8;margin:0;">
            Our Fable &middot; ${childFirst}&rsquo;s circle &middot; Set up by ${parentNames}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
