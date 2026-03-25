'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/waitlist-count')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.count === 'number') setCount(d.count)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'waitlist-page' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }
      setStatus('success')
      setEmail('')
      setCount((c) => (c !== null ? c + 1 : c))
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <main className="min-h-screen bg-brand-bg-warm flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link href="/" className="font-display font-bold text-2xl text-brand-ink tracking-tight">
          OurFable
          <span className="text-brand-coral">.</span>
        </Link>
        <Link href="/auth/login" className="text-sm font-body font-semibold text-brand-ink-muted hover:text-brand-teal transition-colors">
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-teal-light text-brand-teal-dark text-xs font-body font-bold px-4 py-1.5 rounded-full mb-8 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-teal inline-block animate-pulse" />
          Coming Soon
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-brand-ink leading-tight max-w-3xl mb-6">
          Your child is the{' '}
          <span
            className="relative inline-block"
            style={{ color: '#FF6B5A' }}
          >
            main character.
          </span>
        </h1>

        {/* Subhead */}
        <p className="font-body text-lg sm:text-xl text-brand-ink-light max-w-xl mb-10 leading-relaxed">
          OurFable creates custom AI-illustrated storybooks featuring your family. Upload a photo, pick an adventure, and watch the magic happen.
        </p>

        {/* Sign-up form */}
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 bg-brand-teal-light text-brand-teal-dark px-8 py-4 rounded-2xl font-bold text-base font-body shadow-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              You&apos;re on the list!
            </div>
            <p className="text-sm text-brand-ink-muted font-body">We&apos;ll email you the moment OurFable launches.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
            <input
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setStatus('idle')
              }}
              className="input-field flex-1 text-center sm:text-left"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary whitespace-nowrap px-8 py-3"
            >
              {status === 'loading' ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Joining...
                </span>
              ) : (
                'Join the Waitlist'
              )}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-red-500 text-sm mt-3 font-body">{errorMsg}</p>
        )}

        {/* Count */}
        {count !== null && count > 0 && (
          <p className="mt-6 text-sm font-body text-brand-ink-muted">
            🌟 <strong className="text-brand-ink">{count.toLocaleString()}</strong> famil{count === 1 ? 'y' : 'ies'} already on the list
          </p>
        )}

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full text-left">
          {[
            {
              icon: '📖',
              title: '12 Illustrated Pages',
              desc: 'A complete story — your child on every page.',
            },
            {
              icon: '⚡',
              title: 'Ready in Minutes',
              desc: 'AI-written, illustrated, and delivered fast.',
            },
            {
              icon: '📸',
              title: 'Just One Photo',
              desc: 'Upload a photo. We handle the rest.',
            },
          ].map((f) => (
            <div key={f.title} className="card flex flex-col gap-3">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-display font-bold text-brand-ink text-base">{f.title}</h3>
              <p className="font-body text-sm text-brand-ink-light leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-8 text-center">
        <p className="text-xs font-body text-brand-ink-muted">
          © {new Date().getFullYear()} OurFable ·{' '}
          <Link href="/privacy" className="hover:text-brand-teal transition-colors">Privacy</Link>
          {' · '}
          <Link href="/terms" className="hover:text-brand-teal transition-colors">Terms</Link>
        </p>
      </footer>
    </main>
  )
}
