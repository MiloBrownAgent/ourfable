/**
 * OurFable Convex Schema
 *
 * Combined schema for OurFable's independent Convex deployment.
 * Contains:
 *  - ourfable_vault_* tables (family/circle/contributions/prompts/etc.)
 *  - ourfable_* tables (OurFable SaaS accounts, vault, delivery)
 *  - questionHistory / questionQueue (AI question engine)
 *
 * 
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ---------------------------------------------------------------------------
  // AI Question Engine — Question History
  // ---------------------------------------------------------------------------
  questionHistory: defineTable({
    contributorId: v.string(),
    questionId: v.string(),
    askedAt: v.number(),
    answered: v.boolean(),
  })
    .index("by_contributor", ["contributorId"])
    .index("by_contributor_question", ["contributorId", "questionId"]),

  // ---------------------------------------------------------------------------
  // AI Question Engine — Dispatch Queue
  // ---------------------------------------------------------------------------
  questionQueue: defineTable({
    contributorId: v.string(),
    familyId: v.string(),
    questionId: v.string(),
    scheduledFor: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    emailAddress: v.string(),
  })
    .index("by_contributor", ["contributorId"])
    .index("by_status", ["status"])
    .index("by_family_status", ["familyId", "status"]),

  // ---------------------------------------------------------------------------
  // OurFable Vault — Family records (legacy vault engine)
  // ---------------------------------------------------------------------------
  ourfable_vault_families: defineTable({
    familyId: v.string(),
    familyName: v.string(),
    childName: v.string(),
    childDob: v.string(),
    childPhotoUrl: v.optional(v.string()),
    childEmailAlias: v.optional(v.string()),
    parentNames: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    timezone: v.string(),
    plan: v.string(),
    createdAt: v.number(),
    testIntervalMinutes: v.optional(v.number()), // test mode: override 30-day prompt interval
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
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
  }).index("by_familyId", ["familyId"])
    .index("by_parentEmail", ["parentEmail"]),

  ourfable_vault_outgoings: defineTable({
    familyId: v.string(),
    childId: v.optional(v.string()),
    dispatchTarget: v.optional(v.string()),
    subject: v.string(),
    body: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    mediaType: v.optional(v.string()),
    sentToAll: v.boolean(),
    sentToMemberIds: v.optional(v.array(v.string())),
    sentAt: v.number(),
    sentByName: v.string(),
    recipientCount: v.optional(v.number()),
  }).index("by_familyId", ["familyId"]),

  ourfable_vault_chronicle: defineTable({
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
  })
    .index("by_familyId_date", ["familyId", "date"])
    .index("by_familyId", ["familyId"]),

  ourfable_vault_milestones: defineTable({
    familyId: v.string(),
    name: v.string(),
    category: v.string(),
    expectedAgeMonths: v.number(),
    reachedAt: v.optional(v.number()),
    note: v.optional(v.string()),
    isCustom: v.optional(v.boolean()),
  }).index("by_familyId", ["familyId"]),

  ourfable_vault_letters: defineTable({
    familyId: v.string(),
    childId: v.optional(v.string()),   // null = first child (backward compat)
    author: v.string(),
    subject: v.string(),
    body: v.string(),
    openOn: v.string(),
    isOpen: v.boolean(),
    writtenAt: v.number(),
    openedAt: v.optional(v.number()),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.string()),
  }).index("by_familyId", ["familyId"]),

  ourfable_vault_circle: defineTable({
    familyId: v.string(),
    name: v.string(),
    relationship: v.string(),
    relationshipKey: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    inviteToken: v.string(),
    shareToken: v.string(),
    hasAccepted: v.boolean(),
    acceptedAt: v.optional(v.number()),
    lastActiveAt: v.optional(v.number()),
    contributionCount: v.optional(v.number()),
    promptFrequency: v.optional(v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("paused"),
    )),
    // E2E encryption: invite key wrapped with family key (JSON-encoded WrappedKey)
    encryptedInviteKey: v.optional(v.string()),
  })
    .index("by_familyId", ["familyId"])
    .index("by_inviteToken", ["inviteToken"])
    .index("by_shareToken", ["shareToken"]),

  ourfable_vault_contributions: defineTable({
    familyId: v.string(),
    childId: v.optional(v.string()),   // null = first child (backward compat)
    memberId: v.id("ourfable_vault_circle"),
    type: v.string(),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.string()),
    mediaMimeType: v.optional(v.string()),
    mediaEncryptionIv: v.optional(v.string()),
    mediaEncryptionTag: v.optional(v.string()),
    mediaEncryptionVersion: v.optional(v.number()),
    openOn: v.optional(v.string()),
    unlocksAtAge: v.optional(v.number()),
    unlocksAtEvent: v.optional(v.string()),
    isOpen: v.boolean(),
    openedAt: v.optional(v.number()),
    openedByParent: v.optional(v.boolean()),
    prompt: v.optional(v.string()),
    promptId: v.optional(v.string()),
    submittedAt: v.number(),
    // Vault encryption fields
    encryptedBody: v.optional(v.string()),   // JSON-encoded EncryptedText { ciphertext, iv, tag }
    contentHash: v.optional(v.string()),     // SHA-256 hex hash of original plaintext
    encryptionVersion: v.optional(v.number()), // 1 = AES-256-GCM
  })
    .index("by_familyId", ["familyId"])
    .index("by_memberId", ["memberId"])
    .index("by_familyId_isOpen", ["familyId", "isOpen"]),

  ourfable_vault_generated_prompts: defineTable({
    memberId: v.id("ourfable_vault_circle"),
    familyId: v.string(),
    promptIndex: v.number(),
    text: v.string(),
    category: v.string(),
    unlocksAtAge: v.optional(v.number()),
    unlocksAtEvent: v.optional(v.string()),
    tone: v.optional(v.string()),
    generatedAt: v.number(),
  })
    .index("by_memberId_index", ["memberId", "promptIndex"])
    .index("by_familyId", ["familyId"]),

  ourfable_vault_prompt_queue: defineTable({
    familyId: v.string(),
    memberId: v.id("ourfable_vault_circle"),
    promptText: v.string(),
    promptCategory: v.string(),
    promptUnlocksAtAge: v.optional(v.number()),
    promptUnlocksAtEvent: v.optional(v.string()),
    scheduledFor: v.string(),
    sentAt: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("responded"),
      v.literal("skipped")
    ),
    submissionToken: v.optional(v.string()),
  })
    .index("by_familyId", ["familyId"])
    .index("by_memberId", ["memberId"])
    .index("by_status_scheduledFor", ["status", "scheduledFor"]),

  ourfable_vault_recipes: defineTable({
    familyId: v.string(),
    contributorName: v.string(),
    contributorRelationship: v.string(),
    title: v.string(),
    story: v.string(),
    ingredients: v.array(v.string()),
    instructions: v.string(),
    audioNoteUrl: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    submittedAt: v.number(),
  }).index("by_familyId", ["familyId"]),

  ourfable_vault_feed: defineTable({
    familyId: v.string(),
    authorName: v.string(),
    authorRelationship: v.string(),
    caption: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    postedAt: v.number(),
    addedToChronicle: v.optional(v.boolean()),
  }).index("by_familyId", ["familyId"]),

  ourfable_vault_prompts_sent: defineTable({
    familyId: v.string(),
    memberId: v.id("ourfable_vault_circle"),
    prompt: v.string(),
    promptType: v.string(),
    triggerEvent: v.optional(v.string()),
    sentAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_familyId", ["familyId"])
    .index("by_memberId", ["memberId"]),

  ourfable_vault_snapshots: defineTable({
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
  })
    .index("by_familyId", ["familyId"])
    .index("by_familyId_year_month", ["familyId", "year", "month"]),

  ourfable_vault_notifications: defineTable({
    familyId: v.string(),
    type: v.string(),
    memberName: v.string(),
    preview: v.string(),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  }).index("by_familyId", ["familyId"]),

  ourfable_vault_before_born: defineTable({
    familyId: v.string(),
    childId: v.optional(v.string()),   // null = first child (backward compat)
    promptKey: v.string(),
    prompt: v.string(),
    displayPrompt: v.string(),
    answer: v.optional(v.string()),
    answeredAt: v.optional(v.number()),
    sortOrder: v.number(),
    sealedUntilAge: v.number(),
  })
    .index("by_familyId", ["familyId"])
    .index("by_familyId_promptKey", ["familyId", "promptKey"]),

  ourfable_vault_birthday_letters: defineTable({
    familyId: v.string(),
    childId: v.optional(v.string()),   // null = first child (backward compat)
    year: v.number(),
    milestonesText: v.optional(v.string()),
    contributionCount: v.number(),
    worldHighlight: v.optional(v.string()),
    parentNote: v.optional(v.string()),
    isSealed: v.boolean(),
    sealedUntilAge: v.number(),
    generatedAt: v.number(),
  })
    .index("by_familyId", ["familyId"])
    .index("by_familyId_year", ["familyId", "year"]),

  ourfable_gifts: defineTable({
    giftCode: v.string(),
    purchaserName: v.string(),
    purchaserEmail: v.string(),
    recipientName: v.optional(v.string()),
    recipientEmail: v.optional(v.string()),
    message: v.optional(v.string()),
    plan: v.string(),
    purchasedAt: v.number(),
    redeemedAt: v.optional(v.number()),
    redeemedByFamilyId: v.optional(v.string()),
    // New fields for Stripe-backed gift flow
    gifterName: v.optional(v.string()),
    gifterEmail: v.optional(v.string()),
    gifterMessage: v.optional(v.string()),
    planType: v.optional(v.string()),     // "standard" | "plus"
    billingPeriod: v.optional(v.string()), // "annual"
    status: v.optional(v.string()),        // "pending" | "paid" | "redeemed" | "expired"
    stripeSessionId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  })
    .index("by_giftCode", ["giftCode"])
    .index("by_recipientEmail", ["recipientEmail"])
    .index("by_status", ["status"]),

  ourfable_print_orders: defineTable({
    familyId: v.string(),
    year: v.number(),
    status: v.string(),
    requestedAt: v.number(),
    generatedAt: v.optional(v.number()),
    printUrl: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
  }).index("by_familyId", ["familyId"]),

  ourfable_voice_submissions: defineTable({
    familyId: v.string(),
    callerPhone: v.string(),
    audioUrl: v.optional(v.string()),
    transcription: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_familyId", ["familyId"]),

  ourfable_waitlist: defineTable({
    email: v.string(),
    createdAt: v.number(),
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
  })
    .index("by_email", ["email"])
    .index("by_createdAt", ["createdAt"])
    .index("by_source", ["source"]),

  ourfable_vault_media: defineTable({
    familyId: v.string(),
    contributionId: v.optional(v.string()),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    r2Key: v.string(),
    r2Url: v.string(),
    uploadedBy: v.string(),
    uploadedAt: v.number(),
    mediaType: v.union(
      v.literal("photo"),
      v.literal("video"),
      v.literal("voice"),
      v.literal("document")
    ),
  })
    .index("by_familyId", ["familyId"])
    .index("by_contributionId", ["contributionId"]),

  ourfable_vault_delivery_milestones: defineTable({
    familyId: v.string(),
    contributorId: v.string(),
    milestoneAge: v.number(),
    deliveryDate: v.optional(v.string()),
    deliveryFormat: v.string(),
    backupContactEmail: v.optional(v.string()),
    backupContactName: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_familyId", ["familyId"])
    .index("by_familyId_age", ["familyId", "milestoneAge"])
    .index("by_deliveryDate", ["deliveryDate"]),

  // ---------------------------------------------------------------------------
  // OurFable — SaaS accounts & delivery infrastructure
  // ---------------------------------------------------------------------------
  ourfable_families: defineTable({
    familyId: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    childName: v.string(),
    planType: v.string(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.string(),
    passwordChangedAt: v.optional(v.number()),
    birthDate: v.optional(v.string()),
    parentNames: v.optional(v.string()),
    storageUsedBytes: v.optional(v.number()),
    status: v.optional(v.string()),
    facilitator1Name: v.optional(v.string()),
    facilitator1Email: v.optional(v.string()),
    facilitator1Relationship: v.optional(v.string()),
    facilitator2Name: v.optional(v.string()),
    facilitator2Email: v.optional(v.string()),
    facilitator2Relationship: v.optional(v.string()),
    childEmail: v.optional(v.string()),
    deliveryMilestoneChoice: v.optional(v.string()), // "13" | "18" | "21" | "all"
    deliveryFormatPref: v.optional(v.string()),       // "email" | "letter" | "video"
    backupContactEmail: v.optional(v.string()),
    deliveryStatus: v.optional(v.string()),
    lastDeliveryNotification: v.optional(v.number()),
    totpSecret: v.optional(v.string()),
    totpEnabled: v.optional(v.boolean()),
    // Vault encryption — per-family AES-256-GCM key management
    encryptedFamilyKey: v.optional(v.string()), // JSON-encoded WrappedKey { wrappedKey, iv }
    keySalt: v.optional(v.string()),            // PBKDF2 salt for key derivation (base64)
    keyVersion: v.optional(v.number()),         // encryption key version (for future rotation)
    // Recovery code system
    recoveryCodeHashes: v.optional(v.array(v.string())),      // SHA-256 hashes of recovery codes
    recoveryCodesUsed: v.optional(v.array(v.string())),        // hashes of used codes (can't reuse)
    recoverySetupComplete: v.optional(v.boolean()),            // true when user saved codes OR assigned guardian
    recoveryWrappedKeys: v.optional(v.array(v.string())),      // family key wrapped per recovery code (JSON strings)
    notifyFacilitatorOnLapse: v.optional(v.boolean()),
    consecutivePaymentFailures: v.optional(v.number()),
    lastFacilitatorBillingNotification: v.optional(v.number()),
    storageWarned80: v.optional(v.boolean()),
    storageWarned95: v.optional(v.boolean()),
    storageLimitBytes: v.optional(v.number()),
    legacyMode: v.optional(v.boolean()),
    guardianCheckIn: v.optional(v.boolean()),
    lastActivityAt: v.optional(v.number()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_familyId", ["familyId"])
    .index("by_stripeCustomerId", ["stripeCustomerId"])
    .index("by_subscriptionStatus", ["subscriptionStatus"]),

  // ---------------------------------------------------------------------------
  // OurFable — Children (multi-child support)
  // ---------------------------------------------------------------------------
  ourfable_children: defineTable({
    familyId: v.string(),          // parent family slug
    childId: v.string(),           // unique slug e.g. "soren-mn657o1b"
    childName: v.string(),         // "Soren Thomas Sweeney"
    childDob: v.string(),          // "2025-06-21"
    createdAt: v.number(),
    isFirst: v.boolean(),          // true = included in base plan, false = add-on
    isActive: v.boolean(),         // false = soft-deleted / subscription cancelled
    stripeSubscriptionItemId: v.optional(v.string()), // for add-on billing
  })
    .index("by_familyId", ["familyId"])
    .index("by_childId", ["childId"]),

  ourfable_circle_members: defineTable({
    familyId: v.string(),
    childId: v.optional(v.string()),   // null = family-level member (all children)
    name: v.string(),
    email: v.string(),
    relationship: v.string(),
    inviteToken: v.optional(v.string()),
    joinedAt: v.optional(v.number()),
    missedPrompts: v.optional(v.number()),
    lastRespondedAt: v.optional(v.number()),
    consecutiveMissed: v.optional(v.number()),
    promptFrequency: v.optional(v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("paused"),
    )),
    isInnerRing: v.optional(v.boolean()), // true = inner ring (base plan can dispatch to these)
  })
    .index("by_familyId", ["familyId"])
    .index("by_email", ["email"])
    .index("by_childId", ["childId"]),

  ourfable_vault_entries: defineTable({
    familyId: v.string(),
    childId: v.optional(v.string()),   // null = first child (backward compat)
    type: v.string(),
    content: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
    mediaStorageId: v.optional(v.string()),
    mediaMimeType: v.optional(v.string()),
    mediaEncryptionIv: v.optional(v.string()),
    mediaEncryptionTag: v.optional(v.string()),
    mediaEncryptionVersion: v.optional(v.number()),
    authorEmail: v.string(),
    authorName: v.string(),
    isSealed: v.boolean(),
    unlockAge: v.optional(v.number()),
    createdAt: v.number(),
    sourceType: v.optional(v.string()), // "letter" | "dispatch" | "prompt_reply"
    // Vault encryption fields
    encryptedBody: v.optional(v.string()),   // JSON-encoded EncryptedText { ciphertext, iv, tag }
    contentHash: v.optional(v.string()),     // SHA-256 hex hash of original plaintext
    encryptionVersion: v.optional(v.number()), // 1 = AES-256-GCM
  })
    .index("by_familyId", ["familyId"])
    .index("by_childId", ["childId"]),

  ourfable_letters: defineTable({
    familyId: v.string(),
    childId: v.optional(v.string()),   // null = first child (backward compat)
    authorEmail: v.string(),
    authorName: v.string(),
    content: v.string(),
    isSealed: v.boolean(),
    unlockAge: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_familyId", ["familyId"]),

  ourfable_snapshots: defineTable({
    familyId: v.string(),
    childId: v.optional(v.string()),   // null = first child (backward compat)
    month: v.number(),
    year: v.number(),
    headline: v.optional(v.string()),
    song: v.optional(v.string()),
    sp500Close: v.optional(v.number()),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_familyId", ["familyId"])
    .index("by_familyId_year_month", ["familyId", "year", "month"]),

  ourfable_milestones: defineTable({
    familyId: v.string(),
    childId: v.optional(v.string()),   // null = first child (backward compat)
    title: v.string(),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_familyId", ["familyId"]),

  ourfable_dispatches: defineTable({
    familyId: v.string(),
    childId: v.optional(v.string()),   // null = family dispatch (all children)
    type: v.string(),
    content: v.string(),              // subject line
    body: v.optional(v.string()),     // message body
    mediaUrls: v.optional(v.array(v.string())),
    sentTo: v.string(),
    sentByName: v.optional(v.string()),
    recipientCount: v.optional(v.number()),
    sentAt: v.number(),
    viewToken: v.optional(v.string()), // public token for branded view page
    usedAt: v.optional(v.number()),
  })
    .index("by_viewToken", ["viewToken"])
    .index("by_familyId", ["familyId"])
    .index("by_type", ["type"]),

  ourfable_delivery_milestones: defineTable({
    familyId: v.string(),
    milestoneName: v.string(),
    milestoneDate: v.number(),
    deliveryStatus: v.string(),
    notificationsSent: v.array(v.string()),
    deliveredAt: v.optional(v.number()),
    deliveryToken: v.optional(v.string()),
  })
    .index("by_familyId", ["familyId"])
    .index("by_deliveryStatus", ["deliveryStatus"])
    .index("by_deliveryToken", ["deliveryToken"]),

  ourfable_delivery_tokens: defineTable({
    token: v.string(),
    familyId: v.string(),
    milestoneId: v.optional(v.string()),
    type: v.string(),
    facilitatorEmail: v.optional(v.string()),
    childEmail: v.optional(v.string()),
    createdAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_familyId", ["familyId"]),

  ourfable_facilitator_tokens: defineTable({
    token: v.string(),
    familyId: v.string(),
    milestoneId: v.string(),
    facilitatorEmail: v.string(),
    facilitatorName: v.string(),
    createdAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_familyId", ["familyId"]),

  ourfable_password_resets: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    consumed: v.optional(v.boolean()), // H5: mark consumed before password update (TOCTOU fix)
  })
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  // ---------------------------------------------------------------------------
  // Signup Tokens — temporary store for password hashes during Stripe checkout
  // Replaces storing password_hash in Stripe metadata (C4 fix)
  // ---------------------------------------------------------------------------
  ourfable_signup_tokens: defineTable({
    token: v.string(),
    passwordHash: v.string(),
    email: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    consumed: v.optional(v.boolean()),
  })
    .index("by_token", ["token"]),

  // ---------------------------------------------------------------------------
  // Login Rate Limiting — tracks failed login attempts per IP (HIGH-3 fix)
  // Convex-backed for serverless compatibility (replaces in-memory Map)
  // ---------------------------------------------------------------------------
  ourfable_login_attempts: defineTable({
    ipKey: v.string(),
    failedCount: v.number(),
    lastFailedAt: v.number(),
    lockedUntil: v.optional(v.number()),
  })
    .index("by_ipKey", ["ipKey"]),

  // ---------------------------------------------------------------------------
  // OurFable Users — individual parent accounts (dual-parent login)
  // ---------------------------------------------------------------------------
  ourfable_users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    passwordChangedAt: v.optional(v.number()),
    familyId: v.string(),
    name: v.string(),
    role: v.union(v.literal("owner"), v.literal("parent")),
    totpSecret: v.optional(v.string()),
    totpEnabled: v.optional(v.boolean()),
    encryptedFamilyKey: v.optional(v.string()),
    keySalt: v.optional(v.string()),
    recoveryCodeHashes: v.optional(v.array(v.string())),
    recoveryCodesUsed: v.optional(v.array(v.string())),
    recoveryWrappedKeys: v.optional(v.array(v.string())),
    recoverySetupComplete: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_familyId", ["familyId"]),

  // ---------------------------------------------------------------------------
  // Parent Invites — pending invitations for co-parent to join
  // ---------------------------------------------------------------------------
  ourfable_parent_invites: defineTable({
    familyId: v.string(),
    invitedByUserId: v.string(),
    invitedByName: v.string(),
    email: v.string(),
    token: v.string(),
    // Encrypted family key wrapped with invite secret (for key transfer)
    encryptedFamilyKeyForInvite: v.optional(v.string()),
    inviteKeySalt: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired")),
    createdAt: v.number(),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_familyId", ["familyId"])
    .index("by_email", ["email"]),

  // ---------------------------------------------------------------------------
  // 2FA Rate Limiting — tracks failed attempts per family (H1 fix)
  // ---------------------------------------------------------------------------
  ourfable_2fa_attempts: defineTable({
    familyId: v.string(),
    failedCount: v.number(),
    lastFailedAt: v.number(),
    lockedUntil: v.optional(v.number()),
  })
    .index("by_familyId", ["familyId"]),

  // ---------------------------------------------------------------------------
  // OurFable — Prompt Skip Tracking
  // ---------------------------------------------------------------------------
  ourfable_prompt_skips: defineTable({
    memberId: v.string(),
    familyId: v.string(),
    childId: v.optional(v.string()),
    promptText: v.string(),        // the actual question they were asked
    promptId: v.optional(v.string()), // if we have a prompt template ID
    skippedAt: v.number(),
  })
    .index("by_promptText", ["promptText"])
    .index("by_memberId", ["memberId"])
    .index("by_familyId", ["familyId"]),

  // ---------------------------------------------------------------------------
  // OurFable — Milestone Prompt Engine
  // ---------------------------------------------------------------------------
  ourfable_milestone_prompts: defineTable({
    childId: v.optional(v.string()),        // per-child prompts
    familyId: v.string(),
    promptType: v.string(),                 // "milestone" | "age" | "custom"
    triggerAgeMonths: v.optional(v.number()), // age in months when this fires
    triggerDate: v.optional(v.string()),    // specific date trigger (YYYY-MM-DD)
    title: v.string(),                      // "First Smile"
    promptText: v.string(),                 // "Soren smiled for the first time..."
    sent: v.boolean(),
    sentAt: v.optional(v.number()),
    respondedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_familyId", ["familyId"])
    .index("by_childId", ["childId"])
    .index("by_sent", ["sent"]),

  // ---------------------------------------------------------------------------
  // Vault Encryption — Guardian Key Shares
  // ---------------------------------------------------------------------------
  ourfable_guardian_key_shares: defineTable({
    familyId: v.string(),
    guardianEmail: v.string(),
    encryptedFamilyKey: v.string(), // family key encrypted with guardian's derived key
    guardianName: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_familyId", ["familyId"])
    .index("by_guardianEmail", ["guardianEmail"]),

  // ---------------------------------------------------------------------------
  // Vault Audit Log — enterprise-grade submission tracking
  // Every vault submission (success or failure) writes one row.
  // Independent from the contribution itself — even if the contribution
  // insert fails, the audit log captures the attempt.
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Referral Codes — viral growth
  // ---------------------------------------------------------------------------
  ourfable_referrals: defineTable({
    code: v.string(),                       // unique 8-char code
    referrerFamilyId: v.string(),
    referrerName: v.string(),               // "Dave & Amanda"
    childName: v.string(),                  // "Soren"
    status: v.string(),                     // "available" | "redeemed"
    redeemedByEmail: v.optional(v.string()),
    redeemedByFamilyId: v.optional(v.string()),
    redeemedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_referrerFamilyId", ["referrerFamilyId"])
    .index("by_status", ["status"]),

  // ---------------------------------------------------------------------------
  // Vault Audit Log
  // ---------------------------------------------------------------------------
  ourfable_vault_audit_log: defineTable({
    familyId: v.string(),
    memberId: v.optional(v.string()),
    memberName: v.optional(v.string()),
    childName: v.optional(v.string()),
    contentType: v.string(),               // "write" | "voice" | "video" | "photo"
    status: v.string(),                     // "success" | "upload_failed" | "mutation_failed" | "storage_missing"
    errorMessage: v.optional(v.string()),
    mediaStorageId: v.optional(v.string()),
    mediaVerified: v.optional(v.boolean()), // true if storage URL resolves after insert
    submissionToken: v.optional(v.string()),
    receiptEmailSent: v.optional(v.boolean()),
    timestamp: v.number(),
    source: v.optional(v.string()),         // "respond_page" | "dashboard" | "canary"
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_status", ["status", "timestamp"])
    .index("by_familyId", ["familyId", "timestamp"]),

  // ---------------------------------------------------------------------------
  // Canary — synthetic test results
  // ---------------------------------------------------------------------------
  ourfable_vault_canary: defineTable({
    testType: v.string(),                   // "write" | "voice" | "video" | "photo" | "full"
    status: v.string(),                     // "pass" | "fail"
    errorMessage: v.optional(v.string()),
    durationMs: v.number(),
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"]),
});
