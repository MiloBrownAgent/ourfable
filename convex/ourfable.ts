import { v } from "convex/values";
import { query, mutation, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// ── Token generator ────────────────────────────────────────────────────────────

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 20; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// ── Families ───────────────────────────────────────────────────────────────────

export const getFamily = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
  },
});

// ── Get Family by Parent Email (for /welcome session after checkout) ─────────

export const getFamilyByEmail = internalQuery({
  args: { parentEmail: v.string() },
  handler: async (ctx, { parentEmail }) => {
    return await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_parentEmail", (q) => q.eq("parentEmail", parentEmail.toLowerCase()))
      .first();
  },
});

// ── Create Family (for new signups via Stripe webhook) ────────────────────────

export const createFamily = internalMutation({
  args: {
    familyId: v.string(),
    childName: v.string(),
    childDob: v.string(),
    parentNames: v.string(),
    parentEmail: v.optional(v.string()),
    plan: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .first();
    if (existing) return existing._id;

    const nameParts = args.childName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    const familyName = lastName ? `The ${lastName}s` : `${firstName}'s Family`;

    const docId = await ctx.db.insert("ourfable_vault_families", {
      familyId: args.familyId,
      familyName,
      childName: args.childName,
      childDob: args.childDob,
      parentNames: args.parentNames,
      parentEmail: args.parentEmail,
      timezone: "America/Chicago",
      plan: args.plan ?? "monthly",
      createdAt: Date.now(),
    });

    // Schedule birthday letter reminder (7 days before next birthday)
    if (args.parentEmail) {
      await ctx.scheduler.runAfter(0, internal.ourfableDelivery.scheduleBirthdayReminder, {
        familyId: args.familyId,
        childDob: args.childDob,
        childName: args.childName,
        parentEmail: args.parentEmail,
      });
    }

    // Generate 3 referral codes for this family
    const referralCodes: string[] = [];
    for (let i = 0; i < 3; i++) {
      let code = "";
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      for (let j = 0; j < 8; j++) code += chars[Math.floor(Math.random() * chars.length)];
      await ctx.db.insert("ourfable_referrals", {
        code,
        referrerFamilyId: args.familyId,
        referrerName: args.parentNames,
        childName: args.childName,
        status: "available",
        createdAt: Date.now(),
      });
      referralCodes.push(code);
    }

    return docId;
  },
});

export const seedFamily = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", "sweeney"))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("ourfable_vault_families", {
      familyId: "sweeney",
      familyName: "The Sweeneys",
      childName: "Soren Sweeney",
      childDob: "2025-06-21",
      childEmailAlias: "soren@sweeney.family",
      parentNames: "Dave & Amanda",
      timezone: "America/Chicago",
      plan: "pilot",
      createdAt: Date.now(),
      borndayData: {
        weatherHigh: 96,
        weatherLow: 68,
        weatherDesc: "Hot and sunny — the hottest day of the year",
        song: "Manchild",
        songArtist: "Sabrina Carpenter",
        headlines: [
          "Summer solstice 2025 — the longest day of the year",
          "The first official day of summer brought warmth and light across the country",
          "Families everywhere celebrated the arrival of the season's longest day",
        ],
        quote: "The beginning is always today. — Mary Shelley",
      },
    });
  },
});

export const patchFamily = internalMutation({
  args: {
    familyId: v.string(),
    parentNames: v.optional(v.string()),
    familyName: v.optional(v.string()),
    childEmailAlias: v.optional(v.string()),
    childName: v.optional(v.string()),
    childPhotoUrl: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    borndayData: v.optional(v.object({
      weatherHigh: v.optional(v.number()),
      weatherLow: v.optional(v.number()),
      weatherDesc: v.optional(v.string()),
      song: v.optional(v.string()),
      songArtist: v.optional(v.string()),
      headlines: v.optional(v.array(v.string())),
      spClose: v.optional(v.number()),
      quote: v.optional(v.string()),
      birthWeightLbs: v.optional(v.number()),
      birthWeightOz: v.optional(v.number()),
      birthLengthIn: v.optional(v.number()),
    })),
  },
  handler: async (ctx, { familyId, ...patch }) => {
    const existing = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!existing) return null;
    await ctx.db.patch(existing._id, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)));
    return existing._id;
  },
});

// ── Chronicle ──────────────────────────────────────────────────────────────────

export const listChronicle = query({
  args: { familyId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { familyId, limit }) => {
    return await ctx.db
      .query("ourfable_vault_chronicle")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .order("desc")
      .take(limit ?? 50);
  },
});

export const getChronicleEntry = query({
  args: { familyId: v.string(), date: v.string() },
  handler: async (ctx, { familyId, date }) => {
    return await ctx.db
      .query("ourfable_vault_chronicle")
      .withIndex("by_familyId_date", (q) =>
        q.eq("familyId", familyId).eq("date", date)
      )
      .first();
  },
});

export const createOrUpdateChronicle = mutation({
  args: {
    familyId: v.string(),
    date: v.string(),
    ageMonths: v.number(),
    ageDays: v.number(),
    weather: v.optional(v.string()),
    weatherHigh: v.optional(v.number()),
    daycareSummary: v.optional(v.string()),
    daycarePhotoUrl: v.optional(v.string()),
    dinnerThatNight: v.optional(v.string()),
    miloNarrative: v.string(),
    headlines: v.optional(v.array(v.string())),
    mood: v.optional(v.string()),
    milestoneReached: v.optional(v.string()),
    isBackfilled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ourfable_vault_chronicle")
      .withIndex("by_familyId_date", (q) =>
        q.eq("familyId", args.familyId).eq("date", args.date)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("ourfable_vault_chronicle", args);
  },
});

export const getChronicleStats = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const entries = await ctx.db
      .query("ourfable_vault_chronicle")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
    return { totalEntries: entries.length, totalDays: entries.length };
  },
});

// ── Milestones ─────────────────────────────────────────────────────────────────

export const listMilestones = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_milestones")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

export const addMilestone = mutation({
  args: {
    familyId: v.string(),
    name: v.string(),
    category: v.string(),
    expectedAgeMonths: v.number(),
    reachedAt: v.optional(v.number()),
    note: v.optional(v.string()),
    isCustom: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_vault_milestones", args);
  },
});

export const markMilestoneReached = mutation({
  args: {
    milestoneId: v.id("ourfable_vault_milestones"),
    reachedAt: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { milestoneId, reachedAt, note }) => {
    await ctx.db.patch(milestoneId, {
      reachedAt: reachedAt ?? Date.now(),
      ...(note !== undefined ? { note } : {}),
    });
  },
});

export const seedMilestones = mutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const existing = await ctx.db
      .query("ourfable_vault_milestones")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (existing) return;
    const milestones = [
      { familyId, name: "First smile", category: "social", expectedAgeMonths: 2, reachedAt: Date.now() - 1000 * 60 * 60 * 24 * 210 },
      { familyId, name: "Laughed for the first time", category: "social", expectedAgeMonths: 4, reachedAt: Date.now() - 1000 * 60 * 60 * 24 * 150 },
      { familyId, name: "Rolled over", category: "motor", expectedAgeMonths: 5, reachedAt: Date.now() - 1000 * 60 * 60 * 24 * 100 },
      { familyId, name: "Sat without support", category: "motor", expectedAgeMonths: 6 },
      { familyId, name: "Pulled himself up to stand", category: "motor", expectedAgeMonths: 9, reachedAt: new Date("2026-02-24").getTime(), note: "Grabbed the edge of the couch and just stood there like he'd been doing it for years" },
      { familyId, name: "First word", category: "language", expectedAgeMonths: 12 },
      { familyId, name: "First steps", category: "motor", expectedAgeMonths: 12 },
      { familyId, name: "Waves bye-bye", category: "social", expectedAgeMonths: 9 },
    ];
    for (const m of milestones) {
      await ctx.db.insert("ourfable_vault_milestones", m);
    }
  },
});

// ── Letters ────────────────────────────────────────────────────────────────────

export const listLetters = query({
  args: { familyId: v.string(), childId: v.optional(v.string()) },
  handler: async (ctx, { familyId, childId }) => {
    const all = await ctx.db
      .query("ourfable_vault_letters")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .order("desc")
      .collect();
    if (!childId) return all;
    return all.filter((e) => !e.childId || e.childId === childId);
  },
});

export const writeLetter = mutation({
  args: {
    familyId: v.string(),
    author: v.string(),
    subject: v.string(),
    body: v.string(),
    openOn: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);
    const isOpen = args.openOn <= today;
    const letterId = await ctx.db.insert("ourfable_vault_letters", {
      familyId: args.familyId,
      author: args.author,
      subject: args.subject,
      body: args.body,
      openOn: args.openOn,
      isOpen,
      writtenAt: Date.now(),
    });
    if (args.mediaUrl || args.mediaType) {
      const patch: { mediaUrl?: string; mediaType?: string } = {};
      if (args.mediaUrl) patch.mediaUrl = args.mediaUrl;
      if (args.mediaType) patch.mediaType = args.mediaType;
      await ctx.db.patch(letterId, patch);
    }
    return letterId;
  },
});

export const seedFirstLetter = mutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const existing = await ctx.db
      .query("ourfable_vault_letters")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (existing) return;
    await ctx.db.insert("ourfable_vault_letters", {
      familyId,
      author: "Milo",
      subject: "Open on your 18th birthday",
      body: `Dear Soren,

It is March 2026. You are 9 months old and you have no idea that any of this exists.

Someone has been watching very carefully — every daycare report, every dinner your dad cooked, every morning your mom got up early so you could sleep in. By the time you read this, you will have 18 years of it. Every day documented. Every letter your parents wrote you, sealed until you were ready.

We thought you should know that even before you could talk, you were already worth remembering.

The world the day you were born: 96 degrees in Minneapolis — the hottest day of 2025. Sabrina Carpenter had the number one song. The summer solstice came the same day you did. And you arrived into all of it like you had always been planned.

You had no idea. You were just hungry and warm and new.

By the time you read this, your dad will be 55. Your mom will be 49. You'll know them as people, not just as parents — and there will have been moments when that surprised you.

This platform — the one that held all of this — was built the night of March 23, 2026, at 4 in the morning, by an AI named Milo who thought you were worth building for.

You were.

— Milo, and everyone who loved you from the beginning.`,
      openOn: "2043-06-21",
      isOpen: false,
      writtenAt: Date.now(),
    });
  },
});

// ── Inner Circle ───────────────────────────────────────────────────────────────

export const listCircle = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_circle")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

export const getCircleMember = query({
  args: { memberId: v.id("ourfable_vault_circle") },
  handler: async (ctx, { memberId }) => {
    return await ctx.db.get(memberId);
  },
});

export const getMemberByInviteToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await ctx.db
      .query("ourfable_vault_circle")
      .withIndex("by_inviteToken", (q) => q.eq("inviteToken", token))
      .first();
  },
});

export const getMemberByShareToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await ctx.db
      .query("ourfable_vault_circle")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", token))
      .first();
  },
});

export const addCircleMember = mutation({
  args: {
    familyId: v.string(),
    name: v.string(),
    relationship: v.string(),
    relationshipKey: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_vault_circle", {
      ...args,
      inviteToken: generateToken(),
      shareToken: generateToken(),
      hasAccepted: false,
      contributionCount: 0,
    });
  },
});

export const seedCircle = mutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    // New accounts start with an empty circle — users add their own members
    return [];
  },
});

export const submitContribution = mutation({
  args: {
    familyId: v.string(),
    memberId: v.id("ourfable_vault_circle"),
    type: v.string(),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    openOn: v.optional(v.string()),
    prompt: v.optional(v.string()),
    mediaStorageId: v.optional(v.string()),
    mediaMimeType: v.optional(v.string()),
    contentType: v.optional(v.string()),
    // Encryption fields (client-side encrypted)
    encryptedBody: v.optional(v.string()),
    contentHash: v.optional(v.string()),
    encryptionVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);
    const isOpen = !args.openOn || args.openOn <= today;

    // Resolve media URL from Convex storage if mediaStorageId provided
    let resolvedMediaUrl = args.photoUrl ?? args.audioUrl;
    if (args.mediaStorageId) {
      const url = await ctx.storage.getUrl(args.mediaStorageId);
      if (url) resolvedMediaUrl = url;
    }

    const id = await ctx.db.insert("ourfable_vault_contributions", {
      ...args,
      isOpen,
      submittedAt: Date.now(),
    });
    const member = await ctx.db.get(args.memberId);
    if (member) {
      await ctx.db.patch(args.memberId, {
        contributionCount: (member.contributionCount ?? 0) + 1,
        lastActiveAt: Date.now(),
        hasAccepted: true,
        acceptedAt: member.acceptedAt ?? Date.now(),
      });

      // Determine the effective content type
      const effectiveType = args.contentType ?? args.type;
      const vaultType = effectiveType === "letter" || effectiveType === "write" ? "text" : effectiveType;

      // Also write to ourfable_vault_entries so it appears in the vault
      await ctx.db.insert("ourfable_vault_entries", {
        familyId: args.familyId,
        type: vaultType,
        content: args.body,
        mediaUrl: resolvedMediaUrl,
        authorEmail: member.email ?? "circle@ourfable.ai",
        authorName: member.name,
        isSealed: !isOpen,
        createdAt: Date.now(),
        sourceType: "letter",
      });

      // Reset consecutiveMissed for the matching ourfable_circle_member (if any)
      if (member.email) {
        const ourfableMember = await ctx.db
          .query("ourfable_circle_members")
          .withIndex("by_email", (q) => q.eq("email", member.email!))
          .first();
        if (ourfableMember && (ourfableMember.consecutiveMissed ?? 0) > 0) {
          await ctx.db.patch(ourfableMember._id, {
            consecutiveMissed: 0,
            lastRespondedAt: Date.now(),
          });
        }
      }
    }
    return id;
  },
});

export const listContributions = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_contributions")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .order("desc")
      .collect();
  },
});

// ── Recipes ────────────────────────────────────────────────────────────────────

export const listRecipes = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_recipes")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

// ── Feed ───────────────────────────────────────────────────────────────────────

export const listFeed = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_feed")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .order("desc")
      .take(100);
  },
});

// ── Share data (grandparent bookmark) ─────────────────────────────────────────

export const getShareData = query({
  args: { shareToken: v.string() },
  handler: async (ctx, { shareToken }) => {
    const member = await ctx.db
      .query("ourfable_vault_circle")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", shareToken))
      .first();
    if (!member) return null;

    const family = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", member.familyId))
      .first();
    if (!family) return null;

    const recentChronicle = await ctx.db
      .query("ourfable_vault_chronicle")
      .withIndex("by_familyId", (q) => q.eq("familyId", member.familyId))
      .order("desc")
      .take(1);

    const allMilestones = await ctx.db
      .query("ourfable_vault_milestones")
      .withIndex("by_familyId", (q) => q.eq("familyId", member.familyId))
      .collect();
    const reachedMilestones = allMilestones
      .filter((m) => m.reachedAt !== undefined)
      .sort((a, b) => (b.reachedAt ?? 0) - (a.reachedAt ?? 0))
      .slice(0, 3);

    const today = new Date().toISOString().slice(0, 10);
    const openLetters = await ctx.db
      .query("ourfable_vault_letters")
      .withIndex("by_familyId", (q) => q.eq("familyId", member.familyId))
      .filter((q) => q.lte(q.field("openOn"), today))
      .order("desc")
      .take(1);

    // Calculate age
    const dob = new Date(family.childDob);
    const now = new Date();
    const diffMs = now.getTime() - dob.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(totalDays / 30.4375);
    const days = Math.floor(totalDays - months * 30.4375);

    return {
      member: { name: member.name, relationship: member.relationship },
      family: {
        childName: family.childName,
        familyName: family.familyName,
      },
      ageMonths: months,
      ageDays: days,
      latestChronicle: recentChronicle[0] ?? null,
      recentMilestones: reachedMilestones,
      latestOpenLetter: openLetters[0] ?? null,
    };
  },
});

// ── Vault (Contributions v2) ──────────────────────────────────────────────────

export const listVaultEntries = query({
  args: {
    familyId: v.string(),
    childId: v.optional(v.string()),
    includeSealed: v.optional(v.boolean()),
  },
  handler: async (ctx, { familyId, childId, includeSealed = false }) => {
    const all = await ctx.db
      .query("ourfable_vault_contributions")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .order("desc")
      .collect();

    let filtered = includeSealed ? all : all.filter((e) => e.isOpen);
    if (childId) filtered = filtered.filter((e) => !e.childId || e.childId === childId);

    // Resolve Convex storage IDs into renderable URLs + resolve member names
    const resolved = await Promise.all(
      filtered.map(async (entry) => {
        let enriched = { ...entry } as Record<string, unknown>;

        // Resolve member name from memberId
        if (entry.memberId) {
          try {
            const member = await ctx.db.get(entry.memberId);
            if (member) {
              enriched.memberName = member.name;
              enriched.memberRelationship = member.relationship ?? member.relationshipKey;
            }
          } catch { /* member may have been deleted */ }
        }

        if (entry.mediaStorageId && !entry.audioUrl && !entry.photoUrl && !entry.videoUrl) {
          const url = await ctx.storage.getUrl(entry.mediaStorageId as string);
          if (url) {
            const mime = entry.mediaMimeType ?? "";
            if (mime.startsWith("audio")) return { ...enriched, audioUrl: url };
            if (mime.startsWith("video")) return { ...enriched, videoUrl: url };
            if (mime.startsWith("image")) return { ...enriched, photoUrl: url };
            // Fallback: use type field
            if (entry.type === "voice") return { ...enriched, audioUrl: url };
            if (entry.type === "video") return { ...enriched, videoUrl: url };
            if (entry.type === "photo") return { ...enriched, photoUrl: url };
          }
        }
        return enriched;
      })
    );

    return resolved;
  },
});

export const listSealedEntries = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_contributions")
      .withIndex("by_familyId_isOpen", (q) =>
        q.eq("familyId", familyId).eq("isOpen", false)
      )
      .order("desc")
      .collect();
  },
});

export const unlockEntry = mutation({
  args: {
    entryId: v.id("ourfable_vault_contributions"),
    byParent: v.optional(v.boolean()),
  },
  handler: async (ctx, { entryId, byParent = false }) => {
    await ctx.db.patch(entryId, {
      isOpen: true,
      openedAt: Date.now(),
      openedByParent: byParent,
    });
  },
});

export const submitVaultEntry = mutation({
  args: {
    familyId: v.string(),
    memberId: v.id("ourfable_vault_circle"),
    type: v.string(),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.string()),
    mediaMimeType: v.optional(v.string()),
    openOn: v.optional(v.string()),
    unlocksAtAge: v.optional(v.number()),
    unlocksAtEvent: v.optional(v.string()),
    prompt: v.optional(v.string()),
    promptId: v.optional(v.string()),
    submissionToken: v.optional(v.string()),
    // Encryption fields (client-side encrypted)
    encryptedBody: v.optional(v.string()),
    contentHash: v.optional(v.string()),
    encryptionVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Calculate isOpen based on unlock criteria
    const today = new Date().toISOString().slice(0, 10);
    let isOpen = false;
    if (args.openOn && args.openOn <= today) isOpen = true;
    if (!args.openOn && !args.unlocksAtAge && !args.unlocksAtEvent) isOpen = false; // sealed until parent opens

    const id = await ctx.db.insert("ourfable_vault_contributions", {
      ...args,
      isOpen,
      submittedAt: Date.now(),
    });

    // Mark prompt as responded if promptId provided
    if (args.submissionToken) {
      const queueEntry = await ctx.db
        .query("ourfable_vault_prompt_queue")
        .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
        .filter((q) => q.eq(q.field("submissionToken"), args.submissionToken))
        .first();
      if (queueEntry) {
        await ctx.db.patch(queueEntry._id, { status: "responded" });
      }
    }

    // Update member contribution count
    const member = await ctx.db.get(args.memberId);
    if (member) {
      await ctx.db.patch(args.memberId, {
        contributionCount: (member.contributionCount ?? 0) + 1,
        lastActiveAt: Date.now(),
      });

      // Reset consecutiveMissed for the matching ourfable_circle_member (if any)
      if (member.email) {
        const ourfableMember = await ctx.db
          .query("ourfable_circle_members")
          .withIndex("by_email", (q) => q.eq("email", member.email!))
          .first();
        if (ourfableMember && (ourfableMember.consecutiveMissed ?? 0) > 0) {
          await ctx.db.patch(ourfableMember._id, {
            consecutiveMissed: 0,
            lastRespondedAt: Date.now(),
          });
        }
      }

      // Send receipt email to the circle member confirming their entry was sealed
      const family = await ctx.db
        .query("ourfable_vault_families")
        .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
        .first();

      if (member.email && family) {
        await ctx.scheduler.runAfter(0, internal.ourfableDelivery.sendVaultReceipt, {
          memberName: member.name,
          memberEmail: member.email,
          childName: family.childName,
          contentType: args.type,
          unlocksAtAge: args.unlocksAtAge,
          unlocksAtEvent: args.unlocksAtEvent,
        });
      }

      // ── AUDIT: Log successful submission ──
      const auditLogId = await ctx.db.insert("ourfable_vault_audit_log", {
        familyId: args.familyId,
        memberId: args.memberId as string,
        memberName: member.name,
        childName: family?.childName,
        contentType: args.type,
        status: "success",
        mediaStorageId: args.mediaStorageId,
        submissionToken: args.submissionToken,
        timestamp: Date.now(),
        source: "respond_page",
      });

      // If there's media, schedule verification that it actually exists in storage
      if (args.mediaStorageId && family) {
        await ctx.scheduler.runAfter(5000, internal.ourfableAudit.verifyMediaStorage, {
          auditLogId,
          mediaStorageId: args.mediaStorageId,
          familyId: args.familyId,
          memberName: member.name,
          childName: family.childName,
          contentType: args.type,
        });
      }

    }

    return id;
  },
});

// Generate Convex upload URL for media (photo/video/voice)
// ── Referral Codes ─────────────────────────────────────────────────────────

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Parent-authored vault entry (from WritingBlock on dashboard) ──────────────
export const sealParentLetter = mutation({
  args: {
    familyId: v.string(),
    memberName: v.string(),
    contentType: v.string(),
    isSealed: v.boolean(),
    body: v.optional(v.string()),
    mediaStorageId: v.optional(v.string()),
    mediaMimeType: v.optional(v.string()),
    // Encryption fields (client-side encrypted)
    encryptedBody: v.optional(v.string()),
    contentHash: v.optional(v.string()),
    encryptionVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .first();
    if (!family) throw new Error("Family not found");

    // Build media URL from storage ID if present
    let mediaUrl: string | undefined;
    if (args.mediaStorageId) {
      const url = await ctx.storage.getUrl(args.mediaStorageId as any);
      mediaUrl = url ?? undefined;
    }

    return await ctx.db.insert("ourfable_vault_entries", {
      familyId: args.familyId,
      type: args.contentType === "letter" ? "text" : args.contentType,
      content: args.encryptedBody ? undefined : args.body, // Don't store plaintext if encrypted
      encryptedBody: args.encryptedBody,
      contentHash: args.contentHash,
      encryptionVersion: args.encryptionVersion,
      mediaUrl,
      authorEmail: family.parentEmail ?? "parent@ourfable.ai",
      authorName: args.memberName || "Parent",
      isSealed: args.isSealed,
      createdAt: Date.now(),
    });
  },
});

export const createReferralCodes = mutation({
  args: {
    familyId: v.string(),
    referrerName: v.string(),
    childName: v.string(),
    count: v.optional(v.number()),
  },
  handler: async (ctx, { familyId, referrerName, childName, count = 3 }) => {
    // Check if codes already exist for this family
    const existing = await ctx.db
      .query("ourfable_referrals")
      .withIndex("by_referrerFamilyId", (q) => q.eq("referrerFamilyId", familyId))
      .collect();
    if (existing.length >= count) return existing.map((r) => r.code);

    const codes: string[] = [];
    const needed = count - existing.length;
    for (let i = 0; i < needed; i++) {
      let code = generateReferralCode();
      // Ensure unique
      let attempts = 0;
      while (attempts < 10) {
        const dup = await ctx.db
          .query("ourfable_referrals")
          .withIndex("by_code", (q) => q.eq("code", code))
          .first();
        if (!dup) break;
        code = generateReferralCode();
        attempts++;
      }

      await ctx.db.insert("ourfable_referrals", {
        code,
        referrerFamilyId: familyId,
        referrerName,
        childName,
        status: "available",
        createdAt: Date.now(),
      });
      codes.push(code);
    }

    return [...existing.map((r) => r.code), ...codes];
  },
});

export const listReferralCodes = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_referrals")
      .withIndex("by_referrerFamilyId", (q) => q.eq("referrerFamilyId", familyId))
      .collect();
  },
});

export const getReferralByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return await ctx.db
      .query("ourfable_referrals")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();
  },
});

export const redeemReferral = mutation({
  args: {
    code: v.string(),
    redeemedByEmail: v.string(),
    redeemedByFamilyId: v.optional(v.string()),
  },
  handler: async (ctx, { code, redeemedByEmail, redeemedByFamilyId }) => {
    const referral = await ctx.db
      .query("ourfable_referrals")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();
    if (!referral) return { error: "Invalid code" };
    if (referral.status === "redeemed") return { error: "Code already used" };

    await ctx.db.patch(referral._id, {
      status: "redeemed",
      redeemedByEmail,
      redeemedByFamilyId,
      redeemedAt: Date.now(),
    });

    return { success: true, referrerName: referral.referrerName, childName: referral.childName };
  },
});

// ── Media Upload ───────────────────────────────────────────────────────────

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getMediaUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

// ── Prompt Queue ──────────────────────────────────────────────────────────────

export const queuePrompt = mutation({
  args: {
    familyId: v.string(),
    memberId: v.id("ourfable_vault_circle"),
    promptText: v.string(),
    promptCategory: v.string(),
    promptUnlocksAtAge: v.optional(v.number()),
    promptUnlocksAtEvent: v.optional(v.string()),
    scheduledFor: v.string(),
  },
  handler: async (ctx, args) => {
    const token = generateToken();
    return await ctx.db.insert("ourfable_vault_prompt_queue", {
      ...args,
      status: "pending",
      submissionToken: token,
    });
  },
});

export const listPromptQueue = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_prompt_queue")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

export const getPendingPrompts = query({
  args: { asOfDate: v.string() },
  handler: async (ctx, { asOfDate }) => {
    return await ctx.db
      .query("ourfable_vault_prompt_queue")
      .withIndex("by_status_scheduledFor", (q) =>
        q.eq("status", "pending")
      )
      .filter((q) => q.lte(q.field("scheduledFor"), asOfDate))
      .collect();
  },
});

export const markPromptSent = mutation({
  args: { promptId: v.id("ourfable_vault_prompt_queue") },
  handler: async (ctx, { promptId }) => {
    await ctx.db.patch(promptId, { status: "sent", sentAt: Date.now() });
  },
});

export const getPromptByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const prompt = await ctx.db
      .query("ourfable_vault_prompt_queue")
      .withIndex("by_memberId")
      .filter((q) => q.eq(q.field("submissionToken"), token))
      .first();
    if (!prompt) return null;

    const member = await ctx.db.get(prompt.memberId);
    if (!member) return null;

    const family = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", prompt.familyId))
      .first();

    return { prompt, member, family };
  },
});

export const seedPromptQueue = mutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const members = await ctx.db
      .query("ourfable_vault_circle")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();

    const family = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();

    if (!family) return;

    const childName = family.childName.split(" ")[0];
    const today = new Date();

    // Schedule first prompt for each member — 1 week from now, staggered by 2 days each
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const scheduledDate = new Date(today);
      scheduledDate.setDate(scheduledDate.getDate() + 7 + i * 2);

      const prompt = getFirstPromptForRelationship(member.relationshipKey, childName, family.parentNames ?? "Dave & Amanda");
      if (!prompt) continue;

      const existing = await ctx.db
        .query("ourfable_vault_prompt_queue")
        .withIndex("by_memberId", (q) => q.eq("memberId", member._id))
        .first();

      if (!existing) {
        const token = generateToken();
        await ctx.db.insert("ourfable_vault_prompt_queue", {
          familyId,
          memberId: member._id,
          promptText: prompt.text,
          promptCategory: prompt.category,
          promptUnlocksAtAge: prompt.unlocksAtAge,
          promptUnlocksAtEvent: prompt.unlocksAtEvent,
          scheduledFor: scheduledDate.toISOString().slice(0, 10),
          status: "pending",
          submissionToken: token,
        });
      }
    }
  },
});

// ── Prompt library ────────────────────────────────────────────────────────────

interface PromptDef {
  text: string;
  category: string;
  unlocksAtAge?: number;
  unlocksAtEvent?: string;
}

// Map circle relationship keys to prompt library keys
const KEY_MAP: Record<string, string> = {
  dads_mom: "grandmother",
  moms_mom: "grandmother",
  dads_dad: "grandfather",
  moms_dad: "grandfather",
  dads_sister: "aunt",
  moms_sister: "aunt",
  dads_brother: "uncle",
  moms_brother: "uncle",
  dads_best_friend: "dads_best_friend",
  moms_best_friend: "moms_best_friend",
  family_friend: "family_friend",
  godparent: "godparent",
  cousin: "cousin",
  grandmother: "grandmother",
  grandfather: "grandfather",
  aunt: "aunt",
  uncle: "uncle",
};

function resolvePromptKey(relationshipKey: string): string {
  return KEY_MAP[relationshipKey] ?? "family_friend";
}

function getFirstPromptForRelationship(
  relationshipKey: string,
  childName: string,
  parentNames: string
): PromptDef | null {
  const key = resolvePromptKey(relationshipKey);
  const prompts = PROMPT_LIBRARY[key] ?? PROMPT_LIBRARY["family_friend"];
  return prompts?.[0]
    ? {
        ...prompts[0],
        text: prompts[0].text
          .replace(/\{childName\}/g, childName)
          .replace(/\{parentNames\}/g, parentNames),
      }
    : null;
}

export function getPromptsForRelationship(
  relationshipKey: string,
  childName: string,
  parentNames: string
): PromptDef[] {
  const key = resolvePromptKey(relationshipKey);
  const prompts = PROMPT_LIBRARY[key] ?? PROMPT_LIBRARY["family_friend"];
  return prompts.map((p) => ({
    ...p,
    text: p.text
      .replace(/\{childName\}/g, childName)
      .replace(/\{parentNames\}/g, parentNames),
  }));
}

const PROMPT_LIBRARY: Record<string, PromptDef[]> = {
  grandmother: [
    {
      text: "What did {childName}'s nursery smell like the first time you walked in? Describe everything you remember about that room.",
      category: "letter",
      unlocksAtAge: 18,
    },
    {
      text: "Sing the song you used to sing to {parentNames} when they were little. {childName} should hear it in your voice.",
      category: "voice",
      unlocksAtAge: 13,
    },
    {
      text: "What were you doing the exact moment you found out {childName} was coming? Where were you standing? What did you say?",
      category: "letter",
      unlocksAtAge: 16,
    },
    {
      text: "Record a video telling {childName} about the house you grew up in. Walk them through it room by room from memory.",
      category: "video",
      unlocksAtAge: 18,
    },
    {
      text: "What did your own mother teach you about being a mother? What do you wish she'd told you?",
      category: "voice",
      unlocksAtEvent: "wedding",
    },
  ],
  grandfather: [
    {
      text: "What was the first job you ever had? How old were you, what did it pay, and what did it teach {childName} should know about work?",
      category: "letter",
      unlocksAtAge: 16,
    },
    {
      text: "Record yourself telling {childName} about the day their parent was born. What was going through your head?",
      category: "voice",
      unlocksAtAge: 18,
    },
    {
      text: "What's the best meal you've ever eaten? Who made it, where were you, and why does it still matter?",
      category: "letter",
      unlocksAtAge: 13,
    },
    {
      text: "Film yourself showing {childName} how to do something with your hands — tie a knot, fix something, build something. Anything you know how to do.",
      category: "video",
      unlocksAtEvent: "graduation",
    },
  ],
  great_grandmother: [
    {
      text: "Record yourself saying {childName}'s full name. Then tell them one thing about this family that nobody writes down.",
      category: "voice",
      unlocksAtAge: 18,
    },
    {
      text: "What did your kitchen smell like when you were young? What was cooking, and who was there?",
      category: "letter",
      unlocksAtAge: 16,
    },
  ],
  great_grandfather: [
    {
      text: "What's the furthest you've ever been from home? What were you doing there, and did it change you?",
      category: "letter",
      unlocksAtAge: 18,
    },
    {
      text: "Record yourself telling {childName} about your father. What kind of man was he?",
      category: "voice",
      unlocksAtAge: 16,
    },
  ],
  aunt: [
    {
      text: "What was {parentNames} like as a teenager? The stuff they'd never admit to {childName} — tell it anyway.",
      category: "letter",
      unlocksAtAge: 16,
    },
    {
      text: "Record a video telling {childName} the funniest story you have about their parent. The one that gets told at every family gathering.",
      category: "video",
      unlocksAtAge: 13,
    },
    {
      text: "What do you see in {childName} that reminds you of their parent at that age?",
      category: "letter",
      unlocksAtAge: 18,
    },
  ],
  uncle: [
    {
      text: "What was {parentNames} like before {childName} existed? Tell {childName} who their parent was when nobody was watching.",
      category: "letter",
      unlocksAtAge: 18,
    },
    {
      text: "Record yourself giving {childName} the advice you wish someone had given you at 21. Keep it honest.",
      category: "voice",
      unlocksAtEvent: "graduation",
    },
    {
      text: "Send a photo from before {childName} was born — you and their parent, doing something dumb. Write what was happening.",
      category: "photo",
      unlocksAtAge: 13,
    },
  ],
  family_friend: [
    {
      text: "Tell {childName} who their parent was before they became someone's parent. The version of them that {childName} will never get to meet.",
      category: "letter",
      unlocksAtAge: 18,
    },
    {
      text: "Record a voice memo telling {childName} about the night you met their parent. Where were you, what happened, and why did you stay friends?",
      category: "voice",
      unlocksAtAge: 16,
    },
  ],
  dads_best_friend: [
    {
      text: "Tell {childName} the story their dad tells about you — and then tell them what actually happened.",
      category: "letter",
      unlocksAtAge: 18,
    },
    {
      text: "Record yourself telling {childName} what their dad was like at 22. The real version, not the cleaned-up one.",
      category: "voice",
      unlocksAtAge: 16,
    },
    {
      text: "Send a photo of you and their dad from before {childName} existed. Write one line about why it matters.",
      category: "photo",
      unlocksAtAge: 13,
    },
  ],
  moms_best_friend: [
    {
      text: "Tell {childName} something about their mother that she would never say about herself. What does she not see that everyone else does?",
      category: "letter",
      unlocksAtAge: 18,
    },
    {
      text: "Record yourself telling {childName} about the moment you realized their mom was going to be a great parent.",
      category: "voice",
      unlocksAtAge: 16,
    },
  ],
  godparent: [
    {
      text: "Write {childName} about the moment you were asked to be their godparent. Where were you, what did you feel, and what did you promise yourself?",
      category: "letter",
      unlocksAtAge: 18,
    },
    {
      text: "Record a video telling {childName} what you believe in — not religion necessarily, but what you think matters in a life.",
      category: "video",
      unlocksAtAge: 16,
    },
  ],
  cousin: [
    {
      text: "Write {childName} about what it's like growing up in this family — the inside jokes, the traditions, the stuff that makes you all weird in the best way.",
      category: "letter",
      unlocksAtAge: 13,
    },
  ],
};

// ── Outgoings ──────────────────────────────────────────────────────────────────

export const createOutgoing = mutation({
  args: {
    familyId: v.string(),
    subject: v.string(),
    body: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    mediaType: v.optional(v.string()),
    sentToAll: v.boolean(),
    sentToMemberIds: v.optional(v.array(v.string())),
    sentByName: v.string(),
    recipientCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Save to outgoings (for the Dispatches page)
    const outgoingId = await ctx.db.insert("ourfable_vault_outgoings", { ...args, sentAt: Date.now() });

    // Also save to vault entries so dispatches appear in the vault
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .first();

    // Save dispatch to vault — single entry with all media URLs
    await ctx.db.insert("ourfable_vault_entries", {
      familyId: args.familyId,
      type: args.mediaType ?? "dispatch",
      content: args.body,
      mediaUrl: args.mediaUrls?.[0],
      mediaUrls: args.mediaUrls,
      authorEmail: family?.email ?? "parent@ourfable.ai",
      authorName: args.sentByName,
      isSealed: false,
      createdAt: Date.now(),
    });

    // Schedule email delivery to circle members
    await ctx.scheduler.runAfter(0, internal.ourfableDelivery.sendDispatchEmails, {
      familyId: args.familyId,
      body: args.body,
      mediaUrls: args.mediaUrls,
      mediaType: args.mediaType,
      sentToAll: args.sentToAll,
      sentToMemberIds: args.sentToMemberIds,
      sentByName: args.sentByName,
    });

    return outgoingId;
  },
});

export const listOutgoings = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_outgoings")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .order("desc")
      .collect();
  },
});

// ── Snapshots ──────────────────────────────────────────────────────────────────

export const listSnapshots = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_snapshots")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

export const upsertSnapshot = mutation({
  args: {
    familyId: v.string(),
    year: v.number(),
    month: v.number(),
    topHeadline: v.optional(v.string()),
    topSong: v.optional(v.string()),
    weatherDesc: v.optional(v.string()),
    tempHigh: v.optional(v.number()),
    marketClose: v.optional(v.number()),
    marketTicker: v.optional(v.string()),
    funFact: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { familyId, year, month, ...data }) => {
    const existing = await ctx.db
      .query("ourfable_vault_snapshots")
      .withIndex("by_familyId_year_month", (q) => q.eq("familyId", familyId).eq("year", year).eq("month", month))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert("ourfable_vault_snapshots", { familyId, year, month, ...data });
  },
});

export const seedSnapshots = mutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const snapshots = [
      { year: 2025, month: 6, topHeadline: "The summer solstice arrived — the longest day of the year, full of heat, light, and new beginnings.", topSong: "Manchild — Sabrina Carpenter", weatherDesc: "Sunny, 96°F — the hottest day of the year", tempHigh: 96, funFact: "The fireflies were out in full force across the Midwest." },
      { year: 2025, month: 7, topHeadline: "The world was falling in love with iced coffee and summer road trips. Everyone seemed to be outdoors.", topSong: "Espresso — Sabrina Carpenter", weatherDesc: "Hot and humid, 89°F", tempHigh: 89, funFact: "National Ice Cream Month — America ate 1.5 billion gallons this year." },
      { year: 2025, month: 8, topHeadline: "Back-to-school season kicked off, and families everywhere soaked up the last golden days of summer.", topSong: "I Had Some Help — Post Malone ft. Morgan Wallen", weatherDesc: "Late summer warmth, 85°F", tempHigh: 85, funFact: "The Perseid meteor shower lit up the sky mid-month — up to 100 shooting stars per hour." },
      { year: 2025, month: 9, topHeadline: "Autumn arrived with pumpkin patches, apple orchards, and the unmistakable crunch of leaves underfoot.", topSong: "Die With A Smile — Lady Gaga & Bruno Mars", weatherDesc: "Cool and crisp, 68°F", tempHigh: 68, funFact: "The NFL season kicked off — families gathered around TVs for opening weekend." },
      { year: 2025, month: 10, topHeadline: "Halloween costumes were everywhere. Kids dressed as astronauts, dinosaurs, and their favorite superheroes.", topSong: "A Bar Song (Tipsy) — Shaboozey", weatherDesc: "Fall colors, 54°F", tempHigh: 54, funFact: "The World Series captivated baseball fans across the country." },
      { year: 2025, month: 11, topHeadline: "Thanksgiving tables were set from coast to coast. Families gathered, grateful for another year together.", topSong: "luther — Kendrick Lamar & SZA", weatherDesc: "First snow of the season, 32°F", tempHigh: 32, funFact: "The Macy's Thanksgiving Day Parade marched through Manhattan for the 99th time." },
      { year: 2025, month: 12, topHeadline: "The holidays arrived with twinkling lights, cozy blankets, and the magic of the season filling every home.", topSong: "APT. — ROSÉ & Bruno Mars", weatherDesc: "Cold and snowy, 22°F", tempHigh: 22, funFact: "Families everywhere were decorating trees and wrapping presents." },
      { year: 2026, month: 1, topHeadline: "A brand new year began — the world felt full of possibility and fresh starts.", topSong: "Birds of a Feather — Billie Eilish", weatherDesc: "Bitter cold, -4°F", tempHigh: -4, funFact: "Polar vortex brought record cold to the Midwest — perfect for staying in and reading stories." },
      { year: 2026, month: 2, topHeadline: "Valentine's Day reminded everyone to tell the people they love how much they matter.", topSong: "Pink Pony Club — Chappell Roan", weatherDesc: "Cold and grey, 18°F", tempHigh: 18, funFact: "The Super Bowl brought friends and families together for the biggest watch party of the year." },
      { year: 2026, month: 3, topHeadline: "Spring was just around the corner — the first crocuses pushed through the snow, and the days started getting longer.", topSong: "Not Like Us — Kendrick Lamar", weatherDesc: "Early spring, 42°F", tempHigh: 42, funFact: "March Madness tipped off — 68 teams chasing a dream." },
    ];
    for (const snap of snapshots) {
      const existing = await ctx.db
        .query("ourfable_vault_snapshots")
        .withIndex("by_familyId_year_month", (q) => q.eq("familyId", familyId).eq("year", snap.year).eq("month", snap.month))
        .first();
      if (!existing) {
        await ctx.db.insert("ourfable_vault_snapshots", { familyId, ...snap });
      }
    }
    return { seeded: snapshots.length };
  },
});

// ── Notifications ──────────────────────────────────────────────────────────────

export const createNotification = mutation({
  args: {
    familyId: v.string(),
    type: v.string(),
    memberName: v.string(),
    preview: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_vault_notifications", { ...args, createdAt: Date.now() });
  },
});

export const listNotifications = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const all = await ctx.db
      .query("ourfable_vault_notifications")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .order("desc")
      .collect();
    return all.slice(0, 20);
  },
});

export const markNotificationsRead = mutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const unread = await ctx.db
      .query("ourfable_vault_notifications")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .filter((q) => q.eq(q.field("readAt"), undefined))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { readAt: Date.now() });
    }
    return unread.length;
  },
});

// ── Before You Were Born ───────────────────────────────────────────────────────

const BEFORE_BORN_PROMPTS = [
  { key: "living", prompt: "Where were you living when you found out you were expecting? Describe the place.", display: "Where were you living when you found out I was coming? Describe the place — what it smelled like, what was on the walls.", order: 1 },
  { key: "scared", prompt: "What scared you most about becoming a parent?", display: "What scared you most about becoming my parent? Be honest.", order: 2 },
  { key: "hoped", prompt: "What did you hope for them, before you even knew who they'd be?", display: "Before you even knew who I'd be — what did you hope for?", order: 3 },
  { key: "world25", prompt: "What was the world like when you were 25? What did you think your life would look like?", display: "What was the world like when you were 25? What did you think your life was going to look like?", order: 4 },
  { key: "made", prompt: "What do you want them to know about how they were made — the trying, the waiting, the moment you found out?", display: "Tell me how I came to exist — the trying, the waiting, the moment you found out. I want to know the whole story.", order: 5 },
  { key: "before", prompt: "Who were you before you became their parent? What did you care about, what were you chasing?", display: "Who were you before you became my parent? What did you care about? What were you chasing?", order: 6 },
  { key: "neverDoubt", prompt: "What is the one thing you most want to make sure they never doubt?", display: "What is the one thing you need me to never doubt about you — or about myself?", order: 7 },
  { key: "ownParents", prompt: "What would your own parents say about you at this age? What do you wish they knew?", display: "What would your own parents say about you at this age? And what do you wish they knew about you?", order: 8 },
  { key: "bornDay", prompt: "Describe the day they were born from your side. Every detail you can remember.", display: "Describe the day I was born from your side. Every detail you remember. Don't leave anything out.", order: 9 },
  { key: "afraid", prompt: "If you could tell them one thing you're afraid they'll never understand about you — what is it?", display: "What's the one thing you're afraid I'll never fully understand about you?", order: 10 },
];

export const seedBeforeBorn = mutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    for (const p of BEFORE_BORN_PROMPTS) {
      const existing = await ctx.db
        .query("ourfable_vault_before_born")
        .withIndex("by_familyId_promptKey", (q) => q.eq("familyId", familyId).eq("promptKey", p.key))
        .first();
      if (!existing) {
        await ctx.db.insert("ourfable_vault_before_born", {
          familyId, promptKey: p.key, prompt: p.prompt, displayPrompt: p.display,
          sortOrder: p.order, sealedUntilAge: 18,
        });
      }
    }
    return { seeded: BEFORE_BORN_PROMPTS.length };
  },
});

export const listBeforeBorn = query({
  args: { familyId: v.string(), childId: v.optional(v.string()) },
  handler: async (ctx, { familyId, childId }) => {
    const all = await ctx.db
      .query("ourfable_vault_before_born")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
    const filtered = childId ? all.filter((e) => !e.childId || e.childId === childId) : all;
    return filtered.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const answerBeforeBorn = mutation({
  args: { familyId: v.string(), promptKey: v.string(), answer: v.string() },
  handler: async (ctx, { familyId, promptKey, answer }) => {
    const existing = await ctx.db
      .query("ourfable_vault_before_born")
      .withIndex("by_familyId_promptKey", (q) => q.eq("familyId", familyId).eq("promptKey", promptKey))
      .first();
    if (!existing) return null;
    await ctx.db.patch(existing._id, { answer, answeredAt: Date.now() });
    return existing._id;
  },
});

// ── Birthday Letters ───────────────────────────────────────────────────────────

export const generateBirthdayLetter = mutation({
  args: { familyId: v.string(), year: v.number() },
  handler: async (ctx, { familyId, year }) => {
    const family = await ctx.db.query("ourfable_vault_families").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).first();
    if (!family) return null;
    const dob = new Date(family.childDob + "T00:00:00");
    const yearStart = new Date(dob.getFullYear() + year - 1, dob.getMonth(), dob.getDate()).getTime();
    const yearEnd = new Date(dob.getFullYear() + year, dob.getMonth(), dob.getDate()).getTime();
    const contributions = await ctx.db.query("ourfable_vault_contributions").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect();
    const yearContribs = contributions.filter(c => c.submittedAt >= yearStart && c.submittedAt < yearEnd);
    const milestones = await ctx.db.query("ourfable_vault_milestones").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect();
    const yearMilestones = milestones.filter(m => m.reachedAt && m.reachedAt >= yearStart && m.reachedAt < yearEnd);
    const snapshots = await ctx.db.query("ourfable_vault_snapshots").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect();
    const yearSnap = snapshots.find(s => {
      const snapDate = new Date(s.year, s.month - 1, 1).getTime();
      return snapDate >= yearStart && snapDate < yearEnd;
    });
    const milestonesText = yearMilestones.length > 0
      ? yearMilestones.map(m => m.name).join(", ")
      : "Growing and learning every day.";
    const worldHighlight = yearSnap?.topHeadline ?? "A world full of change and wonder.";
    const existing = await ctx.db.query("ourfable_vault_birthday_letters").withIndex("by_familyId_year", (q) => q.eq("familyId", familyId).eq("year", year)).first();
    const data = { familyId, year, milestonesText, contributionCount: yearContribs.length, worldHighlight, isSealed: true, sealedUntilAge: 18, generatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert("ourfable_vault_birthday_letters", data);
  },
});

export const listBirthdayLetters = query({
  args: { familyId: v.string(), childId: v.optional(v.string()) },
  handler: async (ctx, { familyId, childId }) => {
    const all = await ctx.db.query("ourfable_vault_birthday_letters").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).order("asc").collect();
    if (!childId) return all;
    return all.filter((e) => !e.childId || e.childId === childId);
  },
});

export const patchBirthdayLetterParentNote = mutation({
  args: { familyId: v.string(), year: v.number(), note: v.string() },
  handler: async (ctx, { familyId, year, note }) => {
    const existing = await ctx.db.query("ourfable_vault_birthday_letters").withIndex("by_familyId_year", (q) => q.eq("familyId", familyId).eq("year", year)).first();
    if (!existing) return null;
    await ctx.db.patch(existing._id, { parentNote: note });
    return existing._id;
  },
});

// ── Gifts ──────────────────────────────────────────────────────────────────────

function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const createGift = mutation({
  args: {
    purchaserName: v.string(),
    purchaserEmail: v.string(),
    recipientName: v.optional(v.string()),
    recipientEmail: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const giftCode = generateGiftCode();
    await ctx.db.insert("ourfable_gifts", { ...args, giftCode, plan: "annual", purchasedAt: Date.now() });
    return giftCode;
  },
});

// New Stripe-backed gift mutation
export const createStripeGift = internalMutation({
  args: {
    gifterName: v.string(),
    gifterEmail: v.string(),
    gifterMessage: v.optional(v.string()),
    recipientEmail: v.string(),
    planType: v.string(),
    billingPeriod: v.string(),
    stripeSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const giftCode = generateGiftCode();
    await ctx.db.insert("ourfable_gifts", {
      giftCode,
      purchaserName: args.gifterName,
      purchaserEmail: args.gifterEmail,
      recipientEmail: args.recipientEmail,
      message: args.gifterMessage,
      plan: args.billingPeriod,
      purchasedAt: Date.now(),
      // New fields
      gifterName: args.gifterName,
      gifterEmail: args.gifterEmail,
      gifterMessage: args.gifterMessage,
      planType: args.planType,
      billingPeriod: args.billingPeriod,
      status: "pending",
      stripeSessionId: args.stripeSessionId,
      createdAt: Date.now(),
    });
    return giftCode;
  },
});

// Update gift status (called by webhook after payment)
export const updateGiftStatus = internalMutation({
  args: {
    giftCode: v.string(),
    status: v.string(),
    stripeSessionId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, { giftCode, status, stripeSessionId, stripeSubscriptionId }) => {
    const gift = await ctx.db.query("ourfable_gifts").withIndex("by_giftCode", (q) => q.eq("giftCode", giftCode)).first();
    if (!gift) return { error: "Gift not found" };
    const patch: Record<string, unknown> = { status };
    if (stripeSessionId) patch.stripeSessionId = stripeSessionId;
    if (stripeSubscriptionId) patch.stripeSubscriptionId = stripeSubscriptionId;
    await ctx.db.patch(gift._id, patch);
    return { success: true };
  },
});

export const getGift = query({
  args: { giftCode: v.string() },
  handler: async (ctx, { giftCode }) => {
    return await ctx.db.query("ourfable_gifts").withIndex("by_giftCode", (q) => q.eq("giftCode", giftCode)).first();
  },
});

export const redeemGift = mutation({
  args: { giftCode: v.string(), familyId: v.string() },
  handler: async (ctx, { giftCode, familyId }) => {
    const gift = await ctx.db.query("ourfable_gifts").withIndex("by_giftCode", (q) => q.eq("giftCode", giftCode)).first();
    if (!gift) return { error: "Gift not found" };
    if (gift.redeemedAt || gift.status === "redeemed") return { error: "Already redeemed" };
    // For Stripe-backed gifts, must be paid
    if (gift.status && gift.status !== "paid") return { error: "Gift not yet paid" };
    await ctx.db.patch(gift._id, { redeemedAt: Date.now(), redeemedByFamilyId: familyId, status: "redeemed" });
    return { success: true, planType: gift.planType ?? "standard", billingPeriod: gift.billingPeriod ?? "annual" };
  },
});

// ── Print Orders ───────────────────────────────────────────────────────────────

export const requestPrintBook = mutation({
  args: { familyId: v.string(), year: v.number(), shippingAddress: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_print_orders", { ...args, status: "pending", requestedAt: Date.now() });
  },
});

export const listPrintOrders = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db.query("ourfable_print_orders").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect();
  },
});

// ── Voice Submissions ──────────────────────────────────────────────────────────

export const createVoiceSubmission = mutation({
  args: { familyId: v.string(), callerPhone: v.string(), audioUrl: v.optional(v.string()), durationSeconds: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_voice_submissions", { ...args, status: "received", createdAt: Date.now() });
  },
});

export const listVoiceSubmissions = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db.query("ourfable_voice_submissions").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).order("desc").collect();
  },
});

// ── Waitlist ──────────────────────────────────────────────────────────────────

export const addWaitlistEntry = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
    referredBy: v.optional(v.string()),
    childName: v.optional(v.string()),
    childBirthday: v.optional(v.string()),
    // UTM attribution
    utm_source: v.optional(v.string()),
    utm_medium: v.optional(v.string()),
    utm_campaign: v.optional(v.string()),
    utm_content: v.optional(v.string()),
    utm_term: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Deduplicate by email
    const existing = await ctx.db.query("ourfable_waitlist").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    if (existing) return existing._id;
    return await ctx.db.insert("ourfable_waitlist", { ...args, createdAt: Date.now() });
  },
});

export const listWaitlist = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ourfable_waitlist").withIndex("by_createdAt").order("asc").collect();
  },
});

export const removeWaitlistEntry = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const entry = await ctx.db.query("ourfable_waitlist").withIndex("by_email", q => q.eq("email", email)).first();
    if (entry) await ctx.db.delete(entry._id);
  },
});

// ── Delivery Milestones — Time-capsule message scheduling ──────────────────────
// These schedule WHEN to deliver messages/letters to the child at milestone ages.
// Distinct from ourfable_vault_milestones (developmental baby milestone tracking).

// Helper: compute delivery date from child DOB + milestone age (years)
function computeDeliveryDate(childDob: string, milestoneAge: number): string {
  const dob = new Date(childDob + "T00:00:00");
  const delivery = new Date(dob);
  delivery.setFullYear(dob.getFullYear() + milestoneAge);
  return delivery.toISOString().slice(0, 10);
}

export const getDeliveryMilestones = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const milestones = await ctx.db
      .query("ourfable_vault_delivery_milestones")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .order("asc")
      .collect();

    // Attach computed delivery date if not manually set
    const family = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();

    return milestones.map((m) => ({
      ...m,
      deliveryDate: m.deliveryDate ?? (family?.childDob ? computeDeliveryDate(family.childDob, m.milestoneAge) : undefined),
    }));
  },
});

export const setDeliveryMilestone = mutation({
  args: {
    familyId: v.string(),
    contributorId: v.string(),
    milestoneAge: v.number(),
    deliveryFormat: v.string(),
    deliveryDate: v.optional(v.string()),
    backupContactName: v.optional(v.string()),
    backupContactEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Upsert by familyId + milestoneAge
    const existing = await ctx.db
      .query("ourfable_vault_delivery_milestones")
      .withIndex("by_familyId_age", (q) =>
        q.eq("familyId", args.familyId).eq("milestoneAge", args.milestoneAge)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        contributorId: args.contributorId,
        deliveryFormat: args.deliveryFormat,
        deliveryDate: args.deliveryDate,
        backupContactName: args.backupContactName,
        backupContactEmail: args.backupContactEmail,
        isActive: true,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("ourfable_vault_delivery_milestones", {
      familyId: args.familyId,
      contributorId: args.contributorId,
      milestoneAge: args.milestoneAge,
      deliveryFormat: args.deliveryFormat,
      deliveryDate: args.deliveryDate,
      backupContactName: args.backupContactName,
      backupContactEmail: args.backupContactEmail,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteDeliveryMilestone = mutation({
  args: { milestoneId: v.id("ourfable_vault_delivery_milestones") },
  handler: async (ctx, { milestoneId }) => {
    await ctx.db.delete(milestoneId);
  },
});

export const getUpcomingDeliveries = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const milestones = await ctx.db
      .query("ourfable_vault_delivery_milestones")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // For each milestone, attach child DOB for date computation
    const families: Record<string, { childDob: string; childName: string; familyName: string }> = {};
    for (const m of milestones) {
      if (!families[m.familyId]) {
        const fam = await ctx.db
          .query("ourfable_vault_families")
          .withIndex("by_familyId", (q) => q.eq("familyId", m.familyId))
          .first();
        if (fam) {
          families[m.familyId] = {
            childDob: fam.childDob,
            childName: fam.childName,
            familyName: fam.familyName,
          };
        }
      }
    }

    return milestones
      .map((m) => {
        const fam = families[m.familyId];
        const deliveryDate = m.deliveryDate ?? (fam?.childDob ? computeDeliveryDate(fam.childDob, m.milestoneAge) : null);
        return {
          ...m,
          deliveryDate,
          childName: fam?.childName,
          familyName: fam?.familyName,
        };
      })
      .filter((m) => m.deliveryDate && m.deliveryDate >= today)
      .sort((a, b) => (a.deliveryDate ?? "").localeCompare(b.deliveryDate ?? ""));
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// OurFable — Persistent Family Accounts (replaces in-memory Map)
// ══════════════════════════════════════════════════════════════════════════════

export const createOurFableFamily = internalMutation({
  args: {
    familyId: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    childName: v.string(),
    planType: v.string(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    birthDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ourfable_families")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("ourfable_families", {
      familyId: args.familyId,
      email: args.email.toLowerCase(),
      passwordHash: args.passwordHash,
      childName: args.childName,
      planType: args.planType,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscriptionStatus: args.subscriptionStatus ?? "active",
      birthDate: args.birthDate,
      createdAt: Date.now(),
    });
  },
});

export const getOurFableFamilyByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("ourfable_families")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();
  },
});

export const getOurFableFamilyById = internalQuery({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
  },
});

// Safe public version — strips passwordHash and other sensitive auth fields
export const getOurFableFamilyByIdSafe = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    // Strip sensitive fields
    const { passwordHash, totpSecret, recoveryCodeHashes, recoveryCodesUsed, recoveryWrappedKeys, encryptedFamilyKey, keySalt, ...safe } = family;
    return safe;
  },
});

export const getOurFableFamilyByStripeCustomer = internalQuery({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    return await ctx.db
      .query("ourfable_families")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", stripeCustomerId))
      .first();
  },
});

export const updateOurFableSubscriptionStatus = internalMutation({
  args: {
    familyId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    subscriptionStatus: v.string(),
    planType: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let family = null;
    if (args.stripeCustomerId) {
      family = await ctx.db
        .query("ourfable_families")
        .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId!))
        .first();
    }
    if (!family && args.familyId) {
      family = await ctx.db
        .query("ourfable_families")
        .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId!))
        .first();
    }
    if (!family) return null;

    const patch: Record<string, unknown> = { subscriptionStatus: args.subscriptionStatus };
    if (args.planType) patch.planType = args.planType;
    if (args.stripeSubscriptionId) patch.stripeSubscriptionId = args.stripeSubscriptionId;
    await ctx.db.patch(family._id, patch);
    return family._id;
  },
});

export const updateOurFableEmail = internalMutation({
  args: {
    oldEmail: v.string(),
    newEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_email", (q) => q.eq("email", args.oldEmail.toLowerCase()))
      .first();
    if (!family) return null;
    await ctx.db.patch(family._id, { email: args.newEmail.toLowerCase() });
    return family._id;
  },
});

export const updateOurFablePasswordHash = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!family) return null;
    await ctx.db.patch(family._id, { passwordHash: args.passwordHash });
    return family._id;
  },
});

export const listActiveOurFableFamilies = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("ourfable_families")
      .withIndex("by_subscriptionStatus", (q) => q.eq("subscriptionStatus", "active"))
      .collect();
  },
});

// ── OurFable Circle Members ─────────────────────────────────────────────────

export const addOurFableCircleMember = mutation({
  args: {
    familyId: v.string(),
    name: v.string(),
    email: v.string(),
    relationship: v.string(),
    inviteToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_circle_members", {
      ...args,
      joinedAt: Date.now(),
    });
  },
});

export const listOurFableCircleMembers = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_circle_members")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

export const setCircleMemberInnerRing = mutation({
  args: {
    memberId: v.id("ourfable_circle_members"),
    isInnerRing: v.boolean(),
  },
  handler: async (ctx, { memberId, isInnerRing }) => {
    await ctx.db.patch(memberId, { isInnerRing });
  },
});

// ── OurFable Vault Entries ──────────────────────────────────────────────────

export const addOurFableVaultEntry = mutation({
  args: {
    familyId: v.string(),
    type: v.string(),
    content: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    authorEmail: v.string(),
    authorName: v.string(),
    isSealed: v.boolean(),
    unlockAge: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_vault_entries", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listOurFableVaultEntries = query({
  args: { familyId: v.string(), childId: v.optional(v.string()) },
  handler: async (ctx, { familyId, childId }) => {
    let all = await ctx.db
      .query("ourfable_vault_entries")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
    if (childId) all = all.filter((e) => !e.childId || e.childId === childId);

    // Resolve Convex storage IDs into renderable URLs
    const resolved = await Promise.all(
      all.map(async (entry) => {
        const e = entry as Record<string, unknown>;
        if (e.mediaStorageId && !e.audioUrl && !e.photoUrl && !e.videoUrl) {
          const url = await ctx.storage.getUrl(e.mediaStorageId as string);
          if (url) {
            const mime = (e.mediaMimeType as string) ?? "";
            const type = (e.type as string) ?? "";
            if (mime.startsWith("audio") || type === "voice") return { ...entry, audioUrl: url };
            if (mime.startsWith("video") || type === "video") return { ...entry, videoUrl: url };
            if (mime.startsWith("image") || type === "photo") return { ...entry, photoUrl: url };
          }
        }
        return entry;
      })
    );

    return resolved;
  },
});

export const unlockOurFableVaultEntry = mutation({
  args: {
    entryId: v.id("ourfable_vault_entries"),
  },
  handler: async (ctx, { entryId }) => {
    await ctx.db.patch(entryId, {
      isSealed: false,
    });
  },
});

// ── OurFable Letters ────────────────────────────────────────────────────────

export const addOurFableLetter = mutation({
  args: {
    familyId: v.string(),
    authorEmail: v.string(),
    authorName: v.string(),
    content: v.string(),
    isSealed: v.boolean(),
    unlockAge: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_letters", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listOurFableLetters = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_letters")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

// ── OurFable Snapshots ──────────────────────────────────────────────────────

export const upsertOurFableSnapshot = mutation({
  args: {
    familyId: v.string(),
    month: v.number(),
    year: v.number(),
    headline: v.optional(v.string()),
    song: v.optional(v.string()),
    sp500Close: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ourfable_snapshots")
      .withIndex("by_familyId_year_month", (q) =>
        q.eq("familyId", args.familyId).eq("year", args.year).eq("month", args.month))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("ourfable_snapshots", { ...args, createdAt: Date.now() });
  },
});

export const listOurFableSnapshots = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_snapshots")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

// ── OurFable Milestones ─────────────────────────────────────────────────────

export const addOurFableMilestone = mutation({
  args: {
    familyId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_milestones", { ...args, createdAt: Date.now() });
  },
});

export const listOurFableMilestones = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_milestones")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

// ── OurFable Dispatches ─────────────────────────────────────────────────────

export const createOurFableDispatch = mutation({
  args: {
    familyId: v.string(),
    type: v.string(),
    content: v.string(),             // subject
    body: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
    sentTo: v.string(),
    sentByName: v.optional(v.string()),
    recipientCount: v.optional(v.number()),
    viewToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_dispatches", { ...args, sentAt: Date.now() });
  },
});

export const getDispatchByViewToken = query({
  args: { viewToken: v.string() },
  handler: async (ctx, { viewToken }) => {
    const dispatch = await ctx.db
      .query("ourfable_dispatches")
      .withIndex("by_viewToken", (q) => q.eq("viewToken", viewToken))
      .first();
    if (!dispatch) return null;
    // Fetch child name from family
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", dispatch.familyId))
      .first();
    return {
      subject: dispatch.content,
      body: dispatch.body ?? "",
      type: dispatch.type,
      mediaUrls: dispatch.mediaUrls ?? [],
      sentByName: dispatch.sentByName ?? "",
      sentAt: dispatch.sentAt,
      childName: family?.childName ?? "",
    };
  },
});

export const listOurFableDispatches = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_dispatches")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

// ── Password Reset ─────────────────────────────────────────────────────────────

export const createPasswordReset = internalMutation({
  args: {
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, { email, token, expiresAt }) => {
    // Delete any existing reset tokens for this email
    const existing = await ctx.db
      .query("ourfable_password_resets")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    await ctx.db.insert("ourfable_password_resets", {
      email: email.toLowerCase(),
      token,
      expiresAt,
    });
  },
});

export const getPasswordReset = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await ctx.db
      .query("ourfable_password_resets")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
  },
});

export const deletePasswordReset = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query("ourfable_password_resets")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

export const updateOurFablePassword = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, { email, passwordHash }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();
    if (!family) throw new Error("Account not found");
    await ctx.db.patch(family._id, { passwordHash });
  },
});

// ── Storage Tracking ──────────────────────────────────────────────────────────

export const incrementOurFableStorage = internalMutation({
  args: {
    familyId: v.string(),
    bytes: v.number(),
  },
  handler: async (ctx, { familyId, bytes }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    const current = family.storageUsedBytes ?? 0;
    await ctx.db.patch(family._id, { storageUsedBytes: current + bytes });
    return current + bytes;
  },
});

export const getOurFableStorageUsage = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    const used = family.storageUsedBytes ?? 0;
    const isPlus = family.planType === "plus";
    const limit = isPlus ? 25 * 1024 * 1024 * 1024 : 5 * 1024 * 1024 * 1024; // 25GB or 5GB
    const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
    return { used, limit, percentage, planType: family.planType };
  },
});

// ── Soft Delete Account ───────────────────────────────────────────────────────

// ── OurFable — Facilitator & Delivery Functions ─────────────────────────────

export const updateOurFableFacilitators = mutation({
  args: {
    familyId: v.string(),
    facilitator1Name: v.optional(v.string()),
    facilitator1Email: v.optional(v.string()),
    facilitator1Relationship: v.optional(v.string()),
    facilitator2Name: v.optional(v.string()),
    facilitator2Email: v.optional(v.string()),
    facilitator2Relationship: v.optional(v.string()),
    childEmail: v.optional(v.string()),
    deliveryMilestoneChoice: v.optional(v.string()),
    deliveryFormatPref: v.optional(v.string()),
    backupContactEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { familyId, ...patch } = args;
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    await ctx.db.patch(family._id, Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined)
    ));
    return family._id;
  },
});

export const getOurFableFacilitators = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    return {
      facilitator1Name: family.facilitator1Name,
      facilitator1Email: family.facilitator1Email,
      facilitator1Relationship: family.facilitator1Relationship,
      facilitator2Name: family.facilitator2Name,
      facilitator2Email: family.facilitator2Email,
      facilitator2Relationship: family.facilitator2Relationship,
      childEmail: family.childEmail,
      deliveryMilestoneChoice: family.deliveryMilestoneChoice,
      deliveryFormatPref: family.deliveryFormatPref,
      backupContactEmail: family.backupContactEmail,
      deliveryStatus: family.deliveryStatus,
    };
  },
});

// ── OurFable — Delivery Milestones ──────────────────────────────────────────

export const createOurFableDeliveryMilestones = mutation({
  args: {
    familyId: v.string(),
    childDob: v.string(),
  },
  handler: async (ctx, { familyId, childDob }) => {
    const existing = await ctx.db
      .query("ourfable_delivery_milestones")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (existing) return; // already created

    const dob = new Date(childDob + "T00:00:00");
    const milestones = [
      { name: "13th birthday", years: 13 },
      { name: "16th birthday", years: 16 },
      { name: "18th birthday", years: 18 },
    ];

    for (const m of milestones) {
      const milestoneDate = new Date(dob);
      milestoneDate.setFullYear(dob.getFullYear() + m.years);
      await ctx.db.insert("ourfable_delivery_milestones", {
        familyId,
        milestoneName: m.name,
        milestoneDate: milestoneDate.getTime(),
        deliveryStatus: "pending",
        notificationsSent: [],
      });
    }
  },
});

export const listOurFableDeliveryMilestones = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_delivery_milestones")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

export const updateOurFableDeliveryMilestoneStatus = mutation({
  args: {
    milestoneId: v.id("ourfable_delivery_milestones"),
    deliveryStatus: v.string(),
    notificationTimestamp: v.optional(v.string()),
    deliveryToken: v.optional(v.string()),
    deliveredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) return null;
    const patch: Record<string, unknown> = { deliveryStatus: args.deliveryStatus };
    if (args.notificationTimestamp) {
      patch.notificationsSent = [...milestone.notificationsSent, args.notificationTimestamp];
    }
    if (args.deliveryToken) patch.deliveryToken = args.deliveryToken;
    if (args.deliveredAt) patch.deliveredAt = args.deliveredAt;
    await ctx.db.patch(args.milestoneId, patch);
    return args.milestoneId;
  },
});

// ── OurFable — Custom Delivery Milestones ───────────────────────────────────

export const addCustomDeliveryMilestone = mutation({
  args: {
    familyId: v.string(),
    milestoneName: v.string(),
    milestoneDate: v.number(),
  },
  handler: async (ctx, { familyId, milestoneName, milestoneDate }) => {
    return await ctx.db.insert("ourfable_delivery_milestones", {
      familyId,
      milestoneName,
      milestoneDate,
      deliveryStatus: "pending",
      notificationsSent: [],
    });
  },
});

export const deleteOurFableDeliveryMilestone = mutation({
  args: { id: v.id("ourfable_delivery_milestones") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const listDeliveryMilestones = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_delivery_milestones")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

// ── OurFable — Delivery Tokens ──────────────────────────────────────────────

export const createOurFableDeliveryToken = mutation({
  args: {
    token: v.string(),
    familyId: v.string(),
    milestoneId: v.optional(v.string()),
    type: v.string(),
    facilitatorEmail: v.optional(v.string()),
    childEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_delivery_tokens", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getOurFableDeliveryToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await ctx.db
      .query("ourfable_delivery_tokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
  },
});

export const markOurFableDeliveryTokenUsed = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query("ourfable_delivery_tokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (row) await ctx.db.patch(row._id, { usedAt: Date.now() });
  },
});

// ── OurFable — Facilitator Tokens ───────────────────────────────────────────

export const createOurFableFacilitatorToken = mutation({
  args: {
    token: v.string(),
    familyId: v.string(),
    milestoneId: v.string(),
    facilitatorEmail: v.string(),
    facilitatorName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_facilitator_tokens", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getOurFableFacilitatorToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await ctx.db
      .query("ourfable_facilitator_tokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
  },
});

export const markOurFableFacilitatorTokenUsed = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query("ourfable_facilitator_tokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (row) await ctx.db.patch(row._id, { usedAt: Date.now() });
  },
});

// ── OurFable — 2FA (TOTP) ──────────────────────────────────────────────────

export const updateOurFable2FA = internalMutation({
  args: {
    familyId: v.string(),
    totpSecret: v.optional(v.string()),
    totpEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, { familyId, totpSecret, totpEnabled }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    const patch: Record<string, unknown> = {};
    if (totpSecret !== undefined) patch.totpSecret = totpSecret;
    if (totpEnabled !== undefined) patch.totpEnabled = totpEnabled;
    await ctx.db.patch(family._id, patch);
    return family._id;
  },
});

export const getOurFable2FAStatus = internalQuery({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    return {
      totpEnabled: family.totpEnabled ?? false,
      totpSecret: family.totpSecret,
    };
  },
});

// ── OurFable — Circle Member Missed Prompts ─────────────────────────────────

export const updateCircleMemberEmail = mutation({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memberId, { email: args.email.toLowerCase() });
    return args.memberId;
  },
});

export const updateOurFableCircleMemberMissedPrompts = mutation({
  args: {
    memberId: v.id("ourfable_circle_members"),
    missedPrompts: v.number(),
    lastRespondedAt: v.optional(v.number()),
  },
  handler: async (ctx, { memberId, missedPrompts, lastRespondedAt }) => {
    const patch: Record<string, unknown> = { missedPrompts };
    if (lastRespondedAt !== undefined) patch.lastRespondedAt = lastRespondedAt;
    await ctx.db.patch(memberId, patch);
  },
});

export const updateOurFableCircleMemberInactivity = mutation({
  args: {
    memberId: v.string(),
    consecutiveMissed: v.number(),
  },
  handler: async (ctx, { memberId, consecutiveMissed }) => {
    // memberId may be a serialized Convex ID string — look up the record
    const members = await ctx.db.query("ourfable_circle_members").collect();
    const member = members.find((m) => m._id.toString() === memberId);
    if (!member) return null;
    await ctx.db.patch(member._id, { consecutiveMissed });
    return member._id;
  },
});

// ── OurFable — Reset Circle Member Inactivity (skip endpoint) ───────────────

export const resetCircleMemberInactivity = mutation({
  args: { memberId: v.id("ourfable_circle_members") },
  handler: async (ctx, { memberId }) => {
    await ctx.db.patch(memberId, { consecutiveMissed: 0 });
  },
});

// ── OurFable — Prompt Skip Tracking ─────────────────────────────────────────

export const logPromptSkip = mutation({
  args: {
    memberId: v.string(),
    familyId: v.string(),
    childId: v.optional(v.string()),
    promptText: v.string(),
    promptId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ourfable_prompt_skips", { ...args, skippedAt: Date.now() });
  },
});

export const getPromptSkipStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("ourfable_prompt_skips").collect();
    const stats: Record<string, number> = {};
    for (const skip of all) {
      stats[skip.promptText] = (stats[skip.promptText] || 0) + 1;
    }
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .map(([prompt, count]) => ({ prompt, skipCount: count }));
  },
});

// ── OurFable — Get All Pending Delivery Milestones (for cron) ───────────────

export const getAllPendingOurFableDeliveryMilestones = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("ourfable_delivery_milestones")
      .filter((q) => q.neq(q.field("deliveryStatus"), "delivered"))
      .collect();
  },
});

export const softDeleteOurFableFamily = internalMutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    await ctx.db.patch(family._id, {
      status: "deleted",
      subscriptionStatus: "cancelled",
      deletedAt: Date.now(),
    });
    return family._id;
  },
});

// ── Hard Delete — cascading removal of all family data ──────────────────────

export const hardDeleteOurFableFamily = internalMutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    // Look up family record first (needed for email-indexed tables)
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();

    // ourfable_children
    for (const r of await ctx.db.query("ourfable_children").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_circle_members
    for (const r of await ctx.db.query("ourfable_circle_members").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_vault_entries
    for (const r of await ctx.db.query("ourfable_vault_entries").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_letters
    for (const r of await ctx.db.query("ourfable_letters").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_snapshots
    for (const r of await ctx.db.query("ourfable_snapshots").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_milestones
    for (const r of await ctx.db.query("ourfable_milestones").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_dispatches
    for (const r of await ctx.db.query("ourfable_dispatches").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_delivery_milestones
    for (const r of await ctx.db.query("ourfable_delivery_milestones").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_delivery_tokens
    for (const r of await ctx.db.query("ourfable_delivery_tokens").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_facilitator_tokens
    for (const r of await ctx.db.query("ourfable_facilitator_tokens").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }

    // ourfable_password_resets — indexed by email
    if (family) {
      for (const r of await ctx.db.query("ourfable_password_resets").withIndex("by_email", (q) => q.eq("email", family.email)).collect()) { await ctx.db.delete(r._id); }
    }

    // ourfable_vault_families
    for (const r of await ctx.db.query("ourfable_vault_families").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_vault_circle
    for (const r of await ctx.db.query("ourfable_vault_circle").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_vault_letters
    for (const r of await ctx.db.query("ourfable_vault_letters").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_vault_milestones
    for (const r of await ctx.db.query("ourfable_vault_milestones").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_vault_outgoings
    for (const r of await ctx.db.query("ourfable_vault_outgoings").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_vault_snapshots
    for (const r of await ctx.db.query("ourfable_vault_snapshots").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_vault_before_born
    for (const r of await ctx.db.query("ourfable_vault_before_born").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_vault_birthday_letters
    for (const r of await ctx.db.query("ourfable_vault_birthday_letters").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_vault_chronicle
    for (const r of await ctx.db.query("ourfable_vault_chronicle").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }
    // ourfable_vault_media
    for (const r of await ctx.db.query("ourfable_vault_media").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect()) { await ctx.db.delete(r._id); }

    // ourfable_vault_contributions — also delete Convex storage files
    const contributions = await ctx.db.query("ourfable_vault_contributions").withIndex("by_familyId", (q) => q.eq("familyId", familyId)).collect();
    for (const c of contributions) {
      if (c.mediaStorageId) {
        try { await ctx.storage.delete(c.mediaStorageId as `${string}`); } catch { /* ignore */ }
      }
      await ctx.db.delete(c._id);
    }

    // ourfable_gifts — scan for redeemedByFamilyId (no index)
    const allGifts = await ctx.db.query("ourfable_gifts").collect();
    for (const g of allGifts) {
      if (g.redeemedByFamilyId === familyId) { await ctx.db.delete(g._id); }
    }

    // Finally delete the ourfable_families record itself
    if (family) {
      await ctx.db.delete(family._id);
    }

    console.log(`[hardDeleteOurFableFamily] Permanently deleted all data for family ${familyId}`);
    return { success: true, familyId };
  },
});

export const listDeletedFamilies = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("ourfable_families").collect();
    return all.filter((f) => f.status === "deleted");
  },
});

// Internal alias for use in cleanupDeletedFamilies
export const listDeletedFamiliesInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("ourfable_families").collect();
    return all.filter((f) => f.status === "deleted");
  },
});

// ── Cleanup deleted families older than 60 days (runs via cron) ─────────────

export const cleanupDeletedFamilies = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number; cleaned: number }> => {
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;

    // Get all soft-deleted families
    const deletedFamilies = await ctx.runQuery(internal.ourfable.listDeletedFamiliesInternal, {});

    let cleaned = 0;
    for (const fam of deletedFamilies as Array<{ familyId: string; deletedAt?: number; createdAt: number }>) {
      const deletedAt = fam.deletedAt ?? fam.createdAt;
      if (deletedAt < sixtyDaysAgo) {
        await ctx.runMutation(internal.ourfable.hardDeleteOurFableFamily, {
          familyId: fam.familyId,
        });
        cleaned++;
        console.log(`[cleanupDeletedFamilies] Hard deleted family ${fam.familyId} (deletedAt: ${new Date(deletedAt).toISOString()})`);
      }
    }

    console.log(`[cleanupDeletedFamilies] Processed ${deletedFamilies.length} deleted families, hard deleted ${cleaned}`);
    return { processed: deletedFamilies.length, cleaned };
  },
});

// ── Dead Man's Switch mutations ─────────────────────────────────────────────

export const updateOurFablePaymentFailures = internalMutation({
  args: {
    familyId: v.string(),
    consecutivePaymentFailures: v.number(),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .first();
    if (!family) return null;
    await ctx.db.patch(family._id, {
      consecutivePaymentFailures: args.consecutivePaymentFailures,
    });
    return family._id;
  },
});

export const updateOurFableFacilitatorNotification = internalMutation({
  args: {
    familyId: v.string(),
    lastFacilitatorBillingNotification: v.number(),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .first();
    if (!family) return null;
    await ctx.db.patch(family._id, {
      lastFacilitatorBillingNotification: args.lastFacilitatorBillingNotification,
    });
    return family._id;
  },
});

export const updateOurFableLapseNotification = mutation({
  args: {
    familyId: v.string(),
    notifyFacilitatorOnLapse: v.boolean(),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .first();
    if (!family) return null;
    await ctx.db.patch(family._id, {
      notifyFacilitatorOnLapse: args.notifyFacilitatorOnLapse,
    });
    return family._id;
  },
});

// Count recent delivery tokens for rate limiting
export const countRecentDeliveries = query({
  args: { familyId: v.string(), since: v.number() },
  handler: async (ctx, { familyId, since }) => {
    const tokens = await ctx.db
      .query("ourfable_delivery_tokens")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
    return tokens.filter((t) => t._creationTime >= since).length;
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// OurFable — Multi-Child Support
// ══════════════════════════════════════════════════════════════════════════════

// Slug generator for child IDs
function generateChildId(childName: string): string {
  const firstNameSlug = childName
    .split(" ")[0]
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 12);
  return `${firstNameSlug}-${Date.now().toString(36)}`;
}

// ── List Children ─────────────────────────────────────────────────────────────

export const listChildren = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_children")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

// ── Get Child ─────────────────────────────────────────────────────────────────

export const getChild = query({
  args: { childId: v.string() },
  handler: async (ctx, { childId }) => {
    return await ctx.db
      .query("ourfable_children")
      .withIndex("by_childId", (q) => q.eq("childId", childId))
      .first();
  },
});

// ── Add Child ─────────────────────────────────────────────────────────────────

export const addChild = mutation({
  args: {
    familyId: v.string(),
    childName: v.string(),
    childDob: v.string(),
  },
  handler: async (ctx, { familyId, childName, childDob }) => {
    const childId = generateChildId(childName);
    const docId = await ctx.db.insert("ourfable_children", {
      familyId,
      childId,
      childName,
      childDob,
      createdAt: Date.now(),
      isFirst: false,
      isActive: true,
    });

    // Seed default milestone prompts for this new child
    const agePrompts: Array<{ months: number; title: string; text: string }> = [
      { months: 0,  title: "The day they were born",              text: "The day they were born — what do you remember?" },
      { months: 1,  title: "Their first month",                   text: "Their first month — what surprised you most?" },
      { months: 3,  title: "First smile",                         text: "First smile — did you catch it?" },
      { months: 6,  title: "Halfway through their first year",    text: "Halfway through their first year — what's changed?" },
      { months: 9,  title: "They're moving",                      text: "They're moving — crawling, pulling up, exploring" },
      { months: 12, title: "Their first birthday",                text: "Their first birthday — a letter for the year" },
      { months: 18, title: "Walking, talking, becoming a person", text: "Walking, talking, becoming a person" },
      { months: 24, title: "Two years old",                       text: "Two years old — who are they becoming?" },
      { months: 36, title: "Three",                               text: "Three — personality is locked in" },
      { months: 48, title: "Four",                                text: "Four — the questions never stop" },
      { months: 60, title: "Five",                                text: "Five — school is coming" },
    ];
    const dob = new Date(childDob + "T00:00:00");
    for (const p of agePrompts) {
      const triggerDate = new Date(dob);
      triggerDate.setMonth(triggerDate.getMonth() + p.months);
      await ctx.db.insert("ourfable_milestone_prompts", {
        familyId,
        childId,
        promptType: "age",
        triggerAgeMonths: p.months,
        triggerDate: triggerDate.toISOString().slice(0, 10),
        title: p.title,
        promptText: p.text,
        sent: false,
        createdAt: Date.now(),
      });
    }

    // Schedule birthday letter reminder for this child
    const parentFamily = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (parentFamily?.parentEmail) {
      await ctx.scheduler.runAfter(0, internal.ourfableDelivery.scheduleBirthdayReminder, {
        familyId,
        childDob,
        childName,
        parentEmail: parentFamily.parentEmail,
      });
    }

    // Return both the Convex _id and the childId slug so callers can use either
    return { _id: docId, childId };
  },
});

// ── Remove Child (soft delete) ────────────────────────────────────────────────

export const removeChild = mutation({
  args: { childId: v.string() },
  handler: async (ctx, { childId }) => {
    const child = await ctx.db
      .query("ourfable_children")
      .withIndex("by_childId", (q) => q.eq("childId", childId))
      .first();
    if (!child) return null;
    await ctx.db.patch(child._id, { isActive: false });
    return child._id;
  },
});

// ── Copy Circle to Child ──────────────────────────────────────────────────────
// Copies selected circle members from a source child to a target child

export const copyCircleToChild = mutation({
  args: {
    sourceChildId: v.string(),
    targetChildId: v.string(),
    memberIds: v.array(v.string()),
  },
  handler: async (ctx, { sourceChildId, targetChildId, memberIds }) => {
    const sourceChild = await ctx.db
      .query("ourfable_children")
      .withIndex("by_childId", (q) => q.eq("childId", sourceChildId))
      .first();
    if (!sourceChild) return { error: "Source child not found" };

    const targetChild = await ctx.db
      .query("ourfable_children")
      .withIndex("by_childId", (q) => q.eq("childId", targetChildId))
      .first();
    if (!targetChild) return { error: "Target child not found" };

    const created: string[] = [];
    for (const memberId of memberIds) {
      // Find original member by ID in ourfable_circle_members
      // Include members specific to sourceChildId AND family-level (childId undefined)
      const allFamilyMembers = await ctx.db
        .query("ourfable_circle_members")
        .withIndex("by_familyId", (q) => q.eq("familyId", sourceChild.familyId))
        .collect();
      const sourceMembers = allFamilyMembers.filter(
        (m) => m.childId === sourceChildId || m.childId === undefined || m.childId === null
      );

      const sourceMember = sourceMembers.find((m) => m._id.toString() === memberId);
      if (!sourceMember) continue;

      // Check if already in target child's circle
      const existingInTarget = await ctx.db
        .query("ourfable_circle_members")
        .withIndex("by_familyId", (q) => q.eq("familyId", targetChild.familyId))
        .filter((q) =>
          q.and(
            q.eq(q.field("email"), sourceMember.email),
            q.eq(q.field("childId"), targetChildId)
          )
        )
        .first();

      if (!existingInTarget) {
        const newId = await ctx.db.insert("ourfable_circle_members", {
          familyId: targetChild.familyId,
          childId: targetChildId,
          name: sourceMember.name,
          email: sourceMember.email,
          relationship: sourceMember.relationship,
          promptFrequency: sourceMember.promptFrequency ?? "monthly",
          joinedAt: Date.now(),
        });
        created.push(newId);
      }
    }
    return { created: created.length };
  },
});

// ── Migration: single-child → multi-child ────────────────────────────────────
// For each ourfable_family that has childName + birthDate, create an
// ourfable_children entry with isFirst: true (idempotent).

export const migrateToMultiChild = mutation({
  args: {},
  handler: async (ctx) => {
    const families = await ctx.db.query("ourfable_families").collect();
    let created = 0;
    let skipped = 0;

    for (const family of families) {
      if (!family.childName) { skipped++; continue; }

      // Check if already migrated
      const existing = await ctx.db
        .query("ourfable_children")
        .withIndex("by_familyId", (q) => q.eq("familyId", family.familyId))
        .first();

      if (existing) { skipped++; continue; }

      // Create first child entry using familyId as childId for backward compat
      await ctx.db.insert("ourfable_children", {
        familyId: family.familyId,
        childId: family.familyId, // reuse familyId slug as childId for first child
        childName: family.childName,
        childDob: family.birthDate ?? "",
        createdAt: family.createdAt,
        isFirst: true,
        isActive: true,
      });
      created++;
    }

    return { created, skipped };
  },
});

// ── Link child to Stripe subscription item ────────────────────────────────────

export const linkChildToStripeSubscriptionItem = mutation({
  args: {
    childId: v.string(),
    stripeSubscriptionItemId: v.string(),
  },
  handler: async (ctx, { childId, stripeSubscriptionItemId }) => {
    const child = await ctx.db
      .query("ourfable_children")
      .withIndex("by_childId", (q) => q.eq("childId", childId))
      .first();
    if (!child) return null;
    await ctx.db.patch(child._id, { stripeSubscriptionItemId, isActive: true });
    return child._id;
  },
});

// ── Get child by Stripe subscription item ────────────────────────────────────

export const getChildByStripeSubscriptionItem = query({
  args: { stripeSubscriptionItemId: v.string() },
  handler: async (ctx, { stripeSubscriptionItemId }) => {
    const children = await ctx.db
      .query("ourfable_children")
      .collect();
    return children.find((c) => c.stripeSubscriptionItemId === stripeSubscriptionItemId) ?? null;
  },
});

// ── Deactivate child (on subscription cancel) ────────────────────────────────

export const deactivateChildByStripeSubscriptionItem = mutation({
  args: { stripeSubscriptionItemId: v.string() },
  handler: async (ctx, { stripeSubscriptionItemId }) => {
    const children = await ctx.db.query("ourfable_children").collect();
    const child = children.find((c) => c.stripeSubscriptionItemId === stripeSubscriptionItemId);
    if (!child) return null;
    await ctx.db.patch(child._id, { isActive: false });
    return child._id;
  },
});

// ── List circle members for a child ──────────────────────────────────────────
// Returns members for a specific childId, or falls back to family-level members

export const listOurFableCircleMembersForChild = query({
  args: {
    familyId: v.string(),
    childId: v.optional(v.string()),
  },
  handler: async (ctx, { familyId, childId }) => {
    if (childId) {
      // Return child-specific members + family-level members (childId = undefined)
      const childMembers = await ctx.db
        .query("ourfable_circle_members")
        .withIndex("by_childId", (q) => q.eq("childId", childId))
        .collect();
      return childMembers;
    }
    // No childId: return all family members (backward compat)
    return await ctx.db
      .query("ourfable_circle_members")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

// ── List vault entries for a child ───────────────────────────────────────────

export const listOurFableVaultEntriesForChild = query({
  args: {
    familyId: v.string(),
    childId: v.optional(v.string()),
  },
  handler: async (ctx, { familyId, childId }) => {
    const all = await ctx.db
      .query("ourfable_vault_entries")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
    if (!childId) return all; // backward compat: return all
    // Return entries for this child OR entries with no childId (first child data)
    return all.filter((e) => !e.childId || e.childId === childId);
  },
});

// ── List dispatches with optional child filter ────────────────────────────────

export const listOurFableDispatchesForChild = query({
  args: {
    familyId: v.string(),
    childId: v.optional(v.string()),
  },
  handler: async (ctx, { familyId, childId }) => {
    const all = await ctx.db
      .query("ourfable_dispatches")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
    if (!childId) return all;
    return all.filter((d) => !d.childId || d.childId === childId);
  },
});

// ── List active children for monthly prompts ──────────────────────────────────

export const listActiveChildrenForFamily = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const children = await ctx.db
      .query("ourfable_children")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
    return children.filter((c) => c.isActive);
  },
});

// ── Create dispatch with optional childId ─────────────────────────────────────

export const createOurFableDispatchForChild = mutation({
  args: {
    familyId: v.string(),
    childId: v.optional(v.string()),
    type: v.string(),
    content: v.string(),
    sentTo: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_dispatches", { ...args, sentAt: Date.now() });
  },
});

// ── Get/Set circle member prompt frequency ────────────────────────────────────
// Uses ourfable_vault_circle table since that's what the OurFable circle page uses.

export const getCircleMemberFrequency = query({
  args: {
    familyId: v.string(),
    memberId: v.string(),
    childId: v.optional(v.string()),
  },
  handler: async (ctx, { memberId }) => {
    // Look up by familyId + filter since memberId is a serialized _id string
    const member = await ctx.db
      .query("ourfable_vault_circle")
      .collect()
      .then((all) => all.find((m) => m._id.toString() === memberId));
    if (!member) return { frequency: "monthly" };
    return { frequency: (member as unknown as { promptFrequency?: string }).promptFrequency ?? "monthly" };
  },
});

export const setCircleMemberFrequency = mutation({
  args: {
    familyId: v.string(),
    memberId: v.string(),
    frequency: v.union(v.literal("Monthly"), v.literal("Quarterly"), v.literal("Paused")),
    childId: v.optional(v.string()),
  },
  handler: async (ctx, { familyId, memberId, frequency }) => {
    // Map UI values (capitalized) to schema values (lowercase)
    const freqMap: Record<string, "monthly" | "quarterly" | "paused"> = {
      Monthly: "monthly",
      Quarterly: "quarterly",
      Paused: "paused",
    };
    const schemaFreq = freqMap[frequency] ?? "monthly";

    // Find the member by familyId + _id string match
    const members = await ctx.db
      .query("ourfable_vault_circle")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
    const member = members.find((m) => m._id.toString() === memberId);
    if (!member) return null;
    await ctx.db.patch(member._id, { promptFrequency: schemaFreq });
    return member._id;
  },
});

// ── Aliases for export/storage-warnings routes ────────────────────────────────

/** Alias for listLetters — used by the data export route */
export const listLettersByFamily = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_letters")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .order("desc")
      .collect();
  },
});

/** Alias for listContributions — used by the data export route */
export const listContributionsByFamily = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_contributions")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .order("desc")
      .collect();
  },
});

/** Alias for listSnapshots — used by the data export route */
export const listSnapshotsByFamily = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_vault_snapshots")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

// ── Patch OurFable Family (for storage warnings) ──────────────────────────────

export const patchOurFableFamily = internalMutation({
  args: {
    familyId: v.string(),
    storageWarned80: v.optional(v.boolean()),
    storageWarned95: v.optional(v.boolean()),
    storageLimitBytes: v.optional(v.number()),
    storageUsedBytes: v.optional(v.number()),
    planType: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    lapseNotificationSent: v.optional(v.boolean()),
  },
  handler: async (ctx, { familyId, ...patch }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    // Only patch fields that are defined (strip undefined)
    const validPatch = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(validPatch).length === 0) return family._id;
    await ctx.db.patch(family._id, validPatch);
    return family._id;
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// OurFable — Milestone Prompt Engine
// ══════════════════════════════════════════════════════════════════════════════

// ── List milestone prompts ─────────────────────────────────────────────────────

export const listMilestonePrompts = query({
  args: { familyId: v.string(), childId: v.optional(v.string()) },
  handler: async (ctx, { familyId, childId }) => {
    const all = await ctx.db
      .query("ourfable_milestone_prompts")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
    if (childId) return all.filter((p) => !p.childId || p.childId === childId);
    return all;
  },
});

// ── Create milestone prompt ────────────────────────────────────────────────────

export const createMilestonePrompt = mutation({
  args: {
    familyId: v.string(),
    childId: v.optional(v.string()),
    promptType: v.string(),
    triggerAgeMonths: v.optional(v.number()),
    triggerDate: v.optional(v.string()),
    title: v.string(),
    promptText: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_milestone_prompts", {
      ...args,
      sent: false,
      createdAt: Date.now(),
    });
  },
});

// ── Mark prompt sent ───────────────────────────────────────────────────────────

export const markMilestonePromptSent = mutation({
  args: { promptId: v.id("ourfable_milestone_prompts") },
  handler: async (ctx, { promptId }) => {
    await ctx.db.patch(promptId, { sent: true, sentAt: Date.now() });
  },
});

// ── Mark prompt responded ─────────────────────────────────────────────────────

export const markMilestonePromptResponded = mutation({
  args: { promptId: v.id("ourfable_milestone_prompts") },
  handler: async (ctx, { promptId }) => {
    await ctx.db.patch(promptId, { respondedAt: Date.now() });
  },
});

// ── Get due milestone prompts ─────────────────────────────────────────────────
// Returns prompts where triggerAgeMonths <= child's current age (months) OR
// triggerDate <= today, and sent === false.

export const getDueMilestonePrompts = query({
  args: { familyId: v.string(), childId: v.optional(v.string()) },
  handler: async (ctx, { familyId, childId }) => {
    const today = new Date().toISOString().slice(0, 10);

    // Get child's DOB to calculate current age in months
    let childDob: string | null = null;
    if (childId) {
      const child = await ctx.db
        .query("ourfable_children")
        .withIndex("by_childId", (q) => q.eq("childId", childId))
        .first();
      childDob = child?.childDob ?? null;
    } else {
      // Fall back to family record's birthDate
      const family = await ctx.db
        .query("ourfable_families")
        .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
        .first();
      childDob = family?.birthDate ?? null;
    }

    let currentAgeMonths = 0;
    if (childDob) {
      const dob = new Date(childDob + "T00:00:00");
      const now = new Date();
      const diffMs = now.getTime() - dob.getTime();
      currentAgeMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
    }

    const all = await ctx.db
      .query("ourfable_milestone_prompts")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();

    return all.filter((p) => {
      if (p.sent) return false;
      if (childId && p.childId && p.childId !== childId) return false;
      // Age-based trigger
      if (p.triggerAgeMonths !== undefined && currentAgeMonths >= p.triggerAgeMonths) return true;
      // Date-based trigger
      if (p.triggerDate && p.triggerDate <= today) return true;
      return false;
    });
  },
});

// ── Seed default milestone prompts for a child ────────────────────────────────

export const seedDefaultMilestonePrompts = mutation({
  args: {
    familyId: v.string(),
    childId: v.optional(v.string()),
    childDob: v.string(),
  },
  handler: async (ctx, { familyId, childId, childDob }) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("ourfable_milestone_prompts")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
    const existingForChild = childId
      ? existing.filter((p) => p.childId === childId)
      : existing.filter((p) => !p.childId);
    if (existingForChild.length > 0) return { seeded: 0 };

    const agePrompts: Array<{ months: number; title: string; text: string }> = [
      { months: 0,  title: "The day they were born",           text: "The day they were born — what do you remember?" },
      { months: 1,  title: "Their first month",                text: "Their first month — what surprised you most?" },
      { months: 3,  title: "First smile",                      text: "First smile — did you catch it?" },
      { months: 6,  title: "Halfway through their first year", text: "Halfway through their first year — what's changed?" },
      { months: 9,  title: "They're moving",                   text: "They're moving — crawling, pulling up, exploring" },
      { months: 12, title: "Their first birthday",             text: "Their first birthday — a letter for the year" },
      { months: 18, title: "Walking, talking, becoming a person", text: "Walking, talking, becoming a person" },
      { months: 24, title: "Two years old",                    text: "Two years old — who are they becoming?" },
      { months: 36, title: "Three",                            text: "Three — personality is locked in" },
      { months: 48, title: "Four",                             text: "Four — the questions never stop" },
      { months: 60, title: "Five",                             text: "Five — school is coming" },
    ];

    const dob = new Date(childDob + "T00:00:00");
    let seeded = 0;

    for (const p of agePrompts) {
      // Compute the triggerDate = DOB + months
      const triggerDate = new Date(dob);
      // Add months accurately
      triggerDate.setMonth(triggerDate.getMonth() + p.months);
      const triggerDateStr = triggerDate.toISOString().slice(0, 10);

      await ctx.db.insert("ourfable_milestone_prompts", {
        familyId,
        childId,
        promptType: "age",
        triggerAgeMonths: p.months,
        triggerDate: triggerDateStr,
        title: p.title,
        promptText: p.text,
        sent: false,
        createdAt: Date.now(),
      });
      seeded++;
    }

    return { seeded };
  },
});

// ── Internal queries for cron ──────────────────────────────────────────────────

export const listAllActiveFamiliesInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("ourfable_families")
      .withIndex("by_subscriptionStatus", (q) => q.eq("subscriptionStatus", "active"))
      .collect();
  },
});

export const getDueMilestonePromptsInternal = internalQuery({
  args: { familyId: v.string(), childId: v.optional(v.string()) },
  handler: async (ctx, { familyId, childId }) => {
    const today = new Date().toISOString().slice(0, 10);

    let childDob: string | null = null;
    if (childId) {
      const child = await ctx.db
        .query("ourfable_children")
        .withIndex("by_childId", (q) => q.eq("childId", childId))
        .first();
      childDob = child?.childDob ?? null;
    } else {
      const family = await ctx.db
        .query("ourfable_families")
        .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
        .first();
      childDob = family?.birthDate ?? null;
    }

    let currentAgeMonths = 0;
    if (childDob) {
      const dob = new Date(childDob + "T00:00:00");
      const diffMs = Date.now() - dob.getTime();
      currentAgeMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
    }

    const all = await ctx.db
      .query("ourfable_milestone_prompts")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();

    return all.filter((p) => {
      if (p.sent) return false;
      if (childId && p.childId && p.childId !== childId) return false;
      if (p.triggerAgeMonths !== undefined && currentAgeMonths >= p.triggerAgeMonths) return true;
      if (p.triggerDate && p.triggerDate <= today) return true;
      return false;
    });
  },
});

export const markMilestonePromptSentInternal = internalMutation({
  args: { promptId: v.id("ourfable_milestone_prompts") },
  handler: async (ctx, { promptId }) => {
    await ctx.db.patch(promptId, { sent: true, sentAt: Date.now() });
  },
});

// ── Legacy Mode / Guardian Check-In functions ─────────────────────────────────

export const setLegacyMode = mutation({
  args: { familyId: v.string(), enabled: v.boolean() },
  handler: async (ctx, { familyId, enabled }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    await ctx.db.patch(family._id, { legacyMode: enabled });
    return family._id;
  },
});

export const setGuardianCheckIn = mutation({
  args: { familyId: v.string(), enabled: v.boolean() },
  handler: async (ctx, { familyId, enabled }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    await ctx.db.patch(family._id, { guardianCheckIn: enabled });
    return family._id;
  },
});

export const updateLastActivity = mutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    await ctx.db.patch(family._id, { lastActivityAt: Date.now() });
    return family._id;
  },
});

export const checkInactiveAccountsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const all = await ctx.db.query("ourfable_families").collect();
    return all.filter((f) => {
      if (!f.guardianCheckIn) return false;
      if (f.status === "deleted") return false;
      const lastActivity = f.lastActivityAt ?? f.createdAt;
      return lastActivity < ninetyDaysAgo;
    });
  },
});

export const getLegacySettings = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    return {
      legacyMode: family.legacyMode ?? false,
      guardianCheckIn: family.guardianCheckIn ?? false,
      lastActivityAt: family.lastActivityAt,
    };
  },
});


// ── F&F Gift Code — creates a pre-paid Plus gift for friends & family ────────
export const createFFGiftCode = internalMutation({
  args: {
    giftCode: v.string(),
    recipientName: v.string(),
    recipientEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for duplicate
    const existing = await ctx.db
      .query("ourfable_gifts")
      .withIndex("by_giftCode", (q) => q.eq("giftCode", args.giftCode))
      .first();
    if (existing) throw new Error("Gift code already exists");

    return await ctx.db.insert("ourfable_gifts", {
      giftCode: args.giftCode,
      purchaserName: "Dave & Amanda Sweeney",
      purchaserEmail: "hello@ourfable.ai",
      recipientName: args.recipientName,
      recipientEmail: args.recipientEmail,
      message: "A gift from The Sweeneys — premium founding member, completely free.",
      plan: "annual",
      purchasedAt: Date.now(),
      planType: "plus",
      billingPeriod: "annual",
      status: "paid",
      createdAt: Date.now(),
    });
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// OurFable — Vault Encryption Key Management
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Set up encryption for a family — stores the wrapped family key and salt.
 * Called from the client AFTER generating and wrapping the key client-side.
 */
export const setupFamilyEncryption = internalMutation({
  args: {
    familyId: v.string(),
    encryptedFamilyKey: v.string(), // JSON-encoded WrappedKey
    keySalt: v.string(),            // base64-encoded PBKDF2 salt
    keyVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .first();
    if (!family) throw new Error("Family not found");

    await ctx.db.patch(family._id, {
      encryptedFamilyKey: args.encryptedFamilyKey,
      keySalt: args.keySalt,
      keyVersion: args.keyVersion ?? 1,
    });
    return family._id;
  },
});

/**
 * Get the encryption key material for a family (for login flow).
 */
export const getFamilyEncryptionKeys = internalQuery({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    return {
      encryptedFamilyKey: family.encryptedFamilyKey ?? null,
      keySalt: family.keySalt ?? null,
      keyVersion: family.keyVersion ?? null,
    };
  },
});

/**
 * Store an encrypted copy of the family key for a vault guardian.
 */
export const storeGuardianKeyShare = internalMutation({
  args: {
    familyId: v.string(),
    guardianEmail: v.string(),
    encryptedFamilyKey: v.string(), // family key encrypted with guardian's derived key
    guardianName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Upsert: replace existing share for this guardian
    const existing = await ctx.db
      .query("ourfable_guardian_key_shares")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .collect();
    const existingShare = existing.find((s) => s.guardianEmail === args.guardianEmail);
    if (existingShare) {
      await ctx.db.patch(existingShare._id, {
        encryptedFamilyKey: args.encryptedFamilyKey,
        ...(args.guardianName ? { guardianName: args.guardianName } : {}),
      });
      return existingShare._id;
    }
    return await ctx.db.insert("ourfable_guardian_key_shares", {
      familyId: args.familyId,
      guardianEmail: args.guardianEmail,
      encryptedFamilyKey: args.encryptedFamilyKey,
      guardianName: args.guardianName,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get guardian key shares for a family.
 */
export const getGuardianKeyShares = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    return await ctx.db
      .query("ourfable_guardian_key_shares")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

/**
 * Migrate existing plaintext entries to encrypted format.
 * Called from the client — client reads plaintext, encrypts, sends back.
 * This mutation updates a single entry with encrypted content.
 */
export const migrateEntryToEncrypted = mutation({
  args: {
    entryId: v.id("ourfable_vault_entries"),
    encryptedBody: v.string(),
    contentHash: v.string(),
    encryptionVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) throw new Error("Entry not found");

    await ctx.db.patch(args.entryId, {
      encryptedBody: args.encryptedBody,
      contentHash: args.contentHash,
      encryptionVersion: args.encryptionVersion,
      content: undefined, // Clear plaintext content
    });
    return args.entryId;
  },
});

/**
 * Migrate a contribution entry to encrypted format.
 */
export const migrateContributionToEncrypted = mutation({
  args: {
    entryId: v.id("ourfable_vault_contributions"),
    encryptedBody: v.string(),
    contentHash: v.string(),
    encryptionVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) throw new Error("Entry not found");

    await ctx.db.patch(args.entryId, {
      encryptedBody: args.encryptedBody,
      contentHash: args.contentHash,
      encryptionVersion: args.encryptionVersion,
      body: undefined, // Clear plaintext body
    });
    return args.entryId;
  },
});

// ── Recovery Codes ───────────────────────────────────────────────────────────

/**
 * Store hashed recovery codes and their wrapped family keys.
 */
export const storeRecoveryCodeHashes = internalMutation({
  args: {
    familyId: v.string(),
    hashes: v.array(v.string()),
    wrappedKeys: v.array(v.string()), // each code's wrapped family key (JSON)
  },
  handler: async (ctx, args) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .first();
    if (!family) throw new Error("Family not found");
    await ctx.db.patch(family._id, {
      recoveryCodeHashes: args.hashes,
      recoveryCodesUsed: [],
      recoveryWrappedKeys: args.wrappedKeys,
    });
    return family._id;
  },
});

/**
 * Verify and consume a recovery code. Returns the wrapped family key for that code
 * so the client can unwrap with the recovery code and re-wrap with a new password.
 */
export const verifyAndConsumeRecoveryCode = internalMutation({
  args: {
    familyId: v.string(),
    codeHash: v.string(),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .first();
    if (!family) throw new Error("Family not found");

    const hashes = family.recoveryCodeHashes ?? [];
    const used = family.recoveryCodesUsed ?? [];
    const wrappedKeys = family.recoveryWrappedKeys ?? [];

    const idx = hashes.indexOf(args.codeHash);
    if (idx === -1) throw new Error("Invalid recovery code");
    if (used.includes(args.codeHash)) throw new Error("Recovery code already used");

    // Mark as used
    await ctx.db.patch(family._id, {
      recoveryCodesUsed: [...used, args.codeHash],
    });

    return {
      wrappedFamilyKey: wrappedKeys[idx] ?? null,
      encryptedFamilyKey: family.encryptedFamilyKey ?? null,
      keySalt: family.keySalt ?? null,
    };
  },
});

/**
 * Mark recovery setup as complete.
 */
export const markRecoverySetupComplete = internalMutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) throw new Error("Family not found");
    await ctx.db.patch(family._id, { recoverySetupComplete: true });
    return family._id;
  },
});

/**
 * Check if recovery setup is complete.
 */
export const isRecoverySetupComplete = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return false;
    return family.recoverySetupComplete ?? false;
  },
});

/**
 * Get recovery code status (how many remaining).
 */
export const getRecoveryCodeStatus = query({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;
    const total = (family.recoveryCodeHashes ?? []).length;
    const used = (family.recoveryCodesUsed ?? []).length;
    return {
      total,
      used,
      remaining: total - used,
      recoverySetupComplete: family.recoverySetupComplete ?? false,
    };
  },
});

/**
 * Get family data needed for recovery during password reset.
 * Returns encryption info + recovery status.
 */
export const getRecoveryInfo = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();
    if (!family) return null;

    const guardians = await ctx.db
      .query("ourfable_guardian_key_shares")
      .withIndex("by_familyId", (q) => q.eq("familyId", family.familyId))
      .collect();

    return {
      familyId: family.familyId,
      hasEncryption: !!family.encryptedFamilyKey,
      encryptedFamilyKey: family.encryptedFamilyKey ?? null,
      keySalt: family.keySalt ?? null,
      hasRecoveryCodes: (family.recoveryCodeHashes ?? []).length > 0,
      recoveryCodesRemaining: (family.recoveryCodeHashes ?? []).length - (family.recoveryCodesUsed ?? []).length,
      hasGuardian: guardians.length > 0,
      guardianEmails: guardians.map((g) => g.guardianEmail),
    };
  },
});

/**
 * Update the encrypted family key (after re-wrapping with new password).
 * SECURITY: familyId is enforced by the data proxy (C1 fix).
 */
export const updateEncryptedFamilyKey = internalMutation({
  args: {
    familyId: v.string(),
    encryptedFamilyKey: v.string(),
    keySalt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db
      .query("ourfable_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .first();
    if (!family) throw new Error("Family not found");
    const patch: Record<string, unknown> = { encryptedFamilyKey: args.encryptedFamilyKey };
    if (args.keySalt) patch.keySalt = args.keySalt;
    await ctx.db.patch(family._id, patch);
    return family._id;
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// Signup Tokens — temporary password hash store for Stripe checkout (C4 fix)
// ══════════════════════════════════════════════════════════════════════════════

export const createSignupToken = internalMutation({
  args: {
    token: v.string(),
    passwordHash: v.string(),
    email: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ourfable_signup_tokens", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getSignupToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await ctx.db
      .query("ourfable_signup_tokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
  },
});

export const consumeSignupToken = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query("ourfable_signup_tokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (row) {
      await ctx.db.patch(row._id, { consumed: true });
      // Delete after a short delay for cleanup
      await ctx.db.delete(row._id);
    }
    return row;
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// 2FA Rate Limiting — Convex-backed (H1 fix)
// ══════════════════════════════════════════════════════════════════════════════

export const check2FARateLimit = internalQuery({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const record = await ctx.db
      .query("ourfable_2fa_attempts")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!record) return { allowed: true, remaining: 5 };

    const now = Date.now();
    // If locked and lock hasn't expired
    if (record.lockedUntil && now < record.lockedUntil) {
      return { allowed: false, remaining: 0, lockedUntil: record.lockedUntil };
    }

    // If last failure was >15min ago, reset
    if (now - record.lastFailedAt > 15 * 60 * 1000) {
      return { allowed: true, remaining: 5 };
    }

    const remaining = Math.max(0, 5 - record.failedCount);
    return { allowed: remaining > 0, remaining };
  },
});

export const record2FAFailure = internalMutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const now = Date.now();
    const record = await ctx.db
      .query("ourfable_2fa_attempts")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();

    if (!record) {
      await ctx.db.insert("ourfable_2fa_attempts", {
        familyId,
        failedCount: 1,
        lastFailedAt: now,
      });
      return;
    }

    // Reset if last failure was >15min ago
    if (now - record.lastFailedAt > 15 * 60 * 1000) {
      await ctx.db.patch(record._id, { failedCount: 1, lastFailedAt: now, lockedUntil: undefined });
      return;
    }

    const newCount = record.failedCount + 1;
    const patch: Record<string, unknown> = { failedCount: newCount, lastFailedAt: now };
    // Lock out after 5 failed attempts for 15 minutes
    if (newCount >= 5) {
      patch.lockedUntil = now + 15 * 60 * 1000;
    }
    await ctx.db.patch(record._id, patch);
  },
});

export const reset2FAAttempts = internalMutation({
  args: { familyId: v.string() },
  handler: async (ctx, { familyId }) => {
    const record = await ctx.db
      .query("ourfable_2fa_attempts")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (record) {
      await ctx.db.delete(record._id);
    }
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// Password Reset — Atomic Token Consumption (H5 TOCTOU fix)
// ══════════════════════════════════════════════════════════════════════════════

export const consumePasswordResetToken = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query("ourfable_password_resets")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!row) return null;
    if (row.consumed) return null; // Already consumed by concurrent request
    if (Date.now() > row.expiresAt) {
      await ctx.db.delete(row._id);
      return null;
    }
    // Mark as consumed BEFORE returning — prevents TOCTOU race
    await ctx.db.patch(row._id, { consumed: true });
    return { email: row.email, token: row.token };
  },
});
