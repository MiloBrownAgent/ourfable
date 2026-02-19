'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingImages, setIsRegeneratingImages] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>('writing');
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [regenerateImagesError, setRegenerateImagesError] = useState<string | null>(null);

  const hasPagesButMissingImages =
    pages.length > 0 &&
    pages.some((p) => !(p.imageUrl ?? p.image_url));

  useEffect(() => {
    if (!isGenerating) return;
    setProgressStep('writing');
    const t = setTimeout(() => setProgressStep('illustrations'), 6000);
    return () => clearTimeout(t);
  }, [isGenerating]);

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

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);
  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goPrev, goNext]);

  if (status === 'generating' && !isGenerating) {
    return (
      <div className="card text-center py-16">
        <div className="text-6xl mb-4">✨</div>
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
        <div className="aspect-[4/3] sm:aspect-[3/4] max-h-[60vh] w-full bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl || placeholder}
            alt={`Page ${currentIndex + 1}`}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="mt-6 px-1">
          <p className="font-body text-brand-ink text-lg leading-relaxed">
            {page!.text}
          </p>
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
    </div>
  );
}
