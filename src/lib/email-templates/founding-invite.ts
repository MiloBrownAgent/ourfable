import { escapeHtml } from "./escape-html";
import { buildUnsubscribeUrl } from "@/lib/unsubscribe-token";

export function foundingInviteEmail({
  parentName,
  childName,
  email,
  unsubscribeUrl,
}: {
  parentName?: string;
  childName?: string;
  email: string;
  unsubscribeUrl?: string;
}): { subject: string; html: string; text: string } {
  const name = parentName?.trim()?.split(/\s+/)[0] || "friend";
  const child = childName?.trim()?.split(/\s+/)[0];
  const subject = `Your Fable is ready, ${name} — time to build something beautiful`;

  const signupParams = new URLSearchParams({ founding: "true", email });
  if (childName) signupParams.set("child", childName.trim());
  const signupUrl = `https://ourfable.ai/signup?${signupParams.toString()}`;
  const unsubscribeHref = unsubscribeUrl ?? buildUnsubscribeUrl(email);

  const ctaLabel = child ? `Create ${child}'s Fable →` : "Create Your Child's Fable →";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Fable is ready.</title>
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
                It's time,<br />
                <em style="color:#4A5E4C;font-style:italic;">${escapeHtml(name)}.</em>
              </h1>

              <!-- Opening -->
              <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.8;color:#4A4A45;">
                We've been building. Testing. Rewriting. And now we're ready.
              </p>

              <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.8;color:#4A4A45;">
                Our Fable is live. Real families are using it. Vaults are filling up with letters, voice memos, photos — sealed until their children are old enough to read them.
              </p>

              <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.8;color:#4A4A45;">
                You signed up early. You believed in this before it existed. That matters.
              </p>

              <!-- Divider -->
              <div style="width:100%;height:1px;background:#E8E2D8;margin:32px 0;"></div>

              <!-- Founding member offer -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 32px;background:#F7F4EE;border-radius:14px;border-left:3px solid #4A5E4C;">
                    <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A8880;">Founding member rate</p>
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.6;color:#1A1A18;">
                      As a founding member, your spot is locked in at <strong>$99/year</strong> <span style="color:#9A9590;text-decoration:line-through;">$149</span>. No one else gets this rate. It's yours for life.
                    </p>
                  </td>
                </tr>
              </table>

              <div style="width:100%;height:1px;background:#E8E2D8;margin:36px 0;"></div>

              <!-- CTA -->
              <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.8;color:#4A4A45;">
                ${child
                  ? `${escapeHtml(child)}'s vault is waiting. Everything you write, everyone you invite — it all starts now.`
                  : "Your child's vault is waiting. Everything you write, everyone you invite — it all starts now."
                }
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#4A5E4C;border-radius:100px;padding:16px 36px;">
                    <a href="${signupUrl}" style="font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:-0.01em;">
                      ${escapeHtml(ctaLabel)}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#9A9590;text-align:center;line-height:1.6;">
                This link is unique to you. Takes about 3 minutes.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#9A9590;">ourfable.ai · Private by design. For families. Not followers.</p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#9A9590;">
                You're receiving this because you joined the Our Fable waitlist at
                <a href="https://ourfable.ai" style="color:#9A9590;">ourfable.ai</a>.<br />
                <a href="${escapeHtml(unsubscribeHref)}" style="color:#9A9590;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `Your Fable is ready, ${name}.

We've been building. Testing. Rewriting. And now we're ready.

Our Fable is live. Real families are using it. Vaults are filling up with letters, voice memos, photos — sealed until their children are old enough to read them.

You signed up early. You believed in this before it existed. That matters.

---

FOUNDING MEMBER RATE
As a founding member, your spot is locked in at $99/year (normally $149). No one else gets this rate. It's yours for life.

---

${child ? `${child}'s vault is waiting.` : "Your child's vault is waiting."} Everything you write, everyone you invite — it all starts now.

${ctaLabel}
${signupUrl}

This link is unique to you. Takes about 3 minutes.

—
Our Fable · ourfable.ai · Private by design. For families. Not followers.
You're receiving this because you joined the Our Fable waitlist.
To unsubscribe: ${unsubscribeHref}`;

  return { subject, html, text };
}
