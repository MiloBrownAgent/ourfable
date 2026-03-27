export function waitlistWelcomeEmail(childName?: string): { subject: string; html: string; text: string } {
  const name = childName?.trim()?.split(/\s+/)[0];
  const subject = name
    ? `We're getting ${name}'s vault ready.`
    : "You're in — we'll be in touch.";

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
              <div style="width:40px;height:2px;background:#C8A87A;margin:14px auto 0;"></div>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#FFFFFF !important;border-radius:20px;padding:52px 52px 44px;border:1px solid #E8E2D8;box-shadow:0 8px 40px rgba(0,0,0,0.06);">

              <!-- Headline -->
              <h1 style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:800;line-height:1.15;letter-spacing:-0.02em;color:#1A1A18;">
                ${name ? `${name}'s vault` : "Your vault"}<br />
                <em style="color:#4A5E4C;font-style:italic;">is waiting.</em>
              </h1>

              <!-- Intro -->
              <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.8;color:#4A4A45;">
                You just did something most parents never think to do —
                you started building a record of everyone who loves ${name || "your child"},
                before ${name ? "they're" : "they're"} old enough to ask.
              </p>

              <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.8;color:#4A4A45;">
                Every month, Our Fable asks the people in ${name ? name + "'s" : "your child's"} circle a question
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
                          <p style="margin:0;font-size:15px;line-height:1.7;color:#1A1A18;font-weight:600;">Monthly World Snapshots</p>
                          <p style="margin:4px 0 0;font-size:14px;line-height:1.65;color:#6B6B65;">Every month of their life, captured — the top news story, the #1 song, the weather. At 18, they'll have 216 of them.</p>
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
                          <p style="margin:0;font-size:15px;line-height:1.7;color:#1A1A18;font-weight:600;">The Day They Were Born</p>
                          <p style="margin:4px 0 0;font-size:14px;line-height:1.65;color:#6B6B65;">A permanent front page for their birthday. Everything that was happening in the world on the exact day they arrived.</p>
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
              <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.75;color:#4A4A45;">
                We're opening Our Fable to founding families first — limited to 1,000 families.
                As a founding member, your rate is locked for life: <strong style="color:#1A1A18;">$79/year</strong> (regular $99/year).
                You're on the list. We'll be in touch when ${name ? name + "'s" : "your"} vault is ready.
              </p>

              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#4A5E4C;border-radius:100px;padding:16px 36px;">
                    <a href="mailto:?subject=${encodeURIComponent("You need to see this — Our Fable")}&body=${encodeURIComponent("I just signed up for Our Fable — it's a vault where the people who love your child leave letters, voice memos, photos, and video, all sealed until they're old enough to read them.\n\nThey're only opening it to 1,000 founding families and the rate is locked for life.\n\nCheck it out: https://ourfable.ai")}" style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:-0.01em;">
                      Know someone who'd love this? →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#9A9590;">ourfable.ai · Private by design. For families. Not followers.</p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9A9590;">
                You're receiving this because you joined the Our Fable waitlist at
                <a href="https://ourfable.ai" style="color:#9A9590;">ourfable.ai</a>.<br />
                <a href="https://ourfable.ai/unsubscribe" style="color:#9A9590;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `Our Fable — ${name ? name + "'s" : "Your"} vault is waiting.

Someone who loves ${name || "your child"} is going to write them a letter today. They don't know it yet — but when the time comes, they will.

Every month, Our Fable asks the people in ${name ? name + "'s" : "your child's"} circle a question tailored to who they are. Grandma gets a different question than the uncle. The old family friend gets a different question than the neighbor.

What's being built for them:

• The Vault — Every letter, photo, voice memo, and video, sealed. Some open at 13. Some at 18. Some on the wedding day.

• Monthly World Snapshots — Every month of their life captured. At 18, they'll have 216 of them.

• The Day They Were Born — A permanent front page for their birthday.

"Imagine your child at 18, opening a voice memo from their great-grandmother — recorded when they were 9 months old. Their great-grandmother, who is no longer alive. Telling them how she wants to be remembered."

We're opening Our Fable to founding families first — limited to 1,000 families. As a founding member, your rate is locked for life: $79/year (regular $99/year). You're on the list. We'll be in touch when your vault is ready.

Know someone who'd love this? Forward this email or send them to https://ourfable.ai

—
Our Fable · ourfable.ai
You're receiving this because you joined the Our Fable waitlist.
To unsubscribe, reply with "unsubscribe."`;

  return { subject, html, text };
}
