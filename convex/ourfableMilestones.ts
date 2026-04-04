/**
 * OurFable — Milestone Prompt Engine + Guardian Check-In
 *
 * Cron-driven system that:
 * 1. Checks for due milestone prompts daily at 8 PM CT and emails parents
 * 2. Checks for inactive accounts weekly and notifies guardians
 */

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";



async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_FULL_API_KEY;
  if (!key) {
    console.error("[ourfableMilestones] RESEND_FULL_API_KEY not set — skipping email");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: "Our Fable <hello@ourfable.ai>",
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[ourfableMilestones] Email send failed: ${err}`);
  }
}

// ── Email templates ────────────────────────────────────────────────────────────

function milestonePromptEmail(opts: {
  childName: string;
  parentNames: string;
  title: string;
  promptText: string;
  familyId: string;
}): string {
  const firstName = opts.childName.split(" ")[0];
  const vaultUrl = `https://app.ourfable.ai/${opts.familyId}/vault`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f6f2;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="text-align:center;padding:0 0 24px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#4A5E4C;letter-spacing:-0.01em;">Our Fable</div>
      <div style="width:32px;height:1.5px;background:#C8A87A;margin:10px auto 0;"></div>
    </div>
    <div style="background:#fff;border-radius:16px;padding:40px 36px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
      <p style="margin:0 0 8px;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#7a9c7e;">
        ${firstName}'s milestone
      </p>
      <h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1A1A18;line-height:1.25;">
        ${opts.title}
      </h1>
      <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#555;line-height:1.8;">
        ${opts.promptText}
      </p>
      <a href="${vaultUrl}" style="display:inline-block;padding:14px 28px;background:#4A5E4C;color:#fff;text-decoration:none;border-radius:100px;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;letter-spacing:-0.01em;">
        Write about this moment →
      </a>
      <p style="margin:28px 0 0;font-family:system-ui,sans-serif;font-size:12px;color:#aaa;line-height:1.5;">
        This prompt was sent because ${firstName} just hit a milestone age.<br>
        You're receiving this because you use Our Fable to preserve what matters.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function guardianInactivityEmail(opts: {
  parentName: string;
  childName: string;
  guardianName: string;
}): string {
  const childFirst = opts.childName.split(" ")[0];
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f6f2;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="text-align:center;padding:0 0 24px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#4A5E4C;letter-spacing:-0.01em;">Our Fable</div>
      <div style="width:32px;height:1.5px;background:#C8A87A;margin:10px auto 0;"></div>
    </div>
    <div style="background:#fff;border-radius:16px;padding:40px 36px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
      <p style="margin:0 0 8px;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#7a9c7e;">
        Our Fable
      </p>
      <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#2c3e2d;line-height:1.2;">
        Just checking in
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.7;">
        Hi ${opts.guardianName},
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.7;">
        We're reaching out because ${opts.parentName} hasn't visited ${childFirst}'s vault in a while. We just wanted to make sure everything is okay.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">
        If you have any questions or concerns, just reply to this email — we're here.
      </p>
      <p style="margin:0;font-family:system-ui,sans-serif;font-size:12px;color:#aaa;line-height:1.5;">
        You're receiving this because you were designated as a vault guardian for ${childFirst}'s Our Fable account.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function parentInactivityEmail(opts: {
  parentName: string;
  childName: string;
  familyId: string;
}): string {
  const childFirst = opts.childName.split(" ")[0];
  const vaultUrl = `https://app.ourfable.ai/${opts.familyId}/vault`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f6f2;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="text-align:center;padding:0 0 24px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#4A5E4C;letter-spacing:-0.01em;">Our Fable</div>
      <div style="width:32px;height:1.5px;background:#C8A87A;margin:10px auto 0;"></div>
    </div>
    <div style="background:#fff;border-radius:16px;padding:40px 36px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
      <p style="margin:0 0 8px;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#7a9c7e;">
        Our Fable
      </p>
      <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#2c3e2d;line-height:1.2;">
        ${childFirst}'s circle misses your voice
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.7;">
        We noticed you haven't visited ${childFirst}'s vault recently. No pressure — but ${childFirst}'s circle is waiting to hear from you.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">
        Even a short note means the world.
      </p>
      <a href="${vaultUrl}" style="display:inline-block;padding:14px 28px;background:#4A5E4C;color:#fff;text-decoration:none;border-radius:100px;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;letter-spacing:-0.01em;">
        Open the vault →
      </a>
      <p style="margin:28px 0 0;font-family:system-ui,sans-serif;font-size:12px;color:#aaa;line-height:1.5;">
        You're receiving this because you use Our Fable to preserve what matters.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Type helpers ───────────────────────────────────────────────────────────────

interface FamilyRecord {
  familyId: string;
  email: string;
  childName: string;
  parentNames?: string;
  birthDate?: string;
}

interface MilestonePromptRecord {
  _id: string;
  title: string;
  promptText: string;
  childId?: string;
}

interface ChildRecord {
  childId: string;
  childName: string;
  childDob: string;
}

interface InactiveFamily {
  familyId: string;
  email: string;
  childName: string;
  parentNames?: string;
  facilitator1Name?: string;
  facilitator1Email?: string;
  facilitator2Name?: string;
  facilitator2Email?: string;
}

// ── Main milestone check action (runs daily) ───────────────────────────────────

export const checkMilestonePrompts = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number; sent: number }> => {
    const families = (await ctx.runQuery(
      internal.ourfable.listAllActiveFamiliesInternal, {}
    )) as FamilyRecord[];

    let processed = 0;
    let sent = 0;

    for (const family of families) {
      processed++;
      const parentEmail = family.email;
      if (!parentEmail) continue;

      // Get active children for this family
      let children: ChildRecord[] = [];
      try {
        children = (await ctx.runQuery(internal.ourfable.listActiveChildrenForFamily, {
          familyId: family.familyId,
        })) as ChildRecord[];
      } catch (err) {
        console.error(`[checkMilestonePrompts] Failed to fetch children for ${family.familyId}:`, err);
      }

      // Process children — or fall back to family-level if none
      const targets: Array<{ childId?: string; childName: string }> =
        children.length > 0
          ? children.map((c) => ({ childId: c.childId, childName: c.childName }))
          : [{ childId: undefined, childName: family.childName }];

      for (const target of targets) {
        const duePrompts = (await ctx.runQuery(
          internal.ourfable.getDueMilestonePromptsInternal,
          { familyId: family.familyId, childId: target.childId }
        )) as MilestonePromptRecord[];

        for (const prompt of duePrompts) {
          const html = milestonePromptEmail({
            childName: target.childName,
            parentNames: family.parentNames ?? "",
            title: prompt.title,
            promptText: prompt.promptText,
            familyId: family.familyId,
          });
          await sendEmail(
            parentEmail,
            `${target.childName.split(" ")[0]}'s ${prompt.title}`,
            html
          );

          // Mark as sent
          try {
            await ctx.runMutation(internal.ourfable.markMilestonePromptSent, {
              promptId: prompt._id as any,
            });
          } catch (err) {
            console.error(`[checkMilestonePrompts] Failed to mark prompt ${prompt._id} as sent:`, err);
          }
          sent++;
        }
      }
    }

    console.log(`[checkMilestonePrompts] Processed ${processed} families, sent ${sent} prompts`);
    return { processed, sent };
  },
});

// ── Guardian inactivity check (runs weekly) ────────────────────────────────────

export const checkGuardianInactivity = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number; notified: number }> => {
    const inactiveFamilies = (await ctx.runQuery(
      internal.ourfable.checkInactiveAccountsInternal, {}
    )) as InactiveFamily[];

    let processed = 0;
    let notified = 0;

    for (const family of inactiveFamilies) {
      processed++;
      const parentName = family.parentNames?.split("&")[0]?.trim() ?? "there";
      const childName = family.childName;

      // Email primary guardian
      if (family.facilitator1Email) {
        const html = guardianInactivityEmail({
          parentName,
          childName,
          guardianName: family.facilitator1Name ?? "there",
        });
        await sendEmail(
          family.facilitator1Email,
          `Just checking in — ${childName.split(" ")[0]}'s vault`,
          html
        );
        notified++;
      }

      // Email secondary guardian
      if (family.facilitator2Email) {
        const html = guardianInactivityEmail({
          parentName,
          childName,
          guardianName: family.facilitator2Name ?? "there",
        });
        await sendEmail(
          family.facilitator2Email,
          `Just checking in — ${childName.split(" ")[0]}'s vault`,
          html
        );
        notified++;
      }

      // Gentle nudge to the parent
      if (family.email) {
        const html = parentInactivityEmail({
          parentName,
          childName,
          familyId: family.familyId,
        });
        await sendEmail(
          family.email,
          `${childName.split(" ")[0]}'s circle misses you`,
          html
        );
        notified++;
      }
    }

    console.log(`[checkGuardianInactivity] Processed ${processed} families, sent ${notified} notifications`);
    return { processed, notified };
  },
});
