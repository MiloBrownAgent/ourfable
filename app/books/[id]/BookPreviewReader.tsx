'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type PageEntry = {
  text: string;
  imagePrompt?: string;
  imageUrl?: string;
  image_url?: string;
};

type ProgressStep = 'writing' | 'illustrations';

export default function BookPreviewReader({
  title,
  pages,
  bookId,
  status,
}: {
  title: string;
  pages: PageEntry[];
  bookId: string;
  status: string;
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingImages, setIsRegeneratingImages] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>('writing');
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [regenerateImagesError, setRegenerateImagesError] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const hasPagesButMissingImages =
    pages.length > 0 &&
    pages.some((p) => !(p.imageUrl ?? p.image_url));

  useEffect(() => {
    if (!isGenerating) return;
    setProgressStep('writing');
    const t = setTimeout(() => setProgressStep('illustrations'), 6000);
    return () => clearTimeout(t);
  }, [isGenerating]);

  // Fire confetti if redirected from creation flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('confetti') === 'true') {
      import('canvas-confetti').then((mod) => {
        mod.default({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  async function handleGenerate() {
    setGenerateError(null);
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Generation failed');
      }
      router.refresh();
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegenerateIllustrations() {
    setRegenerateImagesError(null);
    setIsRegeneratingImages(true);
    try {
      const res = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to regenerate illustrations');
      }
      router.refresh();
    } catch (err) {
      setRegenerateImagesError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsRegeneratingImages(false);
    }
  }

  const total = pages.length;
  const page = total > 0 ? pages[currentIndex] : null;
  const imageUrl = page
    ? (page.imageUrl ?? page.image_url)
    : null;
  const placeholder = 'https://placehold.co/800x600/FFE4F1/E24E8A?text=Illustration';

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/books/${bookId}`
    : '';

  const paginate = useCallback((newIndex: number) => {
    setDirection(newIndex > currentIndex ? 1 : -1);
    setCurrentIndex(newIndex);
  }, [currentIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) paginate(currentIndex - 1);
  }, [currentIndex, paginate]);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) paginate(currentIndex + 1);
  }, [currentIndex, total, paginate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goPrev, goNext]);

  async function handleShare(platform: 'facebook' | 'copy' | 'native') {
    const text = `Check out "${title}" — a personalized storybook I made with OurFable.ai!`;

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ title: `${title} — Made with OurFable.ai`, text, url: shareUrl });
      } catch {
        // User cancelled
      }
      setShowShareMenu(false);
      return;
    }

    if (platform === 'facebook') {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`,
        '_blank',
        'width=600,height=400'
      );
      setShowShareMenu(false);
      return;
    }

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch {
        // Fallback
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('Link copied!');
      }
      setShowShareMenu(false);
      return;
    }
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 150 : -150, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -150 : 150, opacity: 0 }),
  };

  if (status === 'generating' && !isGenerating) {
    return (
      <div className="card text-center py-16">
        <motion.div
          className="text-6xl mb-4"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ✨
        </motion.div>
        <h1 className="font-display text-2xl font-bold mb-2">{title}</h1>
        <p className="text-brand-ink-muted">Your story and illustrations are being created. Refresh in a moment!</p>
      </div>
    );
  }

  if (status === 'draft' || status === 'failed') {
    return (
      <div className="card text-center py-16">
        <div className="text-6xl mb-4">{status === 'failed' ? '😔' : '✨'}</div>
        <h1 className="font-display text-2xl font-bold mb-2">{title}</h1>
        <p className="text-brand-ink-muted mb-6">
          {status === 'draft'
            ? 'This book is still a draft. Click below to generate your story and illustrations.'
            : 'Something went wrong last time. You can try again below.'}
        </p>
        {generateError && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-200 mb-6 max-w-md mx-auto">
            {generateError}
          </div>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="btn-primary justify-center disabled:opacity-60"
        >
          {!isGenerating && '📚 Generate My Book'}
          {isGenerating && progressStep === 'writing' && (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
              Writing your story...
            </>
          )}
          {isGenerating && progressStep === 'illustrations' && (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
              Generating illustrations...
            </>
          )}
        </button>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="card text-center py-16">
        <h1 className="font-display text-2xl font-bold mb-2">{title}</h1>
        <p className="text-brand-ink-muted">No pages yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-brand-ink">{title}</h1>
        <p className="text-brand-ink-muted text-sm mt-1">Page {currentIndex + 1} of {total}</p>
      </div>

      {hasPagesButMissingImages && (
        <div className="card py-4 px-6 space-y-4">
          {regenerateImagesError && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2 border border-red-200">
              {regenerateImagesError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-brand-ink-muted text-sm">Some or all illustrations are missing. Regenerate them with your character photo.</p>
            <button
            type="button"
            onClick={handleRegenerateIllustrations}
            disabled={isRegeneratingImages}
            className="btn-primary justify-center disabled:opacity-60 shrink-0"
          >
            {!isRegeneratingImages && '🎨 Regenerate Illustrations'}
            {isRegeneratingImages && (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
                Regenerating...
              </>
            )}
          </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="aspect-[4/3] sm:aspect-[3/4] max-h-[60vh] w-full bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center relative">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl || placeholder}
                alt={`Page ${currentIndex + 1}`}
                className="w-full h-full object-contain"
              />
            </motion.div>
          </AnimatePresence>
          {/* Page curl shadow */}
          <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/[0.05] to-transparent pointer-events-none" />
        </div>
        <div className="mt-6 px-1">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="font-body text-brand-ink text-lg leading-relaxed"
            >
              {page!.text}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="btn-secondary disabled:opacity-50 disabled:pointer-events-none"
        >
          ← Previous
        </button>
        <span className="text-sm font-display font-bold text-brand-ink-muted">
          {currentIndex + 1} / {total}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={currentIndex === total - 1}
          className="btn-secondary disabled:opacity-50 disabled:pointer-events-none"
        >
          Next →
        </button>
      </div>

      {/* Share section */}
      <div className="relative flex justify-center">
        <button
          type="button"
          onClick={() => {
            // Try native share first on mobile
            if (typeof navigator.share === "function") {
              handleShare('native');
            } else {
              setShowShareMenu(!showShareMenu);
            }
          }}
          className="btn-secondary text-sm gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share This Book
        </button>

        <AnimatePresence>
          {showShareMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 bg-white rounded-xl shadow-lg border border-brand-border p-3 flex flex-col gap-2 min-w-[200px] z-10"
            >
              <button
                type="button"
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-body text-brand-ink"
              >
                <span className="text-blue-600 text-lg">f</span>
                Share to Facebook
              </button>
              <button
                type="button"
                onClick={() => handleShare('copy')}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-body text-brand-ink"
              >
                <svg className="w-5 h-5 text-brand-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copy Link
              </button>
              <div className="border-t border-brand-border-light pt-2 mt-1">
                <p className="text-[11px] text-brand-ink-muted text-center">Made with OurFable.ai</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
