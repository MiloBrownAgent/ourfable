import { escapeHtml } from "./escape-html";

interface ParentInviteEmailOptions {
  inviterName: string;
  childName: string;
  joinUrl: string;
  unsubscribeUrl: string;
}

export function parentInviteEmail({
  inviterName,
  childName,
  joinUrl,
  unsubscribeUrl,
}: ParentInviteEmailOptions): { subject: string; html: string; text: string } {
  const childFirst = childName.split(" ")[0] || "your child";
  const inviterFirst = inviterName.split(" ")[0] || "A parent";
  const subject = `${inviterName} invited you to co-manage ${childFirst}'s Fable`;

  const html = `<!DOCTYPE html>
<html lang="en" style="color-scheme:light;">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#FDFBF7;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(inviterName)} invited you to help manage ${escapeHtml(childFirst)}'s Our Fable vault.</div>
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FDFBF7" style="background:#FDFBF7;padding:48px 20px 56px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#4A5E4C;letter-spacing:-0.01em;">Our Fable</span>
              <div style="width:32px;height:1.5px;background:#C8A87A;margin:10px auto 0;"></div>
            </td>
          </tr>
          <tr>
            <td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="background:#4A5E4C;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 40px 32px;">
                    <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">Co-Parent Invite</p>
                    <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1A1A18;line-height:1.25;">${escapeHtml(inviterName)} invited you to join ${escapeHtml(childFirst)}'s Fable.</p>
                    <p style="margin:0 0 18px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">You&apos;ve been invited to co-manage ${escapeHtml(childFirst)}'s memory vault on Our Fable.</p>
                    <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">You&apos;ll have your own login and can write letters, send dispatches, and manage the circle while sharing the same vault.</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:100px;background:#4A5E4C;">
                          <a href="${escapeHtml(joinUrl)}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">Accept invite</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0 40px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #F0ECE6;height:1px;font-size:0;">&nbsp;</td></tr></table></td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 40px 32px;">
                    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9A9590;line-height:1.7;">This invite expires in 7 days. If you didn&apos;t expect it, you can safely ignore this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A09890;line-height:1.8;">Sent by ${escapeHtml(inviterFirst)} via ourfable.ai</p>
              <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#B0A9A0;"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#B0A9A0;text-decoration:underline;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${inviterName} invited you to co-manage ${childFirst}'s memory vault on Our Fable.

Accept invite: ${joinUrl}

This invite expires in 7 days.
Unsubscribe: ${unsubscribeUrl}`;

  return { subject, html, text };
}
