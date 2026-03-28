#!/usr/bin/env npx tsx
// ─────────────────────────────────────────────────────────────────────────────
// Friends & Family Invite Script
//
// Reads scripts/friends-list.json, creates comped accounts via the admin API,
// and sends personalized welcome emails via Resend.
//
// Usage:  npx tsx scripts/invite-friends.ts
//         npx tsx scripts/invite-friends.ts --dry-run
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from "fs";
import { resolve } from "path";

// ── Types ────────────────────────────────────────────────────────────────────

interface Friend {
  email: string;
  childName: string;
  childDob: string;
  parentNames: string;
  password: string;
}

interface CompAccountResponse {
  success?: boolean;
  familyId?: string;
  error?: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? ""; // ⚠️ do NOT hardcode — use env var
const ADMIN_SECRET = process.env.OURFABLE_ADMIN_SECRET ?? ""; // ⚠️ do NOT hardcode — use env var
const COMP_ACCOUNT_URL = "https://ourfable.ai/api/admin/comp-account";
const FROM_EMAIL = "Dave & Amanda via Our Fable <hello@ourfable.ai>";

// ── Email HTML ───────────────────────────────────────────────────────────────

function buildEmailHtml(friend: Friend): string {
  const childFirst = friend.childName.split(" ")[0];

  const content = `
            <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">A gift for ${childFirst}</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.3;">Dave &amp; Amanda set up a vault for ${friend.childName}.</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">Hey ${friend.parentNames} — we&rsquo;ve been building something called <strong>Our Fable</strong>, and we want you to have it. It&rsquo;s a private vault where the people who love ${childFirst} can write letters, record voice memos, and share photos &mdash; all sealed until a milestone you choose. Think of it as a time capsule, built by everyone who matters.</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">We set everything up for you. ${childFirst}&rsquo;s vault is ready to go.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4A5E4C;">
              <a href="https://ourfable.ai/login" style="display:inline-block;padding:13px 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Open ${childFirst}&rsquo;s vault &rarr;</a>
            </td></tr></table>
            <table width="100%" style="margin-top:32px;border-top:1px solid #EAE7E1;"><tr><td style="padding-top:24px;">
              <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:600;color:#4A5E4C;">Your login details</p>
              <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A4A;">Email: <strong>${friend.email}</strong></p>
              <p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A4A4A;">Password: <strong>the one we gave you</strong></p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#8A8A8A;">Log in at <a href="https://ourfable.ai/login" style="color:#4A5E4C;text-decoration:underline;">ourfable.ai/login</a></p>
            </td></tr></table>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F5F2ED;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F2ED" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background:#F0F5F0;display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#4A5E4C;">OF</span>
          </div>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            ${content}
          </td></tr></table>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A09890;">Our Fable · Made with love</p>
          <p style="margin:4px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#B0A9A0;">Our Fable · Minneapolis, MN</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (dryRun) {
    console.log("🏜️  DRY RUN — no accounts will be created, no emails sent.\n");
  }

  // Load friends list
  const listPath = resolve(__dirname, "friends-list.json");
  const raw = readFileSync(listPath, "utf-8");
  const friends: Friend[] = JSON.parse(raw);

  if (!friends.length) {
    console.log("No friends in the list. Add entries to scripts/friends-list.json");
    process.exit(0);
  }

  console.log(`Found ${friends.length} friend(s) to invite.\n`);

  let created = 0;
  let emailed = 0;
  let errors = 0;

  for (const friend of friends) {
    const childFirst = friend.childName.split(" ")[0];
    console.log(`── ${friend.childName} (${friend.email}) ──`);

    // 1. Create comped account
    if (dryRun) {
      console.log("  [dry-run] Would create comped account");
    } else {
      try {
        const res = await fetch(COMP_ACCOUNT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-secret": ADMIN_SECRET,
          },
          body: JSON.stringify({
            email: friend.email,
            password: friend.password,
            childName: friend.childName,
            childDob: friend.childDob,
            parentNames: friend.parentNames,
            planType: "plus",
            note: "Friends & Family invite",
          }),
        });

        const data = (await res.json()) as CompAccountResponse;

        if (!res.ok || data.error) {
          console.log(`  ❌ Account creation failed: ${data.error ?? res.statusText}`);
          errors++;
          continue; // skip email if account failed
        }

        console.log(`  ✅ Account created (familyId: ${data.familyId})`);
        created++;
      } catch (err) {
        console.log(`  ❌ Account creation error: ${err instanceof Error ? err.message : err}`);
        errors++;
        continue;
      }
    }

    // 2. Send welcome email via Resend
    if (dryRun) {
      console.log(`  [dry-run] Would send email: "${childFirst}'s vault is ready"`);
    } else {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [friend.email],
            subject: `${childFirst}'s vault is ready`,
            html: buildEmailHtml(friend),
          }),
        });

        if (!emailRes.ok) {
          const errBody = await emailRes.text();
          console.log(`  ❌ Email failed: ${emailRes.status} ${errBody}`);
          errors++;
        } else {
          console.log(`  ✉️  Email sent to ${friend.email}`);
          emailed++;
        }
      } catch (err) {
        console.log(`  ❌ Email error: ${err instanceof Error ? err.message : err}`);
        errors++;
      }
    }

    // Small delay between entries to be kind to APIs
    if (!dryRun && friends.indexOf(friend) < friends.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log();
  }

  // Summary
  console.log("─── Summary ───");
  if (dryRun) {
    console.log(`Would have processed ${friends.length} friend(s).`);
  } else {
    console.log(`Accounts created: ${created}`);
    console.log(`Emails sent: ${emailed}`);
    if (errors > 0) console.log(`Errors: ${errors}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
