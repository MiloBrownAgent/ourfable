"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function UnsubscribeForm() {
  const params = useSearchParams();
  const prefillEmail = params.get("email") ?? "";
  const [email, setEmail] = useState(prefillEmail);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/ourfable/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
    } catch {
      setError("Something went wrong. Email us at privacy@ourfable.ai to be removed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700, color: "var(--green)", marginBottom: 40 }}>Our Fable</p>
        </Link>

        {done ? (
          <div style={{ padding: "36px 32px", background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 16 }}>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>You're unsubscribed.</p>
            <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 24 }}>
              We've removed you from the Our Fable waitlist. You won't receive any more emails from us.
            </p>
            <Link href="/" className="btn-secondary" style={{ fontSize: 14 }}>Back to Our Fable</Link>
          </div>
        ) : (
          <div style={{ padding: "36px 32px", background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 16 }}>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Unsubscribe</p>
            <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 28 }}>
              Enter your email and we'll remove you from the waitlist immediately.
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ padding: "13px 16px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 15, outline: "none", fontFamily: "inherit" }}
              />
              {error && <p style={{ fontSize: 13, color: "#c0392b" }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "13px 24px", fontSize: 14, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Removing…" : "Unsubscribe"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return <Suspense fallback={null}><UnsubscribeForm /></Suspense>;
}
