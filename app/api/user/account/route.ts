// app/api/user/account/route.ts
// DELETE /api/user/account — full account deletion (COPPA P0)
// Deletes all photos, generated images, books, consent records, then the auth user.
// Anonymizes order records (keeps for financial/legal purposes).
// Sends confirmation email before deleting the auth user.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

async function sendDeletionConfirmation(email: string, name?: string) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 'placeholder_need_from_resend') return;
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'OurFable <hello@ourfable.ai>',
      to: email,
      subject: 'Your OurFable account has been deleted',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
          <h1 style="font-size: 24px; color: #1a1a2e;">Account deleted ✓</h1>
          <p style="color: #555; line-height: 1.6;">
            Hi ${name || 'there'},<br><br>
            Your OurFable account and all associated data have been permanently deleted, including:
          </p>
          <ul style="color: #555; line-height: 2;">
            <li>Your child's uploaded photos</li>
            <li>All AI-generated illustrations</li>
            <li>All storybooks and pages</li>
            <li>Your account profile and login credentials</li>
            <li>All parental consent records</li>
          </ul>
          <p style="color: #555; line-height: 1.6;">
            Order history has been anonymized and retained for legal and financial compliance.<br><br>
            If you have questions or believe this was a mistake, reply to this email within 30 days and we'll do our best to assist.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            OurFable.ai · hello@ourfable.ai
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[account/delete] email error:', err);
    // Non-fatal — deletion proceeds even if email fails
  }
}

export async function DELETE() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const userEmail = user.email ?? '';

    // Get profile for name (for email)
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const log: string[] = [];

    // ── 1. Delete storage: character-photos ────────────────────────────────
    for (const folder of ['', 'characters']) {
      const path = folder ? `${userId}/${folder}` : userId;
      const { data: objects } = await supabaseAdmin.storage
        .from('character-photos')
        .list(path, { limit: 1000 });
      if (objects && objects.length > 0) {
        const paths = objects.map((o) => `${path}/${o.name}`);
        await supabaseAdmin.storage.from('character-photos').remove(paths);
        log.push(`Deleted ${paths.length} character photo(s)`);
      }
    }

    // ── 2. Delete storage: book-assets ─────────────────────────────────────
    const { data: bookAssets } = await supabaseAdmin.storage
      .from('book-assets')
      .list(userId, { limit: 1000 });
    if (bookAssets && bookAssets.length > 0) {
      const paths = bookAssets.map((o) => `${userId}/${o.name}`);
      await supabaseAdmin.storage.from('book-assets').remove(paths);
      log.push(`Deleted ${paths.length} book asset(s)`);
    }

    // ── 3. Anonymize orders (retain for financial/legal records) ───────────
    await supabaseAdmin
      .from('orders')
      .update({ user_id: null, shipping_address: null })
      .eq('user_id', userId);
    log.push('Anonymized order records');

    // ── 4. Delete books ────────────────────────────────────────────────────
    await supabaseAdmin.from('books').delete().eq('user_id', userId);
    log.push('Deleted all books');

    // ── 5. Revoke and delete consent records ───────────────────────────────
    await supabaseAdmin.from('consent_records').delete().eq('user_id', userId);
    log.push('Deleted consent records');

    // ── 6. Delete profile ──────────────────────────────────────────────────
    await supabaseAdmin.from('profiles').delete().eq('id', userId);
    log.push('Deleted profile');

    // ── 7. Send confirmation email before auth deletion ────────────────────
    if (userEmail) {
      await sendDeletionConfirmation(userEmail, profile?.full_name);
      log.push('Sent deletion confirmation email');
    }

    // ── 8. Delete auth user (must be last) ────────────────────────────────
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      console.error('[account/delete] auth.deleteUser error:', authDeleteError);
      // Don't expose auth errors but log them
      return NextResponse.json(
        { error: 'Account data deleted but auth user removal failed. Contact support.' },
        { status: 500 }
      );
    }
    log.push('Deleted auth user');

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted.',
      log,
    });
  } catch (err) {
    console.error('DELETE /api/user/account error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
