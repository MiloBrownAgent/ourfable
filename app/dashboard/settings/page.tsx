import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import AccountSettingsClient from './AccountSettingsClient';

export const metadata: Metadata = {
  title: 'Account Settings',
  robots: { index: false },
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?redirect=/dashboard/settings');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, created_at')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-brand-page-bg">
      <nav className="flex justify-between items-center px-6 py-4 bg-white/90 backdrop-blur-md border-b-[3px] border-brand-sun sticky top-0 z-50">
        <Link href="/" className="font-display text-xl font-extrabold text-brand-ink">
          ✨ Our<span className="text-brand-pink">Fable</span>
          <span className="text-brand-purple text-xs">.ai</span>
        </Link>
        <Link href="/dashboard" className="btn-secondary text-sm">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-ink">Account Settings</h1>
          <p className="text-brand-ink-muted mt-1 text-sm">Manage your account and privacy preferences.</p>
        </div>

        {/* Account info */}
        <section className="card p-6">
          <h2 className="font-display text-lg font-bold text-brand-ink mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-brand-ink-muted font-medium">Name</span>
              <span className="text-brand-ink font-semibold">{profile?.full_name || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-brand-ink-muted font-medium">Email</span>
              <span className="text-brand-ink font-semibold">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-brand-ink-muted font-medium">Member since</span>
              <span className="text-brand-ink font-semibold">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </section>

        {/* Privacy & data */}
        <AccountSettingsClient userEmail={user.email ?? ''} />

        {/* Legal links */}
        <section className="card p-6">
          <h2 className="font-display text-lg font-bold text-brand-ink mb-4">Legal</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/privacy" className="btn-secondary text-sm w-full sm:w-auto justify-center" target="_blank">
              Privacy Policy ↗
            </Link>
            <Link href="/terms" className="btn-secondary text-sm w-full sm:w-auto justify-center" target="_blank">
              Terms of Service ↗
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
