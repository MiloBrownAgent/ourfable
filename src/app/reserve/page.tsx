"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Lock, Gift, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { captureUtmParams, getUtmParams } from "../../lib/utm";
import { trackLead, generateEventId } from "../../lib/analytics";

type GiftTier = "standard" | "plus";

const TIERS = {
  standard: {
    name: "Our Fable",
    annualPrice: 79,
    originalPrice: 99,
    tagline: "Vault, prompts, circle",
  },
  plus: {
    name: "Our Fable+",
    annualPrice: 99,
    originalPrice: 149,
    tagline: "Everything + voice, dispatches",
  },
};

export default function ReservePage() {
  return (
    <Suspense>
      <ReservePageInner />
    </Suspense>
  );
}

function ReservePageInner() {
  const searchParams = useSearchParams();
  const [isGift, setIsGift] = useState(false);

  // Auto-check gift mode if ?gift=true + capture UTMs
  useEffect(() => {
    if (searchParams.get("gift") === "true") {
      setIsGift(true);
    }
    captureUtmParams();
  }, [searchParams]);

  // — Waitlist state —
  const [childName, setChildName] = useState("");
  const [childBirthday, setChildBirthday] = useState("");
  const [email, setEmail] = useState("");

  // — Gift state —
  const [gifterName, setGifterName] = useState("");
  const [gifterEmail, setGifterEmail] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [gifterMessage, setGifterMessage] = useState("");
  const [selectedTier, setSelectedTier] = useState<GiftTier>("standard");

  // — Shared state —
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [successRecipientEmail, setSuccessRecipientEmail] = useState("");
  const [successMode, setSuccessMode] = useState<"waitlist" | "gift">("waitlist");
  const [error, setError] = useState("");

  // — Validation —
  const emailTouched = email.length > 0;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const showEmailError = emailTouched && !emailValid && email.length > 3;
  const canSubmitWaitlist = childName.trim().length > 0 && emailValid;

  const gifterEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gifterEmail.trim());
  const recipientEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim());
  const canSubmitGift = gifterName.trim().length > 0 && gifterEmailValid && recipientEmailValid;

  const tier = TIERS[selectedTier];

  // Height animation refs
  const waitlistRef = useRef<HTMLDivElement>(null);
  const giftRef = useRef<HTMLDivElement>(null);

  const handleToggleGift = (val: boolean) => {
    setIsGift(val);
    setError("");
  };

  // — Waitlist submit —
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitWaitlist || loading) return;
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
          childName: childName.trim(),
          childBirthday,
          source: "reserve",
          eventId: eid,
          referralCode: searchParams.get("ref") ?? undefined,
          ...utms,
        }),
      });
      if (res.ok) {
        setSuccessMode("waitlist");
        setSuccessEmail(email.trim().toLowerCase());
        setSuccessRecipientEmail("");
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

  // — Gift submit — saves to waitlist (no payment yet)
  const handleGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitGift || loading) return;
    setLoading(true);
    setError("");
    try {
      const utms = getUtmParams();
      const eid = generateEventId();
      const res = await fetch("/api/ourfable/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recipientEmail.trim().toLowerCase(),
          gifterName: gifterName.trim(),
          gifterEmail: gifterEmail.trim().toLowerCase(),
          recipientEmail: recipientEmail.trim().toLowerCase(),
          source: "gift-waitlist",
          eventId: eid,
          referralCode: searchParams.get("ref") ?? undefined,
          requestedPlanType: selectedTier,
          ...utms,
        }),
      });
      if (res.ok) {
        setSuccessMode("gift");
        setSuccessEmail(gifterEmail.trim().toLowerCase());
        setSuccessRecipientEmail(recipientEmail.trim().toLowerCase());
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

  // ── Success state ──
  if (success) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "var(--green)", margin: "0 auto 28px",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}>
            <Check size={36} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{
            fontFamily: "var(--font-playfair)", fontSize: 28, fontWeight: 700,
            color: "var(--text)", marginBottom: 12,
          }}>
            {successMode === "gift" ? "Gift reserved." : "You&apos;re in."}
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 12 }}>
            {successMode === "gift"
              ? "We emailed the recipient and sent your confirmation."
              : "We&apos;ll be in touch when your family&apos;s vault is ready."}
          </p>
          <p style={{ fontSize: 13, color: "var(--text-4)", lineHeight: 1.5, marginBottom: 36 }}>
            {successMode === "gift" ? (
              <>
                Confirmation sent to{" "}
                <strong style={{ color: "var(--text-3)" }}>{successEmail}</strong>
                {" · "}
                Recipient notified at{" "}
                <strong style={{ color: "var(--text-3)" }}>{successRecipientEmail}</strong>
              </>
            ) : (
              <>
                Confirmation sent to{" "}
                <strong style={{ color: "var(--text-3)" }}>{successEmail}</strong>
              </>
            )}
          </p>
          <Link href="/" style={{ fontSize: 14, color: "var(--green)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to ourfable.ai
          </Link>
        </div>
        <style>{`
          @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
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
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .mode-panel {
          overflow: hidden;
          transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.3s ease;
        }
        .mode-panel.panel-visible {
          max-height: 1200px;
          opacity: 1;
        }
        .mode-panel.panel-hidden {
          max-height: 0;
          opacity: 0;
          pointer-events: none;
        }

        /* Toggle switch */
        .gift-toggle-track {
          position: relative;
          width: 44px;
          height: 24px;
          border-radius: 100px;
          background: var(--border);
          border: 1.5px solid var(--border);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .gift-toggle-track.on {
          background: var(--green);
          border-color: var(--green);
        }
        .gift-toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .gift-toggle-track.on .gift-toggle-thumb {
          transform: translateX(20px);
        }

        /* Plan cards */
        .plan-card {
          padding: 18px 16px;
          border-radius: 12px;
          border: 2px solid var(--border);
          background: var(--card, #fff);
          cursor: pointer;
          text-align: left;
          position: relative;
          transition: all 0.2s;
          width: 100%;
        }
        .plan-card.selected {
          border-color: var(--green);
          background: var(--green-light);
        }
        .plan-card:hover:not(.selected) {
          border-color: var(--green-border, #9db39e);
        }
        .plan-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 500px) {
          .plan-grid { grid-template-columns: 1fr; }
        }

        input, textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          color: var(--text);
          background: #fff;
          transition: border-color 0.2s;
          box-sizing: border-box;
          outline: none;
        }
        input:focus, textarea:focus {
          border-color: var(--green);
        }
        input::placeholder, textarea::placeholder {
          color: var(--text-4, #C8C3BA);
        }
      `}</style>

      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 32 }}>
        <span style={{
          fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700,
          color: "var(--green)", letterSpacing: "0.02em",
        }}>
          Our Fable
        </span>
      </Link>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 460,
        background: "#fff", borderRadius: 16,
        boxShadow: "0 2px 24px rgba(0,0,0,0.07)",
        padding: "36px 32px",
      }}>
        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "var(--font-playfair)", fontSize: 25, fontWeight: 700,
            color: "var(--text)", marginBottom: 8,
          }}>
            {isGift ? "Give Our Fable as a gift" : "Reserve your family\u2019s vault"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.5 }}>
            {isGift
              ? "Give someone the gift of a memory vault for their child."
              : "We just need a few details to get started."}
          </p>
        </div>

        {/* Gift toggle */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px",
            background: isGift ? "var(--green-light)" : "var(--bg-2, #F9F7F4)",
            borderRadius: 10,
            border: `1.5px solid ${isGift ? "var(--green-border)" : "var(--border)"}`,
            cursor: "pointer",
            marginBottom: 24,
            transition: "all 0.2s",
            userSelect: "none",
          }}
          onClick={() => handleToggleGift(!isGift)}
          role="checkbox"
          aria-checked={isGift}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); handleToggleGift(!isGift); } }}
        >
          <div className={`gift-toggle-track ${isGift ? "on" : ""}`}>
            <div className="gift-toggle-thumb" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Gift size={15} color={isGift ? "var(--green)" : "var(--text-3)"} strokeWidth={2} aria-hidden="true" />
            <span style={{
              fontSize: 14, fontWeight: 600,
              color: isGift ? "var(--green)" : "var(--text-2)",
            }}>
              Give this as a gift
            </span>
          </div>
        </div>

        {/* ── WAITLIST MODE ── */}
        <div
          ref={waitlistRef}
          className={`mode-panel ${!isGift ? "panel-visible" : "panel-hidden"}`}
        >
          <form onSubmit={handleWaitlistSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Child name */}
            <div>
              <label htmlFor="reserve-child-name" style={labelStyle}>
                Child&apos;s first name
              </label>
              <input
                id="reserve-child-name"
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="e.g. Oliver"
                autoComplete="given-name"
              />
            </div>

            {/* Child birthday */}
            <div>
              <label htmlFor="reserve-child-birthday" style={labelStyle}>
                Child&apos;s birthday <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 10, color: "var(--text-4)" }}>(optional)</span>
              </label>
              <input
                id="reserve-child-birthday"
                type="date"
                value={childBirthday}
                onChange={(e) => setChildBirthday(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                placeholder="You can add this later"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reserve-email" style={labelStyle}>
                Your email
              </label>
              <input
                id="reserve-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                style={showEmailError ? { borderColor: "#E07070" } : undefined}
              />
              {showEmailError && (
                <p style={{ fontSize: 12, color: "#E07070", margin: "6px 0 0" }}>
                  Please enter a valid email address.
                </p>
              )}
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "#E07070", textAlign: "center", margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmitWaitlist || loading}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", fontSize: 15, padding: "14px 24px", marginTop: 4 }}
            >
              {loading ? "Reserving…" : "Reserve your spot →"}
            </button>
          </form>

          {/* Waitlist trust signals */}
          <div style={{ marginTop: 18, textAlign: "center", display: "flex", flexDirection: "column", gap: 5 }}>
            <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
              Free to reserve · No card required
            </p>
            <p style={{
              fontSize: 12, color: "var(--text-3)", margin: 0,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              <Lock size={11} strokeWidth={2} aria-hidden="true" />
              Private vault · Your data is never shared · Export anytime
            </p>
          </div>
        </div>

        {/* ── GIFT MODE ── */}
        <div
          ref={giftRef}
          className={`mode-panel ${isGift ? "panel-visible" : "panel-hidden"}`}
        >
          {/* Gift intro */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.7 }}>
              We&apos;ll notify you when gifting is available. Founding member rates will apply.
            </p>
          </div>

          <form onSubmit={handleGiftSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Gifter name */}
            <div>
              <label htmlFor="gift-gifter-name" style={labelStyle}>
                Your name <span style={{ color: "#E07070" }}>*</span>
              </label>
              <input
                id="gift-gifter-name"
                type="text"
                value={gifterName}
                onChange={(e) => setGifterName(e.target.value)}
                placeholder="e.g. Grandma Sarah"
                autoComplete="name"
                required
              />
            </div>

            {/* Gifter email */}
            <div>
              <label htmlFor="gift-gifter-email" style={labelStyle}>
                Your email <span style={{ color: "#E07070" }}>*</span>
              </label>
              <input
                id="gift-gifter-email"
                type="email"
                value={gifterEmail}
                onChange={(e) => setGifterEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                We&apos;ll send you a confirmation as soon as this gift reservation is saved.
              </p>
            </div>

            {/* Recipient email */}
            <div>
              <label htmlFor="gift-recipient-email" style={labelStyle}>
                Recipient&apos;s email <span style={{ color: "#E07070" }}>*</span>
              </label>
              <input
                id="gift-recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="parents@example.com"
                required
              />
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                We&apos;ll email them now and follow up again when gifting opens.
              </p>
            </div>

            {/* Personal message */}
            <div>
              <label htmlFor="gift-message" style={labelStyle}>
                Personal message{" "}
                <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10, color: "var(--text-4)" }}>
                  (optional)
                </span>
              </label>
              <textarea
                id="gift-message"
                value={gifterMessage}
                onChange={(e) => setGifterMessage(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Write a note to go with your gift..."
                maxLength={500}
                style={{ resize: "none" }}
              />
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, textAlign: "right" }}>
                {gifterMessage.length}/500
              </p>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "#E07070", textAlign: "center", margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmitGift || loading}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", fontSize: 15, padding: "14px 24px", marginTop: 4 }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
                  Reserving…
                </>
              ) : (
                <>
                  Reserve this gift →
                </>
              )}
            </button>
          </form>

          {/* Gift trust signals */}
          <div style={{ marginTop: 18, textAlign: "center", display: "flex", flexDirection: "column", gap: 5 }}>
            <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
              We&apos;ll notify both of you when gifting opens · Founding member pricing guaranteed
            </p>
            <p style={{
              fontSize: 12, color: "var(--text-3)", margin: 0,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              <Lock size={11} strokeWidth={2} aria-hidden="true" />
              Private vault · Your data is never shared · Export anytime
            </p>
          </div>
        </div>
      </div>

      {/* Back link */}
      <Link href="/" style={{
        marginTop: 28, fontSize: 14, color: "var(--text-3)", textDecoration: "none",
      }}>
        ← Back to ourfable.ai
      </Link>
    </div>
  );
}

// Shared label style
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "var(--text-3)",
  marginBottom: 8,
};
