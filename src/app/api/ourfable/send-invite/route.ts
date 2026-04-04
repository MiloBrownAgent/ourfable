import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { convexQuery } from "@/lib/convex";
import { buildUnsubscribeHeaders, buildUnsubscribeUrl } from "@/lib/unsubscribe-token";
import { escapeHtml } from "@/lib/email-templates/escape-html";
import { circleGrowthHtml } from "@/lib/email-templates/circle-growth";


// Resend API for sending emails from hello@ourfable.ai
const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? "";

async function sendEmail({ from, to, subject, html, replyTo, headers }: { from: string; to: string; subject: string; html: string; replyTo?: string; headers?: Record<string, string> }) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_FULL_API_KEY not configured");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from, to, subject, html, reply_to: replyTo, headers }),
  });
  if (!res.ok) throw new Error(`Resend API error: ${await res.text()}`);
  return res.json();
}

// Returns child first name for pronouns/signing
function childFirstName(childName: string) {
  return childName.split(" ")[0];
}

function recipientFirstName(name: string) {
  return name.split(" ")[0];
}

// Age-appropriate voice: newborn/infant Milo writes as the child
function childVoiceIntro(childFirst: string, ageMonths: number, relationship: string, recipientFirst: string): string {
  if (ageMonths < 3) {
    return `I'm only ${ageMonths === 0 ? "a few days" : `${ageMonths} month${ageMonths !== 1 ? "s" : ""}`} old and I already have people in my corner — you're one of them.`;
  }
  if (ageMonths < 12) {
    return `I'm ${ageMonths} months old and I'm figuring out pretty much everything. My parents are writing it all down. Now you can follow along too.`;
  }
  return `I'm ${childFirst} — ${ageMonths} months old and apparently growing fast. My parents thought you should be part of my story.`;
}

function ourfableInviteHtml({
  recipientName,
  relationship,
  childName,
  childDob,
  parentNames,
  inviteUrl,
  unsubscribeUrl,
  isTest,
}: {
  recipientName: string;
  relationship: string;
  childName: string;
  childDob: string;
  parentNames: string;
  inviteUrl: string;
  unsubscribeUrl: string;
  isTest?: boolean;
}) {
  const childFirst = childFirstName(childName);
  const recipientFirst = recipientFirstName(recipientName);

  // Calculate age in months
  const born = new Date(childDob + "T00:00:00");
  const now = new Date();
  const ageMonths = Math.floor((now.getTime() - born.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));

  const intro = childVoiceIntro(childFirst, ageMonths, relationship, recipientFirst);

  return `<!DOCTYPE html>
<html lang="en" style="color-scheme:light;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Hi — it's ${childFirst}</title>
  <style>
    :root { color-scheme: light; }
    body { margin:0; padding:0; background-color:#FDFBF7 !important; }
    @media (prefers-color-scheme: dark) {
      body { background-color:#FDFBF7 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#FDFBF7;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(childFirst)} wants you in their circle — ${escapeHtml(parentNames)} set this up for them.</div>
  <div style="display:none;max-height:0;overflow:hidden;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  ${isTest ? `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#2C2C2C;"><tr><td align="center" style="padding:10px 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#F5F2ED;">TEST — preview of ${escapeHtml(recipientFirst.toUpperCase())}'s invite</td></tr></table>` : ""}

  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FDFBF7" style="background-color:#FDFBF7;padding:48px 20px 56px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Child name wordmark -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:400;color:#6B7C6E;letter-spacing:0.2em;text-transform:uppercase;">${escapeHtml(childFirst)}</span>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #EAE7E1;">

              <!-- Top color bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#4A5E4C;height:3px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Opening — the child's voice -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 40px 32px;">
                    <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:#8A9E8C;">For ${escapeHtml(recipientFirst)}</p>
                    <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1A1A18;line-height:1.3;">Hi — it's ${escapeHtml(childFirst)}.</p>
                    <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.75;">
                      ${escapeHtml(intro)}
                    </p>
                    <p style="margin:0 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.75;">
                      As my <strong style="color:#1A1A18;">${escapeHtml(relationship.toLowerCase())}</strong>, there's something waiting for you.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0 40px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #F0ECE6;height:1px;font-size:0;">&nbsp;</td></tr></table></td></tr>
              </table>

              <!-- Block 1: Write to me -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 40px 40px;">
                    <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Write to me</p>
                    <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6B6860;line-height:1.7;">Leave me a letter, a memory, something you want me to know — sealed until I'm old enough to really read it. It'll be waiting for me.</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:100px;background-color:#4A5E4C;">
                          <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;padding:13px 26px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:0.02em;">Write to ${escapeHtml(childFirst)} &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>



              ${circleGrowthHtml({
                body: `If writing to ${childFirst} makes you wish you had a place like this for your own child, you can reserve a private vault for your family too.`,
                ctaLabel: "Reserve your family's spot",
              })}

              <!-- Footer note inside card -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0 40px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #F0ECE6;height:1px;font-size:0;">&nbsp;</td></tr></table></td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 40px 32px;">
                    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9A9590;line-height:1.7;">These links are yours alone. Nothing here is on social media. This is private — just the people ${escapeHtml(childFirst)}'s parents trust with their story.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A09890;line-height:1.8;">
                ${escapeHtml(childFirst)} &middot; ourfable.ai<br/>
                Set up by ${escapeHtml(parentNames)} &mdash; not on social, not public, just family.
              </p>
              <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#B0A9A0;"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#B0A9A0;text-decoration:underline;">Unsubscribe</a></p>
              <p style="margin:4px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#B0A9A0;">ourfable.ai</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    // Auth check — must be logged in
    const sessionToken = req.cookies.get(COOKIE)?.value;
    const session = sessionToken ? await verifySession(sessionToken) : null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { memberId, testEmail, inviteUrl: clientInviteUrl } = body;
    const familyId = session.familyId;
    if (!familyId) {
      return NextResponse.json({ error: "familyId is required" }, { status: 400 });
    }

    // Fetch family
    const family = await convexQuery("ourfable:getFamily", { familyId });
    if (!family) return NextResponse.json({ error: "Family not found" }, { status: 404 });

    // Fetch member
    const members = await convexQuery<Array<{ _id: string; email?: string }>>("ourfable:listCircle", { familyId }).catch(() => []);
    const member = memberId
      ? members.find((m: { _id: string }) => m._id === memberId)
      : members[0];

    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const toEmail = testEmail ?? member.email;
    if (!toEmail) return NextResponse.json({ error: "No email address" }, { status: 400 });

    const isTest = !!testEmail;
    const childFirst = childFirstName(family.childName);

    const baseUrl = `https://ourfable.ai`;
    // Use client-provided invite URL (includes #key fragment for E2E encryption) if available
    const inviteUrl = clientInviteUrl || `${baseUrl}/join/${member.inviteToken}`;
    // Parent names for footer — pulled from familyName or hardcoded for Sweeney
    const parentNames = family.parentNames ?? "the family";

    const html = ourfableInviteHtml({
      recipientName: member.name,
      relationship: member.relationship,
      childName: family.childName,
      childDob: family.childDob,
      parentNames,
      inviteUrl,
      unsubscribeUrl: buildUnsubscribeUrl(toEmail),
      isTest,
    });

    const info = await sendEmail({
      from: `${childFirst} via Our Fable <hello@ourfable.ai>`,
      to: toEmail,
      subject: `${isTest ? "[TEST] " : ""}Hi — it's ${childFirst}`,
      html,
      replyTo: `hello@ourfable.ai`,
        headers: buildUnsubscribeHeaders(toEmail),
      });

    return NextResponse.json({ success: true, messageId: info.id, sentTo: toEmail, member: member.name });

  } catch (e) {
    console.error("[ourfable/send-invite]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
