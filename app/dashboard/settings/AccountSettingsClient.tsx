'use client';

// AccountSettingsClient — interactive privacy & data management section
// Surfaces: consent status, revoke consent, delete photos, delete account

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  userEmail: string;
}

type ConsentInfo = {
  hasConsent: boolean;
  consent: { granted_at: string; consent_version: string } | null;
  needsRenewal: boolean;
};

export default function AccountSettingsClient({ userEmail }: Props) {
  const router = useRouter();
  const [consent, setConsent] = useState<ConsentInfo | null>(null);
  const [loadingConsent, setLoadingConsent] = useState(true);

  const [deletingPhotos, setDeletingPhotos] = useState(false);
  const [photoDeleteDone, setPhotoDeleteDone] = useState(false);
  const [photoDeleteError, setPhotoDeleteError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accountDeleteError, setAccountDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConsent() {
      try {
        const res = await fetch('/api/user/consent');
        if (res.ok) setConsent(await res.json());
      } finally {
        setLoadingConsent(false);
      }
    }
    fetchConsent();
  }, []);

  async function revokeConsent() {
    const res = await fetch('/api/user/consent', { method: 'DELETE' });
    if (res.ok) {
      setConsent((prev) => prev ? { ...prev, hasConsent: false, consent: null } : null);
    }
  }

  async function deletePhotos() {
    setDeletingPhotos(true);
    setPhotoDeleteError(null);
    try {
      const res = await fetch('/api/user/photos', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete photos');
      setPhotoDeleteDone(true);
    } catch (err) {
      setPhotoDeleteError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDeletingPhotos(false);
    }
  }

  async function deleteAccount() {
    if (deleteConfirmText.toLowerCase() !== 'delete my account') return;
    setDeletingAccount(true);
    setAccountDeleteError(null);
    try {
      const res = await fetch('/api/user/account', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');
      // Sign out locally then redirect
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/?deleted=1');
    } catch (err) {
      setAccountDeleteError(err instanceof Error ? err.message : 'Something went wrong');
      setDeletingAccount(false);
    }
  }

  return (
    <>
      {/* Consent status */}
      <section className="card p-6">
        <h2 className="font-display text-lg font-bold text-brand-ink mb-1">Parental Consent</h2>
        <p className="text-xs text-brand-ink-muted mb-4">
          Your consent allows us to process your child&apos;s photos to generate storybook illustrations.
        </p>
        {loadingConsent ? (
          <div className="text-sm text-brand-ink-muted">Checking consent status…</div>
        ) : consent?.hasConsent ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700 bg-green-50 px-4 py-2 rounded-xl">
              <span className="text-base">✅</span>
              Consent granted
              {consent.consent?.granted_at && (
                <span className="font-normal text-green-600 ml-1">
                  · {new Date(consent.consent.granted_at).toLocaleDateString()}
                </span>
              )}
            </div>
            {consent.needsRenewal && (
              <div className="text-xs text-amber-700 bg-amber-50 px-4 py-2 rounded-xl">
                ⚠️ Your consent was given under an older policy version. Please review and re-consent on the{' '}
                <a href="/create" className="underline font-semibold">Create page</a>.
              </div>
            )}
            <button
              onClick={revokeConsent}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              Revoke consent
            </button>
            <p className="text-xs text-brand-ink-muted">
              Revoking consent means no new photos will be processed. Existing books are not affected.
              To delete existing photos, use &quot;Delete My Photos&quot; below.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
              <span className="text-base">⭕</span>
              No active consent on file
            </div>
            <p className="text-xs text-brand-ink-muted">
              You&apos;ll be asked to consent when you next create a storybook.
            </p>
          </div>
        )}
      </section>

      {/* Delete photos */}
      <section className="card p-6">
        <h2 className="font-display text-lg font-bold text-brand-ink mb-1">Delete My Photos</h2>
        <p className="text-sm text-brand-ink-muted mb-4">
          Permanently removes all uploaded character photos from our storage. Your storybooks will
          be preserved but won&apos;t be able to show the original photo.
        </p>
        {photoDeleteDone ? (
          <div className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded-xl font-semibold">
            ✅ All photos deleted successfully.
          </div>
        ) : (
          <>
            {photoDeleteError && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl mb-3">
                {photoDeleteError}
              </div>
            )}
            <button
              onClick={deletePhotos}
              disabled={deletingPhotos}
              className="btn-secondary text-sm border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deletingPhotos ? '🗑️ Deleting…' : '🗑️ Delete All Photos'}
            </button>
          </>
        )}
      </section>

      {/* Delete account */}
      <section className="card p-6 border-red-200">
        <h2 className="font-display text-lg font-bold text-red-700 mb-1">Delete My Account</h2>
        <p className="text-sm text-brand-ink-muted mb-4">
          Permanently deletes your account, all photos, all storybooks, and all associated data.
          A confirmation email will be sent to <strong>{userEmail}</strong>. This cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-secondary text-sm border-red-300 text-red-700 hover:bg-red-50"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 space-y-1">
              <p className="font-bold">⚠️ This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-0.5 text-red-700 text-xs">
                <li>All uploaded photos</li>
                <li>All AI-generated illustrations</li>
                <li>All storybooks and pages</li>
                <li>Your account and login credentials</li>
                <li>All parental consent records</li>
              </ul>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-ink mb-1.5">
                Type <span className="font-mono bg-gray-100 px-1 rounded">delete my account</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete my account"
                className="input-field text-sm"
              />
            </div>
            {accountDeleteError && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">
                {accountDeleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={deleteAccount}
                disabled={
                  deletingAccount ||
                  deleteConfirmText.toLowerCase() !== 'delete my account'
                }
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingAccount ? 'Deleting…' : 'Permanently Delete Account'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                  setAccountDeleteError(null);
                }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
