import Link from 'next/link';

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
          <Link href="/auth/login" className="btn-secondary text-sm">
            Sign In
          </Link>
          <Link href="/auth/signup" className="btn-primary text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-24 pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-teal-light text-brand-teal px-4 py-1.5 rounded-full font-bold text-xs tracking-wide uppercase mb-6 font-body">
            Personalized Storybooks
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-teal leading-[1.15] mb-5">
            Make your child the star of their very own book
          </h1>
          <p className="text-brand-ink-light text-lg max-w-lg mx-auto mb-8 leading-relaxed font-body">
            Upload a photo and we create a fully illustrated, personalized storybook with your child as the hero.
          </p>
          <Link href="/auth/signup" className="btn-primary text-base px-8 py-4 inline-block mb-6">
            Create Your Storybook
          </Link>
          <div className="text-brand-gold text-lg font-display mb-1">
            ★★★★★
          </div>
          <p className="text-brand-ink-muted text-sm font-body">
            Loved by families everywhere
          </p>
        </div>
      </section>

      {/* Visual showcase - three storybook cards */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex flex-col sm:flex-row sm:justify-center sm:items-end gap-4 sm:gap-6 -mx-2 sm:-mx-4">
            {/* Left card */}
            <div className="flex-1 max-w-xs mx-auto sm:mx-0">
              <div className="bg-white rounded-2xl shadow-lg border border-brand-border overflow-hidden">
                <div className="h-48 bg-gradient-to-b from-brand-teal-light to-white" />
                <div className="p-4 space-y-2">
                  <div className="h-2 bg-gray-100 rounded-full w-full" />
                  <div className="h-2 bg-gray-100 rounded-full w-5/6" />
                  <div className="h-2 bg-gray-100 rounded-full w-2/3" />
                </div>
              </div>
            </div>
            {/* Middle card (highlighted) */}
            <div className="flex-1 max-w-xs mx-auto sm:mx-0 sm:scale-105 sm:-mt-4 sm:z-10">
              <div className="bg-white rounded-2xl shadow-lg border border-brand-border overflow-hidden">
                <div className="h-48 bg-gradient-to-b from-brand-coral-light to-white" />
                <div className="p-4 space-y-2">
                  <div className="h-2 bg-gray-100 rounded-full w-full" />
                  <div className="h-2 bg-gray-100 rounded-full w-4/5" />
                  <div className="h-2 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-2 bg-gray-100 rounded-full w-2/3" />
                </div>
              </div>
            </div>
            {/* Right card */}
            <div className="flex-1 max-w-xs mx-auto sm:mx-0">
              <div className="bg-white rounded-2xl shadow-lg border border-brand-border overflow-hidden">
                <div className="h-48 bg-gradient-to-b from-brand-teal-light to-brand-coral-light" />
                <div className="p-4 space-y-2">
                  <div className="h-2 bg-gray-100 rounded-full w-full" />
                  <div className="h-2 bg-gray-100 rounded-full w-5/6" />
                  <div className="h-2 bg-gray-100 rounded-full w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof bar (unchanged) */}
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
            Photos kept private
          </div>
        </div>
      </section>

      {/* How it works (unchanged) */}
      <section className="px-4 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-3">
            How it works
          </h2>
          <p className="text-brand-ink-muted text-base font-body">
            Three steps. No artistic skills needed.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-teal-light flex items-center justify-center mx-auto mb-5">
              <span className="font-display text-xl font-extrabold text-brand-teal">1</span>
            </div>
            <h3 className="font-display text-lg font-bold text-brand-ink mb-2">Upload a photo</h3>
            <p className="text-brand-ink-muted text-sm leading-relaxed font-body">
              Share a clear photo of your child. Our AI uses it to keep their look consistent across every page.
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-coral-light flex items-center justify-center mx-auto mb-5">
              <span className="font-display text-xl font-extrabold text-brand-coral">2</span>
            </div>
            <h3 className="font-display text-lg font-bold text-brand-ink mb-2">Choose a theme</h3>
            <p className="text-brand-ink-muted text-sm leading-relaxed font-body">
              Pick an adventure, name your hero, and add family, friends, or pets to the story.
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-teal-light flex items-center justify-center mx-auto mb-5">
              <span className="font-display text-xl font-extrabold text-brand-teal">3</span>
            </div>
            <h3 className="font-display text-lg font-bold text-brand-ink mb-2">Get your book</h3>
            <p className="text-brand-ink-muted text-sm leading-relaxed font-body">
              Download a beautiful 12-page digital storybook instantly, or order a premium hardcover.
            </p>
          </div>
        </div>
      </section>

      {/* Feature callout (unchanged) */}
      <section className="bg-brand-bg-warm border-y border-brand-border">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-4">
            Every book is one of a kind
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-xl mx-auto mt-10">
            <div>
              <div className="font-display text-3xl font-extrabold text-brand-teal">12</div>
              <div className="text-brand-ink-muted text-xs font-semibold mt-1 font-body">Illustrated pages</div>
            </div>
            <div>
              <div className="font-display text-3xl font-extrabold text-brand-teal">AI</div>
              <div className="text-brand-ink-muted text-xs font-semibold mt-1 font-body">Written story</div>
            </div>
            <div>
              <div className="font-display text-3xl font-extrabold text-brand-teal">&lt;3m</div>
              <div className="text-brand-ink-muted text-xs font-semibold mt-1 font-body">Generation time</div>
            </div>
            <div>
              <div className="font-display text-3xl font-extrabold text-brand-teal">1</div>
              <div className="text-brand-ink-muted text-xs font-semibold mt-1 font-body">Photo needed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA (unchanged) */}
      <section className="px-4 py-20 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink mb-4">
          Ready to create something special?
        </h2>
        <Link href="/auth/signup" className="btn-primary text-base px-8 py-4 inline-block">
          Create Your Storybook
        </Link>
      </section>

      {/* Footer (unchanged) */}
      <footer className="text-center py-8 border-t border-brand-border">
        <p className="text-brand-ink-muted text-sm font-body">
          © 2026 OurFable.ai
        </p>
      </footer>
    </main>
  );
}

