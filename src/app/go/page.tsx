"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Lock, Loader2 } from "lucide-react";
import { captureUtmParams, getUtmParams } from "../../lib/utm";
import { trackLead, generateEventId } from "../../lib/analytics";

export default function GoPage() {
  return (
    <Suspense>
      <GoPageInner />
    </Suspense>
  );
}

function GoPageInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    captureUtmParams();
  }, [searchParams]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const emailTouched = email.length > 0;
  const showEmailError = emailTouched && !emailValid && email.length > 3;
  const canSubmit = emailValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");
    try {
      const utms = getUtmParams();
      const eid = generateEventId();
      const res = await fetch("/api/ourfable/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          childName: childName.trim() || undefined,
          source: "fb-ad",
          eventId: eid,
          ...utms,
        }),
      });
      if (res.ok) {
        setSuccessEmail(email.trim().toLowerCase());
        setSuccess(true);
        trackLead(eid);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success ──
  if (success) {
    return (
      <div style={pageStyle}>
        <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "var(--green)", margin: "0 auto 28px",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}>
            <Check size={36} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 className="font-display" style={{
            fontSize: 28, fontWeight: 700,
            color: "var(--text)", marginBottom: 12,
          }}>
            You&apos;re in.
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 12 }}>
            We&apos;ll email you when your vault is ready.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-4)", lineHeight: 1.5, marginBottom: 36 }}>
            Confirmation sent to{" "}
            <strong style={{ color: "var(--text-3)" }}>{successEmail}</strong>
          </p>
          <Link href="/" style={{ fontSize: 14, color: "var(--green)", textDecoration: "none", fontWeight: 500 }}>
            Learn more about Our Fable →
          </Link>
        </div>
        <style>{`@keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .go-input { width: 100%; padding: 14px 16px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 16px; font-family: inherit; color: var(--text); background: #fff; transition: border-color 0.2s; box-sizing: border-box; outline: none; }
        .go-input:focus { border-color: var(--green); }
        .go-input::placeholder { color: var(--text-4, #C8C3BA); }
      `}</style>

      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 12 }}>
        <span className="font-display" style={{
          fontSize: 24, fontWeight: 700,
          color: "var(--green)", letterSpacing: "0.02em",
        }}>
          Our Fable
        </span>
      </Link>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 440,
        background: "#fff", borderRadius: 16,
        boxShadow: "0 2px 24px rgba(0,0,0,0.07)",
        padding: "40px 32px",
        animation: "fadeSlideIn 0.5s ease both",
      }}>
        {/* Emotional hook */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🌿</p>
          <h1 className="font-display" style={{
            fontSize: 24, fontWeight: 700, color: "var(--text)",
            lineHeight: 1.35, marginBottom: 14,
          }}>
            What if your child could open<br />letters from everyone who<br />loved them — years from now?
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-3)", lineHeight: 1.65 }}>
            Grandparents, godparents, aunts, uncles — every month, Our Fable asks them a simple question. Their answers are sealed until your child is ready.
          </p>
        </div>

        {/* Form — stripped down, zero friction */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <input
              className="go-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              autoComplete="email"
              required
              style={showEmailError ? { borderColor: "#E07070" } : undefined}
            />
            {showEmailError && (
              <p style={{ fontSize: 12, color: "#E07070", margin: "6px 0 0" }}>
                Please enter a valid email address.
              </p>
            )}
          </div>

          <input
            className="go-input"
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Child's first name (optional)"
            autoComplete="given-name"
          />

          {error && (
            <p style={{ fontSize: 13, color: "#E07070", textAlign: "center", margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="btn-primary"
            style={{
              width: "100%", justifyContent: "center",
              fontSize: 16, padding: "15px 24px", marginTop: 4,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
                Joining…
              </>
            ) : (
              "Join the waitlist — it\u2019s free →"
            )}
          </button>
        </form>

        {/* Trust signals */}
        <div style={{ marginTop: 20, textAlign: "center", display: "flex", flexDirection: "column", gap: 5 }}>
          <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
            Free to join · No credit card · Founding families get early access
          </p>
          <p style={{
            fontSize: 12, color: "var(--text-3)", margin: 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          }}>
            <Lock size={11} strokeWidth={2} aria-hidden="true" />
            Private vault · Never shared · Export anytime
          </p>
        </div>
      </div>

      {/* Social proof */}
      <p style={{
        marginTop: 24, fontSize: 13, color: "var(--text-4)",
        textAlign: "center", fontStyle: "italic",
      }}>
        &ldquo;Like a time capsule, but it fills itself.&rdquo;
      </p>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 24px",
};
