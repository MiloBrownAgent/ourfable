// lib/question-gen.ts
// AI question generation for OurFable family contributors
// Uses Replicate (meta-llama-3.1-405b-instruct) via the same pattern as story-gen.ts

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

function getToken(): string {
  const token = REPLICATE_API_TOKEN?.trim();
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set");
  return token;
}

export type ContributorRole =
  | "grandparent"
  | "godparent"
  | "uncle"
  | "aunt"
  | "old_friend"
  | "neighbor"
  | "mentor"
  | "family_friend";

const ROLE_CONTEXT: Record<ContributorRole, string> = {
  grandparent:
    "You are a grandparent of this child. You have a lifetime of wisdom, memories from your own childhood, and early memories of this child's parent. Your answers are treasured heirlooms.",
  godparent:
    "You are a godparent of this child. You carry a special responsibility for their spiritual and moral development. Your answers carry the weight of what you hope they become.",
  uncle:
    "You are an uncle to this child. You bring fun, adventure, family lore, and a sibling's perspective on their parent. Your answers are stories worth telling.",
  aunt: "You are an aunt to this child. You bring warmth, inside knowledge of the family, and a sibling's perspective on their parent. Your answers are stories worth telling.",
  old_friend:
    "You are a lifelong friend of this child's parent. You knew them before they became a parent — in college, in youth, in formative years. Your answers reveal who their parent really is.",
  neighbor:
    "You are a neighbor and community member who has watched this family grow. Your answers capture the village that raised this child.",
  mentor:
    "You are a mentor to this child's parent — a professional, coach, or guide who shaped their character. Your answers carry earned wisdom.",
  family_friend:
    "You are a close family friend who has been woven into this child's life from the beginning. Your answers capture community, belonging, and love beyond bloodlines.",
};

const ROLE_ANGLE: Record<ContributorRole, string> = {
  grandparent: "life wisdom, memories of your own childhood, early memories of this child's parent",
  godparent: "spiritual guidance, moral values you hope to pass on, your hopes for this child's character",
  uncle: "funny family stories, adventures with the parent, family lore and traditions",
  aunt: "warmth, family stories, the sibling relationship with the parent, family traditions",
  old_friend: "friendship lessons, how you met the parent, formative shared experiences, who the parent really is",
  neighbor: "community memories, moments you witnessed from the outside, what makes this family special",
  mentor: "professional wisdom, defining moments in the parent's growth, lessons learned the hard way",
  family_friend: "community, belonging, how the child fits into a wider circle of love",
};

export async function generateQuestionForRole(
  role: ContributorRole,
  childName: string,
  month: string, // "2026-03"
  previousQuestions: string[]
): Promise<string> {
  const token = getToken();

  const roleContext = ROLE_CONTEXT[role];
  const roleAngle = ROLE_ANGLE[role];

  const previousSection =
    previousQuestions.length > 0
      ? `\n\nPrevious questions already asked (do NOT repeat these topics or angles):\n${previousQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")}`
      : "";

  const prompt = `You are helping create a time capsule of family stories for a child named ${childName}.

${roleContext}

Your task: Write one warm, open-ended question that will be emailed to this person this month (${month}). They will answer it and their response will be stored in a private vault — ${childName} will read it when they are older.

The question should draw on: ${roleAngle}

Rules:
- One sentence only, ending with a question mark
- Warm, personal, specific to this relationship role
- Open-ended (not yes/no)
- Should prompt a meaningful story or memory, not a generic answer
- No generic openers like "What is your favorite memory?" — be more specific and evocative
- Never start with "What is your favorite"
- The question should feel like it could only come from someone in this exact relationship${previousSection}

Output ONLY the question text. No preamble, no explanation, no quotes. Just the question.`;

  const response = await fetch(
    "https://api.replicate.com/v1/models/meta/meta-llama-3.1-405b-instruct/predictions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Prefer: "wait=120",
      },
      body: JSON.stringify({
        input: {
          prompt,
          max_tokens: 200,
          temperature: 0.85,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("[QuestionGen] API error:", response.status, data);
    throw new Error(`Question generation failed: ${data?.detail || response.statusText}`);
  }

  let raw = "";

  if (data.status === "succeeded" && data.output) {
    if (Array.isArray(data.output)) {
      raw = data.output.join("").trim();
    } else if (typeof data.output === "string") {
      raw = data.output.trim();
    }
  } else if (data.status === "processing" || data.status === "starting") {
    const getUrl = data.urls?.get;
    if (!getUrl) throw new Error("No polling URL from Replicate");

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pollData = await pollRes.json();

      if (pollData.status === "succeeded" && pollData.output) {
        if (Array.isArray(pollData.output)) {
          raw = pollData.output.join("").trim();
          break;
        }
        if (typeof pollData.output === "string") {
          raw = pollData.output.trim();
          break;
        }
      }
      if (pollData.status === "failed" || pollData.status === "canceled") {
        throw new Error(`Question generation failed: ${pollData.error}`);
      }
    }
    if (!raw) throw new Error("Question generation timed out");
  } else {
    throw new Error(`Unexpected Replicate response: ${JSON.stringify(data)}`);
  }

  // Clean up: strip surrounding quotes if present, take only the first line
  raw = raw.replace(/^["']|["']$/g, "").split("\n")[0].trim();

  // Ensure ends with ?
  if (!raw.endsWith("?")) raw += "?";

  return raw;
}
