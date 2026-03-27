/**
 * OurFable Monthly Prompt Delivery
 * Runs on the 1st of each month. For each active family:
 * - For each active child, picks an age-appropriate question
 * - Sends email via Resend API to circle members
 * - If a member is in multiple children's circles, they get separate staggered emails
 * - Logs dispatch in ourfable_dispatches table
 * - Tracks inactivity: increments consecutiveMissed if no response in ~35 days
 */

import { internalAction } from "./_generated/server";

const CONVEX_URL = process.env.CONVEX_URL ?? "https://rightful-eel-502.convex.cloud";

// Rotating general questions (used as fallback / family-level)
const MONTHLY_QUESTIONS = [
  "What's one thing about your child's personality that surprised you this month?",
  "Describe a moment from this month you never want to forget.",
  "What made you laugh the hardest this month?",
  "What's something your child did for the first time?",
  "If you could freeze one moment from this month, which would it be?",
  "What song reminds you of this time in your child's life?",
  "What's something your child loves right now that you want to remember?",
  "Describe your child's favorite game or activity this month.",
  "What's the funniest thing your child said or did?",
  "What are you most grateful for about your family this month?",
  "What was the hardest part of this month? How did you get through it?",
  "Write a short note to your child about who they are right now.",
];

// Age-appropriate question banks
const INFANT_QUESTIONS = [
  "What does {childName} smell like right now — and will you remember it in 10 years?",
  "Describe a morning with {childName} in as much detail as you can.",
  "What sound does {childName} make that you never want to forget?",
  "What are {childName}'s hands like right now — tiny, chubby, curious?",
  "What do you do to soothe {childName}? Describe the ritual.",
];

const TODDLER_QUESTIONS = [
  "What word or phrase does {childName} say that you hope they never stop saying?",
  "Describe {childName}'s laugh. When does it happen?",
  "What is {childName} obsessed with right now?",
  "What does a typical bedtime look like for {childName}?",
  "What does {childName} do that surprises you every time?",
];

const CHILD_QUESTIONS = [
  "What is {childName} learning about the world right now?",
  "What does {childName} ask questions about most?",
  "Describe {childName}'s best friend and what makes them good for each other.",
  "What made {childName} proudest this month?",
  "What does {childName} say they want to be when they grow up?",
];

function getAgeInMonths(dob: string): number {
  const birth = new Date(dob + "T00:00:00");
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function pickQuestion(childName: string, childDob: string, seed: number): string {
  const ageMonths = getAgeInMonths(childDob);
  let pool: string[];
  if (ageMonths < 12) {
    pool = INFANT_QUESTIONS;
  } else if (ageMonths < 36) {
    pool = TODDLER_QUESTIONS;
  } else if (ageMonths < 96) {
    pool = CHILD_QUESTIONS;
  } else {
    pool = MONTHLY_QUESTIONS;
  }
  const question = pool[seed % pool.length];
  return question.replace(/\{childName\}/g, childName.split(" ")[0]);
}

async function convexQuery(path: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

async function convexMutation(path: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Convex-Client": "npm-1.34.0",
    },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
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

function buildPromptEmail(
  childFirst: string,
  monthName: string,
  question: string,
  skipOpts?: { memberId: string; token: string; promptId: string },
): string {
  const skipLink = skipOpts
    ? `\n  <p style="margin:32px 0 0;text-align:center;"><a href="https://ourfable.ai/api/ourfable/skip-prompt?token=${encodeURIComponent(skipOpts.token)}&memberId=${encodeURIComponent(skipOpts.memberId)}&promptId=${encodeURIComponent(skipOpts.promptId)}" style="font-size:12px;color:#9A9590;text-decoration:none;">Skip this month — I'll be back next time</a></p>`
    : "";
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;padding:48px 24px;background:#F5F2ED;">
  <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
    <div style="background:#4A5E4C;height:3px;"></div>
    <div style="padding:40px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">${monthName} Prompt</p>
      <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:24px;color:#1A1A1A;line-height:1.3;">${childFirst}'s monthly question</h2>
      <div style="background:#F8F5F0;border:1px solid #E0DDD7;border-radius:12px;padding:24px;margin:0 0 28px;">
        <p style="margin:0;font-family:Georgia,serif;font-size:18px;color:#1A1A1A;line-height:1.6;font-style:italic;">"${question}"</p>
      </div>
      <p style="margin:0 0 24px;font-size:15px;color:#4A4A4A;line-height:1.7;">Take a few minutes to reflect. Your answer becomes part of ${childFirst}'s story — sealed until they're ready.</p>
      <a href="https://ourfable.ai/login" style="display:inline-block;padding:13px 28px;background:#4A5E4C;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px;">Answer now →</a>${skipLink}
    </div>
  </div>
  <p style="text-align:center;margin-top:24px;font-size:11px;color:#A09890;">${childFirst} · ourfable.ai · <a href="https://ourfable.ai/unsubscribe" style="color:#A09890;">unsubscribe</a></p>
</div>`;
}

function buildInactivityEmailToMember(memberName: string, childFirst: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;padding:48px 24px;background:#F5F2ED;">
  <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
    <div style="background:#4A5E4C;height:3px;"></div>
    <div style="padding:40px;">
      <h2 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;color:#1A1A1A;line-height:1.3;">Hi ${memberName},</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#4A4A4A;line-height:1.7;">We noticed you haven't responded to the last couple of prompts for ${childFirst}.</p>
      <p style="margin:0 0 16px;font-size:15px;color:#4A4A4A;line-height:1.7;">No pressure at all — life gets busy. But ${childFirst}'s parents would love to hear from you when you're ready.</p>
      <a href="https://ourfable.ai/login" style="display:inline-block;padding:13px 28px;background:#4A5E4C;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px;">Share something for ${childFirst} →</a>
    </div>
  </div>
  <p style="text-align:center;margin-top:24px;font-size:11px;color:#A09890;">${childFirst} · ourfable.ai · <a href="https://ourfable.ai/unsubscribe" style="color:#A09890;">unsubscribe</a></p>
</div>`;
}

function buildInactivityEmailToParent(memberName: string, relationship: string, childFirst: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;padding:48px 24px;background:#F5F2ED;">
  <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
    <div style="background:#4A5E4C;height:3px;"></div>
    <div style="padding:40px;">
      <h2 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;color:#1A1A1A;line-height:1.3;">A heads up about ${memberName}</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#4A4A4A;line-height:1.7;">Heads up — ${memberName} (${relationship}) hasn't responded to the last 2 monthly prompts for ${childFirst}.</p>
      <p style="margin:0 0 16px;font-size:15px;color:#4A4A4A;line-height:1.7;">They might just be busy, but we wanted you to know. You can reach out to check in.</p>
    </div>
  </div>
  <p style="text-align:center;margin-top:24px;font-size:11px;color:#A09890;">${childFirst} · ourfable.ai</p>
</div>`;
}

export const sendMonthlyPrompts = internalAction({
  args: {},
  handler: async () => {
    const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY;
    if (!RESEND_API_KEY) {
      console.error("[ourfableMonthly] RESEND_FULL_API_KEY not set — skipping");
      return;
    }

    // Get all active families
    const families = (await convexQuery("ourfable:listActiveOurFableFamilies", {})) as Array<{
      familyId: string;
      email: string;
      childName: string;
      birthDate?: string;
    }> | null;

    if (!families || families.length === 0) {
      console.log("[ourfableMonthly] No active families found");
      return;
    }

    const now = new Date();
    const monthIndex = (now.getFullYear() * 12 + now.getMonth());
    const monthName = now.toLocaleString("en-US", { month: "long" });

    console.log(`[ourfableMonthly] Processing ${families.length} families`);

    for (const family of families) {
      try {
        // Get active children for this family
        const children = (await convexQuery("ourfable:listActiveChildrenForFamily", {
          familyId: family.familyId,
        })) as Array<{ childId: string; childName: string; childDob: string }> | null;

        // If no children in the new table, fall back to the family record itself (backward compat)
        const childList = children && children.length > 0
          ? children
          : [{
              childId: family.familyId,
              childName: family.childName,
              childDob: family.birthDate ?? "",
            }];

        // Track emails already sent this run to avoid same-day duplicates to multi-child circle members
        const emailsSentThisRun = new Set<string>();

        for (let childIndex = 0; childIndex < childList.length; childIndex++) {
          const child = childList[childIndex];
          const childFirst = child.childName.split(" ")[0];
          const question = pickQuestion(child.childName, child.childDob, monthIndex + childIndex);

          type CircleMember = {
            _id: string;
            email: string;
            name: string;
            relationship: string;
            promptFrequency?: string;
            consecutiveMissed?: number;
            lastRespondedAt?: number;
            inviteToken?: string;
          };

          // Get circle members for this child
          let members: CircleMember[] | null = null;

          if (children && children.length > 0) {
            members = (await convexQuery("ourfable:listOurFableCircleMembersForChild", {
              familyId: family.familyId,
              childId: child.childId,
            })) as CircleMember[] | null;
          } else {
            // Backward compat: use family-level circle
            members = (await convexQuery("ourfable:listOurFableCircleMembers", {
              familyId: family.familyId,
            })) as CircleMember[] | null;
          }

          // Collect recipients (family email + circle members)
          const recipients: Array<{ email: string; name: string; skipOpts?: { memberId: string; token: string; promptId: string } }> = [];

          // Always include family email for first child
          if (childIndex === 0) {
            recipients.push({ email: family.email, name: "Parent" });
          }

          if (members) {
            for (const m of members) {
              // Skip paused members
              if (m.promptFrequency === "paused") continue;
              // Skip quarterly members on non-quarterly months (send in Jan, Apr, Jul, Oct)
              if (m.promptFrequency === "quarterly") {
                const month = now.getMonth(); // 0-indexed
                if (![0, 3, 6, 9].includes(month)) continue;
              }

              // ── Inactivity tracking ────────────────────────────────────────
              // Check if the member responded in the last ~35 days (since last prompt)
              const thirtyFiveDaysAgo = Date.now() - 35 * 24 * 60 * 60 * 1000;
              const respondedRecently = m.lastRespondedAt && m.lastRespondedAt > thirtyFiveDaysAgo;

              if (!respondedRecently) {
                // Member did NOT respond to last prompt — increment consecutiveMissed
                const newMissed = (m.consecutiveMissed ?? 0) + 1;
                await convexMutation("ourfable:updateOurFableCircleMemberInactivity", {
                  memberId: m._id,
                  consecutiveMissed: newMissed,
                });

                // If >= 2 consecutive misses, send inactivity notifications
                if (newMissed >= 2) {
                  // Email to circle member
                  if (m.email) {
                    try {
                      await sendEmail(
                        RESEND_API_KEY,
                        m.email,
                        `A note from ${childFirst}'s vault`,
                        buildInactivityEmailToMember(m.name, childFirst),
                      );
                      console.log(`[ourfableMonthly] 📨 Inactivity email sent to circle member ${m.email} (missed: ${newMissed})`);
                    } catch (err) {
                      console.error(`[ourfableMonthly] Failed to send inactivity email to ${m.email}:`, err);
                    }
                  }

                  // Email to parent
                  try {
                    await sendEmail(
                      RESEND_API_KEY,
                      family.email,
                      `${m.name} hasn't responded to recent prompts`,
                      buildInactivityEmailToParent(m.name, m.relationship, childFirst),
                    );
                    console.log(`[ourfableMonthly] 📨 Inactivity notification sent to parent ${family.email} about ${m.name}`);
                  } catch (err) {
                    console.error(`[ourfableMonthly] Failed to send parent inactivity notification:`, err);
                  }
                }
              } else {
                // Member responded — reset consecutiveMissed if it was > 0
                if ((m.consecutiveMissed ?? 0) > 0) {
                  await convexMutation("ourfable:updateOurFableCircleMemberInactivity", {
                    memberId: m._id,
                    consecutiveMissed: 0,
                  });
                }
              }
              // ── End inactivity tracking ────────────────────────────────────

              if (m.email) {
                // Build a stable promptId from question content (hash-like slug)
                const promptId = Buffer.from(question).toString("base64").slice(0, 16);
                recipients.push({
                  email: m.email,
                  name: m.name,
                  skipOpts: m.inviteToken
                    ? { memberId: m._id, token: m.inviteToken, promptId }
                    : undefined,
                });
              }
            }
          }

          // Send emails — deduplicate within same run
          const sentToList: string[] = [];
          for (const recipient of recipients) {
            const dedupeKey = `${recipient.email}:${child.childId}`;
            if (emailsSentThisRun.has(dedupeKey)) continue;
            emailsSentThisRun.add(dedupeKey);

            const html = buildPromptEmail(childFirst, monthName, question, recipient.skipOpts);
            await sendEmail(
              RESEND_API_KEY,
              recipient.email,
              `${monthName} prompt for ${childFirst}'s vault`,
              html,
            );
            sentToList.push(recipient.email);
          }

          if (sentToList.length > 0) {
            // Log dispatch
            await convexMutation("ourfable:createOurFableDispatchForChild", {
              familyId: family.familyId,
              childId: child.childId !== family.familyId ? child.childId : undefined,
              type: "monthly_prompt",
              content: question,
              sentTo: sentToList.join(", "),
            });

            console.log(`[ourfableMonthly] ✅ ${family.familyId} / child=${childFirst}: sent to ${sentToList.length} recipients`);
          }
        }
      } catch (err) {
        console.error(`[ourfableMonthly] Error for family ${family.familyId}:`, err);
      }
    }
  },
});
