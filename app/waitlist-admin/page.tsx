'use client'

import { useState, useEffect } from 'react'

export default function WaitlistAdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === 'OurFable2026!') {
      setAuthed(true)
      setAuthError('')
    } else {
      setAuthError('Incorrect password.')
    }
  }

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    fetch('/api/waitlist-count')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.count === 'number') setCount(d.count)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [authed])

  if (!authed) {
    return (
      <main className="min-h-screen bg-brand-bg-warm flex items-center justify-center px-4">
        <div className="card w-full max-w-sm">
          <h1 className="font-display font-bold text-2xl text-brand-ink mb-1">
            Waitlist Admin
          </h1>
          <p className="font-body text-sm text-brand-ink-muted mb-6">Enter your admin password.</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setAuthError('')
              }}
              className="input-field"
              autoFocus
            />
            {authError && (
              <p className="text-red-500 text-xs font-body">{authError}</p>
            )}
            <button type="submit" className="btn-primary w-full py-3">
              Sign In
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-brand-bg-warm px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-brand-ink">
              Waitlist Admin
            </h1>
            <p className="font-body text-sm text-brand-ink-muted mt-1">OurFable.ai</p>
          </div>
          <button
            onClick={() => setAuthed(false)}
            className="text-xs font-body text-brand-ink-muted hover:text-brand-ink transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="card">
            <p className="font-body text-xs text-brand-ink-muted uppercase tracking-wider mb-2">Total Signups</p>
            {loading ? (
              <div className="h-10 w-24 bg-brand-border-light rounded animate-pulse" />
            ) : (
              <p className="font-display font-bold text-5xl text-brand-ink">
                {count !== null ? count.toLocaleString() : '—'}
              </p>
            )}
          </div>
          <div className="card flex flex-col justify-center">
            <p className="font-body text-xs text-brand-ink-muted uppercase tracking-wider mb-2">Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
              <span className="font-body font-semibold text-brand-teal text-sm">Live — collecting signups</span>
            </div>
          </div>
        </div>

        {/* Table note */}
        <div className="card">
          <h2 className="font-display font-bold text-base text-brand-ink mb-3">Signup Details</h2>
          {count === null || count === 0 ? (
            <p className="font-body text-sm text-brand-ink-muted">
              Signup details load once the Supabase <code className="bg-brand-border-light px-1.5 py-0.5 rounded text-xs">waitlist</code> table is populated.
            </p>
          ) : (
            <p className="font-body text-sm text-brand-ink-muted">
              {count} signup{count !== 1 ? 's' : ''} recorded. View full details in the{' '}
              <a
                href="https://supabase.com/dashboard/project/ylugucyzdvvzmziqzjto/editor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-teal font-semibold hover:underline"
              >
                Supabase dashboard →
              </a>
            </p>
          )}
        </div>

        {/* Quick links */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://supabase.com/dashboard/project/ylugucyzdvvzmziqzjto"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm px-5 py-2.5"
          >
            Supabase Dashboard
          </a>
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm px-5 py-2.5"
          >
            Stripe Dashboard
          </a>
          <a
            href="/waitlist"
            className="btn-secondary text-sm px-5 py-2.5"
          >
            View Waitlist Page
          </a>
        </div>
      </div>
    </main>
  )
}
