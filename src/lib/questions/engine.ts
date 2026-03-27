/**
 * Question Engine — rotation logic for the OurFable AI Question Engine.
 *
 * getNextQuestion() pulls from Convex question history to determine which
 * questions a contributor has already been asked, then returns the next
 * unasked question in stable order. Falls back to a fresh cycle once
 * all questions have been asked.
 *
 * Works in two modes:
 *   1. Server-side (API routes): calls Convex HTTP API directly
 *   2. Local test: accepts an in-memory history store
 */

import { CONVEX_URL } from "@/lib/convex";
import {
  type Question,
  type RelationshipType,
  getQuestionsForType,
} from "./templates";


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuestionHistoryEntry {
  contributorId: string;
  questionId: string;
  askedAt: number;
  answered: boolean;
}

export interface NextQuestionResult {
  question: Question;
  totalForType: number;
  askedCount: number;
  isCycleReset: boolean;
}

// ---------------------------------------------------------------------------
// Convex helpers (server-side)
// ---------------------------------------------------------------------------

async function fetchQuestionHistory(
  contributorId: string
): Promise<QuestionHistoryEntry[]> {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "questions:getQuestionHistory",
      args: { contributorId },
      format: "json",
    }),
    cache: "no-store",
  });
  const data = await res.json();
  return (data.value ?? []) as QuestionHistoryEntry[];
}

async function convexRecordAsked(
  contributorId: string,
  questionId: string
): Promise<void> {
  await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Convex-Client": "npm-1.33.0",
    },
    body: JSON.stringify({
      path: "questions:recordQuestionAsked",
      args: { contributorId, questionId },
      format: "json",
    }),
  });
}

async function convexResetQuestions(contributorId: string): Promise<void> {
  await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Convex-Client": "npm-1.33.0",
    },
    body: JSON.stringify({
      path: "questions:resetQuestions",
      args: { contributorId },
      format: "json",
    }),
  });
}

// ---------------------------------------------------------------------------
// Core rotation logic (pure — works with any history source)
// ---------------------------------------------------------------------------

/**
 * Given a list of questions for a type and the set of already-asked question IDs,
 * returns the next unasked question. When all have been asked, wraps back to
 * the beginning (isCycleReset = true).
 */
export function pickNextQuestion(
  questions: Question[],
  askedIds: Set<string>
): { question: Question; isCycleReset: boolean } {
  if (questions.length === 0) {
    throw new Error("No questions available for this relationship type");
  }

  const unasked = questions.filter((q) => !askedIds.has(q.id));

  if (unasked.length > 0) {
    return { question: unasked[0], isCycleReset: false };
  }

  // All asked — wrap to cycle 2
  return { question: questions[0], isCycleReset: true };
}

// ---------------------------------------------------------------------------
// Public API — server-side (Convex-backed)
// ---------------------------------------------------------------------------

/**
 * Returns the next unasked question for a contributor.
 * Records the question as asked in Convex automatically.
 */
export async function getNextQuestion(
  contributorId: string,
  relationshipType: RelationshipType
): Promise<NextQuestionResult> {
  const questions = getQuestionsForType(relationshipType);
  if (questions.length === 0) {
    throw new Error(`No questions found for relationship type: ${relationshipType}`);
  }

  const history = await fetchQuestionHistory(contributorId);
  const askedIds = new Set(history.map((h) => h.questionId));

  const { question, isCycleReset } = pickNextQuestion(questions, askedIds);

  if (isCycleReset) {
    // Reset history in Convex before recording the fresh start
    await convexResetQuestions(contributorId);
  }

  await convexRecordAsked(contributorId, question.id);

  return {
    question,
    totalForType: questions.length,
    askedCount: isCycleReset ? 1 : askedIds.size + 1,
    isCycleReset,
  };
}

/**
 * Marks a specific question as answered for a contributor.
 */
export async function markQuestionAsked(
  contributorId: string,
  questionId: string
): Promise<void> {
  await convexRecordAsked(contributorId, questionId);
}

/**
 * Clears all question history for a contributor (fresh start).
 */
export async function resetQuestions(contributorId: string): Promise<void> {
  await convexResetQuestions(contributorId);
}

// ---------------------------------------------------------------------------
// In-memory engine — for local testing without Convex
// ---------------------------------------------------------------------------

/**
 * Creates a self-contained question engine backed by in-memory state.
 * Used by the test harness and for unit testing rotation logic.
 */
export function createInMemoryEngine() {
  // contributorId -> Set of asked questionIds
  const history = new Map<string, Set<string>>();

  return {
    getHistory(contributorId: string): Set<string> {
      if (!history.has(contributorId)) history.set(contributorId, new Set());
      return history.get(contributorId)!;
    },

    getNextQuestion(
      contributorId: string,
      relationshipType: RelationshipType
    ): NextQuestionResult {
      const questions = getQuestionsForType(relationshipType);
      if (questions.length === 0) {
        throw new Error(`No questions for type: ${relationshipType}`);
      }

      const askedIds = this.getHistory(contributorId);
      const { question, isCycleReset } = pickNextQuestion(questions, askedIds);

      if (isCycleReset) {
        askedIds.clear();
      }

      askedIds.add(question.id);

      return {
        question,
        totalForType: questions.length,
        askedCount: askedIds.size,
        isCycleReset,
      };
    },

    markQuestionAsked(contributorId: string, questionId: string): void {
      this.getHistory(contributorId).add(questionId);
    },

    resetQuestions(contributorId: string): void {
      history.set(contributorId, new Set());
    },
  };
}
