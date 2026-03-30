import { escapeHtml } from "./escape-html";

/**
 * dispatch.ts — Email template for Dispatches (parent → circle member)
 *
 * Used when a parent sends a dispatch (text/photo/voice/video) to
 * selected circle members. The email IS the dispatch for text/photo/voice.
 * Video uses the branded viewer page for playback.
 */

interface DispatchEmailOptions {
  recipientName: string;
  childName: string;
  sentByName: string;
  subject: string;
  body: string;
  mediaUrls?: string[];
  mediaType?: "photo" | "voice" | "video" | string;
  viewUrl?: string; // branded view page URL (used for video)
  unsubscribeUrl?: string;
}

function firstWord(name: string): string {
  return name.split(" ")[0];
}

function formatBody(body: string): string {
  if (!body.trim()) return "";
  return body
    .split("\n")
    .map(line =>
      line.trim() === ""
        ? "<div style='height:12px;'></div>"
        : `<p style="margin:0 0 14px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:16px;color:#3A3A38;line-height:1.8;">${escapeHtml(line)}</p>`
    )
    .join("");
}

function mediaBlock(mediaUrls: string[], mediaType: string, childFirst: string, viewUrl?: string): string {
  if (!mediaUrls || mediaUrls.length === 0) return "";

  if (mediaType === "photo") {
    return mediaUrls.map(url => `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
        <tr>
          <td style="border-radius:14px;overflow:hidden;line-height:0;">
            <img src="${escapeHtml(url)}" alt="Photo from ${escapeHtml(childFirst)}'s family" 
              style="width:100%;max-width:100%;border-radius:14px;display:block;border:none;" />
          </td>
        </tr>
      </table>`).join("");
  }

  if (mediaType === "voice") {
    return mediaUrls.map(url => `
      <table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
        <tr>
          <td style="background:#F0EDE7;border-radius:12px;border:1px solid #E0DDD7;">
            <a href="${escapeHtml(url)}" style="display:inline-flex;align-items:center;gap:10px;padding:14px 24px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;color:#4A5E4C;text-decoration:none;letter-spacing:-0.01em;">
              <span style="font-size:18px;">🎙</span> Listen to voice message
            </a>
          </td>
        </tr>
      </table>`).join("");
  }

  if (mediaType === "video") {
    const href = viewUrl || mediaUrls[0];
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
        <tr>
          <td>
            <a href="${escapeHtml(href)}" style="display:block;text-decoration:none;">
              <div style="background:linear-gradient(180deg,#2F3A32 0%,#171A18 100%);border:1px solid #2A312D;border-radius:16px;padding:30px 24px;">
                <div style="width:74px;height:74px;border-radius:999px;background:rgba(253,251,247,0.14);border:1px solid rgba(253,251,247,0.22);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;">
                  <span style="font-size:28px;line-height:1;color:#FFFFFF;">▶</span>
                </div>
                <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#FDFBF7;text-align:center;line-height:1.3;">
                  Video from ${escapeHtml(childFirst)}&rsquo;s family
                </p>
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:rgba(253,251,247,0.78);text-align:center;line-height:1.7;">
                  Open the Our Fable viewer to watch the full video.
                </p>
              </div>
            </a>
          </td>
        </tr>
      </table>`;
  }

  return "";
}

export function dispatchEmail({
  recipientName,
  childName,
  sentByName,
  subject,
  body,
  mediaUrls = [],
  mediaType = "",
  viewUrl,
  unsubscribeUrl = "https://ourfable.ai/unsubscribe",
}: DispatchEmailOptions): { subject: string; html: string; text: string } {
  const rFirst = firstWord(recipientName);
  const cFirst = firstWord(childName);
  const sFirst = firstWord(sentByName);

  const emailSubject = `${subject} — from ${cFirst}`;
  const previewText = `${sFirst} shared something with you from ${cFirst}'s family.`;

  const html = `<!DOCTYPE html>
<html lang="en" style="color-scheme:light;">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
  <title>${emailSubject}</title>
  <style>
    :root { color-scheme: light; }
    body { margin:0;padding:0;background-color:#FDFBF7 !important; }
    @media (max-width:600px) {
      .card-pad { padding:28px 24px !important; }
      .outer-pad { padding:24px 16px 40px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#FDFBF7;-webkit-text-size-adjust:100%;" bgcolor="#FDFBF7">

  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(previewText)}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FDFBF7" style="background-color:#FDFBF7;">
    <tr>
      <td align="center" class="outer-pad" style="padding:48px 20px 60px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#4A5E4C;letter-spacing:-0.01em;">Our Fable</span>
              <div style="width:32px;height:1.5px;background:#C8A87A;margin:10px auto 0;"></div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;box-shadow:0 4px 24px rgba(0,0,0,0.05);">

              <!-- Green top bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="background:#4A5E4C;height:4px;border-radius:20px 20px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <!-- Header -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="card-pad" style="padding:36px 44px 24px;">
                    <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">For ${escapeHtml(rFirst)}</p>
                    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1A1A18;line-height:1.25;">
                      Hi — it&rsquo;s ${escapeHtml(cFirst)}.
                    </h1>
                    <p style="margin:14px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6A6660;line-height:1.7;">
                      ${escapeHtml(sentByName)} wanted you to see this.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0 44px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #F0ECE6;height:1px;font-size:0;">&nbsp;</td></tr></table></td></tr>
              </table>

              <!-- Subject + body + media -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="card-pad" style="padding:28px 44px 36px;">
                    <h2 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:400;color:#1A1A18;line-height:1.35;">${escapeHtml(subject)}</h2>
                    ${formatBody(body)}
                    ${mediaBlock(mediaUrls, mediaType, cFirst, viewUrl)}
                    ${mediaType === "video" && viewUrl ? `
                      <table cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
                        <tr>
                          <td style="background:#4A5E4C;border-radius:12px;">
                            <a href="${escapeHtml(viewUrl)}" style="display:inline-block;padding:15px 24px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:-0.01em;">
                              Watch full video
                            </a>
                          </td>
                        </tr>
                      </table>
                    ` : ""}
                  </td>
                </tr>
              </table>

              <!-- Footer inside card -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0 44px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #F0ECE6;height:1px;font-size:0;">&nbsp;</td></tr></table></td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="card-pad" style="padding:20px 44px 28px;">
                    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9A9590;line-height:1.7;">
                      This is private — just for ${escapeHtml(cFirst)}&rsquo;s circle. Not on social media, not shared anywhere else.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Outer footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A09890;">
                Sent by ${escapeHtml(sentByName)} &middot; <a href="https://ourfable.ai" style="color:#A09890;text-decoration:none;">ourfable.ai</a>
              </p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A09890;">
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:#A09890;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  const mediaTextBlock = (() => {
    if (!mediaUrls || mediaUrls.length === 0) return "";
    if (mediaType === "photo") return `\n\n📷 Photo attached: ${mediaUrls.join(", ")}`;
    if (mediaType === "voice") return `\n\n🎙 Listen: ${mediaUrls.join(", ")}`;
    if (mediaType === "video") return `\n\n▶ Watch full video: ${viewUrl || mediaUrls[0]}`;
    return "";
  })();

  const text = `Hi ${rFirst} — ${sentByName} shared something from ${cFirst}'s family.\n\n${subject}\n\n${body}${mediaTextBlock}\n\n---\nThis is private — just for ${cFirst}'s circle.\nSent by ${sentByName} via Our Fable · ourfable.ai\nUnsubscribe: ${unsubscribeUrl}`;

  return { subject: emailSubject, html, text };
}
