import { escapeHtml } from "./escape-html";
import { buildUnsubscribeUrl } from "@/lib/unsubscribe-token";

export function waitlistWelcomeEmail(email?: string, unsubscribeUrl?: string): { subject: string; html: string; text: string } {
  const subject = "You're in — we'll be in touch.";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your vault is waiting.</title>
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <style>:root { color-scheme: light only; } body { background-color: #FDFBF7 !important; color: #1A1A18 !important; }</style>
</head>
<body style="margin:0;padding:0;background:#FDFBF7;font-family:Georgia,'Times New Roman',serif;" bgcolor="#FDFBF7">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 40px;text-align:center;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#4A5E4C;letter-spacing:-0.01em;">Our Fable</p>
              <div style="width:32px;height:1.5px;background:#C8A87A;margin:10px auto 0;"></div>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#FFFFFF !important;border-radius:20px;padding:52px 52px 44px;border:1px solid #E8E2D8;box-shadow:0 8px 40px rgba(0,0,0,0.06);">

              <!-- Headline -->
              <h1 style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;line-height:1.25;color:#1A1A18;">
                Your vault<br />
                <em style="color:#4A5E4C;font-style:italic;">is waiting.</em>
              </h1>

              <!-- Intro -->
              <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.8;color:#4A4A45;">
                You just did something most parents never think to do —
                you started building a record of everyone who loves your child,
                before they&apos;re old enough to ask.
              </p>

              <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.8;color:#4A4A45;">
                Every month, Our Fable asks the people in your child&apos;s circle a question
                tailored to who they are. Grandma gets a different question than the uncle.
                The old family friend gets a different question than the neighbor.
                All they have to do is reply.
              </p>

              <!-- Divider -->
              <div style="width:100%;height:1px;background:#E8E2D8;margin:32px 0;"></div>

              <!-- Teaser feature list -->
              <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A8880;">What's being built for them</p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;vertical-align:top;padding-top:3px;">
                          <div style="width:8px;height:8px;border-radius:50%;background:#4A5E4C;margin-top:6px;"></div>
                        </td>
                        <td>
                          <p style="margin:0;font-size:15px;line-height:1.7;color:#1A1A18;font-weight:600;">The Vault</p>
                          <p style="margin:4px 0 0;font-size:14px;line-height:1.65;color:#6B6B65;">Every letter, photo, voice memo, and video — sealed. Some open at 13. Some at 18. Some on the wedding day. The people who love them, speaking across time.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;vertical-align:top;padding-top:3px;">
                          <div style="width:8px;height:8px;border-radius:50%;background:#4A5E4C;margin-top:6px;"></div>
                        </td>
                        <td>
                          <p style="margin:0;font-size:15px;line-height:1.7;color:#1A1A18;font-weight:600;">The Day They Were Born</p>
                          <p style="margin:4px 0 0;font-size:14px;line-height:1.65;color:#6B6B65;">A permanent front page for their birthday — the headlines, weather, and cultural details from the exact day they arrived.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;vertical-align:top;padding-top:3px;">
                          <div style="width:8px;height:8px;border-radius:50%;background:#4A5E4C;margin-top:6px;"></div>
                        </td>
                        <td>
                          <p style="margin:0;font-size:15px;line-height:1.7;color:#1A1A18;font-weight:600;">Private family updates in Our Fable+</p>
                          <p style="margin:4px 0 0;font-size:14px;line-height:1.65;color:#6B6B65;">Send Dispatches to grandparents, aunts, uncles, and family friends without a group chat.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="width:100%;height:1px;background:#E8E2D8;margin:36px 0;"></div>

              <!-- Pull quote -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 32px;background:#F7F4EE;border-radius:14px;border-left:3px solid #4A5E4C;">
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;line-height:1.8;color:#1A1A18;">
                      "Imagine your child at 18, opening a voice memo from their great-grandmother — recorded when they were 9 months old.
                      <br /><br />
                      Their great-grandmother, who is no longer alive.
                      <br /><br />
                      Telling them how she wants to be remembered."
                    </p>
                  </td>
                </tr>
              </table>

              <div style="width:100%;height:1px;background:#E8E2D8;margin:36px 0;"></div>

              <!-- CTA -->
              <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.8;color:#4A4A45;">
                We&apos;re opening Our Fable to founding families first. Your place is saved, and we&apos;ll be in touch as soon as your vault is ready.
              </p>

              <div style="padding:22px 24px;background:#F7F4EE;border:1px solid #E8E2D8;border-radius:14px;">
                <p style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A8880;">If someone comes to mind</p>
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.75;color:#6B6B65;">
                  If you know another family who would treasure something like this, you can simply forward them to <a href="https://ourfable.ai" style="color:#4A5E4C;text-decoration:underline;">ourfable.ai</a> when the time feels right.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#9A9590;">ourfable.ai · Private by design. For families. Not followers.</p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9A9590;">
                You're receiving this because you joined the Our Fable waitlist at
                <a href="https://ourfable.ai" style="color:#9A9590;">ourfable.ai</a>.<br />
                <a href="${escapeHtml(unsubscribeUrl ?? (email ? buildUnsubscribeUrl(email) : "https://ourfable.ai/unsubscribe"))}" style="color:#9A9590;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `Our Fable — Your vault is waiting.

Someone who loves your child is going to write them a letter today. They don't know it yet — but when the time comes, they will.

Every month, Our Fable asks the people in your child's circle a question tailored to who they are. Grandma gets a different question than the uncle. The old family friend gets a different question than the neighbor.

What's being built for them:

• The Vault — Every letter, photo, voice memo, and video, sealed. Some open at 13. Some at 18. Some on the wedding day.

• The Day They Were Born — Every month of their life captured. At 18, they'll have 216 of them.

• The Day They Were Born — A permanent front page for their birthday.

• Private family Dispatches in Our Fable+ — send updates to the people who love them without a group chat.

"Imagine your child at 18, opening a voice memo from their great-grandmother — recorded when they were 9 months old. Their great-grandmother, who is no longer alive. Telling them how she wants to be remembered."

We're opening Our Fable to founding families first. Your place is saved, and we'll be in touch when your vault is ready.

If someone comes to mind, you can always send them to https://ourfable.ai when the time feels right.

—
Our Fable · ourfable.ai
You're receiving this because you joined the Our Fable waitlist.
To unsubscribe: ${unsubscribeUrl ?? (email ? buildUnsubscribeUrl(email) : "https://ourfable.ai/unsubscribe")}`;

  return { subject, html, text };
}
