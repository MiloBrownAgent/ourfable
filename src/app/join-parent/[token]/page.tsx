"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Shield } from "lucide-react";
import { deriveKeyEncryptionKey, generateSalt, unwrapFamilyKey, wrapFamilyKey } from "@/lib/vault-encryption";

export default function JoinParentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<{
    email: string;
    invitedByName: string;
    childName: string;
    familyId: string;
    encryptedFamilyKeyForInvite?: string | null;
    inviteKeySalt?: string | null;
  } | null>(null);
  const [error, setError] = useState("");

  // Form
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    async function loadInvite() {
      try {
        const res = await fetch(`/api/ourfable/join-parent?token=${token}`);
        const data = await res.json();
        if (res.ok) {
          setInviteData(data);
        } else {
          setError(data.error ?? "Invalid or expired invite link.");
        }
      } catch {
        setError("Failed to load invite. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  }, [token]);

  const childFirst = inviteData?.childName?.split(" ")[0] ?? "the child";
  const canSubmit = name.trim().length > 1 && password.length >= 6 && password === confirmPassword;

  async function handleSubmit() {
    setSubmitError("");
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      let encryptedFamilyKey: string | undefined;
      let keySalt: string | undefined;

      if (inviteData?.encryptedFamilyKeyForInvite && inviteData.inviteKeySalt) {
        const inviterPassword = sessionStorage.getItem(`ourfable-pwd-${inviteData.familyId}`);
        if (!inviterPassword) {
          setSubmitError("Ask the inviting parent to sign in again before you accept this invite. Their vault key needs to be shared securely.");
          setSubmitting(false);
          return;
        }

        const inviterKek = await deriveKeyEncryptionKey(inviterPassword, inviteData.inviteKeySalt);
        const familyKey = await unwrapFamilyKey(JSON.parse(inviteData.encryptedFamilyKeyForInvite), inviterKek);
        keySalt = generateSalt();
        const newUserKek = await deriveKeyEncryptionKey(password, keySalt);
        encryptedFamilyKey = JSON.stringify(await wrapFamilyKey(familyKey, newUserKek));
      }

      const res = await fetch("/api/ourfable/join-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          email: inviteData?.email,
          password,
          encryptedFamilyKey,
          keySalt,
        }),
      });
      const data = await res.json();
      if (res.ok && data.familyId) {
        window.location.href = `/${data.familyId}`;
      } else {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-3)" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px", textAlign: "center",
      }}>
        <Link href="/" style={{ textDecoration: "none", marginBottom: 32 }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--green)", letterSpacing: "0.12em" }}>Our Fable</span>
        </Link>
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "32px 28px", maxWidth: 400,
        }}>
          <p style={{ fontSize: 16, color: "var(--text)", fontWeight: 600, marginBottom: 8 }}>
            Invite unavailable
          </p>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>
            {error}
          </p>
          <Link href="/login" style={{
            display: "inline-block", marginTop: 20,
            color: "var(--green)", fontSize: 14, textDecoration: "none", fontWeight: 500,
          }}>
            Go to login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--green)", letterSpacing: "0.12em" }}>Our Fable</span>
        </Link>
      </div>

      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{
              fontFamily: "var(--font-playfair)", fontSize: 28, fontWeight: 700,
              color: "var(--text)", marginBottom: 8,
            }}>
              Join {childFirst}&apos;s Fable
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>
              {inviteData?.invitedByName} invited you to help build {childFirst}&apos;s memory vault.
              Create your own account to get started.
            </p>
          </div>

          {/* Invite info card */}
          <div style={{
            background: "var(--green-light)", border: "1px solid var(--green-border)",
            borderRadius: 12, padding: "16px 20px",
          }}>
            <p style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>
              You&apos;ll share the same vault as {inviteData?.invitedByName}, with your own login, password, and 2FA settings.
            </p>
          </div>

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{
                display: "block", fontSize: 10, fontWeight: 500,
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: "var(--text-3)", marginBottom: 8,
              }}>
                Your name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amanda"
                autoFocus
                style={{
                  width: "100%", padding: "12px 16px", fontSize: 15,
                  border: "1px solid var(--border)", borderRadius: 10,
                  background: "var(--bg)", color: "var(--text)", outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{
                display: "block", fontSize: 10, fontWeight: 500,
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: "var(--text-3)", marginBottom: 8,
              }}>
                Email
              </label>
              <input
                value={inviteData?.email ?? ""}
                disabled
                style={{
                  width: "100%", padding: "12px 16px", fontSize: 15,
                  border: "1px solid var(--border)", borderRadius: 10,
                  background: "var(--surface)", color: "var(--text-3)", outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{
                display: "block", fontSize: 10, fontWeight: 500,
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: "var(--text-3)", marginBottom: 8,
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                autoComplete="new-password"
                style={{
                  width: "100%", padding: "12px 16px", fontSize: 15,
                  border: "1px solid var(--border)", borderRadius: 10,
                  background: "var(--bg)", color: "var(--text)", outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{
                display: "block", fontSize: 10, fontWeight: 500,
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: "var(--text-3)", marginBottom: 8,
              }}>
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                style={{
                  width: "100%", padding: "12px 16px", fontSize: 15,
                  border: "1px solid var(--border)", borderRadius: 10,
                  background: "var(--bg)", color: "var(--text)", outline: "none",
                }}
              />
              {confirmPassword && password !== confirmPassword && (
                <p style={{ fontSize: 12, color: "#E07070", marginTop: 6 }}>Passwords don&apos;t match</p>
              )}
            </div>
          </div>

          {submitError && (
            <p style={{ fontSize: 13, color: "#E07070", textAlign: "center" }}>{submitError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="btn-gold"
            style={{
              justifyContent: "center", width: "100%",
              fontSize: 15, padding: "16px 24px",
              opacity: canSubmit && !submitting ? 1 : 0.5,
            }}
          >
            {submitting ? "Creating your account…" : <>Join {childFirst}&apos;s Fable <ArrowRight size={15} /></>}
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Shield size={12} color="var(--text-3)" strokeWidth={1.5} />
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
              Your login is separate from {inviteData?.invitedByName}&apos;s
            </p>
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--green)", textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
