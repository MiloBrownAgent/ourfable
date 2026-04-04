import { escapeHtml } from "./escape-html";
import { buildUnsubscribeUrl } from "@/lib/unsubscribe-token";

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

type GifterConfirmationArgs = {
  gifterName?: string;
  recipientEmail: string;
  planLabel: string;
  gifterEmail?: string;
};

type RecipientNoticeArgs = {
  gifterName?: string;
  recipientEmail: string;
  planLabel: string;
  recipientName?: string;
};

function firstName(name?: string): string | undefined {
  const value = name?.trim();
  return value ? value.split(/\s+/)[0] : undefined;
}

function giftCtaUrl(): string {
  return "https://ourfable.ai/gift";
}

function homepageUrl(): string {
  return "https://ourfable.ai";
}

function renderShell({
  preview,
  eyebrow,
  title,
  intro,
  body,
  ctaLabel,
  ctaUrl,
  note,
  footerLine,
  unsubscribeUrl,
}: {
  preview: string;
  eyebrow: string;
  title: string;
  intro: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  note?: string;
  footerLine: string;
  unsubscribeUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
  <style>:root { color-scheme: light only; } body { background-color: #FDFBF7 !important; color: #1A1A18 !important; }</style>
</head>
<body style="margin:0;padding:0;background:#FDFBF7;font-family:Georgia,'Times New Roman',serif;" bgcolor="#FDFBF7">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 0 40px;text-align:center;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#4A5E4C;letter-spacing:-0.01em;">Our Fable</p>
              <div style="width:32px;height:1.5px;background:#C8A87A;margin:10px auto 0;"></div>
            </td>
          </tr>
          <tr>
            <td style="background:#FFFFFF !important;border-radius:20px;padding:52px 52px 44px;border:1px solid #E8E2D8;box-shadow:0 8px 40px rgba(0,0,0,0.06);">
              <p style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">${escapeHtml(eyebrow)}</p>
              <h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;line-height:1.25;color:#1A1A18;">${title}</h1>
              <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.8;color:#4A4A45;">${intro}</p>
              <p style="margin:0 0 32px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.8;color:#4A4A45;">${body}</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#4A5E4C;border-radius:100px;padding:16px 36px;">
                    <a href="${escapeHtml(ctaUrl)}" style="font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:-0.01em;">
                      ${escapeHtml(ctaLabel)}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#9A9590;text-align:center;line-height:1.7;">
                Prefer the plain link? <a href="${escapeHtml(ctaUrl)}" style="color:#4A5E4C;text-decoration:underline;">${escapeHtml(ctaUrl)}</a>
              </p>
              ${note ? `<div style="width:100%;height:1px;background:#E8E2D8;margin:32px 0 24px;"></div>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#9A9590;line-height:1.7;">${note}</p>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#9A9590;">ourfable.ai · Private by design. For families. Not followers.</p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9A9590;">
                ${footerLine}<br />
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:#9A9590;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function giftWaitlistGifterConfirmationEmail({
  gifterName,
  recipientEmail,
  planLabel,
  gifterEmail,
}: GifterConfirmationArgs): EmailTemplate {
  const gifterFirst = firstName(gifterName);
  const subject = `Your ${planLabel} gift reservation is in`;
  const ctaUrl = giftCtaUrl();
  const unsubscribeUrl = buildUnsubscribeUrl(gifterEmail ?? recipientEmail);

  const html = renderShell({
    preview: `${gifterFirst ? `${gifterFirst}, ` : ""}your ${planLabel} gift reservation is confirmed.`,
    eyebrow: "Gift reservation confirmed",
    title: gifterFirst
      ? `${escapeHtml(gifterFirst)}, your gift is reserved.`
      : "Your gift is reserved.",
    intro: `We've reserved a spot for your <strong>${escapeHtml(planLabel)}</strong> gift and emailed <strong>${escapeHtml(recipientEmail)}</strong> to let them know.`,
    body: "When gifting opens, we'll follow up with the claim link and next steps. Until then, you can share the gift page if you want to show them what you've reserved.",
    ctaLabel: "See the gift page",
    ctaUrl,
    note: "We saved the founding-member plan you selected, and we'll email you again as soon as it's ready to be claimed.",
    footerLine: "You're receiving this because you reserved an Our Fable gift at ourfable.ai.",
    unsubscribeUrl,
  });

  const text = `${gifterFirst ? `${gifterFirst}, ` : ""}your ${planLabel} gift reservation is in.

We've reserved a spot for your gift and emailed ${recipientEmail} to let them know.

When gifting opens, we'll follow up with the claim link and next steps.

See the gift page: ${ctaUrl}

You're receiving this because you reserved an Our Fable gift at ourfable.ai.
To unsubscribe: ${unsubscribeUrl}`;

  return { subject, html, text };
}

export function giftWaitlistRecipientEmail({
  gifterName,
  recipientEmail,
  planLabel,
  recipientName,
}: RecipientNoticeArgs): EmailTemplate {
  const gifterFirst = firstName(gifterName) ?? "Someone";
  const recipientFirst = firstName(recipientName);
  const subject = `${gifterFirst} reserved an Our Fable gift for your family`;
  const ctaUrl = homepageUrl();
  const unsubscribeUrl = buildUnsubscribeUrl(recipientEmail);

  const html = renderShell({
    preview: `${gifterFirst} reserved an Our Fable gift for your family.`,
    eyebrow: `A gift from ${escapeHtml(gifterFirst)}`,
    title: recipientFirst
      ? `${escapeHtml(recipientFirst)}, a gift is waiting for your family.`
      : "A gift is waiting for your family.",
    intro: `<strong>${escapeHtml(gifterName?.trim() || "Someone who loves your family")}</strong> reserved an <strong>${escapeHtml(planLabel)}</strong> gift for you.`,
    body: "Our Fable is a private vault where the people who love your child can leave letters, voice memos, photos, and video over the years, all sealed until a milestone you choose. We saved your spot under this email and will send the claim link as soon as gifting opens.",
    ctaLabel: "See how Our Fable works",
    ctaUrl,
    note: `Your reservation is saved under <strong>${escapeHtml(recipientEmail)}</strong>. If you want the full picture now, the homepage is the best public overview.`,
    footerLine: "You're receiving this because an Our Fable gift was reserved for your email address.",
    unsubscribeUrl,
  });

  const text = `A gift is waiting for your family.

${gifterName?.trim() || "Someone who loves your family"} reserved an ${planLabel} gift for you.

Our Fable is a private vault where the people who love your child can leave letters, voice memos, photos, and video over the years, all sealed until a milestone you choose.

We saved your spot under ${recipientEmail}. When gifting opens, we'll email you with the next step to claim it.

See how Our Fable works: ${ctaUrl}

You're receiving this because an Our Fable gift was reserved for your email address.
To unsubscribe: ${unsubscribeUrl}`;

  return { subject, html, text };
}
