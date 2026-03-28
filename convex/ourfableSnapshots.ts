/**
 * OurFable World Snapshot AI Generation
 *
 * Automatically generates World Snapshot content for any missing months
 * using OpenAI GPT-4o-mini. Runs on cron (1st of each month) and can
 * be triggered manually.
 *
 * Each snapshot covers: top headline, #1 song, weather context, fun fact
 * for the given month/year — written in warm, archival tone for a child
 * to read years later.
 */

import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, action, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

const OPENAI_MODEL = "gpt-4o-mini";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Generate snapshots for all families that are missing the current month
// Called by cron on the 1st of each month
// ─────────────────────────────────────────────────────────────────────────────

export const generateMissingSnapshots = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-based

    // Get all active families
    const families = await ctx.runQuery(internal.ourfableSnapshots.getActiveFamilyIds);
    console.log(`[snapshots] Checking ${families.length} families for missing ${year}-${String(month).padStart(2, "0")} snapshot`);

    let generated = 0;
    for (const familyId of families) {
      const existing = await ctx.runQuery(internal.ourfableSnapshots.getSnapshotForMonth, { familyId, year, month });
      if (!existing) {
        await ctx.runAction(internal.ourfableSnapshots.generateSnapshotForMonth, { familyId, year, month });
        generated++;
      }
    }
    console.log(`[snapshots] Generated ${generated} new snapshots`);
    return { generated };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC (callable from dashboard/admin): Generate a specific month's snapshot
// ─────────────────────────────────────────────────────────────────────────────

export const generateSnapshotForMonth = internalAction({
  args: { familyId: v.string(), year: v.number(), month: v.number() },
  handler: async (ctx, { familyId, year, month }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[snapshots] No OPENAI_API_KEY");
      return { error: "No API key" };
    }

    const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long" });
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;

    const systemPrompt = `You are writing content for a child's memory vault. 
Each month, we capture a "World Snapshot" — a warm, archival description of what the world was like during that month.
The child will read this years from now and feel transported back to when they were small.

Write in an intimate, warm, slightly literary tone. Not journalistic — more like a letter to a child.
Think: "This was the world you were born into."

TONE GUIDELINES:
- Warm, nostalgic, human. Like a parent writing to their future teenager.
- Seasonal and sensory — what the weather felt like, what people were doing, the rhythm of the month.
- Specific but universal. Reference cultural moments that EVERYONE would remember (a song everyone was singing, a movie everyone saw, a collective feeling) — not niche or divisive events.
- Emotional resonance over factual precision. "The whole country was humming this song" beats "Billboard #1 for 4 consecutive weeks."

NEVER INCLUDE:
- Politics, elections, legislation, government policy, trade disputes, tariffs, partisan content
- Violence, war, tragedy, mass shootings, terrorism, disasters
- Economic indicators (Fed rates, inflation, GDP, job numbers, stock market)
- Controversy, scandal, divisive cultural debates
- Anything that would make a parent uncomfortable reading to a child
- Corporate news (mergers, IPOs, layoffs)

ALWAYS PREFER:
- Weather and seasons ("The first real snow came early this year")
- Music and movies everyone loved
- Sports moments that brought people together
- Cultural vibes and collective feelings
- Small, charming details of everyday life (what people were eating, wearing, doing on weekends)
- Nature, holidays, family rhythms
- Things that will feel nostalgic in 10-15 years

CRITICAL — SONG ACCURACY:
- The topSong MUST be the actual Billboard Hot 100 #1 song for that month. Do NOT guess or hallucinate.
- If you are not 100% certain of the #1 song, use the most culturally dominant/memorable song of the month instead.
- NEVER fabricate a song title or artist. Real songs only.`;

    const userPrompt = `Generate a World Snapshot for ${monthName} ${year}.

Return ONLY valid JSON with this exact shape:
{
  "topHeadline": "1-2 sentence description of the mood, season, or cultural moment of the month — written like a warm letter to a child who will read this in 15 years. NO politics, NO economics, NO tragedy. Focus on weather, seasons, music, sports, collective feelings, things that bring people together.",
  "topSong": "Song Title — Artist (the song everyone was singing or streaming that month — the one that defined the moment)",
  "weatherDesc": "brief seasonal weather description — evocative and sensory, not clinical. Write it like you're describing the month to someone who wasn't there.",
  "tempHigh": <number, approximate high temp in Fahrenheit for the month in the US>,
  "funFact": "one charming, specific detail about everyday life or culture in this month — the kind of thing that will make someone smile in 2040. What were people eating? Watching? Wearing? What was the vibe?"
}

Make every line feel like it belongs in a letter to a child. Something they'd read at 18 and think: "That's the world I grew up in." Keep it warm, universal, and completely apolitical.`;

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
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content ?? "{}";
      const snap = JSON.parse(raw);

      if (!snap.topHeadline) throw new Error("AI returned empty snapshot");

      // Upsert into the vault for this family
      await ctx.runMutation(internal.ourfableSnapshots.upsertSnapshotFromAI, {
        familyId,
        year,
        month,
        topHeadline: snap.topHeadline,
        topSong: snap.topSong,
        weatherDesc: snap.weatherDesc,
        tempHigh: typeof snap.tempHigh === "number" ? snap.tempHigh : undefined,
        funFact: snap.funFact,
      });

      console.log(`[snapshots] ✅ Generated snapshot for ${familyId} — ${monthKey}`);
      return { success: true, monthKey };
    } catch (err) {
      console.error(`[snapshots] Failed for ${familyId} ${monthKey}:`, err);
      return { error: String(err) };
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL: Backfill all missing months since child's birth for one family
// ─────────────────────────────────────────────────────────────────────────────

export const backfillSnapshotsForFamily = action({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const family = await ctx.runQuery(internal.ourfableSnapshots.getFamilyBirthDate, { familyId });
    if (!family) return { error: "Family not found" };

    const birthDate = new Date(family.childDob);
    const now = new Date();
    const months: { year: number; month: number }[] = [];

    // Generate list of months from birth through current month
    let d = new Date(birthDate.getFullYear(), birthDate.getMonth(), 1);
    while (d <= now) {
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }

    let generated = 0;
    let skipped = 0;
    for (const { year, month } of months) {
      const existing = await ctx.runQuery(internal.ourfableSnapshots.getSnapshotForMonth, { familyId, year, month });
      if (existing) { skipped++; continue; }
      await ctx.runAction(internal.ourfableSnapshots.generateSnapshotForMonth, { familyId, year, month });
      generated++;
      // Small delay to avoid hammering OpenAI
      await new Promise(r => setTimeout(r, 300));
    }

    return { generated, skipped, total: months.length };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export const getActiveFamilyIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const families = await ctx.db.query("ourfable_vault_families").collect();
    return families.map(f => f.familyId);
  },
});

export const getSnapshotForMonth = internalQuery({
  args: { familyId: v.string(), year: v.number(), month: v.number() },
  handler: async (ctx, { familyId, year, month }) => {
    return await ctx.db
      .query("ourfable_vault_snapshots")
      .withIndex("by_familyId_year_month", q => q.eq("familyId", familyId).eq("year", year).eq("month", month))
      .first();
  },
});

export const getFamilyBirthDate = internalQuery({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", q => q.eq("familyId", familyId))
      .first();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const upsertSnapshotFromAI = internalMutation({
  args: {
    familyId: v.string(),
    year: v.number(),
    month: v.number(),
    topHeadline: v.string(),
    topSong: v.optional(v.string()),
    weatherDesc: v.optional(v.string()),
    tempHigh: v.optional(v.number()),
    funFact: v.optional(v.string()),
  },
  handler: async (ctx, { familyId, year, month, ...data }) => {
    const existing = await ctx.db
      .query("ourfable_vault_snapshots")
      .withIndex("by_familyId_year_month", q => q.eq("familyId", familyId).eq("year", year).eq("month", month))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert("ourfable_vault_snapshots", { familyId, year, month, ...data });
  },
});

// Delete a single snapshot by its ID (admin use)
export const deleteSnapshotById = mutation({
  args: { id: v.id("ourfable_vault_snapshots") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return { deleted: true };
  },
});
