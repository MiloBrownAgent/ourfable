import { escapeHtml } from "./escape-html";

interface GuardianAssignedEmailOptions {
  guardianName: string;
  guardianRelationship?: string;
  childName: string;
  parentNames: string;
  unsubscribeUrl: string;
}

export function guardianAssignedEmail({
  guardianName,
  guardianRelationship,
  childName,
  parentNames,
  unsubscribeUrl,
}: GuardianAssignedEmailOptions): { subject: string; html: string; text: string } {
  const childFirst = childName.split(" ")[0] || "their child";
  const guardianFirst = guardianName.split(" ")[0] || "there";
  const relationshipLine = guardianRelationship?.trim()
    ? `As ${childFirst}'s ${guardianRelationship.toLowerCase()},`
    : "As one of the trusted adults in their life,";

  const subject = `You were named a vault guardian for ${childFirst}`;
  const html = `<!DOCTYPE html>
<html lang="en" style="color-scheme:light;">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#FDFBF7;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(parentNames)} named you as a vault guardian for ${escapeHtml(childFirst)}.</div>
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
                    <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">Vault Guardian Notice</p>
                    <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1A1A18;line-height:1.25;">You were named a vault guardian for ${escapeHtml(childFirst)}.</p>
                    <p style="margin:0 0 18px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">Hi ${escapeHtml(guardianFirst)},</p>
                    <p style="margin:0 0 18px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">${escapeHtml(parentNames)} added you as a vault guardian for ${escapeHtml(childFirst)} on Our Fable.</p>
                    <p style="margin:0 0 18px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">${escapeHtml(relationshipLine)} this means we may contact you if the family needs help keeping ${escapeHtml(childFirst)}'s vault active or triggering delivery at the right time.</p>
                    <p style="margin:0 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">You cannot read sealed letters, photos, voice memos, or videos in the vault. This role is about stewardship, not access.</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0 40px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #F0ECE6;height:1px;font-size:0;">&nbsp;</td></tr></table></td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 40px 32px;">
                    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9A9590;line-height:1.7;">If you weren&apos;t expecting this, you can reply to this email and we&apos;ll help clarify it.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A09890;line-height:1.8;">ourfable.ai</p>
              <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#B0A9A0;"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#B0A9A0;text-decoration:underline;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${guardianFirst},

${parentNames} added you as a vault guardian for ${childFirst} on Our Fable.

${relationshipLine} this means we may contact you if the family needs help keeping the vault active or triggering delivery at the right time.

You cannot read sealed vault content. This role is about stewardship, not access.

Unsubscribe: ${unsubscribeUrl}`;

  return { subject, html, text };
}
