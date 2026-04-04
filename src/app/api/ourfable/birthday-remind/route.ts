import { NextRequest, NextResponse } from "next/server";
import { internalConvexMutation, internalConvexQuery } from "@/lib/convex-internal";
import { buildUnsubscribeHeaders } from "@/lib/unsubscribe-token";
import { escapeHtml } from "@/lib/email-templates/escape-html";

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? "";

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
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
      reply_to: replyTo,
      headers: {
        ...buildUnsubscribeHeaders(to),
      },
    }),
  });
}

function renderPage(title: string, message: string, form?: { token: string; familyId: string }): string {
  const action = form
    ? `<form method="POST" action="/api/ourfable/birthday-remind" style="margin-top:28px;">
        <input type="hidden" name="token" value="${form.token}" />
        <input type="hidden" name="familyId" value="${form.familyId}" />
        <button type="submit" style="border:none;border-radius:999px;background:#4A5E4C;color:#fff;padding:13px 28px;font:600 13px -apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;cursor:pointer;">Send the reminders</button>
      </form>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} — Our Fable</title>
</head>
<body style="margin:0;padding:0;background:#FDFBF7;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:440px;padding:48px 32px;text-align:center;">
    <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background:#F0F5F0;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
      <span style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#4A5E4C;">OF</span>
    </div>
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#1A1A18;font-weight:400;line-height:1.25;">${title}</h1>
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">${message}</p>
    ${action}
  </div>
</body>
</html>`;
}

async function getValidatedDispatch(token: string, familyId: string) {
  const dispatches = await internalConvexQuery<Array<{
    type: string;
    content: string;
    usedAt?: number;
  }> | null>("ourfable:listOurFableDispatches", { familyId });

  return dispatches?.find((dispatch) =>
    dispatch.type === "birthday_reminder_token" && dispatch.content === token
  ) ?? null;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const familyId = req.nextUrl.searchParams.get("familyId");

  if (!token || !familyId) {
    return new NextResponse(renderPage("Missing parameters", "This link appears to be invalid."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const validDispatch = await getValidatedDispatch(token, familyId);
  if (!validDispatch || validDispatch.usedAt) {
    return new NextResponse(renderPage("Link expired", "This reminder link has already been used or has expired."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const family = await internalConvexQuery<{ childName: string } | null>("ourfable:getFamily", { familyId });
  const accountFamily = await internalConvexQuery<{ email?: string } | null>("ourfable:getOurFableFamilyById", { familyId }).catch(() => null);
  const parentReplyTo = accountFamily?.email || "hello@ourfable.ai";
  if (!family) {
    return new NextResponse(renderPage("Family not found", "We couldn't find this family."), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  const activeChild = await internalConvexQuery<{ childName?: string }>("ourfable:getActiveChildProfile", { familyId });
  const childFirst = (activeChild?.childName ?? family.childName).split(" ")[0];
  return new NextResponse(
    renderPage(
      "Ready to remind the circle?",
      `We’ll send one gentle note to ${escapeHtml(childFirst)}'s circle members who have email addresses on file. This link can only be used once.`,
      { token, familyId }
    ),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const token = String(form.get("token") ?? "");
    const familyId = String(form.get("familyId") ?? "");

    if (!token || !familyId) {
      return new NextResponse(renderPage("Missing parameters", "This link appears to be invalid."), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    const validDispatch = await getValidatedDispatch(token, familyId);
    if (!validDispatch || validDispatch.usedAt) {
      return new NextResponse(renderPage("Link expired", "This reminder link has already been used or has expired."), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    const consumed = await internalConvexMutation("ourfable:consumeBirthdayReminderDispatch", { familyId, token });
    if (!consumed) {
      return new NextResponse(renderPage("Link expired", "This reminder link has already been used or has expired."), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    const family = await internalConvexQuery<{
      childName: string;
      birthDate?: string;
    } | null>("ourfable:getFamily", { familyId });
    if (!family) {
      return new NextResponse(renderPage("Family not found", "We couldn't find this family."), {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    const members = await internalConvexQuery<Array<{
      name: string;
      email?: string;
      respondToken?: string;
    }> | null>("ourfable:listOurFableCircleMembers", { familyId });

    const emailMembers = members?.filter((member) => member.email) ?? [];
    const activeChild = await internalConvexQuery<{ childName?: string }>("ourfable:getActiveChildProfile", { familyId });
    const childFirst = (activeChild?.childName ?? family.childName).split(" ")[0];
    const dob = family.birthDate ? new Date(`${family.birthDate}T00:00:00`) : null;
    const now = new Date();
    let birthdayDate = "soon";
    if (dob) {
      const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (next < now) next.setFullYear(next.getFullYear() + 1);
      birthdayDate = next.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    }

    let sent = 0;
    for (const member of emailMembers) {
      const memberFirst = member.name.split(" ")[0];
      const respondUrl = member.respondToken
        ? `https://ourfable.ai/respond/${member.respondToken}`
        : "https://ourfable.ai";
      const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F5F2ED;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F2ED" style="padding:64px 20px 80px;">
    <tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
      <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
        <table width="100%"><tr><td style="background:#C8A87A;height:3px;font-size:0;">&nbsp;</td></tr></table>
        <table width="100%"><tr><td style="padding:28px 44px 0;text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#4A5E4C;letter-spacing:-0.01em;">Our Fable</div>
          <div style="width:32px;height:1.5px;background:#C8A87A;margin:10px auto 0;"></div>
        </td></tr></table>
        <table width="100%"><tr><td style="padding:32px 44px 44px;">
          <p style="margin:0 0 8px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#C8A87A;">Birthday coming up</p>
          <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1A1A18;line-height:1.25;">${escapeHtml(childFirst)}'s birthday is ${escapeHtml(birthdayDate)}</p>
          <p style="margin:0 0 20px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">Hi ${escapeHtml(memberFirst)} — just a little heads up that ${escapeHtml(childFirst)}'s birthday is coming up on ${escapeHtml(birthdayDate)}.</p>
          <p style="margin:0 0 28px;font-family:-apple-system,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">If you'd like to write a birthday message, share a memory, or leave a voice note, it'll be sealed in ${escapeHtml(childFirst)}'s vault and waiting for them when they're older.</p>
          <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4A5E4C;">
            <a href="${escapeHtml(respondUrl)}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Write something for ${escapeHtml(childFirst)} →</a>
          </td></tr></table>
          <div style="margin-top:24px;background:#F8F5F0;border:1px solid #E0DDD7;border-radius:16px;padding:20px 22px;">
            <p style="margin:0 0 8px;font-family:-apple-system,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">For your own family</p>
            <p style="margin:0 0 16px;font-family:-apple-system,sans-serif;font-size:14px;color:#6B6860;line-height:1.75;">If celebrating ${escapeHtml(childFirst)} this way makes you wish you had the same kind of place for your own child, you can reserve a private vault for your family too.</p>
            <a href="https://ourfable.ai/reserve" style="display:inline-block;padding:12px 20px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#4A5E4C;text-decoration:none;border-radius:999px;background:#FFFFFF;border:1px solid #D8D2C7;">Reserve your family's spot</a>
          </div>
        </td></tr></table>
      </td></tr>
    </table></td></tr>
  </table>
</body></html>`;
      try {
        await sendEmail(member.email!, `${childFirst}'s birthday is coming up`, html, parentReplyTo);
        sent++;
      } catch (error) {
        console.error(`[birthday-remind] Failed to email ${member.name}:`, error);
      }
    }

    return new NextResponse(
      renderPage(
        "Reminders sent",
        `We sent a gentle nudge to ${sent} circle member${sent === 1 ? "" : "s"}.`
      ),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("[birthday-remind]", error);
    return new NextResponse(renderPage("Something went wrong", "Please try again later."), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}
