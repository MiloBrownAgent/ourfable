/**
 * Birthday circle reminder — triggered when a parent clicks "Yes, gently remind them"
 * from the birthday letter reminder email.
 *
 * Sends a gentle nudge to all circle members with emails, letting them know
 * the child's birthday is coming up and inviting them to write something.
 */

import { NextRequest, NextResponse } from "next/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://rightful-eel-502.convex.cloud";
const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? "";

async function convexQuery(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) throw new Error("RESEND_FULL_API_KEY not configured");
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Our Fable <hello@ourfable.ai>",
      to,
      subject,
      html,
      headers: {
        "List-Unsubscribe": "<https://ourfable.ai/unsubscribe>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const familyId = searchParams.get("familyId");

    if (!token || !familyId) {
      return new NextResponse(renderPage("Missing parameters", "This link appears to be invalid."), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Verify the token exists (it was stored as a dispatch record)
    const dispatches = (await convexQuery("ourfable:listOurFableDispatches", { familyId })) as Array<{
      type: string;
      content: string;
    }> | null;

    const validToken = dispatches?.find(d => d.type === "birthday_reminder_token" && d.content === token);
    if (!validToken) {
      return new NextResponse(renderPage("Link expired", "This reminder link has already been used or has expired."), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Get family info
    const family = (await convexQuery("ourfable:getFamily", { familyId })) as {
      childName: string;
      birthDate?: string;
    } | null;
    if (!family) {
      return new NextResponse(renderPage("Family not found", "We couldn't find this family."), {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    const childFirst = family.childName.split(" ")[0];

    // Get circle members with emails
    const members = (await convexQuery("ourfable:listOurFableCircleMembers", { familyId })) as Array<{
      name: string;
      email?: string;
      relationship?: string;
      respondToken?: string;
    }> | null;

    const emailMembers = members?.filter(m => m.email) ?? [];
    if (emailMembers.length === 0) {
      return new NextResponse(
        renderPage("No circle emails", `No circle members have email addresses on file. Add emails in your Circle page to send reminders next time.`),
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    // Calculate birthday date
    const dob = family.birthDate ? new Date(family.birthDate + "T00:00:00") : null;
    const now = new Date();
    let birthdayDate = "soon";
    if (dob) {
      const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (next < now) next.setFullYear(next.getFullYear() + 1);
      birthdayDate = next.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    }

    // Send gentle reminders
    let sent = 0;
    for (const member of emailMembers) {
      const memberFirst = member.name.split(" ")[0];
      const respondUrl = member.respondToken
        ? `https://ourfable.ai/respond/${member.respondToken}`
        : `https://ourfable.ai`;

      const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F5F2ED;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F2ED" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background:#F0F5F0;display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#4A5E4C;">OF</span>
          </div>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#C8A87A;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            <p style="margin:0 0 8px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#C8A87A;">Birthday coming up</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.3;">${childFirst}'s birthday is ${birthdayDate}</p>
            <p style="margin:0 0 20px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">Hi ${memberFirst} — just a little heads up that ${childFirst}'s birthday is coming up on ${birthdayDate}.</p>
            <p style="margin:0 0 28px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">If you'd like to write a birthday message, share a memory, or leave a voice note — it'll be sealed in ${childFirst}'s vault and waiting for them when they're older. No pressure at all.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4A5E4C;">
              <a href="${respondUrl}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Write something for ${childFirst} →</a>
            </td></tr></table>
          </td></tr></table>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-family:-apple-system,sans-serif;font-size:11px;color:#A09890;">Our Fable · Made with love</p>
          <p style="margin:8px 0 0;font-family:-apple-system,sans-serif;font-size:10px;color:#B0A9A0;"><a href="https://ourfable.ai/unsubscribe" style="color:#B0A9A0;text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

      try {
        await sendEmail(member.email!, `${childFirst}'s birthday is coming up 🎂`, html);
        sent++;
      } catch (e) {
        console.error(`[birthday-remind] Failed to email ${member.name}:`, e);
      }
    }

    return new NextResponse(
      renderPage(
        "Reminders sent! 🎂",
        `We sent a gentle nudge to ${sent} circle member${sent !== 1 ? "s" : ""}. They'll get a warm, no-pressure note about ${childFirst}'s birthday.`
      ),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (e) {
    console.error("[birthday-remind]", e);
    return new NextResponse(renderPage("Something went wrong", "Please try again later."), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} — Our Fable</title>
</head>
<body style="margin:0;padding:0;background:#FDFBF7;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:420px;padding:48px 32px;text-align:center;">
    <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background:#F0F5F0;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
      <span style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#4A5E4C;">OF</span>
    </div>
    <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:24px;color:#1A1A18;font-weight:400;">${title}</h1>
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.7;">${message}</p>
  </div>
</body>
</html>`;
}
