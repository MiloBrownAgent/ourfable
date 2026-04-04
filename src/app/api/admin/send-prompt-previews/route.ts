import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;
const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY;
const BASE_URL = process.env.OURFABLE_BASE_URL ?? "https://ourfable.ai";

type PromptCategory = "letter" | "photo" | "voice" | "video" | "any";

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
  category: PromptCategory;
  explicitAnchor: boolean;
  render: (context: PromptContext) => string;
};

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
  const bank = months < 12 ? infantDetails : months < 36 ? toddlerDetails : months < 120 ? childDetails : olderDetails;
  return bank[cycleNumber % bank.length];
}

function hashSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash;
}

function sortBySeed<T extends { key: string }>(items: T[], seed: string) {
  return [...items].sort((a, b) => hashSeed(`${seed}:${a.key}`) - hashSeed(`${seed}:${b.key}`));
}

function buildUnlockAnchor(childDob: string, cycleNumber: number) {
  const currentYears = getAgeMonths(childDob) / 12;
  const ages = [8, 13, 16, 18];
  const futureAges = ages.filter((age) => age > currentYears);
  const anchorAge = (futureAges.length > 0 ? futureAges : ages)[cycleNumber % (futureAges.length > 0 ? futureAges.length : ages.length)];
  return {
    unlocksAtAge: anchorAge,
    unlocksAtEvent: undefined,
    explicitAnchor: `${anchorAge}th birthday`,
    subtleAnchor: `the older version of them who can hold a ${anchorAge}-year-old truth`,
    gentleFutureCue: `when they are ${anchorAge}`,
  };
}

const GRANDPARENT_TEMPLATES: PromptTemplate[] = [
  {
    key: "gp-explicit-house",
    category: "letter",
    explicitAnchor: true,
    render: ({ childFirst, explicitAnchor }) =>
      `What from your own childhood do you want ${childFirst} to carry with them when they read this on their ${explicitAnchor}? Tell the story only a grandparent would think to preserve.`,
  },
  {
    key: "gp-explicit-voice",
    category: "voice",
    explicitAnchor: true,
    render: ({ childFirst, explicitAnchor }) =>
      `Record yourself telling ${childFirst} the family story you would most want in their hands on their ${explicitAnchor}. Say it the way you would across a kitchen table.`,
  },
  {
    key: "gp-subtle-lineage",
    category: "letter",
    explicitAnchor: false,
    render: ({ childFirst, childAgeLabel, ageDetail, subtleAnchor }) =>
      `${childFirst} is ${childAgeLabel}, and ${ageDetail}. What do you see in them already that makes you think of your side of the family, especially for ${subtleAnchor}?`,
  },
  {
    key: "gp-subtle-photo",
    category: "photo",
    explicitAnchor: false,
    render: ({ childFirst, gentleFutureCue }) =>
      `Send one old family photo that ${childFirst} should have someday, then write the story behind it the way you would want them to hear it ${gentleFutureCue}.`,
  },
];

function buildGrandparentPrompt(childName: string, childDob: string, parentNames: string, cycleNumber: number) {
  const childFirst = childName.split(" ")[0];
  const anchor = buildUnlockAnchor(childDob, cycleNumber);
  const context: PromptContext = {
    childFirst,
    childAgeLabel: getAgeLabel(childDob),
    ageDetail: getAgeDetail(childDob, cycleNumber),
    parentNames,
    explicitAnchor: anchor.explicitAnchor,
    subtleAnchor: anchor.subtleAnchor,
    gentleFutureCue: anchor.gentleFutureCue,
  };
  const template = sortBySeed(GRANDPARENT_TEMPLATES, `grandfather:${childFirst}:${cycleNumber}`)[cycleNumber % GRANDPARENT_TEMPLATES.length];
  return {
    text: template.render(context),
    category: template.category,
    unlocksAtAge: template.explicitAnchor ? anchor.unlocksAtAge : undefined,
    unlocksAtEvent: template.explicitAnchor ? anchor.unlocksAtEvent : undefined,
  };
}

function esc(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

async function sendPreviewEmail(args: {
  to: string;
  replyTo: string;
  childName: string;
  memberName: string;
  promptText: string;
  promptCategory: PromptCategory;
  promptUnlocksAtAge?: number;
  promptUnlocksAtEvent?: string;
  index: number;
  total: number;
}) {
  const childFirst = args.childName.split(" ")[0];
  const submitUrl = `${BASE_URL}/respond/preview-${index + 1}`;
  const skipUrl = `${BASE_URL}/api/ourfable/skip-prompt?token=preview-${index + 1}`;
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
      <h2 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1A1A18;line-height:1.25;">${childFirst} has a question for you, ${args.memberName.split(" ")[0]}</h2>
      <div style="background:#F8F5F0;border:1px solid #E0DDD7;border-radius:12px;padding:24px;margin:0 0 20px;">
        <p style="margin:0;font-family:Georgia,serif;font-size:18px;color:#1A1A1A;line-height:1.6;font-style:italic;">"${esc(args.promptText)}"</p>
      </div>
      <p style="margin:0 0 10px;font-size:15px;color:#4A4A4A;line-height:1.7;">Every answer becomes part of ${childFirst}'s future vault. ${mediaNote}</p>
      <p style="margin:0 0 24px;font-size:13px;color:#8A8880;line-height:1.7;font-style:italic;">${unlockLine}</p>
      <a href="${submitUrl}" style="display:inline-block;padding:13px 28px;background:#4A5E4C;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px;">Answer now</a>
      <p style="margin:20px 0 0;"><a href="${skipUrl}" style="font-size:12px;color:#9A9590;text-decoration:none;">Skip this month</a></p>
      <div style="margin-top:24px;background:#F8F5F0;border:1px solid #E0DDD7;border-radius:16px;padding:20px 22px;">
        <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">For your own family</p>
        <p style="margin:0 0 16px;font-size:14px;color:#6B6860;line-height:1.75;">If this makes you wish you had a private place like this for your own child, you can start one too.</p>
        <a href="${BASE_URL}/for-your-family" style="display:inline-block;padding:12px 20px;background:#FFFFFF;color:#4A5E4C;border-radius:999px;text-decoration:none;font-weight:600;font-size:13px;border:1px solid #D8D2C7;">Start your family's vault</a>
      </div>
      <p style="margin:18px 0 0;font-size:11px;color:#A09890;">Preview ${args.index + 1} of ${args.total}</p>
    </div>
  </div>
</div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Our Fable <hello@ourfable.ai>",
      to: args.to,
      subject: `${childFirst} has a question for you — Preview ${args.index + 1} of ${args.total}`,
      html,
      reply_to: args.replyTo,
      tags: [
        { name: "monthly_prompt_preview", value: "true" },
        { name: "relationship", value: "grandfather" },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend failed: ${response.status} ${text}`);
  }
  return response.json();
}

export async function POST(req: NextRequest) {
  if ((!ADMIN_SECRET && !CRON_SECRET) || !RESEND_API_KEY) {
    return NextResponse.json({ error: "Admin preview route not configured" }, { status: 503 });
  }

  const authHeader = req.headers.get("x-admin-secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const candidates = [ADMIN_SECRET, CRON_SECRET].filter((value): value is string => Boolean(value));
  const authorized = candidates.some((candidate) => {
    const secretBuf = Buffer.from(candidate);
    const headerBuf = Buffer.from(authHeader);
    return secretBuf.length === headerBuf.length && crypto.timingSafeEqual(secretBuf, headerBuf);
  });
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    to,
    childName,
    childDob,
    parentNames,
    memberName = "Dave",
    count = 10,
    replyTo,
  } = body as {
    to: string;
    childName: string;
    childDob: string;
    parentNames: string;
    memberName?: string;
    count?: number;
    replyTo?: string;
  };

  const total = Math.min(12, Math.max(1, count));
  const sent = [];
  try {
    for (let i = 0; i < total; i++) {
      const prompt = buildGrandparentPrompt(childName, childDob, parentNames, i);
      const result = await sendPreviewEmail({
        to,
        replyTo: replyTo ?? to,
        childName,
        memberName,
        promptText: prompt.text,
        promptCategory: prompt.category,
        promptUnlocksAtAge: prompt.unlocksAtAge,
        promptUnlocksAtEvent: prompt.unlocksAtEvent,
        index: i,
        total,
      });
      sent.push({ index: i + 1, prompt: prompt.text, result });
    }
    return NextResponse.json({ success: true, sent: sent.length, prompts: sent.map((item) => item.prompt) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to send previews", sent: sent.length }, { status: 500 });
  }
}
