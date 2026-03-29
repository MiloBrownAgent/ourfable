import { internalConvexQuery as convexQuery, internalConvexMutation as convexMutation } from "@/lib/convex-internal";
import { NextRequest, NextResponse } from "next/server";

function confirmationPage(error?: string): NextResponse {
  const html = error
    ? `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Our Fable</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; background: #F5F2ED; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border-radius: 20px; border: 1px solid #EAE7E1; max-width: 480px; width: 100%; overflow: hidden; }
    .top-bar { background: #4A5E4C; height: 3px; }
    .content { padding: 48px 40px; text-align: center; }
    .logo { font-family: Georgia, serif; font-size: 20px; color: #4A5E4C; font-weight: 700; margin-bottom: 32px; }
    h1 { font-family: Georgia, serif; font-size: 22px; color: #1A1A1A; line-height: 1.4; margin-bottom: 16px; }
    p { font-size: 15px; color: #6A6560; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="card">
    <div class="top-bar"></div>
    <div class="content">
      <p class="logo">Our Fable</p>
      <h1>Something went wrong</h1>
      <p>We couldn't process your skip. The link may have expired or already been used.</p>
    </div>
  </div>
</body>
</html>`
    : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>See you next month — Our Fable</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; background: #F5F2ED; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border-radius: 20px; border: 1px solid #EAE7E1; max-width: 480px; width: 100%; overflow: hidden; }
    .top-bar { background: #4A5E4C; height: 3px; }
    .content { padding: 48px 40px; text-align: center; }
    .logo { font-family: Georgia, serif; font-size: 20px; color: #4A5E4C; font-weight: 700; margin-bottom: 32px; }
    .icon { font-size: 40px; margin-bottom: 24px; }
    h1 { font-family: Georgia, serif; font-size: 26px; color: #1A1A1A; line-height: 1.35; margin-bottom: 16px; }
    p { font-size: 15px; color: #6A6560; line-height: 1.75; }
    .footer { margin-top: 40px; font-size: 12px; color: #A09890; }
  </style>
</head>
<body>
  <div class="card">
    <div class="top-bar"></div>
    <div class="content">
      <p class="logo">Our Fable</p>
      <div class="icon">🌿</div>
      <h1>Got it — see you next month.</h1>
      <p>No pressure, ever. We'll check in again when the time is right.</p>
      <p class="footer">Our Fable · ourfable.ai</p>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: error ? 400 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// GET /api/ourfable/skip-prompt?token=XXX&memberId=YYY&promptId=ZZZ
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get("token");
  const memberId = searchParams.get("memberId");
  const promptId = searchParams.get("promptId") ?? "";

  if (!token || !memberId) {
    return confirmationPage("missing params");
  }

  // Look up the member by invite token to validate
  type MemberRecord = {
    _id: string;
    familyId: string;
    childId?: string;
    name: string;
    email: string;
    inviteToken?: string;
  };

  const member = (await convexQuery("ourfable:getMemberByInviteToken", { token })) as MemberRecord | null;

  if (!member) {
    return confirmationPage("invalid token");
  }

  // Validate the memberId matches the token owner
  if (member._id !== memberId) {
    return confirmationPage("token mismatch");
  }

  // Reset consecutiveMissed so they don't get flagged for inactivity
  await convexMutation("ourfable:resetCircleMemberInactivity", { memberId: member._id });

  // Decode promptId (it's a base64 slice of the question text used as a stable ID)
  // We store the skip record — promptText will be reconstructed from promptId if possible,
  // otherwise we store promptId as the text for analytics grouping.
  const promptText = promptId
    ? (() => {
        try {
          // promptId is base64(question).slice(0,16) — decode what we can
          const decoded = Buffer.from(promptId, "base64").toString("utf8");
          return decoded.length > 0 ? decoded : promptId;
        } catch {
          return promptId;
        }
      })()
    : "unknown";

  await convexMutation("ourfable:logPromptSkip", {
    memberId: member._id,
    familyId: member.familyId,
    childId: member.childId,
    promptText,
    promptId: promptId || undefined,
  });

  return confirmationPage();
}
