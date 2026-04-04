import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHLY_INTERVAL_DAYS = 30;
const QUARTERLY_INTERVAL_DAYS = 90;
const CHILD_STAGGER_DAYS = 2;

type PromptCategory = "letter" | "photo" | "voice" | "video" | "any";
type RelationshipGroup = "parent" | "grandparent" | "aunt_uncle" | "godparent" | "family_friend";

type PromptContext = {
  childFirst: string;
  childAgeLabel: string;
  ageDetail: string;
  parentNames: string;
  explicitAnchor: string;
  subtleAnchor: string;
  gentleFutureCue: string;
};

type PromptTemplate = {
  key: string;
  groups: RelationshipGroup[];
  category: PromptCategory;
  explicitAnchor: boolean;
  render: (context: PromptContext) => string;
};

type ChildTarget = {
  childId?: string;
  childName: string;
  childDob: string;
  childIndex: number;
};

function getOurFableUrl(): string {
  return process.env.OURFABLE_BASE_URL ?? "https://ourfable.ai";
}

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

function getPromptIntervalDays(promptFrequency?: string) {
  if (promptFrequency === "paused") return null;
  if (promptFrequency === "quarterly") return QUARTERLY_INTERVAL_DAYS;
  return MONTHLY_INTERVAL_DAYS;
}

function getAnchorDate(member: { joinedAt?: number; acceptedAt?: number; _creationTime: number }) {
  return member.joinedAt ?? member.acceptedAt ?? member._creationTime;
}

function getDueAt(anchorMs: number, intervalDays: number, childIndex: number, cycleNumber: number) {
  return anchorMs + ((cycleNumber + 1) * intervalDays + childIndex * CHILD_STAGGER_DAYS) * DAY_MS;
}

function getResponseWindowEndsAt(anchorMs: number, intervalDays: number, childIndex: number, cycleNumber: number) {
  return getDueAt(anchorMs, intervalDays, childIndex, cycleNumber + 1);
}

function isoDate(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function getAgeMonths(childDob: string) {
  const dob = new Date(`${childDob}T00:00:00`);
  const now = new Date();
  return (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
}

function getAgeLabel(childDob: string) {
  const months = Math.max(0, getAgeMonths(childDob));
  if (months < 1) return "brand new";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} old`;
  if (months < 24) return `${months} months old`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0
    ? `${years} year${years === 1 ? "" : "s"} and ${remMonths} month${remMonths === 1 ? "" : "s"} old`
    : `${years} year${years === 1 ? "" : "s"} old`;
}

function getAgeDetail(childDob: string, cycleNumber: number) {
  const months = Math.max(0, getAgeMonths(childDob));
  const infantDetails = [
    "right now everything about them is changing by the week",
    "their whole world still fits inside a few rooms and familiar arms",
    "even this season of tiny routines will feel impossibly far away one day",
  ];
  const toddlerDetails = [
    "they are turning into a person with opinions, rituals, and favorite words",
    "their personality is showing up in flashes that will soon become who they are",
    "the days are loud and ordinary now, but this version of them will disappear fast",
  ];
  const childDetails = [
    "they are old enough to surprise everyone and young enough to change by next month",
    "the things they love right now are probably becoming part of their permanent story",
    "this is the age when small habits start turning into a real self",
  ];
  const olderDetails = [
    "they are growing into a fuller version of themselves faster than anyone can track",
    "the way they move through the world right now will matter when they look back later",
    "this season will feel early and unfinished when they return to it years from now",
  ];
  const bank =
    months < 12 ? infantDetails :
    months < 36 ? toddlerDetails :
    months < 120 ? childDetails :
    olderDetails;
  return bank[cycleNumber % bank.length];
}

function toRelationshipGroup(relationshipKey?: string): RelationshipGroup {
  const key = (relationshipKey ?? "").toLowerCase();
  if (["mother", "father", "stepmother", "stepfather", "parent"].includes(key)) return "parent";
  if (["grandmother", "grandfather", "grandparent", "grandma", "grandpa", "nana", "papa", "granny", "gran", "grammy", "gramps", "oma", "opa", "mimi", "pop-pop", "poppop"].includes(key)) return "grandparent";
  if (["aunt", "uncle", "cousin"].includes(key)) return "aunt_uncle";
  if (key === "godparent") return "godparent";
  return "family_friend";
}

function hashSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function sortBySeed<T extends { key: string }>(items: T[], seed: string) {
  return [...items].sort((a, b) => {
    const aHash = hashSeed(`${seed}:${a.key}`);
    const bHash = hashSeed(`${seed}:${b.key}`);
    return aHash - bHash;
  });
}

function buildUnlockAnchor(
  deliveryMilestones: Array<{ milestoneName: string; milestoneDate: number; deliveryStatus?: string }>,
  childDob: string,
  cycleNumber: number,
) {
  const activeMilestones = deliveryMilestones
    .filter((milestone) => milestone.deliveryStatus !== "delivered")
    .sort((a, b) => a.milestoneDate - b.milestoneDate);
  if (activeMilestones.length > 0 && cycleNumber % 3 === 0) {
    const milestone = activeMilestones[cycleNumber % activeMilestones.length];
    return {
      unlocksAtEvent: milestone.milestoneName,
      explicitAnchor: `${milestone.milestoneName.toLowerCase()}`,
      subtleAnchor: `the version of them standing on the edge of ${milestone.milestoneName.toLowerCase()}`,
      gentleFutureCue: `when ${milestone.milestoneName.toLowerCase()} arrives`,
    };
  }

  const currentYears = getAgeMonths(childDob) / 12;
  const ages = [8, 13, 16, 18];
  const futureAges = ages.filter((age) => age > currentYears);
  const anchorAge = (futureAges.length > 0 ? futureAges : ages)[cycleNumber % (futureAges.length > 0 ? futureAges.length : ages.length)];
  return {
    unlocksAtAge: anchorAge,
    explicitAnchor: `${anchorAge}${anchorAge === 8 ? "th" : anchorAge === 13 ? "th" : anchorAge === 16 ? "th" : "th"} birthday`,
    subtleAnchor: `the older version of them who can hold a ${anchorAge}-year-old truth`,
    gentleFutureCue: `when they are ${anchorAge}`,
  };
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    key: "gp-explicit-house",
    groups: ["grandparent"],
    category: "letter",
    explicitAnchor: true,
    render: ({ childFirst, explicitAnchor }) =>
      `What from your own childhood do you want ${childFirst} to carry with them when they read this on their ${explicitAnchor}? Tell the story only a grandparent would think to preserve.`,
  },
  {
    key: "gp-explicit-voice",
    groups: ["grandparent"],
    category: "voice",
    explicitAnchor: true,
    render: ({ childFirst, explicitAnchor }) =>
      `Record yourself telling ${childFirst} the family story you would most want in their hands on their ${explicitAnchor}. Say it the way you would across a kitchen table.`,
  },
  {
    key: "gp-subtle-lineage",
    groups: ["grandparent"],
    category: "letter",
    explicitAnchor: false,
    render: ({ childFirst, childAgeLabel, ageDetail, subtleAnchor }) =>
      `${childFirst} is ${childAgeLabel}, and ${ageDetail}. What do you see in them already that makes you think of your side of the family, especially for ${subtleAnchor}?`,
  },
  {
    key: "gp-subtle-photo",
    groups: ["grandparent"],
    category: "photo",
    explicitAnchor: false,
    render: ({ childFirst, gentleFutureCue }) =>
      `Send one old family photo that ${childFirst} should have someday, then write the story behind it the way you would want them to hear it ${gentleFutureCue}.`,
  },
  {
    key: "parent-explicit-origin",
    groups: ["parent"],
    category: "letter",
    explicitAnchor: true,
    render: ({ childFirst, explicitAnchor }) =>
      `What do you want ${childFirst} to understand about who you were before they arrived, especially by the time they open this on their ${explicitAnchor}? Keep it honest, not polished.`,
  },
  {
    key: "parent-explicit-video",
    groups: ["parent"],
    category: "video",
    explicitAnchor: true,
    render: ({ childFirst, explicitAnchor }) =>
      `Record a video for ${childFirst} to open on their ${explicitAnchor}: tell them what you hope they never misread about you as their parent.`,
  },
  {
    key: "parent-subtle-now",
    groups: ["parent"],
    category: "letter",
    explicitAnchor: false,
    render: ({ childFirst, childAgeLabel, ageDetail, subtleAnchor }) =>
      `${childFirst} is ${childAgeLabel}, and ${ageDetail}. What about parenting them right now do you think only ${subtleAnchor} could fully understand later?`,
  },
  {
    key: "parent-subtle-voice",
    groups: ["parent"],
    category: "voice",
    explicitAnchor: false,
    render: ({ childFirst, gentleFutureCue }) =>
      `Record yourself talking to ${childFirst} about the ordinary part of loving them right now, the part you suspect will matter most ${gentleFutureCue}.`,
  },
  {
    key: "au-explicit-parent-story",
    groups: ["aunt_uncle"],
    category: "letter",
    explicitAnchor: true,
    render: ({ childFirst, parentNames, explicitAnchor }) =>
      `What about ${parentNames} before parenthood would help ${childFirst} understand them better when they read this on their ${explicitAnchor}? Tell the story siblings and close family actually know.`,
  },
  {
    key: "au-explicit-video",
    groups: ["aunt_uncle"],
    category: "video",
    explicitAnchor: true,
    render: ({ childFirst, explicitAnchor }) =>
      `Record yourself telling ${childFirst} the family story that should land with them on their ${explicitAnchor}, not earlier. Keep the texture in it.`,
  },
  {
    key: "au-subtle-comparison",
    groups: ["aunt_uncle"],
    category: "letter",
    explicitAnchor: false,
    render: ({ childFirst, childAgeLabel, ageDetail }) =>
      `${childFirst} is ${childAgeLabel}, and ${ageDetail}. What about them already reminds you of their parent at an age the rest of the family would recognize immediately?`,
  },
  {
    key: "au-subtle-photo",
    groups: ["aunt_uncle"],
    category: "photo",
    explicitAnchor: false,
    render: ({ childFirst, gentleFutureCue }) =>
      `Send a photo from your side of the family that says something real about where ${childFirst} comes from, then write why it should still matter ${gentleFutureCue}.`,
  },
  {
    key: "god-explicit-promise",
    groups: ["godparent"],
    category: "letter",
    explicitAnchor: true,
    render: ({ childFirst, explicitAnchor }) =>
      `What promise did you quietly make to yourself about ${childFirst} that you would want them to read on their ${explicitAnchor}? Write that version, not the ceremonial one.`,
  },
  {
    key: "god-subtle-belief",
    groups: ["godparent"],
    category: "voice",
    explicitAnchor: false,
    render: ({ childFirst, subtleAnchor }) =>
      `Record yourself telling ${childFirst} what you believe carries a person through life, especially for ${subtleAnchor}. Make it sound like your actual voice.`,
  },
  {
    key: "ff-explicit-seen",
    groups: ["family_friend"],
    category: "letter",
    explicitAnchor: true,
    render: ({ childFirst, parentNames, explicitAnchor }) =>
      `What did you see in ${parentNames} before ${childFirst} was born that you think ${childFirst} should know by their ${explicitAnchor}?`,
  },
  {
    key: "ff-explicit-voice",
    groups: ["family_friend"],
    category: "voice",
    explicitAnchor: true,
    render: ({ childFirst, explicitAnchor }) =>
      `Record yourself telling ${childFirst} the story of when you first understood the kind of people their parents were, and why it should reach them on their ${explicitAnchor}.`,
  },
  {
    key: "ff-subtle-now",
    groups: ["family_friend"],
    category: "letter",
    explicitAnchor: false,
    render: ({ childFirst, childAgeLabel, ageDetail }) =>
      `${childFirst} is ${childAgeLabel}, and ${ageDetail}. What do you notice about this family's life right now that you think ${childFirst} may someday be grateful someone wrote down?`,
  },
  {
    key: "ff-subtle-photo",
    groups: ["family_friend"],
    category: "photo",
    explicitAnchor: false,
    render: ({ childFirst, gentleFutureCue }) =>
      `Send a photo that captures what this chapter of ${childFirst}'s life feels like from the outside, then write the line you would want attached to it ${gentleFutureCue}.`,
  },
];

function buildPromptForCycle(args: {
  member: { _id: string; name: string; relationshipKey?: string };
  family: { parentNames?: string | null };
  child: ChildTarget;
  cycleNumber: number;
  priorPromptTexts: string[];
  siblingTemplateKeys: string[];
  deliveryMilestones: Array<{ milestoneName: string; milestoneDate: number; deliveryStatus?: string }>;
}) {
  const childFirst = args.child.childName.split(" ")[0];
  const relationshipGroup = toRelationshipGroup(args.member.relationshipKey);
  const anchor = buildUnlockAnchor(args.deliveryMilestones, args.child.childDob, args.cycleNumber);
  const context: PromptContext = {
    childFirst,
    childAgeLabel: getAgeLabel(args.child.childDob),
    ageDetail: getAgeDetail(args.child.childDob, args.cycleNumber),
    parentNames: args.family.parentNames ?? "their parents",
    explicitAnchor: anchor.explicitAnchor,
    subtleAnchor: anchor.subtleAnchor,
    gentleFutureCue: anchor.gentleFutureCue,
  };
  const seededTemplates = sortBySeed(
    PROMPT_TEMPLATES.filter((template) =>
      template.groups.includes(relationshipGroup) &&
      template.explicitAnchor === (args.cycleNumber % 3 === 0)
    ),
    `${args.member._id}:${args.child.childId ?? "first"}:${args.cycleNumber}`,
  );

  const candidateTemplates = seededTemplates.length > 0
    ? seededTemplates
    : sortBySeed(
        PROMPT_TEMPLATES.filter((template) => template.groups.includes(relationshipGroup)),
        `${args.member._id}:${args.child.childId ?? "first"}:${args.cycleNumber}:fallback`,
      );

  for (const template of candidateTemplates) {
    if (args.siblingTemplateKeys.includes(template.key)) continue;
    const text = template.render(context);
    if (args.priorPromptTexts.includes(text)) continue;
    return {
      templateKey: template.key,
      promptText: text,
      promptCategory: template.category,
      promptUnlocksAtAge: anchor.unlocksAtAge,
      promptUnlocksAtEvent: anchor.unlocksAtEvent,
    };
  }

  const fallback = candidateTemplates[0] ?? PROMPT_TEMPLATES[0];
  return {
    templateKey: `${fallback.key}:fallback`,
    promptText: `${fallback.render(context)} Focus on what feels true this month.`,
    promptCategory: fallback.category,
    promptUnlocksAtAge: anchor.unlocksAtAge,
    promptUnlocksAtEvent: anchor.unlocksAtEvent,
  };
}

async function sendPromptEmail(args: {
  email: string;
  memberName: string;
  relationshipKey?: string;
  childName: string;
  parentEmail?: string;
  promptText: string;
  promptCategory: string;
  promptUnlocksAtAge?: number;
  promptUnlocksAtEvent?: string;
  token: string;
  skipUrl: string;
}) {
  const resendKey = process.env.RESEND_API_KEY ?? process.env.RESEND_FULL_API_KEY;
  if (!resendKey) {
    console.error("[ourfable-prompts] No Resend API key configured");
    return false;
  }

  const childFirst = args.childName.split(" ")[0];
  const memberFirst = args.memberName.split(" ")[0];
  const submitUrl = `${getOurFableUrl()}/respond/${args.token}`;
  const unlockLine = args.promptUnlocksAtEvent
    ? `${childFirst} will open this on ${args.promptUnlocksAtEvent}.`
    : args.promptUnlocksAtAge
    ? `${childFirst} will open this when they turn ${args.promptUnlocksAtAge}.`
    : `Sealed for ${childFirst}'s future self.`;
  const mediaNote =
    args.promptCategory === "photo" ? "A single photo with a caption is enough."
    : args.promptCategory === "voice" ? "A short voice memo is perfect."
    : args.promptCategory === "video" ? "A brief video is perfect."
    : "Write, record, or send a photo if that serves the memory better.";

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;padding:48px 24px;background:#F5F2ED;">
  <div style="text-align:center;padding-bottom:24px;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#4A5E4C;letter-spacing:-0.01em;">Our Fable</div>
    <div style="width:32px;height:1.5px;background:#C8A87A;margin:10px auto 0;"></div>
  </div>
  <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
    <div style="background:#4A5E4C;height:3px;"></div>
    <div style="padding:40px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Monthly Prompt</p>
      <h2 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1A1A18;line-height:1.25;">${childFirst} has a question for you, ${memberFirst}</h2>
      <div style="background:#F8F5F0;border:1px solid #E0DDD7;border-radius:12px;padding:24px;margin:0 0 20px;">
        <p style="margin:0;font-family:Georgia,serif;font-size:18px;color:#1A1A1A;line-height:1.6;font-style:italic;">"${args.promptText}"</p>
      </div>
      <p style="margin:0 0 10px;font-size:15px;color:#4A4A4A;line-height:1.7;">Every answer becomes part of ${childFirst}'s future vault. ${mediaNote}</p>
      <p style="margin:0 0 24px;font-size:13px;color:#8A8880;line-height:1.7;font-style:italic;">${unlockLine}</p>
      <a href="${submitUrl}" style="display:inline-block;padding:13px 28px;background:#4A5E4C;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px;">Answer now</a>
      <p style="margin:20px 0 0;"><a href="${args.skipUrl}" style="font-size:12px;color:#9A9590;text-decoration:none;">Skip this month</a></p>
      <div style="margin-top:24px;background:#F8F5F0;border:1px solid #E0DDD7;border-radius:16px;padding:20px 22px;">
        <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">For your own family</p>
        <p style="margin:0 0 16px;font-size:14px;color:#6B6860;line-height:1.75;">If answering for ${childFirst} makes you wish you had a private place like this for your own child, you can reserve a vault for your family too.</p>
        <a href="${getOurFableUrl()}/reserve" style="display:inline-block;padding:12px 20px;background:#FFFFFF;color:#4A5E4C;border-radius:999px;text-decoration:none;font-weight:600;font-size:13px;border:1px solid #D8D2C7;">Reserve your family's spot</a>
      </div>
    </div>
  </div>
</div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Our Fable <hello@ourfable.ai>",
      to: args.email,
      subject: `${childFirst} has a question for you`,
      html,
      reply_to: args.parentEmail ?? "hello@ourfable.ai",
      tags: [
        { name: "monthly_prompt", value: "true" },
        { name: "relationship", value: args.relationshipKey ?? "unknown" },
      ],
    }),
  });

  if (!response.ok) {
    console.error("[ourfable-prompts] Failed to send prompt email", await response.text());
    return false;
  }

  return true;
}

export const kickoffMemberChain = internalMutation({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    familyId: v.string(),
    delayDays: v.optional(v.number()),
  },
  handler: async (ctx, { memberId, familyId }) => {
    await ctx.scheduler.runAfter(0, internal.ourfablePrompts.ensureMemberPromptChains, {
      memberId,
      familyId,
    });
  },
});

export const ensureMemberPromptChains = internalAction({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    familyId: v.string(),
  },
  handler: async (ctx, { memberId, familyId }) => {
    const context = await ctx.runQuery(internal.ourfablePrompts.getMemberPromptingContext, {
      memberId,
      familyId,
    });
    if (!context) return;

    const { member, family, children, deliveryMilestones, promptHistory } = context;
    const intervalDays = getPromptIntervalDays(member.promptFrequency);
    if (!intervalDays) return;

    const anchorMs = getAnchorDate(member);
    for (const child of children) {
      const childHistory = promptHistory.filter((entry) =>
        (entry.childId ?? undefined) === (child.childId ?? undefined) || (!entry.childId && !child.childId)
      );
      const pending = childHistory.find((entry) => entry.status === "pending" && entry.cycleNumber !== undefined);
      if (pending) continue;

      const highestRecordedCycle = childHistory.reduce((max, entry) => Math.max(max, entry.cycleNumber ?? -1), -1);
      const cycleNumber = highestRecordedCycle + 1;
      const siblingTemplateKeys = promptHistory
        .filter((entry) => entry.cycleNumber === cycleNumber && (entry.childId ?? undefined) !== (child.childId ?? undefined))
        .map((entry) => entry.templateKey)
        .filter((value): value is string => Boolean(value));
      const priorPromptTexts = childHistory.map((entry) => entry.promptText);
      const prompt = buildPromptForCycle({
        member,
        family,
        child,
        cycleNumber,
        priorPromptTexts,
        siblingTemplateKeys,
        deliveryMilestones,
      });

      await ctx.runMutation(internal.ourfablePrompts.createPendingPrompt, {
        familyId,
        memberId,
        childId: child.childId,
        cycleNumber,
        promptSequence: cycleNumber,
        templateKey: prompt.templateKey,
        promptText: prompt.promptText,
        promptCategory: prompt.promptCategory,
        promptUnlocksAtAge: prompt.promptUnlocksAtAge,
        promptUnlocksAtEvent: prompt.promptUnlocksAtEvent,
        scheduledFor: isoDate(getDueAt(anchorMs, intervalDays, child.childIndex, cycleNumber)),
        responseWindowEndsAt: getResponseWindowEndsAt(anchorMs, intervalDays, child.childIndex, cycleNumber),
      });
    }
  },
});

export const processDueMonthlyPrompts = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    await ctx.runMutation(internal.ourfablePrompts.expirePromptBatch, {
      now,
    });

    const duePrompts = await ctx.runQuery(internal.ourfablePrompts.getDuePrompts, {
      asOfDate: isoDate(now),
    });

    for (const prompt of duePrompts) {
      const deliveryContext = await ctx.runQuery(internal.ourfablePrompts.getPromptDeliveryContext, {
        promptId: prompt._id,
      });
      if (!deliveryContext) {
        await ctx.runMutation(internal.ourfablePrompts.markPromptStatus, {
          promptId: prompt._id,
          status: "skipped",
        });
        await ctx.scheduler.runAfter(0, internal.ourfablePrompts.ensureMemberPromptChains, {
          familyId: prompt.familyId,
          memberId: prompt.memberId,
        });
        continue;
      }

      const { member, child } = deliveryContext;
      const sent = member.email
        ? await sendPromptEmail({
            email: member.email,
            memberName: member.name,
            relationshipKey: member.relationshipKey,
            childName: child.childName,
            parentEmail: family.email,
            promptText: prompt.promptText,
            promptCategory: prompt.promptCategory,
            promptUnlocksAtAge: prompt.promptUnlocksAtAge,
            promptUnlocksAtEvent: prompt.promptUnlocksAtEvent,
            token: prompt.submissionToken ?? generateToken(),
            skipUrl: `${getOurFableUrl()}/api/ourfable/skip-prompt?token=${encodeURIComponent(prompt.submissionToken ?? "")}`,
          })
        : false;

      await ctx.runMutation(internal.ourfablePrompts.markPromptStatus, {
        promptId: prompt._id,
        status: sent ? "sent" : "skipped",
      });

      await ctx.runMutation(internal.ourfable.createOurFableDispatchForChild, {
        familyId: prompt.familyId,
        childId: prompt.childId,
        type: "monthly_prompt",
        content: prompt.promptText,
        sentTo: sent ? member.email ?? member.name : `skipped:${member.name}`,
      });

      await ctx.scheduler.runAfter(0, internal.ourfablePrompts.ensureMemberPromptChains, {
        familyId: prompt.familyId,
        memberId: prompt.memberId,
      });
    }
  },
});

export const backfillExistingPromptChains = internalAction({
  args: {},
  handler: async (ctx) => {
    const families = await ctx.runQuery(internal.ourfable.listActiveOurFableFamilies, {});
    for (const family of families) {
      const members = await ctx.runQuery(internal.ourfable.listCircle, {
        familyId: family.familyId,
      });
      for (const member of members) {
        await ctx.scheduler.runAfter(0, internal.ourfablePrompts.ensureMemberPromptChains, {
          familyId: family.familyId,
          memberId: member._id,
        });
      }
    }
  },
});

export const getMemberPromptingContext = internalQuery({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    familyId: v.string(),
  },
  handler: async (ctx, { memberId, familyId }) => {
    const member = await ctx.db.get(memberId);
    if (!member || member.familyId !== familyId) return null;

    const family = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .first();
    if (!family) return null;

    const children = await ctx.db
      .query("ourfable_children")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
    const activeChildren = children
      .filter((child) => child.isActive)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((child, index) => ({
        childId: child.childId,
        childName: child.childName,
        childDob: child.childDob,
        childIndex: index,
      }));
    const childTargets: ChildTarget[] = activeChildren.length > 0
      ? activeChildren
      : [{ childId: undefined, childName: family.childName, childDob: family.childDob, childIndex: 0 }];

    const promptHistory = await ctx.db
      .query("ourfable_vault_prompt_queue")
      .withIndex("by_memberId", (q) => q.eq("memberId", memberId))
      .collect();

    const deliveryMilestones = await ctx.db
      .query("ourfable_delivery_milestones")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();

    return {
      member,
      family,
      children: childTargets,
      promptHistory,
      deliveryMilestones,
    };
  },
});

export const createPendingPrompt = internalMutation({
  args: {
    familyId: v.string(),
    memberId: v.id("ourfable_vault_circle"),
    childId: v.optional(v.string()),
    cycleNumber: v.number(),
    promptSequence: v.number(),
    templateKey: v.string(),
    promptText: v.string(),
    promptCategory: v.string(),
    promptUnlocksAtAge: v.optional(v.number()),
    promptUnlocksAtEvent: v.optional(v.string()),
    scheduledFor: v.string(),
    responseWindowEndsAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ourfable_vault_prompt_queue")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();
    const duplicate = existing.find((entry) =>
      (entry.childId ?? undefined) === (args.childId ?? undefined) &&
      (entry.cycleNumber ?? -1) === args.cycleNumber
    );
    if (duplicate) return duplicate._id;

    return await ctx.db.insert("ourfable_vault_prompt_queue", {
      familyId: args.familyId,
      memberId: args.memberId,
      childId: args.childId,
      templateKey: args.templateKey,
      promptText: args.promptText,
      promptCategory: args.promptCategory,
      promptUnlocksAtAge: args.promptUnlocksAtAge,
      promptUnlocksAtEvent: args.promptUnlocksAtEvent,
      cycleNumber: args.cycleNumber,
      promptSequence: args.promptSequence,
      scheduledFor: args.scheduledFor,
      responseWindowEndsAt: args.responseWindowEndsAt,
      status: "pending",
      submissionToken: generateToken(),
    });
  },
});

export const getDuePrompts = internalQuery({
  args: { asOfDate: v.string() },
  handler: async (ctx, { asOfDate }) => {
    const pending = await ctx.db
      .query("ourfable_vault_prompt_queue")
      .withIndex("by_status_scheduledFor", (q) => q.eq("status", "pending"))
      .filter((q) => q.lte(q.field("scheduledFor"), asOfDate))
      .collect();
    return pending.filter((prompt) => prompt.cycleNumber !== undefined);
  },
});

export const expirePromptBatch = internalMutation({
  args: { now: v.number() },
  handler: async (ctx, { now }) => {
    const expiredPromptIds = new Set<string>();
    const memberCache = new Map<string, {
      joinedAt?: number;
      acceptedAt?: number;
      _creationTime: number;
      promptFrequency?: string;
    } | null>();
    const childIndexCache = new Map<string, number>();

    for (const status of ["pending", "sent"] as const) {
      const stalePrompts = await ctx.db
        .query("ourfable_vault_prompt_queue")
        .withIndex("by_status_responseWindowEndsAt", (q) => q.eq("status", status))
        .filter((q) => q.lte(q.field("responseWindowEndsAt"), now))
        .collect();

      for (const prompt of stalePrompts) {
        if (prompt.responseWindowEndsAt === undefined) continue;
        await ctx.db.patch(prompt._id, { status: "expired" });
        expiredPromptIds.add(String(prompt._id));
        await ctx.scheduler.runAfter(0, internal.ourfablePrompts.ensureMemberPromptChains, {
          familyId: prompt.familyId,
          memberId: prompt.memberId,
        });
      }
    }

    // Clean up any open legacy prompt rows that predate responseWindowEndsAt.
    const asOfDate = isoDate(now);
    for (const status of ["pending", "sent"] as const) {
      const legacyOpenPrompts = await ctx.db
        .query("ourfable_vault_prompt_queue")
        .withIndex("by_status_scheduledFor", (q) => q.eq("status", status))
        .filter((q) => q.lte(q.field("scheduledFor"), asOfDate))
        .collect();
      for (const prompt of legacyOpenPrompts) {
        if (prompt.responseWindowEndsAt !== undefined) continue;
        if (prompt.cycleNumber === undefined) continue;

        const memberCacheKey = String(prompt.memberId);
        if (!memberCache.has(memberCacheKey)) {
          const member = await ctx.db.get(prompt.memberId);
          memberCache.set(memberCacheKey, member);
        }
        const member = memberCache.get(memberCacheKey);
        if (!member) continue;

        const intervalDays = getPromptIntervalDays(member.promptFrequency);
        if (!intervalDays) continue;

        const childIndexKey = `${prompt.familyId}:${prompt.childId ?? "first"}`;
        if (!childIndexCache.has(childIndexKey)) {
          if (!prompt.childId) {
            childIndexCache.set(childIndexKey, 0);
          } else {
            const children = await ctx.db
              .query("ourfable_children")
              .withIndex("by_familyId", (q) => q.eq("familyId", prompt.familyId))
              .collect();
            const activeChildren = children
              .filter((child) => child.isActive)
              .sort((a, b) => a.createdAt - b.createdAt);
            const childIndex = activeChildren.findIndex((child) => child.childId === prompt.childId);
            childIndexCache.set(childIndexKey, childIndex >= 0 ? childIndex : 0);
          }
        }
        const childIndex = childIndexCache.get(childIndexKey) ?? 0;
        const responseWindowEndsAt = getResponseWindowEndsAt(
          getAnchorDate(member),
          intervalDays,
          childIndex,
          prompt.cycleNumber,
        );

        await ctx.db.patch(prompt._id, {
          responseWindowEndsAt,
          ...(responseWindowEndsAt <= now ? { status: "expired" as const } : {}),
        });
        if (responseWindowEndsAt <= now) {
          expiredPromptIds.add(String(prompt._id));
          await ctx.scheduler.runAfter(0, internal.ourfablePrompts.ensureMemberPromptChains, {
            familyId: prompt.familyId,
            memberId: prompt.memberId,
          });
        }
      }
    }

    return { expiredCount: expiredPromptIds.size };
  },
});

export const getPromptDeliveryContext = internalQuery({
  args: { promptId: v.id("ourfable_vault_prompt_queue") },
  handler: async (ctx, { promptId }) => {
    const prompt = await ctx.db.get(promptId);
    if (!prompt) return null;

    const member = await ctx.db.get(prompt.memberId);
    if (!member) return null;

    const family = await ctx.db
      .query("ourfable_vault_families")
      .withIndex("by_familyId", (q) => q.eq("familyId", prompt.familyId))
      .first();
    if (!family) return null;

    if (prompt.childId) {
      const child = await ctx.db
        .query("ourfable_children")
        .withIndex("by_childId", (q) => q.eq("childId", prompt.childId!))
        .first();
      if (child) return { prompt, member, family, child };
    }

    return {
      prompt,
      member,
      family,
      child: {
        childId: undefined,
        childName: family.childName,
        childDob: family.childDob,
      },
    };
  },
});

export const markPromptStatus = internalMutation({
  args: {
    promptId: v.id("ourfable_vault_prompt_queue"),
    status: v.union(v.literal("sent"), v.literal("skipped"), v.literal("responded"), v.literal("expired")),
  },
  handler: async (ctx, { promptId, status }) => {
    const patch: {
      status: "sent" | "skipped" | "responded" | "expired";
      sentAt?: number;
    } = {
      status,
    };
    if (status === "sent") patch.sentAt = Date.now();
    await ctx.db.patch(promptId, patch);
  },
});

export const skipPromptByToken = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const prompt = await ctx.db
      .query("ourfable_vault_prompt_queue")
      .withIndex("by_submissionToken", (q) => q.eq("submissionToken", token))
      .first();
    if (!prompt || prompt.status !== "sent") return null;

    await ctx.db.patch(prompt._id, { status: "skipped" });
    await ctx.scheduler.runAfter(0, internal.ourfablePrompts.ensureMemberPromptChains, {
      familyId: prompt.familyId,
      memberId: prompt.memberId,
    });

    return {
      promptId: prompt._id,
      familyId: prompt.familyId,
      memberId: prompt.memberId,
      childId: prompt.childId,
    };
  },
});

export const recordPromptSend = internalMutation({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    familyId: v.string(),
    promptIndex: v.number(),
    promptText: v.string(),
    promptCategory: v.string(),
    promptUnlocksAtAge: v.optional(v.number()),
    promptUnlocksAtEvent: v.optional(v.string()),
    emailSent: v.boolean(),
    sentAt: v.number(),
    submissionToken: v.optional(v.string()),
    childId: v.optional(v.string()),
    templateKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = args.submissionToken || generateToken();
    await ctx.db.insert("ourfable_vault_prompt_queue", {
      familyId: args.familyId,
      memberId: args.memberId,
      childId: args.childId,
      templateKey: args.templateKey,
      promptText: args.promptText,
      promptCategory: args.promptCategory,
      promptUnlocksAtAge: args.promptUnlocksAtAge,
      promptUnlocksAtEvent: args.promptUnlocksAtEvent,
      cycleNumber: args.promptIndex,
      promptSequence: args.promptIndex,
      scheduledFor: new Date(args.sentAt).toISOString().slice(0, 10),
      status: args.emailSent ? "sent" : "skipped",
      sentAt: args.sentAt,
      submissionToken: token,
    });
    return token;
  },
});

export const getMemberHistory = internalQuery({
  args: { memberId: v.id("ourfable_vault_circle") },
  handler: async (ctx, { memberId }) => {
    return await ctx.db
      .query("ourfable_vault_prompt_queue")
      .withIndex("by_memberId", (q) => q.eq("memberId", memberId))
      .order("desc")
      .take(24);
  },
});

export const addMemberAndStart = internalMutation({
  args: {
    familyId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    relationshipKey: v.string(),
    delayDays: v.optional(v.number()),
  },
  handler: async (ctx, { familyId, name, email, relationshipKey }) => {
    const memberId = await ctx.db.insert("ourfable_vault_circle", {
      familyId,
      name,
      email,
      relationshipKey,
      relationship: relationshipKey,
      inviteToken: generateToken(),
      shareToken: generateToken(),
      hasAccepted: false,
      joinedAt: Date.now(),
      contributionCount: 0,
    });
    await ctx.scheduler.runAfter(0, internal.ourfablePrompts.ensureMemberPromptChains, {
      familyId,
      memberId,
    });
    return memberId;
  },
});

export const firePromptNow = internalMutation({
  args: {
    memberId: v.id("ourfable_vault_circle"),
    familyId: v.string(),
    promptIndex: v.optional(v.number()),
  },
  handler: async (ctx, { memberId, familyId }) => {
    await ctx.scheduler.runAfter(0, internal.ourfablePrompts.ensureMemberPromptChains, {
      memberId,
      familyId,
    });
    return { fired: true };
  },
});

export const setTestMode = internalMutation({
  args: {
    familyId: v.string(),
    intervalMinutes: v.optional(v.number()),
  },
  handler: async () => {
    return { testMode: false, note: "Monthly prompt chains now follow real cadence only." };
  },
});
