import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import BookPreviewReader from './BookPreviewReader';

export default async function BookPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/auth/login?redirect=/books/${id}`);

  const { data: book, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !book) notFound();

  const pages = Array.isArray(book.pages) ? book.pages : [];
  const title = book.title || `${book.character_name}'s Adventure`;

  return (
    <main className="min-h-screen bg-brand-page-bg">
      <nav className="flex justify-between items-center px-6 py-4 bg-white/90 backdrop-blur-md border-b-[3px] border-brand-sun sticky top-0 z-50">
        <Link href="/dashboard" className="font-display text-xl font-extrabold text-brand-ink">
          ✨ Our<span className="text-brand-pink">Fable</span>
          <span className="text-brand-purple text-xs">.ai</span>
        </Link>
        <Link href="/dashboard" className="btn-secondary text-sm">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <BookPreviewReader title={title} pages={pages} bookId={id} status={book.status} />
      </div>
    </main>
  );
}
