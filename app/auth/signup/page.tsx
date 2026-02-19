'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const googleSvg = `<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`;

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  }

  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`,
      },
    });
    if (error) setError(error.message);
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-brand-page-bg px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="font-display text-2xl font-bold mb-2">Check your email!</h1>
          <p className="text-brand-ink-muted">
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account and start creating storybooks!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-page-bg px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-2xl font-extrabold text-brand-ink">
            ✨ Our<span className="text-brand-pink">Fable</span>
            <span className="text-brand-purple text-sm">.ai</span>
          </Link>
          <h1 className="font-display text-3xl font-bold mt-4 mb-1">Create your account</h1>
          <p className="text-brand-ink-muted text-sm">Start making magical storybooks today</p>
        </div>

        <button onClick={handleGoogleSignIn} className="btn-secondary w-full justify-center mb-4 text-sm">
          <span dangerouslySetInnerHTML={{ __html: googleSvg }} />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-brand-ink-muted text-xs font-semibold">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block font-display font-bold text-sm mb-1.5">👤 Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="input-field" required />
          </div>
          <div>
            <label className="block font-display font-bold text-sm mb-1.5">✉️ Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" required />
          </div>
          <div>
            <label className="block font-display font-bold text-sm mb-1.5">🔒 Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="input-field" minLength={6} required />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-200">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-base disabled:opacity-50">
            {loading ? '✨ Creating account...' : '🪄 Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-brand-ink-muted mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-purple font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
