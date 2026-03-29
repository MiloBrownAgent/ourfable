/**
 * Storage warning system — checks storage usage after each upload
 * and sends threshold emails via Resend. Tracks warnings in Convex
 * to only send each threshold email once per family.
 */

import { convexQuery, convexMutation } from "@/lib/convex";

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? "";

interface StorageInfo {
  usedBytes: number;
  limitBytes: number;
  warned80?: boolean;
  warned95?: boolean;
}

interface Family {
  childName: string;
  familyName?: string;
  email?: string;
  parentEmail?: string;
  plan?: string;
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: "Our Fable <hello@ourfable.ai>",
      to,
      subject,
      html,
      headers: {
        "List-Unsubscribe": "<https://ourfable.ai/unsubscribe>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
}

function warningEmailHtml({
  childFirst,
  percent,
  isAlmostFull,
}: {
  childFirst: string;
  percent: number;
  isAlmostFull: boolean;
}): string {
  const headline = isAlmostFull
    ? `${childFirst}'s vault is almost full`
    : `${childFirst}'s vault is filling up`;

  const body = isAlmostFull
    ? `You've used ${percent}% of your storage. New photos, videos, and voice memos may not fit. Upgrade to Our Fable+ for 25 GB of storage — room for years of memories.`
    : `You've used ${percent}% of your vault storage. As ${childFirst}'s circle grows, photos and videos add up fast. Upgrade to Our Fable+ for 25 GB — five times the space.`;

  return `<!DOCTYPE html>
<html lang="en" style="color-scheme:light;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F2ED;-webkit-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F2ED" style="background-color:#F5F2ED;padding:48px 20px 56px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:400;color:#6B7C6E;letter-spacing:0.2em;text-transform:uppercase;">Our Fable</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #EAE7E1;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="background-color:#4A5E4C;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 40px 32px;">
                    <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1A1A1A;line-height:1.3;">
                      ${headline}
                    </p>
                    <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.75;">
                      ${body}
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:10px;background-color:#4A5E4C;">
                          <a href="https://ourfable.ai/login" style="display:inline-block;padding:13px 26px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:0.02em;">Upgrade to Our Fable+ &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A09890;line-height:1.8;">
                Our Fable &middot; ourfable.ai
              </p>
              <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#B0A9A0;">
                <a href="https://ourfable.ai/unsubscribe" style="color:#B0A9A0;text-decoration:underline;">Unsubscribe</a>
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

/**
 * Check storage usage and send warning emails if thresholds crossed.
 * Returns { blocked: true } if storage is at 100% and upload should be rejected.
 */
export async function checkStorageWarnings(
  familyId: string,
  fileSize: number
): Promise<{ blocked: boolean; message?: string }> {
  try {
    // Fetch family data
    const family = await convexQuery<Family | null>("ourfable:getFamily", { familyId });
    if (!family) return { blocked: false };

    // Fetch storage info from the OurFable family record
    const ofFamily = await convexQuery<Record<string, unknown> | null>("ourfable:getOurFableFamilyById", { familyId });

    if (!ofFamily) return { blocked: false };

    const usedBytes: number = ofFamily.storageUsedBytes ?? 0;
    const limitBytes: number = ofFamily.storageLimitBytes ?? (5 * 1024 * 1024 * 1024); // default 5GB
    const warned80: boolean = ofFamily.storageWarned80 ?? false;
    const warned95: boolean = ofFamily.storageWarned95 ?? false;

    const newUsedBytes = usedBytes + (fileSize ?? 0);
    const percent = Math.round((newUsedBytes / limitBytes) * 100);

    // Block at 100%
    if (newUsedBytes >= limitBytes) {
      return {
        blocked: true,
        message: `${family.childName.split(" ")[0]}'s vault is full. Upgrade to Our Fable+ for 25 GB of storage and keep the memories coming.`,
      };
    }

    const parentEmail = ofFamily.parentEmail ?? ofFamily.email ?? family.email ?? family.parentEmail;
    if (!parentEmail) return { blocked: false };

    const childFirst = family.childName.split(" ")[0];

    // 95% warning
    if (percent >= 95 && !warned95) {
      await sendEmail({
        to: parentEmail,
        subject: `${childFirst}'s vault is almost full`,
        html: warningEmailHtml({ childFirst, percent, isAlmostFull: true }),
      });
      // Mark warned95 in Convex
      await convexMutation("ourfable:patchOurFableFamily", { familyId, storageWarned95: true });
    }
    // 80% warning
    else if (percent >= 80 && !warned80) {
      await sendEmail({
        to: parentEmail,
        subject: `${childFirst}'s vault is filling up`,
        html: warningEmailHtml({ childFirst, percent, isAlmostFull: false }),
      });
      // Mark warned80 in Convex
      await convexMutation("ourfable:patchOurFableFamily", { familyId, storageWarned80: true });
    }

    return { blocked: false };
  } catch (err) {
    console.error("[storage-warnings] Error checking storage:", err);
    // Don't block uploads if warning system fails
    return { blocked: false };
  }
}
