/**
 * OurFable AI Layer — personalized prompt generation
 *
 * Two jobs:
 *
 * 1. generatePromptsForMember()
 *    Called once when a member is added (or when their prompt stock runs low).
 *    One AI call (~$0.02) → 12 months of personalized prompts stored in DB.
 *    The self-scheduling chain reads from these stored prompts.
 *
 * 2. detectMilestonesFromChronicle()
 *    Called after each Chronicle entry is written.
 *    Scans the entry text for milestone language → auto-tags + stores.
 *    Future prompts pick up these milestones automatically.
 *
 * Cost model:
 *    GPT-4o-mini: ~$0.00015/1k input tokens, ~$0.0006/1k output
 *    One generation call per member per year ≈ $0.02
 *    25k families × 6 members × $0.02 = $3,000/year in AI costs
 *    At $8/mo/family that's ~$2.4M ARR. AI is <0.2% of revenue.
 */

import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getPromptsForRelationship } from "./ourfable";

const OPENAI_MODEL = "gpt-4o-mini"; // fast, cheap, more than good enough for prompts
const PROMPTS_PER_BATCH = 12; // one year of monthly prompts per generation

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Generate prompts for a member — called on add + when stock < 3
// ─────────────────────────────────────────────────────────────────────────────

export const generatePromptsForMember = internalAction({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    familyId: v.string(),
  },
  handler: async (ctx, { memberId, familyId }) => {
    // Load everything we know
    const context = await ctx.runQuery(internal.ourfableAI.getGenerationContext, {
      memberId,
      familyId,
    });

    if (!context) {
      console.error(`[ourfable-ai] No context for member ${memberId}`);
      return;
    }

    const { member, family, milestones, recentChronicle, existingPromptCount } = context;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[ourfable-ai] No OPENAI_API_KEY — falling back to static library");
      // Graceful degradation: pull from static library
      await ctx.runMutation(internal.ourfableAI.seedFromStaticLibrary, { memberId, familyId });
      return;
    }

    const childFirst = family.childName.split(" ")[0];
    const childAgeMonths = getAgeMonths(family.childDob);
    const milestonesReached = milestones.filter((m: MilestoneDoc) => m.reachedAt);
    const milestoneList = milestonesReached.length > 0
      ? milestonesReached.map((m: MilestoneDoc) => `- ${m.name} (reached ${formatAge(m.reachedAt!, family.childDob)})`).join("\n")
      : "None logged yet.";

    const recentEntry = recentChronicle?.miloNarrative ?? null;

    const systemPrompt = `You are Our Fable. You write prompts that get emailed to family members, asking them to contribute a memory for a child's time-locked vault.

Each prompt appears as a single italicized question in a beautiful email. It must feel like something the child might ask this person someday. Intimate. Specific. Real.

HARD RULES — violating any of these makes a prompt unusable:
- 1-2 sentences MAXIMUM. Never 3+.
- Must reference the child by name (${childFirst}).
- Must be specific to THIS relationship — something only a ${member.relationship?.toLowerCase() ?? member.relationshipKey} could answer.
- Never start with "Dear", "Take a moment", "Think about", "Share a", or "Can you".
- Never use the word "cherish", "treasure", "precious", or "journey".
- No generic questions. "What's your favorite memory?" is BANNED. "What did ${(family.parentNames ?? "their parents").split("&")[0]?.trim() ?? "their parent"}'s laugh sound like when they were little?" is GOOD.
- Video and voice prompts should suggest a specific action, not just "record a message."

GOOD EXAMPLES:
- "What did ${childFirst}'s nursery smell like the first time you walked in?"
- "Sing the song you used to sing to ${(family.parentNames ?? "their parents").split("&")[0]?.trim() ?? "their parent"} when they were little. ${childFirst} should hear it in your voice."
- "Record yourself telling ${childFirst} the story of how you met their grandfather."
- "What were you doing the exact moment you found out ${childFirst} was coming?"

BAD EXAMPLES (never produce anything like these):
- "Share a cherished memory about the family." (generic, uses banned word)
- "Take a moment to reflect on what ${childFirst} means to you." (starts with banned phrase, generic)
- "Tell ${childFirst} about a memory you treasure." (generic, banned word)
- "Dear ${childFirst}, I want you to know..." (starts with Dear, wrong POV — the prompt is TO the circle member, not FROM the child)

VARIETY: Across ${PROMPTS_PER_BATCH} prompts, vary:
- Format: letters, photos, voice memos, video messages
- Unlock ages: 8, 13, 16, 18, graduation, wedding day
- Tone: some reflective, some playful, some raw/emotional
- Subject: family history, the member's own life, the child's parents, specific moments, songs, smells, places`;

    const userPrompt = `Child: ${family.childName}, currently ${childAgeMonths} months old
Circle member: ${member.name}
Their relationship: ${member.relationship} (${member.relationshipKey})
${member.city ? `They live in: ${member.city}` : ""}
Parents: ${family.parentNames ?? "their parents"}
${existingPromptCount > 0 ? `This is prompt batch #${Math.floor(existingPromptCount / PROMPTS_PER_BATCH) + 1} — they've already received ${existingPromptCount} prompts.` : "This is their first batch of prompts."}

Milestones ${childFirst} has reached:
${milestoneList}

${recentEntry ? `Recent Chronicle entry (for context on ${childFirst}'s current life):\n"${recentEntry.slice(0, 400)}"` : ""}

Generate exactly ${PROMPTS_PER_BATCH} prompts. Return as a JSON array with this shape:
[
  {
    "text": "the prompt text addressed to the member",
    "category": "letter" | "photo" | "voice" | "video" | "any",
    "unlocksAtAge": 8 | 13 | 16 | 18 | null,
    "unlocksAtEvent": "graduation" | "wedding" | null,
    "tone": "reflective" | "playful" | "practical" | "emotional"
  }
]

Only return valid JSON. No explanation, no markdown fences.`;

    let prompts: GeneratedPrompt[] = [];

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.85,
          max_tokens: 2000,
          response_format: { type: "json_object" }, // force valid JSON
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content ?? "[]";

      // Parse — handle both array root and {prompts: [...]} wrapper
      const parsed = JSON.parse(raw);
      prompts = Array.isArray(parsed) ? parsed : (parsed.prompts ?? []);

      if (!prompts.length) throw new Error("AI returned empty prompt list");

      console.log(`[ourfable-ai] Generated ${prompts.length} prompts for ${member.name}`);
    } catch (err) {
      console.error(`[ourfable-ai] Generation failed for ${member.name}:`, err);
      // Graceful degradation
      await ctx.runMutation(internal.ourfableAI.seedFromStaticLibrary, { memberId, familyId });
      return;
    }

    // ── Quality scoring ──────────────────────────────────────────────
    // Score each prompt with a second GPT call. Drop anything < 4.
    // Replace dropped prompts with static library fallbacks.
    const BANNED_WORDS = ["cherish", "treasure", "precious", "journey"];
    const BANNED_STARTS = ["dear", "take a moment", "think about", "share a", "can you"];

    // Fast local filter first (free, instant)
    const localFiltered = prompts.map((p) => {
      const lower = p.text.toLowerCase();
      if (BANNED_WORDS.some(w => lower.includes(w))) return null;
      if (BANNED_STARTS.some(s => lower.startsWith(s))) return null;
      if (p.text.split(/[.!?]/).filter(Boolean).length > 3) return null; // more than 3 sentences
      if (!p.text.toLowerCase().includes(childFirst.toLowerCase())) return null; // must mention child
      return p;
    });

    // AI scoring for prompts that passed local filter
    const toScore = localFiltered.filter(Boolean) as GeneratedPrompt[];
    let scored: (GeneratedPrompt & { qualityScore: number })[] = [];

    if (toScore.length > 0) {
      try {
        const scoreRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: [
              {
                role: "system",
                content: `Score each prompt on a 1-5 scale. 5 = intimate, specific, could only come from this relationship. 1 = generic, could be asked to anyone. A prompt that says "share a memory" is a 1. A prompt that references a specific person, place, smell, or moment is a 5. Return JSON array of scores in order: {"scores": [4, 5, 2, ...]}`
              },
              {
                role: "user",
                content: `Relationship: ${member.relationship ?? member.relationshipKey}\nChild: ${childFirst}\n\nPrompts:\n${toScore.map((p, i) => `${i + 1}. "${p.text}"`).join("\n")}`
              },
            ],
            temperature: 0,
            max_tokens: 200,
            response_format: { type: "json_object" },
          }),
        });

        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          const scoreRaw = JSON.parse(scoreData.choices?.[0]?.message?.content ?? "{}");
          const scores: number[] = scoreRaw.scores ?? [];
          scored = toScore.map((p, i) => ({ ...p, qualityScore: scores[i] ?? 3 }));
        } else {
          // Scoring failed — accept all that passed local filter with default score
          scored = toScore.map(p => ({ ...p, qualityScore: 3 }));
          console.warn(`[ourfable-ai] Scoring call failed, using defaults`);
        }
      } catch {
        scored = toScore.map(p => ({ ...p, qualityScore: 3 }));
        console.warn(`[ourfable-ai] Scoring exception, using defaults`);
      }
    }

    // Keep only prompts scoring >= 4
    const passing = scored.filter(p => p.qualityScore >= 4);
    const dropped = PROMPTS_PER_BATCH - passing.length;

    console.log(`[ourfable-ai] Quality: ${passing.length}/${prompts.length} passed (${dropped} replaced with static)`);

    // Fill gaps with static library
    const staticPrompts = getPromptsForRelationship(
      member.relationshipKey,
      family.childName,
      family.parentNames ?? "their parents"
    );

    const final: GeneratedPrompt[] = [...passing];
    let staticIdx = 0;
    while (final.length < PROMPTS_PER_BATCH && staticIdx < staticPrompts.length) {
      final.push({
        text: staticPrompts[staticIdx].text,
        category: staticPrompts[staticIdx].category,
        unlocksAtAge: staticPrompts[staticIdx].unlocksAtAge,
        unlocksAtEvent: staticPrompts[staticIdx].unlocksAtEvent,
        tone: "reflective",
      });
      staticIdx++;
    }

    // Normalize nulls to undefined
    const normalized = final.map((p) => ({
      text: p.text,
      category: p.category,
      unlocksAtAge: p.unlocksAtAge ?? undefined,
      unlocksAtEvent: p.unlocksAtEvent ?? undefined,
      tone: p.tone ?? undefined,
    }));

    // Store generated prompts in DB
    await ctx.runMutation(internal.ourfableAI.storeGeneratedPrompts, {
      memberId,
      familyId,
      prompts: normalized,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Detect milestones from a Chronicle entry — called after each write
// ─────────────────────────────────────────────────────────────────────────────

export const detectMilestonesFromEntry = internalAction({
  args: {
    familyId: v.string(),
    entryText: v.string(),
    entryDate: v.string(),
  },
  handler: async (ctx, { familyId, entryText, entryDate }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return; // Silent skip — milestones are nice-to-have, not required

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You detect developmental milestones in journal entries about young children.
Extract any milestones mentioned. Return a JSON array. If none, return [].
Shape: [{"name": "first steps", "category": "motor", "note": "exact quote from text"}]
Categories: motor | language | social | cognitive | physical | other`,
          },
          { role: "user", content: entryText },
        ],
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return;

    try {
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content ?? "[]";
      const parsed = JSON.parse(raw);
      const detected: DetectedMilestone[] = Array.isArray(parsed) ? parsed : (parsed.milestones ?? []);

      if (!detected.length) return;

      await ctx.runMutation(internal.ourfableAI.recordDetectedMilestones, {
        familyId,
        milestones: detected,
        detectedFromDate: entryDate,
      });

      console.log(`[ourfable-ai] Detected ${detected.length} milestones from Chronicle entry`);
    } catch {
      // Non-critical — silently skip
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export const getGenerationContext = internalQuery({
  args: { memberId: v.id("ourfable_vault_circle"), familyId: v.string() },
  handler: async (ctx, { memberId, familyId }) => {
    const member = await ctx.db.get(memberId);
    if (!member) return null;

    const family = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;

    const milestones = await ctx.db
      .query("ourfable_vault_milestones")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();

    // Most recent chronicle entry
    const recentChronicle = await ctx.db
      .query("ourfable_vault_chronicle")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .order("desc")
      .first();

    // How many prompts has this member already received?
    const existingPrompts = await ctx.db
      .query("ourfable_vault_prompt_queue")
      .withIndex("by_memberId", (q) => q.eq("memberId", memberId))
      .collect();

    return {
      member,
      family,
      milestones,
      recentChronicle,
      existingPromptCount: existingPrompts.length,
    };
  },
});

export const getStoredPromptsForMember = internalQuery({
  args: { memberId: v.id("ourfable_vault_circle"), afterIndex: v.number() },
  handler: async (ctx, { memberId, afterIndex }) => {
    return await ctx.db
      .query("ourfable_vault_generated_prompts")
      .withIndex("by_memberId_index", (q) =>
        q.eq("memberId", memberId).gte("promptIndex", afterIndex)
      )
      .order("asc")
      .take(3); // peek ahead — if < 3 remaining, trigger regeneration
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const storeGeneratedPrompts = internalMutation({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    familyId: v.string(),
    prompts: v.array(v.object({
      text: v.string(),
      category: v.string(),
      unlocksAtAge: v.optional(v.number()),
      unlocksAtEvent: v.optional(v.string()),
      tone: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { memberId, familyId, prompts }) => {
    // Get current high watermark
    const existing = await ctx.db
      .query("ourfable_vault_generated_prompts")
      .withIndex("by_memberId_index", (q) => q.eq("memberId", memberId))
      .order("desc")
      .first();

    let startIndex = existing ? existing.promptIndex + 1 : 0;

    for (const prompt of prompts) {
      await ctx.db.insert("ourfable_vault_generated_prompts", {
        memberId,
        familyId,
        promptIndex: startIndex++,
        text: prompt.text,
        category: prompt.category,
        unlocksAtAge: prompt.unlocksAtAge,
        unlocksAtEvent: prompt.unlocksAtEvent,
        tone: prompt.tone,
        generatedAt: Date.now(),
      });
    }
  },
});

export const clearGeneratedPromptsForMember = internalMutation({
  args: { memberId: v.id("ourfable_vault_circle") },
  handler: async (ctx, { memberId }) => {
    const all = await ctx.db
      .query("ourfable_vault_generated_prompts")
      .withIndex("by_memberId_index", (q) => q.eq("memberId", memberId))
      .collect();
    for (const p of all) await ctx.db.delete(p._id);
    console.log(`[ourfable-ai] Cleared ${all.length} generated prompts for member ${memberId}`);
  },
});

export const seedFromStaticLibrary = internalMutation({
  args: { memberId: v.id("ourfable_vault_circle"), familyId: v.string() },
  handler: async (ctx, { memberId, familyId }) => {
    const member = await ctx.db.get(memberId);
    const family = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!member || !family) return;

    const { getPromptsForRelationship } = await import("./ourfable");
    const prompts = getPromptsForRelationship(
      member.relationshipKey,
      family.childName,
      family.parentNames ?? "their parents"
    );

    const existing = await ctx.db
      .query("ourfable_vault_generated_prompts")
      .withIndex("by_memberId_index", (q) => q.eq("memberId", memberId))
      .order("desc")
      .first();

    let startIndex = existing ? existing.promptIndex + 1 : 0;

    for (const p of prompts.slice(0, PROMPTS_PER_BATCH)) {
      await ctx.db.insert("ourfable_vault_generated_prompts", {
        memberId,
        familyId,
        promptIndex: startIndex++,
        text: p.text,
        category: p.category,
        unlocksAtAge: p.unlocksAtAge,
        unlocksAtEvent: p.unlocksAtEvent,
        tone: "reflective",
        generatedAt: Date.now(),
      });
    }
  },
});

export const recordDetectedMilestones = internalMutation({
  args: {
    familyId: v.string(),
    milestones: v.array(v.object({
      name: v.string(),
      category: v.string(),
      note: v.optional(v.string()),
    })),
    detectedFromDate: v.string(),
  },
  handler: async (ctx, { familyId, milestones, detectedFromDate }) => {
    for (const m of milestones) {
      // Check if already recorded (avoid duplicates)
      const existing = await ctx.db
        .query("ourfable_vault_milestones")
        .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
        .filter((q) => q.eq(q.field("name"), m.name))
        .first();

      if (existing && !existing.reachedAt) {
        // Update existing placeholder milestone as reached
        await ctx.db.patch(existing._id, {
          reachedAt: new Date(detectedFromDate).getTime(),
          note: m.note,
        });
      } else if (!existing) {
        // New milestone not in the standard list
        await ctx.db.insert("ourfable_vault_milestones", {
          familyId,
          name: m.name,
          category: m.category,
          expectedAgeMonths: 0, // unknown
          reachedAt: new Date(detectedFromDate).getTime(),
          note: m.note,
          isCustom: true,
        });
      }
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Parents can log milestones manually
// ─────────────────────────────────────────────────────────────────────────────

export const logMilestone = mutation({
  args: {
    familyId: v.string(),
    name: v.string(),
    category: v.string(),
    note: v.optional(v.string()),
    reachedAt: v.optional(v.number()),
  },
  handler: async (ctx, { familyId, name, category, note, reachedAt }) => {
    const existing = await ctx.db
      .query("ourfable_vault_milestones")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .filter((q) => q.eq(q.field("name"), name))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        reachedAt: reachedAt ?? Date.now(),
        note,
      });
      return existing._id;
    }

    return await ctx.db.insert("ourfable_vault_milestones", {
      familyId,
      name,
      category,
      expectedAgeMonths: 0,
      reachedAt: reachedAt ?? Date.now(),
      note,
      isCustom: true,
    });
  },
});

export const getMilestones = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_milestones")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getAgeMonths(birthdate: string | number | undefined): number {
  if (!birthdate) return 0;
  const birth = typeof birthdate === "string" ? new Date(birthdate) : new Date(birthdate);
  const now = new Date();
  return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

function formatAge(timestamp: number, birthdate: string | number | undefined): string {
  if (!birthdate) return "recently";
  const birth = typeof birthdate === "string" ? new Date(birthdate) : new Date(birthdate);
  const reached = new Date(timestamp);
  const months = Math.floor((reached.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 1) return "under 1 month";
  if (months < 24) return `${months} months`;
  return `${Math.floor(months / 12)} years old`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface GeneratedPrompt {
  text: string;
  category: string;
  unlocksAtAge?: number | null;
  unlocksAtEvent?: string | null;
  tone?: string;
}

interface DetectedMilestone {
  name: string;
  category: string;
  note?: string;
}

interface MilestoneDoc {
  _id: Id<"ourfable_vault_milestones">;
  name: string;
  category: string;
  reachedAt?: number;
  note?: string;
}
