/**
 * OurFable Vault Audit System — Enterprise-grade submission safety
 *
 * Three independent layers:
 *
 * 1. Audit Log: Every submission attempt (success or failure) logged.
 *    Post-insert verification confirms media URL resolves.
 *
 * 2. Canary: Synthetic test family submits daily. If it fails, alert.
 *    Catches system-level drift nobody would notice for months.
 *
 * 3. Hourly Health Check: Aggregates failures, alerts on Telegram
 *    when failure rate exceeds threshold.
 *
 * 4. Shadow Ledger: Appends to R2 — independent from Convex entirely.
 *    If Convex loses data, the ledger proves what should exist.
 */

import { v } from "convex/values";
import {
  query,
  mutation,
  action,
  internalMutation,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { api, internal } from "./_generated/api";

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1: Audit Log
// ─────────────────────────────────────────────────────────────────────────────

export const logSubmission = internalMutation({
  args: {
    familyId: v.string(),
    memberId: v.optional(v.string()),
    memberName: v.optional(v.string()),
    childName: v.optional(v.string()),
    contentType: v.string(),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    mediaStorageId: v.optional(v.string()),
    submissionToken: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_vault_audit_log", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// After a successful submission, verify the media is actually retrievable
export const verifyMediaStorage = internalAction({
  args: {
    auditLogId: v.id("ourfable_vault_audit_log"),
    mediaStorageId: v.string(),
    familyId: v.string(),
    memberName: v.string(),
    childName: v.string(),
    contentType: v.string(),
  },
  handler: async (ctx, { auditLogId, mediaStorageId, familyId, memberName, childName, contentType }) => {
    // Try to resolve the storage URL
    const url = await ctx.runQuery(internal.ourfableAudit.getStorageUrl, { storageId: mediaStorageId });

    if (url) {
      // Verify the URL actually responds (HEAD request)
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) {
          await ctx.runMutation(internal.ourfableAudit.markVerified, { auditLogId, verified: true });
          // Write to shadow ledger (R2)
          await writeShadowLedger({ familyId, memberName, childName, contentType, mediaStorageId, verified: true });
          return;
        }
      } catch {
        // URL didn't respond
      }
    }

    // Verification failed — this is serious
    await ctx.runMutation(internal.ourfableAudit.markVerified, { auditLogId, verified: false });
    await ctx.runMutation(internal.ourfableAudit.logSubmission, {
      familyId,
      memberName,
      childName,
      contentType,
      status: "storage_missing",
      errorMessage: `Media storage ID ${mediaStorageId} could not be verified after insert`,
      mediaStorageId,
      source: "verification",
    });

    // Immediate alert for storage verification failures
    await sendAlert(
      `🚨 VAULT STORAGE FAILURE\n\n${memberName}'s ${contentType} for ${childName} was submitted but the file could not be verified in storage.\n\nstorageId: ${mediaStorageId}\nfamilyId: ${familyId}\nTime: ${new Date().toISOString()}\n\nThis means the user saw "Sealed" but the file may not exist.`
    );
  },
});

export const getStorageUrl = internalQuery({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

export const markVerified = internalMutation({
  args: { auditLogId: v.id("ourfable_vault_audit_log"), verified: v.boolean() },
  handler: async (ctx, { auditLogId, verified }) => {
    await ctx.db.patch(auditLogId, { mediaVerified: verified });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2: Canary
// Synthetic test family that submits a text entry daily.
// If the submission or read-back fails, immediate alert.
// ─────────────────────────────────────────────────────────────────────────────

const CANARY_FAMILY_ID = "canary-test-family";

export const runCanary = internalAction({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();

    try {
      // 1. Ensure canary family exists
      const family = await ctx.runQuery(internal.ourfableAudit.getCanaryFamily);
      if (!family) {
        await ctx.runMutation(internal.ourfableAudit.seedCanaryFamily);
      }

      // 2. Submit a test entry
      const testToken = `canary-${Date.now()}`;
      const entryId = await ctx.runMutation(api.ourfableAudit.submitCanaryEntry, {
        token: testToken,
      });

      // 3. Read it back immediately
      const readBack = await ctx.runQuery(api.ourfableAudit.getCanaryEntry, { entryId });

      if (!readBack) {
        throw new Error("Canary entry submitted but read-back returned null");
      }

      if (readBack.body !== `Canary test ${testToken}`) {
        throw new Error(`Canary read-back mismatch: expected "Canary test ${testToken}" got "${readBack.body}"`);
      }

      // 4. Clean up — delete the test entry
      await ctx.runMutation(api.ourfableAudit.deleteCanaryEntry, { entryId });

      const durationMs = Date.now() - startTime;

      // 5. Log success
      await ctx.runMutation(api.ourfableAudit.logCanaryResult, {
        testType: "write",
        status: "pass",
        durationMs,
      });

      console.log(`[canary] Vault write test passed in ${durationMs}ms`);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);

      await ctx.runMutation(api.ourfableAudit.logCanaryResult, {
        testType: "write",
        status: "fail",
        durationMs,
        errorMessage: errorMsg,
      });

      // IMMEDIATE alert — canary failures are always critical
      await sendAlert(
        `🚨 CANARY FAILURE — VAULT IS BROKEN\n\nThe daily vault write test failed.\n\nError: ${errorMsg}\nDuration: ${durationMs}ms\nTime: ${new Date().toISOString()}\n\nThis means the vault submission pipeline may be broken for all users. Investigate immediately.`
      );
    }
  },
});

// Used by external canary (Cloudflare Worker) — must be public query (not internal)
// so the Cloudflare Worker can call it via /api/query
export const getCanaryMember = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_circle")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
  },
});

export const getCanaryFamily = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", CANARY_FAMILY_ID))
      .first();
  },
});

export const seedCanaryFamily = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", CANARY_FAMILY_ID))
      .first();
    if (existing) return;
    await ctx.db.insert("ourfable_vault_families", {
      familyId: CANARY_FAMILY_ID,
      familyName: "Canary Test Family",
      childName: "Test Child",
      childDob: "2025-01-01",
      parentNames: "System",
      timezone: "America/Chicago",
      plan: "test",
      createdAt: Date.now(),
    });
    // Need a circle member for submissions
    await ctx.db.insert("ourfable_vault_circle", {
      familyId: CANARY_FAMILY_ID,
      name: "Canary Bot",
      email: "canary@ourfable.ai",
      relationshipKey: "family_friend",
      relationship: "System Test",
      inviteToken: "canary-invite",
      shareToken: "canary-share",
      hasAccepted: true,
      contributionCount: 0,
    });
  },
});

// Public versions for external canary (Cloudflare Worker)
// Security: only operates on CANARY_FAMILY_ID, rejects all other familyIds
export const submitCanaryEntry = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const member = await ctx.db
      .query("ourfable_vault_circle")
      .withIndex("by_familyId", (q) => q.eq("familyId", CANARY_FAMILY_ID))
      .first();
    if (!member) throw new Error("Canary circle member not found");

    return await ctx.db.insert("ourfable_vault_contributions", {
      familyId: CANARY_FAMILY_ID,
      memberId: member._id,
      type: "write",
      body: `Canary test ${token}`,
      isOpen: false,
      submittedAt: Date.now(),
    });
  },
});

export const getCanaryEntry = query({
  args: { entryId: v.id("ourfable_vault_contributions") },
  handler: async (ctx, { entryId }) => {
    return await ctx.db.get(entryId);
  },
});

export const deleteCanaryEntry = mutation({
  args: { entryId: v.id("ourfable_vault_contributions") },
  handler: async (ctx, { entryId }) => {
    // Safety: only allow deleting canary entries
    const entry = await ctx.db.get(entryId);
    if (!entry || entry.familyId !== CANARY_FAMILY_ID) {
      throw new Error("Can only delete canary test entries");
    }
    await ctx.db.delete(entryId);
  },
});

export const logCanaryResult = mutation({
  args: {
    testType: v.string(),
    status: v.string(),
    durationMs: v.number(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ourfable_vault_canary", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 3: Hourly Health Check
// Aggregates audit log, alerts on anomalies
// ─────────────────────────────────────────────────────────────────────────────

export const hourlyHealthCheck = internalAction({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    const recent = await ctx.runQuery(internal.ourfableAudit.getRecentAuditEntries, {
      since: oneHourAgo,
    });

    const failures = recent.filter((e) => e.status !== "success");
    const total = recent.length;
    const failCount = failures.length;

    if (failCount === 0) {
      // All good — silence
      return;
    }

    const failRate = total > 0 ? (failCount / total * 100).toFixed(1) : "0";
    const firstFailure = failures[0];

    const severity = parseFloat(failRate) > 5 ? "🚨 CRITICAL" : "⚠️ WARNING";

    await sendAlert(
      `${severity} — VAULT HEALTH CHECK\n\n${failCount} failed submission${failCount !== 1 ? "s" : ""} in the last hour (${failRate}% failure rate)\nTotal submissions: ${total}\n\nFirst failure:\n• ${firstFailure?.memberName ?? "Unknown"}'s ${firstFailure?.contentType ?? "?"} for ${firstFailure?.childName ?? "?"}\n• Error: ${firstFailure?.errorMessage ?? "none"}\n• Time: ${new Date(firstFailure?.timestamp ?? 0).toISOString()}`
    );
  },
});

export const getRecentAuditEntries = internalQuery({
  args: { since: v.number() },
  handler: async (ctx, { since }) => {
    return await ctx.db
      .query("ourfable_vault_audit_log")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), since))
      .collect();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 4: Shadow Ledger (R2)
// Append-only log outside Convex — survives Convex data loss
// ─────────────────────────────────────────────────────────────────────────────

async function writeShadowLedger(entry: {
  familyId: string;
  memberName: string;
  childName: string;
  contentType: string;
  mediaStorageId: string;
  verified: boolean;
}) {
  const R2_LEDGER_URL = process.env.R2_LEDGER_WORKER_URL;
  if (!R2_LEDGER_URL) {
    console.warn("[audit] R2_LEDGER_WORKER_URL not set — shadow ledger skipped");
    return;
  }

  try {
    const line = JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
    });

    await fetch(R2_LEDGER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: line,
    });
  } catch (err) {
    // Shadow ledger failure is NOT critical — log but don't alert
    console.error("[audit] Shadow ledger write failed:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Telegram Alerts
// ─────────────────────────────────────────────────────────────────────────────

async function sendAlert(message: string) {
  // Layer 1: Try Telegram
  const BOT_TOKEN = process.env.TELEGRAM_ALERT_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_ALERT_CHAT_ID;

  if (BOT_TOKEN && CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
    } catch (err) {
      console.error("[audit] Telegram alert failed:", err);
    }
  }

  // Layer 2: Always email Dave (Resend)
  const RESEND_KEY = process.env.RESEND_FULL_API_KEY;
  const ALERT_EMAIL = process.env.ALERT_EMAIL ?? "hello@ourfable.ai";

  if (RESEND_KEY) {
    try {
      // Strip HTML tags for plain text email subject
      const plainText = message.replace(/<[^>]*>/g, "").replace(/\n+/g, " ").slice(0, 100);
      const severity = message.includes("CRITICAL") || message.includes("CANARY FAILURE")
        ? "🚨 CRITICAL"
        : "⚠️ WARNING";

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from: "OurFable Alerts <hello@ourfable.ai>",
          to: ALERT_EMAIL,
          subject: `${severity} — OurFable Vault Alert`,
          html: `<pre style="font-family:monospace;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`,
        }),
      });
    } catch (err) {
      console.error("[audit] Email alert failed:", err);
    }
  }

  // Always log to console as final fallback
  console.error(`[VAULT ALERT] ${message}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin: Query audit stats
// ─────────────────────────────────────────────────────────────────────────────

export const getAuditStats = internalQuery({
  args: { hours: v.optional(v.number()) },
  handler: async (ctx, { hours = 24 }) => {
    const since = Date.now() - hours * 60 * 60 * 1000;
    const entries = await ctx.db
      .query("ourfable_vault_audit_log")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), since))
      .collect();

    const successes = entries.filter((e) => e.status === "success").length;
    const failures = entries.filter((e) => e.status !== "success").length;
    const storageFailures = entries.filter((e) => e.status === "storage_missing").length;

    const canaryResults = await ctx.db
      .query("ourfable_vault_canary")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), since))
      .collect();

    const canaryPasses = canaryResults.filter((r) => r.status === "pass").length;
    const canaryFails = canaryResults.filter((r) => r.status === "fail").length;

    return {
      period: `${hours}h`,
      submissions: { total: entries.length, successes, failures, storageFailures },
      canary: { passes: canaryPasses, fails: canaryFails },
      failureRate: entries.length > 0 ? `${(failures / entries.length * 100).toFixed(1)}%` : "0%",
    };
  },
});
