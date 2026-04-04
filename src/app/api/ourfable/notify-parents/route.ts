import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE } from "@/lib/auth";
import { convexQuery, convexMutation } from "@/lib/convex";
import { internalConvexQuery } from "@/lib/convex-internal";
import { buildUnsubscribeHeaders, buildUnsubscribeUrl } from "@/lib/unsubscribe-token";
import { escapeHtml } from "@/lib/email-templates/escape-html";

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? "";

async function sendEmail({ from, to, subject, html, replyTo, headers }: { from: string; to: string; subject: string; html: string; replyTo?: string; headers?: Record<string, string> }) {
  if (!RESEND_API_KEY) throw new Error("RESEND_FULL_API_KEY not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from, to, subject, html, reply_to: replyTo, headers }),
  });
  if (!res.ok) throw new Error(`Resend API error: ${await res.text()}`);
  return res.json();
}

function notifyHtml({
  childFirst,
  memberName,
  relationship,
  contentType,
  vaultUrl,
  unsubscribeUrl,
  totalEntries,
  contributorCount,
  memberEntryCount,
}: {
  childFirst: string;
  memberName: string;
  relationship: string;
  contentType: string;
  vaultUrl: string;
  unsubscribeUrl: string;
  totalEntries: number;
  contributorCount: number;
  memberEntryCount: number;
}) {
  const typeLabel = contentType === "voice" ? "a voice memo" : contentType === "photo" ? "a photo" : contentType === "video" ? "a video" : "a letter";
  const memberFirst = memberName.split(" ")[0];

    return `<!DOCTYPE html>
<html lang="en" style="color-scheme:light;">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(memberFirst)} wrote to ${escapeHtml(childFirst)}</title>
</head>
<body style="margin:0;padding:0;background-color:#FDFBF7;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(memberFirst)} left something for ${escapeHtml(childFirst)} today — sealed and waiting.</div>

  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FDFBF7" style="background-color:#FDFBF7;padding:64px 20px 80px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#4A5E4C;letter-spacing:-0.01em;">Our Fable</div>
              <div style="width:32px;height:1.5px;background:#C8A87A;margin:10px auto 0;"></div>
            </td>
          </tr>

          <tr>
            <td style="background-color:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="background-color:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:48px 44px 44px;">
                    <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1A1A18;line-height:1.25;">Another piece of ${escapeHtml(childFirst)}'s story was just added.</p>
                    <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">
                      <strong style="color:#1A1A18;">${escapeHtml(memberName)}</strong> — ${escapeHtml(childFirst)}'s ${escapeHtml(relationship.toLowerCase())} — left ${escapeHtml(typeLabel)} for the vault today.
                    </p>
                    <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6A6660;line-height:1.8;">
                      It&apos;s sealed now, and it&apos;s part of what ${escapeHtml(childFirst)} will one day receive. This is the quiet compounding value of the vault — one voice at a time.
                    </p>
                    <div style="background:#F8F5F0;border:1px solid #E8E4DE;border-radius:14px;padding:20px 24px;margin:0 0 28px;">
                      <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A8880;">Vault progress</p>
                      <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;color:#1A1A18;line-height:1.5;">${totalEntries} sealed ${totalEntries === 1 ? "memory" : "memories"} · ${contributorCount} ${contributorCount === 1 ? "person" : "people"} contributing</p>
                      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6B6860;line-height:1.75;">${escapeHtml(memberFirst)} has contributed ${memberEntryCount} ${memberEntryCount === 1 ? "time" : "times"} so far.</p>
                    </div>
                    <p style="margin:0 0 36px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#9A9590;line-height:1.75;">
                      The more often this happens, the richer ${escapeHtml(childFirst)}'s future vault becomes.
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:100px;background-color:#4A5E4C;">
                          <a href="${escapeHtml(vaultUrl)}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:0.02em;">Open the vault →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0 44px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #F0ECE6;height:1px;font-size:0;">&nbsp;</td></tr></table></td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 44px 28px;">
                    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9A9590;line-height:1.7;">Our Fable is building ${escapeHtml(childFirst)}'s vault — one contribution at a time.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A09890;line-height:1.8;">${escapeHtml(childFirst)} · ourfable.ai</p>
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

    const body = await req.json();
    const { memberName, relationship, contentType } = body;
    const familyId = session.familyId;

    const family = await convexQuery("ourfable:getFamily", { familyId }) as Record<string, unknown> | null;
    if (!family) return NextResponse.json({ error: "Family not found" }, { status: 404 });

    const entries = await internalConvexQuery<Array<{ memberName?: string }>>("ourfable:listVaultEntries", {
      familyId,
      includeSealed: true,
    }).catch(() => []);
    const totalEntries = entries.length;
    const uniqueContributors = new Set(entries.map((entry) => entry.memberName).filter(Boolean));
    const contributorCount = uniqueContributors.size;
    const memberFirst = memberName.split(" ")[0];
    const memberEntryCount = entries.filter((entry) => (entry.memberName || "").split(" ")[0] === memberFirst).length || 1;

    // Save notification
    await convexMutation("ourfable:createNotification", { familyId, type: "contribution_received", memberName, preview: `${contentType} · sealed` });

    const parentEmail = family.parentEmail;
    if (!parentEmail) {
      console.log("[notify-parents] No parentEmail for family — skipping notification");
      return NextResponse.json({ success: true, skipped: true, reason: "No parent email" });
    }
    const childFirst = family.childName.split(" ")[0];
    const vaultUrl = `https://ourfable.ai/${familyId}/vault`;

    const html = notifyHtml({
      childFirst,
      memberName,
      relationship: relationship ?? "circle member",
      contentType: contentType ?? "letter",
      vaultUrl,
      unsubscribeUrl: buildUnsubscribeUrl(parentEmail),
      totalEntries,
      contributorCount,
      memberEntryCount,
    });

    await sendEmail({
      from: `Our Fable <hello@ourfable.ai>`,
      to: parentEmail,
      subject: `${memberName.split(" ")[0]} wrote to ${childFirst} today`,
      html,
      replyTo: "hello@ourfable.ai",
      headers: buildUnsubscribeHeaders(parentEmail),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[notify-parents]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
