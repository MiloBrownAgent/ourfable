// app/api/questions/respond/route.ts
// Public token-gated endpoint for submitting responses and pre-fetching question data.
//
// GET /api/questions/respond?token=<token>
//   Returns question_text, contributor_name, child_name for the response page.
//
// POST /api/questions/respond
//   Body: { token: string, response_text: string }
//   Stores the response and sends a thank-you email.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { z } from "zod";
import ThankYouEmail from "@/emails/ThankYouEmail";
import React from "react";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

// ── GET — prefetch question data for the respond page ──────────────────────
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const { data: campaign, error } = await supabaseAdmin
    .from("question_campaigns")
    .select(`
      id,
      question_text,
      status,
      family_contributors (
        name,
        child_name
      )
    `)
    .eq("response_token", token)
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  if (campaign.status === "responded") {
    return NextResponse.json({ error: "Already answered" }, { status: 409 });
  }

  if (campaign.status === "expired") {
    return NextResponse.json({ error: "This question has expired" }, { status: 410 });
  }

  const contributor = Array.isArray(campaign.family_contributors)
    ? campaign.family_contributors[0]
    : campaign.family_contributors;

  return NextResponse.json({
    question_text: campaign.question_text,
    contributor_name: contributor?.name ?? "Friend",
    child_name: contributor?.child_name ?? "your child",
    status: campaign.status,
  });
}

// ── POST — submit a response ───────────────────────────────────────────────
const PostSchema = z.object({
  token: z.string().min(1),
  response_text: z.string().min(1).max(10000),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof PostSchema>;
  try {
    body = PostSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body", details: err }, { status: 400 });
  }

  const { token, response_text } = body;

  // Load campaign by response token
  const { data: campaign, error: cErr } = await supabaseAdmin
    .from("question_campaigns")
    .select(`
      id,
      status,
      contributor_id,
      family_contributors (
        id,
        name,
        email,
        child_name
      )
    `)
    .eq("response_token", token)
    .single();

  if (cErr || !campaign) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  if (campaign.status === "responded") {
    return NextResponse.json({ error: "Already answered" }, { status: 409 });
  }

  if (campaign.status !== "sent") {
    return NextResponse.json(
      { error: "This question is not currently open for responses" },
      { status: 400 }
    );
  }

  const contributor = Array.isArray(campaign.family_contributors)
    ? campaign.family_contributors[0]
    : campaign.family_contributors;

  if (!contributor) {
    return NextResponse.json({ error: "Campaign data error" }, { status: 500 });
  }

  // Insert response
  const { error: insertErr } = await supabaseAdmin
    .from("question_responses")
    .insert({
      campaign_id: campaign.id,
      contributor_id: campaign.contributor_id,
      response_text,
      responded_at: new Date().toISOString(),
    });

  if (insertErr) {
    // Could be a unique violation (already answered race condition)
    if (insertErr.code === "23505") {
      return NextResponse.json({ error: "Already answered" }, { status: 409 });
    }
    console.error("[questions/respond] Insert error:", insertErr);
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }

  // Update campaign status
  await supabaseAdmin
    .from("question_campaigns")
    .update({ status: "responded" })
    .eq("id", campaign.id);

  // Send thank-you email (best effort — don't fail the response if this errors)
  try {
    await resend.emails.send({
      from: "OurFable <hello@ourfable.ai>",
      to: contributor.email,
      subject: `Your answer is safe · ${contributor.child_name}'s vault`,
      react: React.createElement(ThankYouEmail, {
        contributorName: contributor.name,
        childName: contributor.child_name,
      }),
    });
  } catch (emailErr) {
    console.error("[questions/respond] Thank-you email error:", emailErr);
  }

  return NextResponse.json({ success: true });
}
