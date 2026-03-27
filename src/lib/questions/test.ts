/**
 * Question Engine Test Harness
 *
 * Simulates question delivery for a "mom" contributor using the in-memory
 * engine — no Convex needed. Run with:
 *
 *   npx tsx src/lib/questions/test.ts
 *
 * Tests:
 *   1. 5 sequential question pulls for a single contributor
 *   2. No repeats across those pulls
 *   3. Multiple contributors don't interfere with each other
 *   4. Cycle reset works (all questions exhausted → wraps to start)
 */

import { createInMemoryEngine } from "./engine";
import { QUESTIONS_BY_TYPE, ALL_RELATIONSHIP_TYPES, type RelationshipType } from "./templates";

// ANSI color helpers
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;

function pass(label: string) {
  console.log(green(`  ✓ ${label}`));
}

function fail(label: string) {
  console.log(red(`  ✗ ${label}`));
  process.exitCode = 1;
}

function section(title: string) {
  console.log(`\n${bold(cyan(`▶ ${title}`))}`);
}

// ---------------------------------------------------------------------------
// TEST 1: 5 sequential pulls for "mom", confirm no repeats
// ---------------------------------------------------------------------------
section("5 question pulls for a 'mom' contributor — no repeats");

const engine = createInMemoryEngine();
const CONTRIBUTOR_ID = "contributor_mom_test";
const PULLS = 5;
const pulledIds: string[] = [];

for (let i = 0; i < PULLS; i++) {
  const result = engine.getNextQuestion(CONTRIBUTOR_ID, "mom");
  pulledIds.push(result.question.id);

  console.log(
    `  ${dim(`[${i + 1}/${PULLS}]`)} ${bold(result.question.id)}\n` +
    `         "${result.question.text}"\n` +
    `         ${dim(`askedCount=${result.askedCount}/${result.totalForType}  cycleReset=${result.isCycleReset}`)}\n`
  );
}

const uniqueIds = new Set(pulledIds);
if (uniqueIds.size === PULLS) {
  pass(`All ${PULLS} questions are unique (no repeats)`);
} else {
  fail(`Duplicate questions found! Got ${uniqueIds.size} unique out of ${PULLS}`);
}

// ---------------------------------------------------------------------------
// TEST 2: Two contributors don't interfere
// ---------------------------------------------------------------------------
section("Two contributors pull independently");

const engine2 = createInMemoryEngine();
const A = "contributor_a";
const B = "contributor_b";

const aResult = engine2.getNextQuestion(A, "dad");
const bResult = engine2.getNextQuestion(B, "dad");
const aResult2 = engine2.getNextQuestion(A, "dad");

if (aResult.question.id === bResult.question.id) {
  pass(`Both fresh contributors start at the same first question (expected)`);
} else {
  fail(`Different first questions for fresh contributors (unexpected)`);
}

if (aResult2.question.id !== aResult.question.id) {
  pass(`Contributor A's second question differs from their first`);
} else {
  fail(`Contributor A got the same question twice in a row`);
}

if (aResult2.question.id !== bResult.question.id) {
  // A has moved forward, B is still at question 1
  pass(`Contributor A and B are on different questions (histories are isolated)`);
} else {
  fail(`Contributor histories are leaking — A and B have same question after A advanced`);
}

// ---------------------------------------------------------------------------
// TEST 3: Cycle reset — exhaust all mom questions, verify wrap-around
// ---------------------------------------------------------------------------
section("Cycle reset — exhaust all mom questions then wrap");

const engine3 = createInMemoryEngine();
const CYCLE_CONTRIBUTOR = "contributor_cycle_test";
const momCount = QUESTIONS_BY_TYPE["mom"].length;

// Pull all mom questions
const cycleIds: string[] = [];
for (let i = 0; i < momCount; i++) {
  const r = engine3.getNextQuestion(CYCLE_CONTRIBUTOR, "mom");
  cycleIds.push(r.question.id);
}

// Pull one more — should be a cycle reset
const wrapResult = engine3.getNextQuestion(CYCLE_CONTRIBUTOR, "mom");

const uniqueCycleIds = new Set(cycleIds);
if (uniqueCycleIds.size === momCount) {
  pass(`All ${momCount} mom questions asked exactly once before reset`);
} else {
  fail(`Expected ${momCount} unique questions, got ${uniqueCycleIds.size}`);
}

if (wrapResult.isCycleReset) {
  pass(`Cycle reset flag set on wrap-around question`);
} else {
  fail(`Expected isCycleReset=true on ${momCount + 1}th pull`);
}

if (wrapResult.question.id === QUESTIONS_BY_TYPE["mom"][0].id) {
  pass(`After reset, wraps back to first question in the list`);
} else {
  fail(`After reset, expected first question but got: ${wrapResult.question.id}`);
}

// ---------------------------------------------------------------------------
// TEST 4: Template coverage — all relationship types have questions
// ---------------------------------------------------------------------------
section("Template coverage — all relationship types loaded");

for (const type of ALL_RELATIONSHIP_TYPES) {
  const qs = QUESTIONS_BY_TYPE[type as RelationshipType];
  if (qs.length >= 15) {
    pass(`${type}: ${qs.length} questions`);
  } else {
    fail(`${type}: only ${qs.length} questions (need ≥15)`);
  }
}

// ---------------------------------------------------------------------------
// TEST 5: No duplicate question IDs anywhere in templates
// ---------------------------------------------------------------------------
section("No duplicate question IDs across all templates");

const allIds: string[] = [];
for (const questions of Object.values(QUESTIONS_BY_TYPE)) {
  for (const q of questions) {
    allIds.push(q.id);
  }
}

const allIdsSet = new Set(allIds);
if (allIdsSet.size === allIds.length) {
  pass(`All ${allIds.length} question IDs are unique`);
} else {
  const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i);
  fail(`Duplicate IDs found: ${dupes.join(", ")}`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log();
if (process.exitCode === 1) {
  console.log(red(bold("Some tests failed.")));
} else {
  console.log(green(bold("All tests passed. ✓")));
  console.log(dim(`\nTotal questions: ${allIds.length} across ${ALL_RELATIONSHIP_TYPES.length} relationship types`));
}
console.log();
