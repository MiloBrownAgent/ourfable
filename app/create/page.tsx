import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StoryCreatorForm from './StoryCreatorForm';

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?redirect=/create');

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

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold mb-2">Create a New Storybook 🪄</h1>
            <p className="text-brand-ink-muted text-sm sm:text-base">
              Upload a photo, describe your little hero, and we&apos;ll spin up a personalized adventure.
            </p>
          </div>

          <StoryCreatorForm />
        </div>
      </div>
    </main>
  );
}
