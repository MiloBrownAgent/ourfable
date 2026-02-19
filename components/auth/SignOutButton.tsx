'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button onClick={handleSignOut} className="text-sm font-semibold text-brand-ink-muted hover:text-brand-pink transition-colors">
      Sign Out
    </button>
  );
}
