'use client';

// ConsentGate — COPPA P0
// Wraps the story creation form. Blocks access until the parent has
// affirmatively consented to photo collection + AI processing.
// On first mount it checks the server for existing consent; shows
// the disclosure screen if none is found.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type ConsentStatus = 'loading' | 'needed' | 'granted';

interface Props {
  children: React.ReactNode;
}

export default function ConsentGate({ children }: Props) {
  const [status, setStatus] = useState<ConsentStatus>('loading');
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check server for existing consent on mount
  useEffect(() => {
    async function checkConsent() {
      try {
        const res = await fetch('/api/user/consent');
        if (!res.ok) throw new Error('Could not verify consent status');
        const data = await res.json();
        // If they have consent and it's the current version, pass through
        if (data.hasConsent && !data.needsRenewal) {
          setStatus('granted');
        } else {
          setStatus('needed');
        }
      } catch {
        // Fail open: if we can't check, show consent screen (safe default)
        setStatus('needed');
      }
    }
    checkConsent();
  }, []);

  async function handleGrant() {
    if (!checked) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/user/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentType: 'photo_collection_and_ai_processing',
          acknowledged: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to record consent');
      }
      setStatus('granted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state — brief spinner
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="inline-block w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Pass-through once consented
  if (status === 'granted') {
    return <>{children}</>;
  }

  // Consent disclosure screen
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="consent"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="font-display text-2xl font-bold text-brand-ink mb-1">
            Before we create your storybook
          </h2>
          <p className="text-brand-ink-muted text-sm max-w-sm mx-auto">
            Because our storybooks feature photos of real children, we need your permission
            first. Takes 30 seconds — no surprises.
          </p>
        </div>

        {/* Disclosure card */}
        <div className="bg-brand-page-bg rounded-2xl border border-gray-200 p-5 space-y-4 text-sm">
          <h3 className="font-display font-bold text-brand-ink">What we collect &amp; how we use it</h3>

          <div className="space-y-3">
            <DisclosureRow
              icon="📸"
              title="Your child's photo"
              detail="Uploaded photos are sent to Replicate (our AI illustration partner) to generate storybook artwork. After processing, photos are stored in our secure database so you can re-generate or revisit your books."
            />
            <DisclosureRow
              icon="🎨"
              title="Generated illustrations"
              detail="AI-created artwork based on your photo is stored in your account and shown in your storybook."
            />
            <DisclosureRow
              icon="🗑️"
              title="Your right to delete"
              detail="You can delete your photos and generated images at any time from your account settings. We'll also automatically delete original photos 90 days after book delivery."
            />
            <DisclosureRow
              icon="🚫"
              title="What we never do"
              detail="We never use your child's photo to train AI models. We never share photos with advertisers. We never sell personal data."
            />
          </div>

          <p className="text-brand-ink-muted text-xs pt-1">
            For full details, read our{' '}
            <Link href="/privacy" className="text-brand-teal font-semibold underline" target="_blank">
              Privacy Policy
            </Link>
            , including Section 5 on Children&apos;s Privacy (COPPA).
          </p>
        </div>

        {/* Consent checkbox */}
        <label
          className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all select-none ${
            checked
              ? 'border-brand-teal bg-teal-50'
              : 'border-gray-200 bg-white hover:border-brand-teal/40'
          }`}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded accent-brand-teal shrink-0 cursor-pointer"
          />
          <span className="text-sm text-brand-ink font-medium leading-snug">
            I am the parent or legal guardian of the child featured in these photos. I consent to
            OurFable collecting and processing my child&apos;s photo as described above and in the{' '}
            <Link
              href="/privacy"
              className="text-brand-teal font-semibold underline"
              target="_blank"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-200">
            {error}
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <button
            onClick={handleGrant}
            disabled={!checked || submitting}
            className="btn-primary w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              '✅ I consent — continue to create'
            )}
          </button>
          <Link
            href="/dashboard"
            className="text-sm text-brand-ink-muted hover:text-brand-ink underline"
          >
            Back to dashboard
          </Link>
        </div>

        <p className="text-xs text-brand-ink-muted text-center">
          You only need to do this once. You can revoke consent anytime in Account Settings.
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

function DisclosureRow({
  icon,
  title,
  detail,
}: {
  icon: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="text-xl shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="font-semibold text-brand-ink text-sm">{title}</p>
        <p className="text-brand-ink-muted text-xs leading-relaxed mt-0.5">{detail}</p>
      </div>
    </div>
  );
}
