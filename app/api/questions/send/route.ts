// app/api/questions/send/route.ts
// Send the question email for a pending campaign.
// Service-role only.
//
// POST /api/questions/send
// Headers: Authorization: Bearer ${CRON_SECRET}
// Body: { campaign_id: string }
//
// Returns: { success: true }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { z } from "zod";
import QuestionEmail from "@/emails/QuestionEmail";
import React from "react";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ourfable.ai";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

const BodySchema = z.object({
  campaign_id: z.string().uuid(),
});

function formatMonth(questionMonth: string): string {
  // "2026-03" → "March 2026"
  const [year, month] = questionMonth.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

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

  const { campaign_id } = body;

  // Load campaign with contributor
  const { data: campaign, error: cErr } = await supabaseAdmin
    .from("question_campaigns")
    .select(`
      id,
      question_text,
      question_month,
      status,
      response_token,
      family_contributors (
        id,
        name,
        email,
        child_name
      )
    `)
    .eq("id", campaign_id)
    .single();

  if (cErr || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status !== "pending") {
    return NextResponse.json(
      { error: `Campaign is already ${campaign.status}` },
      { status: 400 }
    );
  }

  const contributor = Array.isArray(campaign.family_contributors)
    ? campaign.family_contributors[0]
    : campaign.family_contributors;

  if (!contributor) {
    return NextResponse.json({ error: "Contributor data missing" }, { status: 500 });
  }

  const respondUrl = `${APP_URL}/respond/${campaign.response_token}`;
  const monthLabel = formatMonth(campaign.question_month);

  // Send email via Resend
  const { error: emailErr } = await resend.emails.send({
    from: "OurFable <hello@ourfable.ai>",
    to: contributor.email,
    subject: `A question for ${contributor.child_name}'s vault · ${monthLabel}`,
    react: React.createElement(QuestionEmail, {
      contributorName: contributor.name,
      childName: contributor.child_name,
      questionText: campaign.question_text,
      respondUrl,
      month: monthLabel,
    }),
  });

  if (emailErr) {
    console.error("[questions/send] Resend error:", emailErr);
    return NextResponse.json({ error: "Failed to send email", details: emailErr }, { status: 500 });
  }

  // Update campaign status
  const { error: updateErr } = await supabaseAdmin
    .from("question_campaigns")
    .update({ status: "sent", email_sent_at: new Date().toISOString() })
    .eq("id", campaign_id);

  if (updateErr) {
    console.error("[questions/send] Status update error:", updateErr);
    // Email was sent — don't fail the response, just log
  }

  return NextResponse.json({ success: true });
}
