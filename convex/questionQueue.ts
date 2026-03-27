/**
 * Convex functions for the OurFable question dispatch queue.
 *
 * The queue holds questions scheduled to be sent to contributors via email.
 * NOT wired to an email provider yet — pure data structure + state transitions.
 *
 * Mutations:
 *   - enqueueQuestion()   — add a question to the send queue
 *   - markSent()          — transition pending → sent
 *   - markFailed()        — transition pending → failed
 *
 * Queries:
 *   - getPendingQueue()   — all pending items (used by the future email cron)
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns all pending queue items ordered by scheduledFor (ascending).
 * The email dispatcher will call this to find what needs sending.
 */
export const getPendingQueue = query({
  args: {
    familyId: v.optional(v.string()),
  },
  handler: async (ctx, { familyId }) => {
    if (familyId) {
      return ctx.db
        .query("questionQueue")
        .withIndex("by_family_status", (q) =>
          q.eq("familyId", familyId).eq("status", "pending")
        )
        .order("asc")
        .collect();
    }

    return ctx.db
      .query("questionQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc")
      .collect();
  },
});

/**
 * Returns the full queue for a specific contributor (all statuses).
 */
export const getContributorQueue = query({
  args: { contributorId: v.string() },
  handler: async (ctx, { contributorId }) => {
    return ctx.db
      .query("questionQueue")
      .withIndex("by_contributor", (q) => q.eq("contributorId", contributorId))
      .order("desc")
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Adds a question to the dispatch queue.
 *
 * scheduledFor defaults to now if not provided — useful for immediate dispatch.
 * Skips enqueueing if this contributor + question combo is already pending/sent.
 */
export const enqueueQuestion = mutation({
  args: {
    contributorId: v.string(),
    familyId: v.string(),
    questionId: v.string(),
    emailAddress: v.string(),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, { contributorId, familyId, questionId, emailAddress, scheduledFor }) => {
    // Check for duplicate pending entry (same contributor + question not yet sent)
    const existing = await ctx.db
      .query("questionQueue")
      .withIndex("by_contributor", (q) => q.eq("contributorId", contributorId))
      .filter((q) =>
        q.and(
          q.eq(q.field("questionId"), questionId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existing) return { id: existing._id, duplicate: true };

    const id = await ctx.db.insert("questionQueue", {
      contributorId,
      familyId,
      questionId,
      emailAddress,
      scheduledFor: scheduledFor ?? Date.now(),
      status: "pending",
    });

    return { id, duplicate: false };
  },
});

/**
 * Transitions a queue item from pending → sent.
 * Call this after the email provider confirms delivery.
 */
export const markSent = mutation({
  args: { id: v.id("questionQueue") },
  handler: async (ctx, { id }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new Error(`Queue item not found: ${id}`);
    if (item.status !== "pending") {
      throw new Error(`Cannot mark as sent — current status: ${item.status}`);
    }
    await ctx.db.patch(id, { status: "sent" });
    return id;
  },
});

/**
 * Transitions a queue item from pending → failed.
 * The email cron should call this on provider error so the item can be retried.
 */
export const markFailed = mutation({
  args: { id: v.id("questionQueue") },
  handler: async (ctx, { id }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new Error(`Queue item not found: ${id}`);
    await ctx.db.patch(id, { status: "failed" });
    return id;
  },
});

/**
 * Re-queues a failed item — resets status back to pending with a new scheduledFor.
 */
export const requeueFailed = mutation({
  args: {
    id: v.id("questionQueue"),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, { id, scheduledFor }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new Error(`Queue item not found: ${id}`);
    if (item.status !== "failed") {
      throw new Error(`Can only requeue failed items — current status: ${item.status}`);
    }
    await ctx.db.patch(id, {
      status: "pending",
      scheduledFor: scheduledFor ?? Date.now(),
    });
    return id;
  },
});
