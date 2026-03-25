// app/api/cron/questions/route.ts
// Monthly question dispatch cron.
// Loops all active contributors — generates + sends a question if none exists this month.
//
// Secured with CRON_SECRET bearer token.
// Call via GET or POST (Vercel cron config uses GET).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ourfable.ai";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[cron/questions] CRON_SECRET not set — rejecting all requests");
    return false;
  }
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

type DispatchResult = {
  contributor_id: string;
  contributor_name: string;
  status: "sent" | "skipped" | "error";
  reason?: string;
};

async function dispatchMonthlyQuestions(): Promise<DispatchResult[]> {
  const now = new Date();
  const questionMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Load all active contributors
  const { data: contributors, error: cErr } = await supabaseAdmin
    .from("family_contributors")
    .select("id, name, email, relationship_role, child_name, owner_id")
    .eq("active", true);

  if (cErr) {
    console.error("[cron/questions] Failed to load contributors:", cErr);
    throw new Error("Failed to load contributors");
  }

  if (!contributors || contributors.length === 0) {
    return [];
  }

  const results: DispatchResult[] = [];

  for (const contributor of contributors) {
    try {
      // Check if already sent this month
      const { data: existing } = await supabaseAdmin
        .from("question_campaigns")
        .select("id, status")
        .eq("contributor_id", contributor.id)
        .eq("question_month", questionMonth)
        .maybeSingle();

      if (existing) {
        results.push({
          contributor_id: contributor.id,
          contributor_name: contributor.name,
          status: "skipped",
          reason: `Already ${existing.status} for ${questionMonth}`,
        });
        continue;
      }

      // Generate question via internal API
      const generateRes = await fetch(`${APP_URL}/api/questions/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ contributor_id: contributor.id }),
      });

      if (!generateRes.ok) {
        const errData = await generateRes.json().catch(() => ({}));
        results.push({
          contributor_id: contributor.id,
          contributor_name: contributor.name,
          status: "error",
          reason: `Generate failed (${generateRes.status}): ${(errData as { error?: string }).error ?? "unknown"}`,
        });
        continue;
      }

      const { campaign_id } = (await generateRes.json()) as { campaign_id: string };

      // Send the question email
      const sendRes = await fetch(`${APP_URL}/api/questions/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ campaign_id }),
      });

      if (!sendRes.ok) {
        const errData = await sendRes.json().catch(() => ({}));
        results.push({
          contributor_id: contributor.id,
          contributor_name: contributor.name,
          status: "error",
          reason: `Send failed (${sendRes.status}): ${(errData as { error?: string }).error ?? "unknown"}`,
        });
        continue;
      }

      results.push({
        contributor_id: contributor.id,
        contributor_name: contributor.name,
        status: "sent",
      });

      // Small delay between sends to respect rate limits
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`[cron/questions] Error for contributor ${contributor.id}:`, err);
      results.push({
        contributor_id: contributor.id,
        contributor_name: contributor.name,
        status: "error",
        reason: String(err),
      });
    }
  }

  return results;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await dispatchMonthlyQuestions();
    const sent = results.filter((r) => r.status === "sent").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;

    console.log(`[cron/questions] Complete — sent: ${sent}, skipped: ${skipped}, errors: ${errors}`);

    return NextResponse.json({ success: true, sent, skipped, errors, results });
  } catch (err) {
    console.error("[cron/questions] Fatal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
