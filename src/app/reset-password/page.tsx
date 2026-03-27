"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Lock } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canSubmit = password.length >= 6 && password === confirm && !!token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
        <div style={{ maxWidth: 360, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Lock size={22} color="var(--text-3)" strokeWidth={1.5} />
          </div>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
            Invalid reset link
          </p>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7 }}>
            This password reset link is missing or invalid.{" "}
            <Link href="/login" style={{ color: "var(--green)", textDecoration: "none" }}>Back to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
        <div style={{ maxWidth: 360, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green-light)", border: "1.5px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Check size={22} color="var(--green)" strokeWidth={2} />
          </div>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
            Password updated.
          </p>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 24 }}>
            Your password has been reset. You can now sign in with your new password.
          </p>
          <Link href="/login" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--green)", color: "#fff", borderRadius: 10,
            padding: "14px 24px", fontSize: 14, fontWeight: 600,
            textDecoration: "none",
          }}>
            Sign in <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px solid var(--green-border)", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 800, color: "var(--green)" }}>Our Fable</span>
          </div>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--text)", letterSpacing: "0.06em" }}>Our Fable</p>
        </div>

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 26, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
            Choose a new password.
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Must be at least 6 characters.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              autoComplete="new-password"
              autoFocus
              style={{ fontSize: 15 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              style={{ fontSize: 15 }}
            />
            {confirm && password !== confirm && (
              <p style={{ fontSize: 12, color: "#E07070", marginTop: 6 }}>Passwords don&apos;t match</p>
            )}
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(196,96,96,0.08)", border: "1px solid rgba(196,96,96,0.2)", borderRadius: 8 }}>
              <Lock size={13} color="var(--red)" strokeWidth={2} />
              <p style={{ fontSize: 13, color: "var(--red)" }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={!canSubmit || loading} className="btn-primary"
            style={{ padding: "14px 24px", fontSize: 14, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: canSubmit && !loading ? "pointer" : "not-allowed" }}>
            {loading ? "Resetting…" : <><span>Reset password</span> <ArrowRight size={14} strokeWidth={2} /></>}
          </button>
        </form>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Link href="/login" style={{ fontSize: 13, color: "var(--green)", textDecoration: "none" }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPasswordForm /></Suspense>;
}
