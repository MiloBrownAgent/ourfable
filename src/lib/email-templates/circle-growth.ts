import { escapeHtml } from "./escape-html";

const RESERVE_URL = "https://ourfable.ai/for-your-family";

export function circleGrowthHtml(options: {
  title?: string;
  body: string;
  ctaLabel?: string;
  reserveUrl?: string;
}): string {
  const title = options.title ?? "For your own family";
  const ctaLabel = options.ctaLabel ?? "Start your family's vault";
  const reserveUrl = options.reserveUrl ?? RESERVE_URL;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr>
        <td style="background:#F8F5F0;border:1px solid #E0DDD7;border-radius:16px;padding:22px 24px;">
          <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">${escapeHtml(title)}</p>
          <p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6B6860;line-height:1.75;">${escapeHtml(options.body)}</p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#FFFFFF;border:1px solid #D8D2C7;border-radius:999px;">
                <a href="${escapeHtml(reserveUrl)}" style="display:inline-block;padding:12px 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#4A5E4C;text-decoration:none;letter-spacing:-0.01em;">${escapeHtml(ctaLabel)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export function circleGrowthText(body: string, reserveUrl: string = RESERVE_URL): string {
  return `${body}\n\nStart your family's vault: ${reserveUrl}`;
}
