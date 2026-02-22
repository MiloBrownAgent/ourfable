// app/api/user/photos/route.ts
// DELETE /api/user/photos — delete all character photos for the authenticated user
// COPPA P0: parents must be able to delete their child's photos on demand.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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

// DELETE /api/user/photos — Delete all uploaded character photos for the user.
// Clears character_photo_url from books (replaces with null).
// Does NOT delete the books themselves.
export async function DELETE() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = { storageDeleted: 0, storageErrors: 0, booksCleared: 0 };

    // 1. List all objects in the user's folder in character-photos bucket
    const { data: objects, error: listError } = await supabaseAdmin.storage
      .from('character-photos')
      .list(user.id, { limit: 1000 });

    if (listError) {
      console.error('[photos/delete] list error:', listError);
    }

    // 2. Delete found storage objects
    if (objects && objects.length > 0) {
      const paths = objects.map((o) => `${user.id}/${o.name}`);
      const { error: deleteError } = await supabaseAdmin.storage
        .from('character-photos')
        .remove(paths);

      if (deleteError) {
        console.error('[photos/delete] remove error:', deleteError);
        results.storageErrors = paths.length;
      } else {
        results.storageDeleted = paths.length;
      }
    }

    // Also check sub-folders (character photos can be nested in /characters/)
    const { data: subObjects } = await supabaseAdmin.storage
      .from('character-photos')
      .list(`${user.id}/characters`, { limit: 1000 });

    if (subObjects && subObjects.length > 0) {
      const paths = subObjects.map((o) => `${user.id}/characters/${o.name}`);
      const { error: deleteError } = await supabaseAdmin.storage
        .from('character-photos')
        .remove(paths);
      if (!deleteError) results.storageDeleted += paths.length;
      else results.storageErrors += paths.length;
    }

    // 3. Clear character_photo_url on the user's books (retain the books themselves)
    const supabase = await createClient();
    const { count, error: booksError } = await supabase
      .from('books')
      .update({ character_photo_url: null })
      .eq('user_id', user.id)
      .not('character_photo_url', 'is', null);

    if (booksError) {
      console.error('[photos/delete] books update error:', booksError);
    } else {
      results.booksCleared = count ?? 0;
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${results.storageDeleted} photo(s). Your storybooks are preserved.`,
      ...results,
    });
  } catch (err) {
    console.error('DELETE /api/user/photos error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
