import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from '@/components/auth/SignOutButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Friend';

  return (
    <main className="min-h-screen bg-brand-page-bg">
      <nav className="flex justify-between items-center px-6 py-4 bg-white/90 backdrop-blur-md border-b-[3px] border-brand-sun sticky top-0 z-50">
        <Link href="/" className="font-display text-xl font-extrabold text-brand-ink">
          ✨ Our<span className="text-brand-pink">Fable</span>
          <span className="text-brand-purple text-xs">.ai</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-brand-ink-muted hidden sm:block">Hey, {displayName}! 👋</span>
          <SignOutButton />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">My Storybooks 📚</h1>
            <p className="text-brand-ink-muted mt-1">Your personalized adventures, all in one place.</p>
          </div>
          <Link href="/create" className="btn-primary">🪄 Create New Book</Link>
        </div>

        {books && books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book: any) => (
              <Link key={book.id} href={`/books/${book.id}`} className="block">
                <div className="card hover:-translate-y-1 transition-transform duration-300">
                  <div
                    className="w-full h-40 rounded-xl mb-4 flex items-center justify-center text-4xl"
                    style={{
                      background: book.cover_image_url
                        ? `url(${book.cover_image_url}) center/cover`
                        : 'linear-gradient(135deg, #FFD1DC, #E1D5F0)',
                    }}
                  >
                    {!book.cover_image_url && '📖'}
                  </div>
                  <h3 className="font-display text-lg font-bold">
                    {book.title || `${book.character_name}'s Adventure`}
                  </h3>
                  <p className="text-brand-ink-muted text-sm mt-1 line-clamp-2">{book.story_prompt}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      book.status === 'ready' ? 'bg-green-100 text-green-700'
                      : book.status === 'generating' ? 'bg-yellow-100 text-yellow-700'
                      : book.status === 'failed' ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                      {book.status === 'ready' && '✅ '}
                      {book.status === 'generating' && '⏳ '}
                      {book.status === 'failed' && '❌ '}
                      {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                    </span>
                    <span className="text-xs text-brand-ink-muted">
                      {new Date(book.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16 max-w-md mx-auto">
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="font-display text-2xl font-bold mb-2">No storybooks yet!</h2>
            <p className="text-brand-ink-muted mb-6">Create your first personalized storybook — it only takes a few minutes.</p>
            <Link href="/create" className="btn-primary">🪄 Create Your First Book</Link>
          </div>
        )}
      </div>
    </main>
  );
}
