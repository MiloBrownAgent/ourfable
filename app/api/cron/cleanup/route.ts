// app/api/cron/cleanup/route.ts
// Data retention cron endpoint — COPPA P0
//
// Three jobs (pass ?job=<name> or body.job):
//   abandoned-uploads  — photos uploaded with no paid order after 30 days
//   post-delivery      — character photos 90 days after digital order paid
//   annual-cleanup     — book assets (generated images, PDFs) 1 year after paid
//
// Secured with CRON_SECRET bearer token.
// Returns JSON summary of what was deleted.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn('[cron/cleanup] CRON_SECRET not set — rejecting all requests');
    return false;
  }
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

type DeletionEntry = {
  user_id: string | null;
  resource_type: string;
  resource_id: string | null;
  reason: string;
  initiated_by: string;
};

async function logDeletions(entries: DeletionEntry[]) {
  if (entries.length === 0) return;
  const { error } = await supabaseAdmin.from('deletion_log').insert(entries);
  if (error) console.error('[cron/cleanup] deletion_log insert error:', error);
}

// ── Job: abandoned-uploads ─────────────────────────────────────────────────
// Delete character photos where the user has no paid/delivered order and
// the book was created more than 30 days ago.
async function cleanupAbandonedUploads(): Promise<{ deleted: number; errors: number }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  // Find books with character photos, older than 30 days, with no paid order
  const { data: books, error } = await supabaseAdmin
    .from('books')
    .select(`
      id,
      user_id,
      character_photo_url,
      orders!books_id_fkey (id, status)
    `)
    .not('character_photo_url', 'is', null)
    .lt('created_at', cutoff.toISOString());

  if (error) {
    console.error('[cleanup:abandoned] query error:', error);
    return { deleted: 0, errors: 1 };
  }

  let deleted = 0;
  let errors = 0;
  const logEntries: DeletionEntry[] = [];

  for (const book of books ?? []) {
    // Skip if there's any paid/delivered/refunded order for this book
    const orders = (book as unknown as { orders?: Array<{ status: string }> }).orders ?? [];
    const hasPaidOrder = orders.some((o) =>
      ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)
    );
    if (hasPaidOrder) continue;

    // Extract storage path from URL
    const photoUrl: string = book.character_photo_url;
    const storagePath = extractStoragePath(photoUrl, 'character-photos');
    if (!storagePath) continue;

    const { error: delErr } = await supabaseAdmin.storage
      .from('character-photos')
      .remove([storagePath]);

    if (delErr) {
      console.error('[cleanup:abandoned] storage remove error:', delErr, storagePath);
      errors++;
    } else {
      // Clear the URL from the book record
      await supabaseAdmin
        .from('books')
        .update({ character_photo_url: null })
        .eq('id', book.id);

      logEntries.push({
        user_id: book.user_id,
        resource_type: 'character_photo',
        resource_id: storagePath,
        reason: 'abandoned_upload',
        initiated_by: 'system',
      });
      deleted++;
    }
  }

  await logDeletions(logEntries);
  return { deleted, errors };
}

// ── Job: post-delivery ─────────────────────────────────────────────────────
// Delete character photos 90 days after digital order paid.
// For digital books, "delivery" = order status 'paid' or 'delivered'.
async function cleanupPostDelivery(): Promise<{ deleted: number; errors: number }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  // Find paid orders older than 90 days where the book still has a character photo
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      user_id,
      book_id,
      updated_at,
      books!orders_book_id_fkey (id, character_photo_url)
    `)
    .in('status', ['paid', 'delivered'])
    .lt('updated_at', cutoff.toISOString());

  if (error) {
    console.error('[cleanup:post-delivery] query error:', error);
    return { deleted: 0, errors: 1 };
  }

  let deleted = 0;
  let errors = 0;
  const logEntries: DeletionEntry[] = [];

  for (const order of orders ?? []) {
    const rawBook = (order as unknown as { books?: Array<{ id: string; character_photo_url: string | null }> | { id: string; character_photo_url: string | null } }).books;
    const book = Array.isArray(rawBook) ? rawBook[0] : rawBook;
    if (!book?.character_photo_url) continue;

    const storagePath = extractStoragePath(book.character_photo_url, 'character-photos');
    if (!storagePath) continue;

    const { error: delErr } = await supabaseAdmin.storage
      .from('character-photos')
      .remove([storagePath]);

    if (delErr) {
      errors++;
    } else {
      await supabaseAdmin
        .from('books')
        .update({ character_photo_url: null })
        .eq('id', book.id);

      logEntries.push({
        user_id: order.user_id,
        resource_type: 'character_photo',
        resource_id: storagePath,
        reason: 'post_delivery_retention',
        initiated_by: 'system',
      });
      deleted++;
    }
  }

  await logDeletions(logEntries);
  return { deleted, errors };
}

// ── Job: annual-cleanup ────────────────────────────────────────────────────
// Delete book assets (generated illustrations, PDFs) 1 year after order paid.
async function cleanupAnnual(): Promise<{ deleted: number; errors: number }> {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, book_id, updated_at')
    .in('status', ['paid', 'delivered'])
    .lt('updated_at', cutoff.toISOString());

  if (error) {
    console.error('[cleanup:annual] query error:', error);
    return { deleted: 0, errors: 1 };
  }

  let deleted = 0;
  let errors = 0;
  const logEntries: DeletionEntry[] = [];

  for (const order of orders ?? []) {
    if (!order.user_id || !order.book_id) continue;

    // List and delete book assets folder
    const prefix = `${order.user_id}/${order.book_id}`;
    const { data: assets } = await supabaseAdmin.storage
      .from('book-assets')
      .list(prefix, { limit: 500 });

    if (assets && assets.length > 0) {
      const paths = assets.map((a) => `${prefix}/${a.name}`);
      const { error: delErr } = await supabaseAdmin.storage
        .from('book-assets')
        .remove(paths);

      if (delErr) {
        errors += paths.length;
      } else {
        // Clear cover_image_url and pdf_url on the book
        await supabaseAdmin
          .from('books')
          .update({ cover_image_url: null, pdf_url: null })
          .eq('id', order.book_id);

        for (const path of paths) {
          logEntries.push({
            user_id: order.user_id,
            resource_type: 'book_asset',
            resource_id: path,
            reason: 'annual_cleanup',
            initiated_by: 'system',
          });
        }
        deleted += paths.length;
      }
    }
  }

  await logDeletions(logEntries);
  return { deleted, errors };
}

// ── Util ──────────────────────────────────────────────────────────────────
function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    // Supabase public URL format: .../storage/v1/object/public/<bucket>/<path>
    const marker = `/object/public/${bucket}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  let job = url.searchParams.get('job');
  if (!job) {
    try {
      const body = await req.json();
      job = body.job;
    } catch {
      // ignore
    }
  }

  const validJobs = ['abandoned-uploads', 'post-delivery', 'annual-cleanup'];
  if (!job || !validJobs.includes(job)) {
    return NextResponse.json(
      { error: `Invalid job. Must be one of: ${validJobs.join(', ')}` },
      { status: 400 }
    );
  }

  console.log(`[cron/cleanup] Running job: ${job}`);

  try {
    let result;
    if (job === 'abandoned-uploads') result = await cleanupAbandonedUploads();
    else if (job === 'post-delivery') result = await cleanupPostDelivery();
    else result = await cleanupAnnual();

    console.log(`[cron/cleanup] ${job} complete:`, result);
    return NextResponse.json({ success: true, job, ...result });
  } catch (err) {
    console.error(`[cron/cleanup] ${job} error:`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also handle GET for simple health checks (no auth needed)
export async function GET() {
  return NextResponse.json({ status: 'ok', jobs: ['abandoned-uploads', 'post-delivery', 'annual-cleanup'] });
}
