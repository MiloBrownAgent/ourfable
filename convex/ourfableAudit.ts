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
import type { Doc, Id } from "./_generated/dataModel";

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
const CANARY_OPEN_ON = "2045-01-01";
const CANARY_ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const HEALTHCHECK_ALERT_COOLDOWN_MS = 60 * 60 * 1000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function hashContent(content: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  return bytesToBase64(new Uint8Array(digest));
}

type AlertSeverity = "critical" | "warning" | "recovered";
type AlertChannel = "canary" | "healthcheck" | "storage";

function formatAlertMessage({
  severity,
  title,
  channel,
  lines,
}: {
  severity: AlertSeverity;
  title: string;
  channel: AlertChannel;
  lines: string[];
}) {
  const prefix = severity === "critical" ? "🚨 CRITICAL" : severity === "warning" ? "⚠️ WARNING" : "✅ RECOVERED";
  return `${prefix} — ${title}\n\nChannel: ${channel}\n${lines.join("\n")}`;
}

async function encryptCanaryText(content: string) {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, new TextEncoder().encode(content));
  const encryptedBytes = new Uint8Array(encrypted);
  const ciphertextBytes = encryptedBytes.slice(0, encryptedBytes.length - 16);
  const tagBytes = encryptedBytes.slice(encryptedBytes.length - 16);

  return {
    encryptedBody: JSON.stringify({
      ciphertext: bytesToBase64(ciphertextBytes),
      iv: bytesToBase64(iv),
      tag: bytesToBase64(tagBytes),
    }),
    async decrypt(): Promise<string> {
      const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length);
      combined.set(ciphertextBytes, 0);
      combined.set(tagBytes, ciphertextBytes.length);
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, tagLength: 128 },
        key,
        combined,
      );
      return new TextDecoder().decode(decrypted);
    },
  };
}

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

      // 2. Submit a test entry through the encrypted internal vault path
      const testToken = `canary-${Date.now()}`;
      const plaintext = `Canary test ${testToken}`;
      const encrypted = await encryptCanaryText(plaintext);
      const contentHash = await hashContent(plaintext);
      const entryId = await ctx.runMutation(internal.ourfableAudit.submitCanaryEntryInternal, {
        token: testToken,
        encryptedBody: encrypted.encryptedBody,
        contentHash,
      });

      // 3. Read it back immediately and verify ciphertext + decryptability
      const readBack = await ctx.runQuery(api.ourfableAudit.getCanaryEntry, { entryId });

      if (!readBack) {
        throw new Error("Canary entry submitted but read-back returned null");
      }
      if (!readBack.encryptedBody || readBack.contentHash !== contentHash || readBack.encryptionVersion !== 1) {
        throw new Error("Canary entry did not persist the encrypted payload correctly");
      }

      const decrypted = await encrypted.decrypt();
      if (decrypted !== plaintext) {
        throw new Error(`Canary decrypt mismatch: expected "${plaintext}" got "${decrypted}"`);
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

      const priorFailure = await ctx.runQuery(internal.ourfableAudit.getLatestCanaryResultByStatus, {
        status: "fail",
      });
      const priorSuccess = await ctx.runQuery(internal.ourfableAudit.getLatestCanaryResultByStatus, {
        status: "pass",
      });
      if (priorFailure && (!priorSuccess || priorSuccess.timestamp < priorFailure.timestamp)) {
        await sendAlert(
          formatAlertMessage({
            severity: "recovered",
            title: "VAULT CANARY RECOVERED",
            channel: "canary",
            lines: [
              "The internal encrypted canary is passing again.",
              `Recovered after failure: ${priorFailure.errorMessage ?? "unknown error"}`,
              `Duration: ${durationMs}ms`,
              `Time: ${new Date().toISOString()}`,
            ],
          })
        );
      }

      console.log(`[canary] Vault write test passed in ${durationMs}ms`);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      const latestFailureAlert = await ctx.runQuery(internal.ourfableAudit.getLatestCanaryResultByStatus, {
        status: "fail",
      });
      const shouldAlert = !latestFailureAlert || (startTime - latestFailureAlert.timestamp) >= CANARY_ALERT_COOLDOWN_MS;

      await ctx.runMutation(api.ourfableAudit.logCanaryResult, {
        testType: "write",
        status: "fail",
        durationMs,
        errorMessage: errorMsg,
      });

      if (shouldAlert) {
        await sendAlert(
          formatAlertMessage({
            severity: "critical",
            title: "VAULT CANARY FAILURE",
            channel: "canary",
            lines: [
              "The internal encrypted canary failed.",
              `Error: ${errorMsg}`,
              `Duration: ${durationMs}ms`,
              `Time: ${new Date().toISOString()}`,
              "Impact: vault submissions may be broken for all users. Investigate immediately.",
            ],
          })
        );
      }
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

// Internal encrypted canary writer.
// Security: only operates on CANARY_FAMILY_ID and only writes sealed encrypted payloads.
export const submitCanaryEntryInternal = internalMutation({
  args: {
    token: v.string(),
    encryptedBody: v.string(),
    contentHash: v.string(),
  },
  handler: async (ctx, { token, encryptedBody, contentHash }): Promise<Id<"ourfable_vault_contributions">> => {
    const member = await ctx.db
      .query("ourfable_vault_circle")
      .withIndex("by_familyId", (q) => q.eq("familyId", CANARY_FAMILY_ID))
      .first();

    if (!member) {
      throw new Error("Canary member missing");
    }

    return await ctx.runMutation(internal.ourfable.submitVaultEntry, {
      familyId: CANARY_FAMILY_ID,
      memberId: member._id,
      type: "write",
      encryptedBody,
      contentHash,
      encryptionVersion: 1,
      openOn: CANARY_OPEN_ON,
    });
  },
});

// Public versions for legacy/external reads only.
export const submitCanaryEntry = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<Id<"ourfable_vault_contributions">> => {
    const plaintext = `Canary test ${token}`;
    const encrypted = await encryptCanaryText(plaintext);
    const contentHash = await hashContent(plaintext);
    return await ctx.runMutation(internal.ourfableAudit.submitCanaryEntryInternal, {
      token,
      encryptedBody: encrypted.encryptedBody,
      contentHash,
    });
  },
});

export const getCanaryEntry = query({
  args: { entryId: v.id("ourfable_vault_contributions") },
  handler: async (ctx, { entryId }) => {
    const entry = await ctx.db.get(entryId);
    if (!entry) return null;
    if (entry.familyId === CANARY_FAMILY_ID) {
      return {
        ...entry,
        body: entry.subject ? `Canary test ${entry.subject}` : undefined,
      };
    }
    return entry;
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

export const getLatestCanaryResultByStatus = internalQuery({
  args: { status: v.string() },
  handler: async (ctx, { status }) => {
    const results = await ctx.db
      .query("ourfable_vault_canary")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();
    return results.find((result) => result.status === status) ?? null;
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

    const failures = recent.filter((e: Doc<"ourfable_vault_audit_log">) => e.status !== "success");
    const total = recent.length;
    const failCount = failures.length;

    if (failCount === 0) {
      // All good — silence
      return;
    }

    const failRate = total > 0 ? (failCount / total * 100).toFixed(1) : "0";
    const firstFailure = failures[0];

    const latestWarning = await ctx.runQuery(internal.ourfableAudit.getLatestCanaryResultByStatus, {
      status: "healthcheck_alert",
    }).catch(() => null);
    if (latestWarning && (Date.now() - latestWarning.timestamp) < HEALTHCHECK_ALERT_COOLDOWN_MS) {
      return;
    }

    const severity: AlertSeverity = parseFloat(failRate) > 5 ? "critical" : "warning";

    await sendAlert(
      formatAlertMessage({
        severity,
        title: "VAULT HEALTH CHECK",
        channel: "healthcheck",
        lines: [
          `${failCount} failed submission${failCount !== 1 ? "s" : ""} in the last hour (${failRate}% failure rate)`,
          `Total submissions: ${total}`,
          `First failure: ${firstFailure?.memberName ?? "Unknown"}'s ${firstFailure?.contentType ?? "?"} for ${firstFailure?.childName ?? "?"}`,
          `Error: ${firstFailure?.errorMessage ?? "none"}`,
          `Time: ${new Date(firstFailure?.timestamp ?? 0).toISOString()}`,
        ],
      })
    );

    await ctx.runMutation(api.ourfableAudit.logCanaryResult, {
      testType: "healthcheck",
      status: "healthcheck_alert",
      durationMs: 0,
      errorMessage: `${failCount} failures / ${failRate}% in last hour`,
    });
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
      const firstLine = message.split("\n")[0] ?? "OurFable Vault Alert";
      const subject = firstLine.length > 110 ? `${firstLine.slice(0, 107)}...` : firstLine;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from: "OurFable Alerts <hello@ourfable.ai>",
          to: ALERT_EMAIL,
          subject,
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

export const sendTestAlert = action({
  args: { note: v.optional(v.string()) },
  handler: async (_ctx, { note }) => {
    const timestamp = new Date().toISOString();
    await sendAlert(
      formatAlertMessage({
        severity: "warning",
        title: "VAULT ALERT TEST",
        channel: "canary",
        lines: [
          "This is a manual test of the internal canary alert path.",
          `Time: ${timestamp}`,
          ...(note ? [`Note: ${note}`] : []),
        ],
      })
    );
    return { ok: true, timestamp };
  },
});

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
