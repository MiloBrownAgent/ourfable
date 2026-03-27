"use client";
import { useState } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
        <div style={{ maxWidth: 360, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green-light)", border: "1.5px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Mail size={22} color="var(--green)" strokeWidth={1.5} />
          </div>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
            Check your email.
          </p>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 24 }}>
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. Check your inbox (and spam folder).
          </p>
          <Link href="/login" style={{ fontSize: 13, color: "var(--green)", textDecoration: "none" }}>
            Back to sign in
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
            Reset your password.
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              autoComplete="email"
              style={{ fontSize: 15 }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "#E07070" }}>{error}</p>
          )}

          <button type="submit" disabled={loading || !email.trim()} style={{
            display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center",
            background: "var(--green)", color: "#fff", border: "none", borderRadius: 10,
            padding: "14px 24px", fontSize: 14, fontWeight: 600,
            cursor: !loading && email.trim() ? "pointer" : "not-allowed",
            opacity: !loading && email.trim() ? 1 : 0.6,
          }}>
            {loading ? "Sending…" : <><span>Send reset link</span> <ArrowRight size={14} strokeWidth={2} /></>}
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
