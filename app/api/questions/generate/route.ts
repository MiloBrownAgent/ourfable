// app/api/questions/generate/route.ts
// Generate a monthly question for a contributor.
// Service-role only — not called by the client directly.
//
// POST /api/questions/generate
// Headers: Authorization: Bearer ${CRON_SECRET}
// Body: { contributor_id: string }
//
// Returns: { campaign_id: string, question_text: string }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { generateQuestionForRole, ContributorRole } from "@/lib/question-gen";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

const BodySchema = z.object({
  contributor_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body", details: err }, { status: 400 });
  }

  const { contributor_id } = body;

  // Load contributor
  const { data: contributor, error: cErr } = await supabaseAdmin
    .from("family_contributors")
    .select("id, name, email, relationship_role, child_name, active")
    .eq("id", contributor_id)
    .single();

  if (cErr || !contributor) {
    return NextResponse.json({ error: "Contributor not found" }, { status: 404 });
  }

  if (!contributor.active) {
    return NextResponse.json({ error: "Contributor is inactive" }, { status: 400 });
  }

  // Current month key e.g. "2026-03"
  const now = new Date();
  const questionMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Check no campaign already exists this month
  const { data: existing } = await supabaseAdmin
    .from("question_campaigns")
    .select("id, status")
    .eq("contributor_id", contributor_id)
    .eq("question_month", questionMonth)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Campaign already exists for this contributor this month", campaign_id: existing.id },
      { status: 409 }
    );
  }

  // Load previous questions to avoid repeats (last 24 months)
  const { data: previousCampaigns } = await supabaseAdmin
    .from("question_campaigns")
    .select("question_text")
    .eq("contributor_id", contributor_id)
    .order("created_at", { ascending: false })
    .limit(24);

  const previousQuestions = (previousCampaigns ?? []).map((c) => c.question_text);

  // Generate question
  let questionText: string;
  try {
    questionText = await generateQuestionForRole(
      contributor.relationship_role as ContributorRole,
      contributor.child_name,
      questionMonth,
      previousQuestions
    );
  } catch (err) {
    console.error("[questions/generate] LLM error:", err);
    return NextResponse.json({ error: "Question generation failed" }, { status: 500 });
  }

  // Insert campaign
  const { data: campaign, error: insertErr } = await supabaseAdmin
    .from("question_campaigns")
    .insert({
      contributor_id,
      question_text: questionText,
      question_month: questionMonth,
      status: "pending",
    })
    .select("id, question_text")
    .single();

  if (insertErr || !campaign) {
    console.error("[questions/generate] Insert error:", insertErr);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }

  return NextResponse.json({
    campaign_id: campaign.id,
    question_text: campaign.question_text,
  });
}
