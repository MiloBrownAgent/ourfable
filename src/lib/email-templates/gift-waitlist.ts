import { escapeHtml } from "./escape-html";

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

type GifterConfirmationArgs = {
  gifterName?: string;
  recipientEmail: string;
  planLabel: string;
};

type RecipientNoticeArgs = {
  gifterName?: string;
  recipientEmail: string;
  planLabel: string;
};

function firstName(name?: string): string | undefined {
  const value = name?.trim();
  return value ? value.split(/\s+/)[0] : undefined;
}

export function giftWaitlistGifterConfirmationEmail({
  gifterName,
  recipientEmail,
  planLabel,
}: GifterConfirmationArgs): EmailTemplate {
  const gifterFirst = firstName(gifterName);
  const subject = `Your ${planLabel} gift reservation is in`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your gift reservation is in</title>
</head>
<body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="background:#FFFFFF;border:1px solid #E8E2D8;border-radius:18px;padding:40px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">Gift reservation confirmed</p>
              <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:30px;line-height:1.25;color:#1A1A18;">${escapeHtml(gifterFirst ? `${gifterFirst}, you're in.` : "You're in.")}</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#4A4A45;">We've reserved a spot for your ${escapeHtml(planLabel)} gift and emailed <strong>${escapeHtml(recipientEmail)}</strong> to let them know.</p>
              <p style="margin:0;font-size:15px;line-height:1.8;color:#4A4A45;">When gifting opens, we'll follow up with next steps so they can claim it cleanly.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${gifterFirst ? `${gifterFirst}, ` : ""}your ${planLabel} gift reservation is in.

We've reserved a spot for your gift and emailed ${recipientEmail} to let them know.

When gifting opens, we'll follow up with next steps so they can claim it cleanly.`;

  return { subject, html, text };
}

export function giftWaitlistRecipientEmail({
  gifterName,
  recipientEmail,
  planLabel,
}: RecipientNoticeArgs): EmailTemplate {
  const gifterFirst = firstName(gifterName) ?? "Someone";
  const subject = `${gifterFirst} reserved an Our Fable gift for your family`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>An Our Fable gift is waiting</title>
</head>
<body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="background:#FFFFFF;border:1px solid #E8E2D8;border-radius:18px;padding:40px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">Gift reservation</p>
              <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:30px;line-height:1.25;color:#1A1A18;">A gift is waiting for your family.</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#4A4A45;"><strong>${escapeHtml(gifterName?.trim() || "Someone who loves your family")}</strong> reserved an <strong>${escapeHtml(planLabel)}</strong> gift for you.</p>
              <p style="margin:0;font-size:15px;line-height:1.8;color:#4A4A45;">We saved your spot under <strong>${escapeHtml(recipientEmail)}</strong>. When gifting opens, we'll email you with the next step to claim it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `A gift is waiting for your family.

${gifterName?.trim() || "Someone who loves your family"} reserved an ${planLabel} gift for you.

We saved your spot under ${recipientEmail}. When gifting opens, we'll email you with the next step to claim it.`;

  return { subject, html, text };
}
