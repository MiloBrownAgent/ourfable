'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';

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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        You&apos;re on the list.
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
    title: 'Add the people who matter',
    desc: 'Grandma. A godparent. An old family friend. Anyone whose voice your child should hear when they\'re older.',
    color: 'teal' as const,
  },
  {
    num: '2',
    title: 'OurFable asks the questions',
    desc: 'Every month, each person receives one carefully crafted question — tailored to their relationship with your child. No effort from you.',
    color: 'coral' as const,
  },
  {
    num: '3',
    title: 'The answers go into the vault',
    desc: 'Responses are stored privately, building over years into something your child will read when they\'re older. You decide when they get access.',
    color: 'teal' as const,
  },
];

const WHAT_GETS_CAPTURED = [
  { icon: '👶', title: 'The day they first met you', desc: 'What your grandma thought the moment she held you. What your godfather felt in the waiting room.' },
  { icon: '🌱', title: 'Who they were before you', desc: 'Stories from their own childhood. What they were afraid of. What they wanted to be.' },
  { icon: '💌', title: 'What they hope for you', desc: 'The advice they\'ve been meaning to give. The things they want you to know about life.' },
  { icon: '🕰️', title: 'Memories that would otherwise vanish', desc: 'The things no one thinks to write down. The moments that define a family, told in the voices that lived them.' },
];

const TESTIMONIALS = [
  {
    quote: "My dad has been answering questions for eight months. He's 74. He wrote about his first job, his parents, the day I was born. I didn't know any of it. My daughter will.",
    name: 'Rachel K.',
    detail: 'Mom of a 2-year-old',
  },
  {
    quote: "I'm the one being asked the questions. I cry every time I answer one. I didn't know I had this much to say to her.",
    name: 'Linda M.',
    detail: 'Grandmother of 1',
  },
  {
    quote: "We lost my father-in-law six months after our son was born. He only got to answer three questions. Those three answers are the most precious thing we own.",
    name: 'Mark T.',
    detail: 'Dad of a 3-year-old',
  },
];

const FAQS = [
  {
    q: 'How does OurFable work?',
    a: 'You add the people in your child\'s life — grandparents, godparents, old friends. OurFable sends each of them one question per month, tailored to their relationship with your child. Their answers are stored in a private vault. You decide when your child reads them.',
  },
  {
    q: 'Do contributors need to create an account?',
    a: 'No. They receive an email with one question. They click a link, type their answer, and submit. That\'s it. Nothing to download, nothing to log into.',
  },
  {
    q: 'What kind of questions do people receive?',
    a: 'Every question is crafted specifically for the contributor\'s relationship to your child. A grandmother gets different questions than a godparent or an old college friend. Questions cover memory, advice, hopes, stories — the things worth preserving.',
  },
  {
    q: 'When does my child get to read the vault?',
    a: 'You decide. Some parents plan to give access at 18. Some at a milestone birthday. Some when a child leaves home. The vault builds quietly in the background until the moment you choose.',
  },
  {
    q: 'What if someone passes away before my child reads the vault?',
    a: 'That\'s exactly why OurFable exists. The answers are preserved privately and permanently. Your child will have them regardless of what happens.',
  },
  {
    q: 'How much does it cost?',
    a: 'We\'re in early access. Join the waitlist to be notified when we launch — and to get our founding member pricing.',
  },
];

function FAQItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-brand-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-3 min-h-[48px]"
      >
        <span className="font-display text-sm sm:text-lg font-bold text-brand-ink">{q}</span>
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

function SparkleParticles() {
  const particles = [
    { left: '10%', top: '20%', size: 4, delay: 0, color: '#F5A623' },
    { left: '88%', top: '25%', size: 3, delay: 0.7, color: '#0EA5A5' },
    { left: '22%', top: '75%', size: 5, delay: 1.4, color: '#F5A623' },
    { left: '78%', top: '65%', size: 3, delay: 2.1, color: '#0EA5A5' },
    { left: '50%', top: '12%', size: 4, delay: 0.35, color: '#F5A623' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, backgroundColor: p.color }}
          animate={{ y: [0, -15, 0], opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
          transition={{ duration: 3, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 bg-white/90 backdrop-blur-xl border-b border-brand-border">
        <Link href="/" className="font-display text-xl sm:text-2xl font-extrabold text-brand-ink shrink-0">
          Our<span className="text-brand-teal">Fable</span>
          <span className="text-brand-ink-muted text-xs sm:text-sm font-body">.ai</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/auth/login" className="btn-secondary text-xs sm:text-sm py-2 px-3 sm:px-4 min-h-[44px]">
            Sign In
          </Link>
          <Link href="/waitlist" className="btn-primary text-xs sm:text-sm py-2 px-3 sm:px-4 min-h-[44px]">
            Get Early Access
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-gradient px-4 pt-14 pb-12 sm:pt-28 sm:pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-teal-light text-brand-teal-dark px-4 py-1.5 rounded-full font-bold text-xs tracking-wide uppercase mb-4 sm:mb-6 font-body">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
              Now in Early Access
            </div>
          </motion.div>
          <motion.h1
            className="font-display text-[1.75rem] sm:text-5xl lg:text-6xl font-extrabold text-brand-ink leading-[1.15] sm:leading-[1.1] mb-4 sm:mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            The people who love your child
            <span className="text-brand-coral"> won&apos;t always be here.</span>
            <span className="text-brand-teal"> Their voices can be.</span>
          </motion.h1>
          <motion.p
            className="text-brand-ink-light text-base sm:text-xl max-w-lg mx-auto mb-8 sm:mb-10 leading-relaxed font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            OurFable quietly interviews the people around your child — one question per month — and stores their answers in a vault only your child will read when they&apos;re older.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <EmailCapture source="hero" />
          </motion.div>
          <motion.p
            className="text-brand-ink-muted text-xs mt-4 font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Free to join. No credit card required.
          </motion.p>
        </div>
      </section>

      {/* Dispatches */}
      <section className="px-4 py-12 sm:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-brand-ink mb-5 sm:mb-7 leading-snug">
              One update. Everyone who matters.
            </h2>
            <p className="text-brand-ink-light text-base sm:text-lg leading-relaxed font-body mb-5">
              Your mom wants photos. Your sister wants videos. Your best friend just wants to know how the baby&apos;s doing. And you&apos;re supposed to remember to send all of it, to all of them, while running on three hours of sleep.
            </p>
            <p className="text-brand-ink text-base sm:text-lg leading-relaxed font-body font-semibold mb-5">
              Not anymore.
            </p>
            <p className="text-brand-ink-light text-base sm:text-lg leading-relaxed font-body mb-5">
              Record a voice memo. Snap a photo. Shoot a quick video. Write a few lines. Then hit send&nbsp;&mdash; once&nbsp;&mdash; and OurFable delivers it to every person in your child&apos;s circle.
            </p>
            <p className="text-brand-ink-light text-base sm:text-lg leading-relaxed font-body mb-5">
              Grandparents. Aunts. Uncles. Godparents. The college friend who&apos;s already obsessed. Everyone gets the update. Nobody gets forgotten.
            </p>
            <p className="text-brand-ink text-base sm:text-lg leading-relaxed font-body font-semibold">
              No group texts. No &ldquo;sorry I forgot to send you that.&rdquo; No guilt.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Problem */}
      <section className="border-y border-brand-border bg-brand-bg-warm px-4 py-12 sm:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-brand-ink mb-5 sm:mb-7 leading-snug">
              Grandparents die with their stories untold.
            </h2>
            <p className="text-brand-ink-light text-base sm:text-lg leading-relaxed font-body mb-5">
              Parents mean to record them. They never do. Old friends fade away. In twenty years, children want to know who loved them when they were small — and there is almost nothing left.
            </p>
            <p className="text-brand-ink text-base sm:text-lg leading-relaxed font-body font-semibold">
              OurFable fixes this quietly, automatically, before it&apos;s too late.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-12 sm:py-20 max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-8 sm:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-brand-ink mb-3">
            How it works
          </h2>
          <p className="text-brand-ink-muted text-sm sm:text-base font-body">
            Set it up once. It runs for years.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.2 }}
            >
              <motion.div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${step.color === 'teal' ? 'bg-brand-teal-light' : 'bg-brand-coral-light'}`}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 + 0.1, type: 'spring', stiffness: 300, damping: 15 }}
              >
                <span className={`font-display text-xl font-extrabold ${step.color === 'teal' ? 'text-brand-teal' : 'text-brand-coral'}`}>{step.num}</span>
              </motion.div>
              <h3 className="font-display text-lg font-bold text-brand-ink mb-2">{step.title}</h3>
              <p className="text-brand-ink-muted text-sm leading-relaxed font-body">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What Gets Captured */}
      <section className="px-4 py-12 sm:py-20 bg-brand-bg-warm border-y border-brand-border">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-8 sm:mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-brand-ink mb-3">
              What gets captured
            </h2>
            <p className="text-brand-ink-muted text-sm sm:text-base font-body max-w-lg mx-auto">
              Not just memories. The things children actually want to know when they grow up.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {WHAT_GETS_CAPTURED.map((item, i) => (
              <motion.div
                key={item.title}
                className="card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-display text-base font-bold text-brand-ink mb-2">{item.title}</h3>
                <p className="text-brand-ink-muted text-sm leading-relaxed font-body">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-8 sm:mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-brand-ink mb-3">
              Families who started early
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                className="card"
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
              >
                <div className="flex gap-1 text-brand-gold text-sm mb-3">★★★★★</div>
                <p className="text-brand-ink text-sm leading-relaxed font-body mb-4 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="border-t border-brand-border-light pt-3">
                  <p className="font-display text-sm font-bold text-brand-ink">{t.name}</p>
                  <p className="text-brand-ink-muted text-xs font-body">{t.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-12 sm:py-20 bg-brand-bg-warm border-y border-brand-border">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="text-center mb-8 sm:mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-brand-ink mb-3">
              Frequently asked questions
            </h2>
          </motion.div>
          <div>
            {FAQS.map((faq, i) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-teal px-4 py-12 sm:py-20 relative overflow-hidden">
        <SparkleParticles />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.h2
            className="font-display text-2xl sm:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Start building the vault.
          </motion.h2>
          <motion.p
            className="text-white/80 text-base sm:text-lg font-body mb-8 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            The best time to start was the day your child was born. The second best time is now.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <EmailCapture source="footer_cta" />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left">
            <div>
              <Link href="/" className="font-display text-xl font-extrabold text-brand-ink">
                Our<span className="text-brand-teal">Fable</span>
                <span className="text-brand-ink-muted text-sm font-body">.ai</span>
              </Link>
              <p className="text-brand-ink-muted text-xs sm:text-sm font-body mt-2 max-w-xs">
                A private vault of family voices, built one question at a time, for the child who will read it someday.
              </p>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end gap-x-6 sm:gap-x-8 gap-y-3 text-sm font-body">
              <Link href="/waitlist" className="text-brand-ink-light hover:text-brand-teal transition-colors min-h-[44px] flex items-center">Get Early Access</Link>
              <Link href="/auth/login" className="text-brand-ink-light hover:text-brand-teal transition-colors min-h-[44px] flex items-center">Sign In</Link>
              <Link href="/privacy" className="text-brand-ink-light hover:text-brand-teal transition-colors min-h-[44px] flex items-center">Privacy</Link>
              <Link href="/terms" className="text-brand-ink-light hover:text-brand-teal transition-colors min-h-[44px] flex items-center">Terms</Link>
            </div>
          </div>
          <div className="border-t border-brand-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
            <p className="text-brand-ink-muted text-xs sm:text-sm font-body">
              &copy; 2026 OurFable.ai. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
