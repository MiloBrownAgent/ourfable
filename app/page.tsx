'use client';

import Link from 'next/link';
import { useState } from 'react';

function EmailCapture({ source = 'landing' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 bg-brand-teal-light text-brand-teal-dark px-6 py-3 rounded-full font-bold text-sm font-body">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        You&apos;re on the list! We&apos;ll be in touch soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
      <input
        type="email"
        required
        placeholder="Enter your email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
        className="input-field flex-1 text-center sm:text-left"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary whitespace-nowrap px-8 py-3"
      >
        {status === 'loading' ? 'Joining...' : 'Get Early Access'}
      </button>
      {status === 'error' && (
        <p className="text-red-500 text-xs mt-1 font-body w-full text-center sm:text-left">{errorMsg}</p>
      )}
    </form>
  );
}

const STEPS = [
  {
    num: '1',
    title: 'Upload a photo',
    desc: 'Share a clear photo of your child. Our AI uses it to create their likeness on every page.',
    color: 'teal' as const,
  },
  {
    num: '2',
    title: 'Choose an adventure',
    desc: 'Pick a theme, name your hero, and add family, friends, or pets to the story.',
    color: 'coral' as const,
  },
  {
    num: '3',
    title: 'Get your book',
    desc: 'Download a beautiful 12-page digital storybook instantly, or order a premium hardcover.',
    color: 'teal' as const,
  },
];

const FEATURES = [
  { icon: '📖', title: '12 Illustrated Pages', desc: 'A complete story with a unique illustration on every page.' },
  { icon: '✨', title: 'AI-Written Story', desc: 'Powered by advanced AI that crafts engaging, age-appropriate narratives.' },
  { icon: '🎨', title: '6 Art Styles', desc: 'Watercolor, whimsical, pastel, bold, fantasy, or classic illustration styles.' },
  { icon: '⚡', title: 'Ready in Minutes', desc: 'Your complete storybook is generated in under 3 minutes.' },
  { icon: '📸', title: 'One Photo Needed', desc: 'Just one clear photo and our AI handles the rest.' },
  { icon: '🔒', title: 'Photos Kept Private', desc: 'Your photos are never shared or used for anything else.' },
];

const TESTIMONIALS = [
  {
    quote: "My daughter's face when she saw herself as a princess in her own book — priceless. She asks to read it every single night.",
    name: 'Sarah M.',
    detail: 'Mom of a 4-year-old',
  },
  {
    quote: "We ordered hardcovers for grandparents as gifts. They cried happy tears. Best $35 we've ever spent.",
    name: 'James & Priya K.',
    detail: 'Parents of twins',
  },
  {
    quote: "The illustrations are genuinely beautiful. I was expecting generic clip-art, but these look like a real children's book.",
    name: 'Lauren T.',
    detail: 'Mom of a 6-year-old',
  },
];

const FAQS = [
  {
    q: 'How long does it take to create a book?',
    a: 'Your personalized storybook is generated in under 3 minutes. You can read it immediately as a digital book, or order a hardcover that ships in 5-7 business days.',
  },
  {
    q: 'What kind of photo should I upload?',
    a: 'A clear, front-facing photo with good lighting works best. School photos, portrait-style shots, or any well-lit photo where your child is clearly visible.',
  },
  {
    q: 'Is my child\'s photo safe?',
    a: 'Absolutely. Photos are used only to generate your book and are never shared, sold, or used for any other purpose. You can delete them at any time.',
  },
  {
    q: 'What ages is this for?',
    a: 'OurFable books are perfect for children ages 2-10. The AI adapts the story complexity and vocabulary to match your child\'s age.',
  },
  {
    q: 'Can I include other family members or pets?',
    a: 'Yes! You can mention siblings, parents, grandparents, friends, or pets when describing your story, and they\'ll be woven into the narrative.',
  },
  {
    q: 'What\'s the difference between digital and hardcover?',
    a: 'The digital book ($14.99) is available instantly as a beautiful page-by-page reader. The hardcover ($34.99) is a premium printed book with thick pages and a durable cover, shipped to your door.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-brand-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="font-display text-base sm:text-lg font-bold text-brand-ink">{q}</span>
        <svg
          className={`w-5 h-5 text-brand-ink-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <p className="text-brand-ink-light text-sm leading-relaxed font-body pb-5 pr-8">{a}</p>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-white/90 backdrop-blur-xl border-b border-brand-border">
        <Link href="/" className="font-display text-2xl font-extrabold text-brand-ink">
          Our<span className="text-brand-teal">Fable</span>
          <span className="text-brand-ink-muted text-sm font-body">.ai</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">
            Sign In
          </Link>
          <Link href="/auth/signup" className="btn-primary text-sm py-2 px-4">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-teal-light text-brand-teal-dark px-4 py-1.5 rounded-full font-bold text-xs tracking-wide uppercase mb-6 font-body">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
            Now in Early Access
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-ink leading-[1.1] mb-5">
            Turn your child into the
            <span className="text-brand-teal"> hero</span> of their own
            <span className="text-brand-coral"> storybook</span>
          </h1>
          <p className="text-brand-ink-light text-lg sm:text-xl max-w-lg mx-auto mb-10 leading-relaxed font-body">
            Upload one photo and our AI creates a beautifully illustrated, personalized 12-page storybook in under 3 minutes.
          </p>
          <EmailCapture source="hero" />
          <p className="text-brand-ink-muted text-xs mt-4 font-body">
            Free to join. No credit card required.
          </p>
        </div>
      </section>

      {/* Book Mockups */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex flex-col sm:flex-row sm:justify-center sm:items-end gap-4 sm:gap-6">
            {/* Left card */}
            <div className="flex-1 max-w-xs mx-auto sm:mx-0">
              <div className="bg-white rounded-2xl shadow-lg border border-brand-border overflow-hidden transition-transform hover:-translate-y-1">
                <div className="h-52 bg-gradient-to-br from-brand-teal-light via-white to-brand-coral-light relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center text-3xl shadow-sm">🏰</div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-display text-sm font-bold text-brand-ink mb-2">The Castle Adventure</div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                    <div className="h-1.5 bg-gray-100 rounded-full w-5/6" />
                    <div className="h-1.5 bg-gray-100 rounded-full w-2/3" />
                  </div>
                </div>
              </div>
            </div>
            {/* Middle card (highlighted) */}
            <div className="flex-1 max-w-xs mx-auto sm:mx-0 sm:scale-110 sm:z-10">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-brand-coral/20 overflow-hidden transition-transform hover:-translate-y-1">
                <div className="h-52 bg-gradient-to-br from-brand-coral-light via-white to-brand-teal-light relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center text-3xl shadow-sm">🚀</div>
                  </div>
                  <div className="absolute top-3 right-3 bg-brand-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-body">POPULAR</div>
                </div>
                <div className="p-4">
                  <div className="font-display text-sm font-bold text-brand-ink mb-2">Journey to the Stars</div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                    <div className="h-1.5 bg-gray-100 rounded-full w-4/5" />
                    <div className="h-1.5 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-1.5 bg-gray-100 rounded-full w-2/3" />
                  </div>
                </div>
              </div>
            </div>
            {/* Right card */}
            <div className="flex-1 max-w-xs mx-auto sm:mx-0">
              <div className="bg-white rounded-2xl shadow-lg border border-brand-border overflow-hidden transition-transform hover:-translate-y-1">
                <div className="h-52 bg-gradient-to-br from-brand-teal-light via-brand-coral-light to-white relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center text-3xl shadow-sm">🌊</div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-display text-sm font-bold text-brand-ink mb-2">The Ocean Secret</div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                    <div className="h-1.5 bg-gray-100 rounded-full w-5/6" />
                    <div className="h-1.5 bg-gray-100 rounded-full w-2/3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-y border-brand-border bg-brand-bg-warm">
        <div className="max-w-3xl mx-auto px-4 py-5 flex flex-wrap justify-center gap-x-10 gap-y-3">
          <div className="flex items-center gap-2 text-brand-ink-light text-sm font-semibold font-body">
            <span className="w-2 h-2 rounded-full bg-brand-teal shrink-0" />
            Ready in under 3 minutes
          </div>
          <div className="flex items-center gap-2 text-brand-ink-light text-sm font-semibold font-body">
            <span className="w-2 h-2 rounded-full bg-brand-coral shrink-0" />
            Unique illustrations every time
          </div>
          <div className="flex items-center gap-2 text-brand-ink-light text-sm font-semibold font-body">
            <span className="w-2 h-2 rounded-full bg-brand-gold shrink-0" />
            Photos kept private &amp; secure
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
            How it works
          </h2>
          <p className="text-brand-ink-muted text-base font-body">
            Three simple steps. No artistic skills needed.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {STEPS.map((step) => (
            <div key={step.num} className="text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${step.color === 'teal' ? 'bg-brand-teal-light' : 'bg-brand-coral-light'}`}>
                <span className={`font-display text-xl font-extrabold ${step.color === 'teal' ? 'text-brand-teal' : 'text-brand-coral'}`}>{step.num}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-brand-ink mb-2">{step.title}</h3>
              <p className="text-brand-ink-muted text-sm leading-relaxed font-body">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-brand-bg-warm border-y border-brand-border px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
              Parents love OurFable
            </h2>
            <div className="flex items-center justify-center gap-1 text-brand-gold text-2xl font-display">
              ★★★★★
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card">
                <div className="flex gap-1 text-brand-gold text-sm mb-3">★★★★★</div>
                <p className="text-brand-ink text-sm leading-relaxed font-body mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="border-t border-brand-border-light pt-3">
                  <p className="font-display text-sm font-bold text-brand-ink">{t.name}</p>
                  <p className="text-brand-ink-muted text-xs font-body">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
            Every book is one of a kind
          </h2>
          <p className="text-brand-ink-muted text-base font-body max-w-lg mx-auto">
            Powered by the same AI behind the world&apos;s best creative tools, each book is a unique masterpiece.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card text-center sm:text-left">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-display text-base font-bold text-brand-ink mb-1">{f.title}</h3>
              <p className="text-brand-ink-muted text-sm leading-relaxed font-body">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-brand-bg-warm border-y border-brand-border px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-brand-ink-muted text-base font-body">
              No subscriptions. Pay only when you love what you see.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Digital */}
            <div className="card text-center">
              <div className="inline-flex items-center gap-2 bg-brand-teal-light text-brand-teal px-3 py-1 rounded-full font-bold text-xs uppercase mb-4 font-body">
                Digital
              </div>
              <div className="font-display text-4xl font-extrabold text-brand-ink mb-1">$14.99</div>
              <p className="text-brand-ink-muted text-sm font-body mb-6">One-time purchase</p>
              <ul className="text-sm text-brand-ink-light font-body space-y-2 text-left mb-6">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  12-page personalized storybook
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Unique AI illustrations
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Instant digital delivery
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Read on any device
                </li>
              </ul>
              <Link href="/auth/signup" className="btn-secondary w-full text-sm">
                Get Started
              </Link>
            </div>
            {/* Hardcover */}
            <div className="card text-center relative border-2 border-brand-coral/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-coral text-white px-3 py-0.5 rounded-full font-bold text-xs uppercase font-body">
                Best Value
              </div>
              <div className="inline-flex items-center gap-2 bg-brand-coral-light text-brand-coral px-3 py-1 rounded-full font-bold text-xs uppercase mb-4 font-body">
                Hardcover
              </div>
              <div className="font-display text-4xl font-extrabold text-brand-ink mb-1">$34.99</div>
              <p className="text-brand-ink-muted text-sm font-body mb-6">One-time purchase</p>
              <ul className="text-sm text-brand-ink-light font-body space-y-2 text-left mb-6">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-coral shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Everything in Digital, plus...
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-coral shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Premium hardcover book
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-coral shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Thick, durable pages
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-coral shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Ships in 5-7 business days
                </li>
              </ul>
              <Link href="/auth/signup" className="btn-primary w-full text-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20 max-w-2xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
            Frequently asked questions
          </h2>
        </div>
        <div>
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-teal px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to create something magical?
          </h2>
          <p className="text-white/80 text-lg font-body mb-8 max-w-md mx-auto">
            Join thousands of parents making bedtime unforgettable. Get early access today.
          </p>
          <EmailCapture source="footer_cta" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border bg-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
            <div>
              <Link href="/" className="font-display text-xl font-extrabold text-brand-ink">
                Our<span className="text-brand-teal">Fable</span>
                <span className="text-brand-ink-muted text-sm font-body">.ai</span>
              </Link>
              <p className="text-brand-ink-muted text-sm font-body mt-2 max-w-xs">
                AI-powered personalized storybooks that make your child the hero of their own adventure.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-body">
              <Link href="/auth/signup" className="text-brand-ink-light hover:text-brand-teal transition-colors">Create a Book</Link>
              <Link href="/auth/login" className="text-brand-ink-light hover:text-brand-teal transition-colors">Sign In</Link>
            </div>
          </div>
          <div className="border-t border-brand-border mt-8 pt-8 text-center">
            <p className="text-brand-ink-muted text-sm font-body">
              &copy; 2026 OurFable.ai. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
