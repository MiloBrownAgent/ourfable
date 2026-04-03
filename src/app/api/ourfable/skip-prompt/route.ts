import { internalConvexMutation as convexMutation, internalConvexQuery as convexQuery } from "@/lib/convex-internal";
import { NextRequest, NextResponse } from "next/server";

function page(title: string, message: string, token?: string) {
  const action = token
    ? `<form method="POST" action="/api/ourfable/skip-prompt" style="margin-top:28px;">
        <input type="hidden" name="token" value="${token}" />
        <button type="submit" style="border:none;border-radius:999px;background:#4A5E4C;color:#fff;padding:13px 28px;font:600 13px -apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;cursor:pointer;">Skip this month</button>
      </form>`
    : "";

  return new NextResponse(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Our Fable</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;background:#F5F2ED;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
  <div style="background:#fff;border-radius:20px;border:1px solid #EAE7E1;max-width:480px;width:100%;overflow:hidden;">
    <div style="background:#4A5E4C;height:3px;"></div>
    <div style="padding:48px 40px;text-align:center;">
      <p style="font-family:Georgia,serif;font-size:20px;color:#4A5E4C;font-weight:700;margin:0 0 32px;">Our Fable</p>
      <h1 style="font-family:Georgia,serif;font-size:24px;color:#1A1A1A;line-height:1.4;margin:0 0 16px;">${title}</h1>
      <p style="font-size:15px;color:#6A6560;line-height:1.7;margin:0;">${message}</p>
      ${action}
    </div>
  </div>
</body>
</html>`, {
    status: token ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function getPrompt(token: string) {
  const promptData = await convexQuery<{
    prompt?: { status?: string };
  } | null>("ourfable:getPromptByToken", { token }).catch(() => null);
  if (!promptData?.prompt) return null;
  if (promptData.prompt.status !== "sent") return null;
  return promptData.prompt;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!token) {
    return page("Something went wrong", "We couldn't process your skip. The link may have expired or already been used.");
  }

  const prompt = await getPrompt(token);
  if (!prompt) {
    return page("Something went wrong", "We couldn't process your skip. The link may have expired or already been used.");
  }

  return page(
    "Skip this month?",
    "No pressure. We’ll mark this month as skipped and check in again next time.",
    token
  );
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  if (!token) {
    return page("Something went wrong", "We couldn't process your skip. The link may have expired or already been used.");
  }

  const prompt = await getPrompt(token);
  if (!prompt) {
    return page("Something went wrong", "We couldn't process your skip. The link may have expired or already been used.");
  }

  await convexMutation("ourfablePrompts:skipPromptByToken", { token });

  return new NextResponse(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>See you next month — Our Fable</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;background:#F5F2ED;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
  <div style="background:#fff;border-radius:20px;border:1px solid #EAE7E1;max-width:480px;width:100%;overflow:hidden;">
    <div style="background:#4A5E4C;height:3px;"></div>
    <div style="padding:48px 40px;text-align:center;">
      <p style="font-family:Georgia,serif;font-size:20px;color:#4A5E4C;font-weight:700;margin:0 0 32px;">Our Fable</p>
      <h1 style="font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.35;margin:0 0 16px;">See you next month.</h1>
      <p style="font-size:15px;color:#6A6560;line-height:1.75;margin:0;">No pressure. We marked this month as skipped and will send the next prompt on schedule.</p>
    </div>
  </div>
</body></html>`, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
