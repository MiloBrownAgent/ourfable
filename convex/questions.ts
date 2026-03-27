/**
 * Convex functions for the OurFable AI Question Engine.
 *
 * Question History:
 *   - getQuestionHistory(contributorId)     — query
 *   - recordQuestionAsked(contributorId, questionId) — mutation
 *   - markAnswered(contributorId, questionId)        — mutation
 *   - resetQuestions(contributorId)                  — mutation
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the full question history for a contributor, newest first.
 */
export const getQuestionHistory = query({
  args: { contributorId: v.string() },
  handler: async (ctx, { contributorId }) => {
    return ctx.db
      .query("questionHistory")
      .withIndex("by_contributor", (q) => q.eq("contributorId", contributorId))
      .order("desc")
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Records that a question was surfaced to a contributor.
 * Idempotent — skips if the question is already recorded for this contributor.
 */
export const recordQuestionAsked = mutation({
  args: {
    contributorId: v.string(),
    questionId: v.string(),
  },
  handler: async (ctx, { contributorId, questionId }) => {
    // Check for existing record
    const existing = await ctx.db
      .query("questionHistory")
      .withIndex("by_contributor_question", (q) =>
        q.eq("contributorId", contributorId).eq("questionId", questionId)
      )
      .first();

    if (existing) return existing._id;

    return ctx.db.insert("questionHistory", {
      contributorId,
      questionId,
      askedAt: Date.now(),
      answered: false,
    });
  },
});

/**
 * Marks a previously-asked question as answered by the contributor.
 */
export const markAnswered = mutation({
  args: {
    contributorId: v.string(),
    questionId: v.string(),
  },
  handler: async (ctx, { contributorId, questionId }) => {
    const entry = await ctx.db
      .query("questionHistory")
      .withIndex("by_contributor_question", (q) =>
        q.eq("contributorId", contributorId).eq("questionId", questionId)
      )
      .first();

    if (!entry) {
      throw new Error(
        `No history entry found for contributor=${contributorId} question=${questionId}`
      );
    }

    await ctx.db.patch(entry._id, { answered: true });
    return entry._id;
  },
});

/**
 * Clears all question history for a contributor.
 * Called by the engine when a full cycle is complete and it wraps around.
 */
export const resetQuestions = mutation({
  args: { contributorId: v.string() },
  handler: async (ctx, { contributorId }) => {
    const entries = await ctx.db
      .query("questionHistory")
      .withIndex("by_contributor", (q) => q.eq("contributorId", contributorId))
      .collect();

    await Promise.all(entries.map((e) => ctx.db.delete(e._id)));
    return { deleted: entries.length };
  },
});
