'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

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

const SAMPLE_PAGES = [
  { image: '/samples/story/page1.jpg', text: 'One magical evening, Lily discovered a tiny glowing door at the base of the old oak tree. Her heart raced with excitement as she reached for the golden handle.' },
  { image: '/samples/story/page2.jpg', text: 'Through the door lay a wondrous kingdom of floating islands and rainbow bridges. A fox wearing a tiny crown bowed and said, "We\'ve been waiting for you, brave one."' },
  { image: '/samples/story/page3.jpg', text: 'The bravest part came next — crossing the Wobbly Bridge over the Sparkling River. But Lily wasn\'t afraid. The star creatures lit the way, and she knew she could do it.' },
  { image: '/samples/story/page4.jpg', text: 'And so, surrounded by all her new friends, Lily danced in the meadow of wildflowers. She\'d found something more precious than any treasure — a place where she truly belonged.' },
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

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5]);

  return (
    <motion.div
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
    >
      {children}
    </motion.div>
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

function SampleBookPreview() {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = (newPage: number) => {
    if (newPage === page) return;
    setDirection(newPage > page ? 1 : -1);
    setPage(newPage);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 150 : -150, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -150 : 150, opacity: 0 }),
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-xl border border-brand-border overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SAMPLE_PAGES[page].image}
              alt={`Sample story page ${page + 1}`}
              className="w-full aspect-[4/3] object-cover"
            />
            {/* Page curl shadow */}
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/[0.06] to-transparent pointer-events-none" />
          </motion.div>
        </AnimatePresence>
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-brand-ink text-xs font-bold px-3 py-1 rounded-full font-body shadow-sm">
          Page {page + 1} of {SAMPLE_PAGES.length}
        </div>
      </div>
      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.p
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="font-body text-brand-ink text-base sm:text-lg leading-relaxed italic"
          >
            &ldquo;{SAMPLE_PAGES[page].text}&rdquo;
          </motion.p>
        </AnimatePresence>
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => paginate(Math.max(0, page - 1))}
            disabled={page === 0}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <div className="flex gap-1.5">
            {SAMPLE_PAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => paginate(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === page ? 'bg-brand-teal w-6' : 'bg-gray-200 hover:bg-gray-300'}`}
              />
            ))}
          </div>
          <button
            onClick={() => paginate(Math.min(SAMPLE_PAGES.length - 1, page + 1))}
            disabled={page === SAMPLE_PAGES.length - 1}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const PHYSICAL_BOOKS = [
  { src: '/samples/book-mockup-open.jpg', alt: 'Open storybook showing beautiful watercolor illustrations', title: 'Beautiful inside and out', desc: 'Thick glossy pages with vivid watercolor illustrations' },
  { src: '/samples/book-mockup-stack.jpg', alt: 'Stack of personalized storybooks wrapped as gift', title: 'The perfect gift', desc: "Birthdays, holidays, or just because — they'll love it" },
  { src: '/samples/book-mockup-reading.jpg', alt: 'Child reading their personalized storybook', title: 'Watch their face light up', desc: 'The moment they see themselves as the hero of their story' },
];

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
      <section className="hero-gradient px-4 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-teal-light text-brand-teal-dark px-4 py-1.5 rounded-full font-bold text-xs tracking-wide uppercase mb-6 font-body">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
              Now in Early Access
            </div>
          </motion.div>
          <motion.h1
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-ink leading-[1.1] mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Turn your child into the
            <span className="text-brand-teal"> hero</span> of their own
            <span className="text-brand-coral"> storybook</span>
          </motion.h1>
          <motion.p
            className="text-brand-ink-light text-lg sm:text-xl max-w-lg mx-auto mb-10 leading-relaxed font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Upload one photo and our AI creates a beautifully illustrated, personalized 12-page storybook in under 3 minutes.
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

      {/* Book Mockups */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex flex-col sm:flex-row sm:justify-center sm:items-end gap-4 sm:gap-6">
            {/* Left card */}
            <motion.div
              className="flex-1 max-w-xs mx-auto sm:mx-0"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <TiltCard className="animate-float-1">
                <div className="bg-white rounded-2xl shadow-lg border border-brand-border overflow-hidden">
                  <div className="h-64 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/samples/underwater-kingdom.jpg" alt="Underwater Kingdom storybook illustration" className="w-full h-full object-cover" />
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
              </TiltCard>
            </motion.div>
            {/* Middle card (highlighted) */}
            <motion.div
              className="flex-1 max-w-xs mx-auto sm:mx-0 sm:scale-110 sm:z-10"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <TiltCard className="animate-float-2">
                <div className="bg-white rounded-2xl shadow-xl border-2 border-brand-coral/20 overflow-hidden relative">
                  <div className="h-64 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/samples/space-adventure.jpg" alt="Space Adventure storybook illustration" className="w-full h-full object-cover" />
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
                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="shimmer-overlay" />
                  </div>
                </div>
              </TiltCard>
            </motion.div>
            {/* Right card */}
            <motion.div
              className="flex-1 max-w-xs mx-auto sm:mx-0"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <TiltCard className="animate-float-3">
                <div className="bg-white rounded-2xl shadow-lg border border-brand-border overflow-hidden">
                  <div className="h-64 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/samples/dragon-quest.jpg" alt="Dragon Quest storybook illustration" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="font-display text-sm font-bold text-brand-ink mb-2">The Dragon&apos;s Friend</div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                      <div className="h-1.5 bg-gray-100 rounded-full w-5/6" />
                      <div className="h-1.5 bg-gray-100 rounded-full w-2/3" />
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Physical Book Showcase */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
              A real book they&apos;ll treasure forever
            </h2>
            <p className="text-brand-ink-muted text-base font-body max-w-lg mx-auto">
              Premium hardcover with thick glossy pages. Printed and shipped to your door.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PHYSICAL_BOOKS.map((book, i) => (
              <motion.div
                key={i}
                className="rounded-2xl overflow-hidden shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={book.src} alt={book.alt} className="w-full h-64 object-cover" />
                <div className="bg-white p-4">
                  <p className="font-display text-sm font-bold text-brand-ink">{book.title}</p>
                  <p className="text-xs text-brand-ink-muted font-body mt-1">{book.desc}</p>
                </div>
              </motion.div>
            ))}
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
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
            How it works
          </h2>
          <p className="text-brand-ink-muted text-base font-body">
            Three simple steps. No artistic skills needed.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
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

      {/* Sample Story Preview */}
      <section className="px-4 py-20 bg-brand-bg-warm border-y border-brand-border">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
              Preview a sample story
            </h2>
            <p className="text-brand-ink-muted text-base font-body">
              Every book is unique. Here&apos;s a peek at what yours could look like.
            </p>
          </motion.div>
          <SampleBookPreview />
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-brand-bg-warm border-y border-brand-border px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
              Parents love OurFable
            </h2>
            <div className="flex items-center justify-center gap-1 text-brand-gold text-2xl font-display">
              ★★★★★
            </div>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-brand-ink text-sm leading-relaxed font-body mb-4">
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

      {/* Features */}
      <section className="px-4 py-20 max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
            Every book is one of a kind
          </h2>
          <p className="text-brand-ink-muted text-base font-body max-w-lg mx-auto">
            Powered by the same AI behind the world&apos;s best creative tools, each book is a unique masterpiece.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="card text-center sm:text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-display text-base font-bold text-brand-ink mb-1">{f.title}</h3>
              <p className="text-brand-ink-muted text-sm leading-relaxed font-body">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-brand-bg-warm border-y border-brand-border px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-brand-ink-muted text-base font-body">
              No subscriptions. Pay only when you love what you see.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Digital */}
            <motion.div
              className="card text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.1)', transition: { duration: 0.2 } }}
            >
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
            </motion.div>
            {/* Hardcover */}
            <motion.div
              className="card text-center relative animate-border-pulse"
              style={{ borderWidth: '2px' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.1)', transition: { duration: 0.2 } }}
            >
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20 max-w-2xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
            Frequently asked questions
          </h2>
        </motion.div>
        <div>
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-teal px-4 py-20 relative overflow-hidden">
        <SparkleParticles />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.h2
            className="font-display text-3xl sm:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Ready to create something magical?
          </motion.h2>
          <motion.p
            className="text-white/80 text-lg font-body mb-8 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Join thousands of parents making bedtime unforgettable. Get early access today.
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
              <Link href="/privacy" className="text-brand-ink-light hover:text-brand-teal transition-colors">Privacy</Link>
              <Link href="/terms" className="text-brand-ink-light hover:text-brand-teal transition-colors">Terms</Link>
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
