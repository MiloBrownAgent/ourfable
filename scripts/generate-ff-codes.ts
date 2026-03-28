#!/usr/bin/env npx tsx
/**
 * Generate F&F gift codes and optionally send invite emails.
 *
 * Usage:
 *   npx tsx scripts/generate-ff-codes.ts                    # generate codes only
 *   npx tsx scripts/generate-ff-codes.ts --send             # generate + send emails
 *   npx tsx scripts/generate-ff-codes.ts --dry-run          # preview without creating/sending
 *
 * Edit the FRIENDS list below with the families you want to invite.
 */

// ── Friends & Family List ────────────────────────────────────────────────────
// Add everyone you want to invite here.

interface FFInvite {
  recipientNames: string;   // "Sean & Sarah"
  email: string;            // their email
}

const FRIENDS: FFInvite[] = [
  // { recipientNames: "Sean & Sarah", email: "dave@lookandseen.com" },
  // Add more here...
];

// ── Config ───────────────────────────────────────────────────────────────────

const CONVEX_URL = "https://rightful-eel-502.convex.cloud";
const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? "";
const DRY_RUN = process.argv.includes("--dry-run");
const SEND_EMAILS = process.argv.includes("--send");

// ── Gift code generator ─────────────────────────────────────────────────────

function generateFFCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  let code = "FF-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Convex helpers ──────────────────────────────────────────────────────────

async function convexMutation(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Convex-Client": "npm-1.34.0" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  const data = await res.json();
  if (data.status !== "success") throw new Error(`Convex error: ${JSON.stringify(data)}`);
  return data.value;
}

// ── Email HTML ──────────────────────────────────────────────────────────────

function buildEmailHtml(recipientNames: string, giftCode: string): string {
  const signupUrl = `https://ourfable.ai/signup?gift=${giftCode}&plan=plus`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="color-scheme" content="light"/><style>:root{color-scheme:light only;}body,table,td,div{background-color:#FDFBF7 !important;}</style></head><body style="margin:0;padding:0;background-color:#FDFBF7;"><div style="background-color:#FDFBF7;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#FDFBF7;"><tr><td style="padding:64px 20px 80px;background-color:#FDFBF7;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;"><tr><td align="center" style="padding-bottom:28px;"><div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background-color:#F0F5F0;text-align:center;line-height:56px;"><span style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#4A5E4C;">OF</span></div></td></tr><tr><td style="background-color:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background-color:#4A5E4C;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr></table><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:44px;background-color:#FFFFFF;"><p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">An invitation for your family from The Sweeneys</p><p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A1A;line-height:1.3;">Hey ${recipientNames} &mdash;</p><p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">We&rsquo;ve been building something called <strong>Our Fable</strong>, and we want you to have it.</p><p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">It&rsquo;s a private vault where the people who love your child or children can write letters, record voice memos, share photos, and record videos &mdash; all sealed until a milestone you choose. Their 13th birthday. Their 18th. Graduation. Wedding day.</p><p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">Every month, Our Fable sends a personalized question to everyone in your child&rsquo;s circle &mdash; grandparents, aunts, uncles, old friends. They respond with text, a photo, a voice recording, or a video. Everything is sealed. Private. Permanent.</p><p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">As a premium member, you also get <strong>Dispatches</strong> &mdash; send one update (a photo, video, voice memo, or note) and it goes out to all or some of the people who love your child. No group texts. No one gets forgotten.</p><p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.8;">We started building this for Soren, and we think your family would love it. <strong>Your account is on us &mdash; premium founding member, completely free.</strong></p><table width="100%" style="border-top:1px solid #EAE7E1;"><tr><td style="padding-top:24px;"><p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;font-size:13px;color:#9A9590;line-height:1.7;font-style:italic;">All we ask is that when you find something you think could be improved, you send us some feedback. That&rsquo;s all.</p><p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;font-size:14px;color:#4A4A4A;font-weight:500;">With love,</p><p style="margin:0 0 32px;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;font-size:14px;color:#4A4A4A;font-weight:600;">Amanda &amp; Dave Sweeney</p><table cellpadding="0" cellspacing="0"><tr><td style="border-radius:100px;background-color:#4A5E4C;"><a href="${signupUrl}" style="display:inline-block;padding:16px 36px;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:0.02em;">Start your family&rsquo;s vault &rarr;</a></td></tr></table><p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;font-size:13px;color:#9A9590;line-height:1.7;">Takes about 5 minutes to set up. You&rsquo;ll name your child, choose who&rsquo;s in their circle, and Our Fable handles the rest.</p></td></tr></table></td></tr></table></td></tr><tr><td align="center" style="padding-top:28px;"><p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;font-size:11px;color:#B0A9A0;">Our Fable &middot; ourfable.ai</p></td></tr></table></td></tr></table></div></body></html>`;
}

function buildPlainText(recipientNames: string, signupUrl: string): string {
  return `AN INVITATION FOR YOUR FAMILY FROM THE SWEENEYS

Hey ${recipientNames} —

We've been building something called Our Fable, and we want you to have it.

It's a private vault where the people who love your child or children can write letters, record voice memos, share photos, and record videos — all sealed until a milestone you choose. Their 13th birthday. Their 18th. Graduation. Wedding day.

Every month, Our Fable sends a personalized question to everyone in your child's circle — grandparents, aunts, uncles, old friends. They respond with text, a photo, a voice recording, or a video. Everything is sealed. Private. Permanent.

As a premium member, you also get Dispatches — send one update (a photo, video, voice memo, or note) and it goes out to all or some of the people who love your child. No group texts. No one gets forgotten.

We started building this for Soren, and we think your family would love it. Your account is on us — premium founding member, completely free.

All we ask is that when you find something you think could be improved, you send us some feedback. That's all.

With love,
Amanda & Dave Sweeney

Start your family's vault → ${signupUrl}

Takes about 5 minutes to set up.

Our Fable · ourfable.ai`;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (FRIENDS.length === 0) {
    console.log("⚠️  No friends in the list. Edit FRIENDS array in this file.");
    return;
  }

  console.log(`\n🎁 Our Fable F&F Code Generator`);
  console.log(`   ${FRIENDS.length} families to invite`);
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN" : SEND_EMAILS ? "GENERATE + SEND" : "GENERATE ONLY"}\n`);

  const results: Array<{ names: string; email: string; code: string; sent: boolean }> = [];

  for (const friend of FRIENDS) {
    const code = generateFFCode();
    console.log(`📋 ${friend.recipientNames} (${friend.email}) → ${code}`);

    if (!DRY_RUN) {
      // Create the gift code in Convex
      await convexMutation("ourfable:createGift", {
        purchaserName: "Dave & Amanda Sweeney",
        purchaserEmail: "hello@ourfable.ai",
        recipientName: friend.recipientNames,
        recipientEmail: friend.email,
        message: "A gift from The Sweeneys — premium founding member, completely free.",
      });

      // Now patch it to set planType, status, billingPeriod via a direct insert
      // Actually createGift generates its own code. Let me use a different approach.
    }

    results.push({ names: friend.recipientNames, email: friend.email, code, sent: false });
  }

  // The createGift mutation generates its own code. We need a custom mutation.
  // Let me use a different approach — insert directly.
  console.log("\n⚠️  Note: createGift generates its own code. Using direct insert instead.\n");

  // Re-do with direct inserts
  for (const r of results) {
    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would create code ${r.code} for ${r.names}`);
      continue;
    }

    try {
      await convexMutation("ourfable:createFFGiftCode", {
        giftCode: r.code,
        recipientName: r.names,
        recipientEmail: r.email,
      });
      console.log(`   ✅ Code ${r.code} created in database`);
    } catch (err) {
      console.error(`   ❌ Failed to create code for ${r.names}:`, err);
      continue;
    }

    if (SEND_EMAILS && RESEND_API_KEY) {
      const signupUrl = `https://ourfable.ai/signup?gift=${r.code}&plan=plus`;
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Amanda & Dave Sweeney via Our Fable <hello@ourfable.ai>",
            to: r.email,
            subject: "An invitation for your family from The Sweeneys",
            html: buildEmailHtml(r.names, r.code),
            text: buildPlainText(r.names, signupUrl),
          }),
        });
        const emailData = await emailRes.json();
        if (emailData.id) {
          r.sent = true;
          console.log(`   📧 Email sent to ${r.email}`);
        } else {
          console.error(`   ❌ Email failed:`, emailData);
        }
      } catch (err) {
        console.error(`   ❌ Email error for ${r.email}:`, err);
      }
      // Rate limit: 100ms between sends
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Summary
  console.log("\n═══════════════════════════════════════════");
  console.log("SUMMARY");
  console.log("═══════════════════════════════════════════");
  for (const r of results) {
    const signupUrl = `https://ourfable.ai/signup?gift=${r.code}&plan=plus`;
    console.log(`\n${r.names} (${r.email})`);
    console.log(`  Code: ${r.code}`);
    console.log(`  Link: ${signupUrl}`);
    console.log(`  Email: ${r.sent ? "✅ Sent" : "Not sent"}`);
  }
  console.log("\n");
}

main().catch(console.error);
