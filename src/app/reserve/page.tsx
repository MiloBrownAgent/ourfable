"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Lock, Gift, Loader2 } from "lucide-react";
import { captureUtmParams, getUtmParams } from "../../lib/utm";
import { trackLead, generateEventId } from "../../lib/analytics";

type GiftTier = "standard" | "plus";

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

  // Capture UTMs and route old gift links to the dedicated gift page
  useEffect(() => {
    if (searchParams.get("gift") === "true") {
      window.location.href = "/gift";
      return;
    }
    captureUtmParams();
  }, [searchParams]);

  // — Waitlist state —
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
  const canSubmitWaitlist = emailValid;

  const gifterEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gifterEmail.trim());
  const recipientEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim());
  const canSubmitGift = gifterName.trim().length > 0 && gifterEmailValid && recipientEmailValid;

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
            {successMode === "gift" ? "Gift reserved." : "You locked in your spot."}
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 12 }}>
            {successMode === "gift"
              ? "We emailed the recipient and sent your confirmation."
              : "You’re on the founding-families list. We’ll follow up when your vault is ready, and your pricing is locked in for life."}
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
            Reserve your family’s vault
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 12 }}>
            Reserve free now, lock in founding pricing for life, and we’ll invite you in as onboarding opens.
          </p>
          <div style={{
              padding: "14px 16px",
              background: "var(--bg-2, #F9F7F4)",
              borderRadius: 12,
              border: "1px solid var(--border)",
              textAlign: "left",
              display: "grid",
              gap: 8,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", margin: 0 }}>
                Why reserve now
              </p>
              <div style={{ display: "grid", gap: 6 }}>
                {[
                  "Lock founding pricing for life",
                  "Join before founding-family spots fill",
                  "We’ll email you as your onboarding spot opens",
                  "No card required today",
                ].map((line) => (
                  <div key={line} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>
                    <Check size={12} color="var(--green)" style={{ marginTop: 3, flexShrink: 0 }} />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, marginTop: 2, display: "grid", gap: 2 }}>
                <p style={{ margin: 0 }}>
                  Our Fable: <strong>$12/mo or $99/yr</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Our Fable+: <strong>$19/mo or $149/yr</strong>
                </p>
              </div>
              <details style={{ marginTop: 2 }}>
                <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--text-3)" }}>See later pricing and additional-child details</summary>
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.55, margin: 0 }}>
                    After founders, pricing becomes $16/mo or $149/yr for Our Fable and $25/mo or $199/yr for Our Fable+.
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.55, margin: 0 }}>
                    Additional children are $7/mo or $59/yr during founders, then $9/mo or $79/yr. Each child gets their own vault and can share the same circle or have a completely separate one.
                  </p>
                </div>
              </details>
            </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "14px 16px",
          background: "var(--bg-2, #F9F7F4)",
          borderRadius: 10,
          border: "1.5px solid var(--border)",
          marginBottom: 24,
        }}>
          <Gift size={15} color="var(--text-3)" strokeWidth={2} aria-hidden="true" />
          <span style={{ fontSize: 14, color: "var(--text-2)" }}>
            Looking for a gift instead?
          </span>
          <Link href="/gift" style={{ marginLeft: "auto", fontSize: 14, fontWeight: 600, color: "var(--green)", textDecoration: "none" }}>
            Open gift page →
          </Link>
        </div>

        {/* ── WAITLIST MODE ── */}
        <div
          ref={waitlistRef}
          className={`mode-panel ${!isGift ? "panel-visible" : "panel-hidden"}`}
        >
          <div style={{
            marginBottom: 18,
            padding: "14px 16px",
            background: "rgba(107,143,111,0.08)",
            border: "1px solid rgba(107,143,111,0.18)",
            borderRadius: 12,
            display: "grid",
            gap: 10,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", margin: 0 }}>
              What you’re reserving
            </p>
            <div style={{ display: "grid", gap: 6 }}>
              {[
                "A private vault for your child’s future",
                "Monthly prompts to the people who love them",
                "Letters, voice notes, photos, and videos that grow over time",
              ].map((line) => (
                <div key={line} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>
                  <Check size={12} color="var(--green)" style={{ marginTop: 3, flexShrink: 0 }} />
                  <span>{line}</span>
                </div>
              ))}
            </div>
            <div style={{ width: "100%", height: 1, background: "rgba(107,143,111,0.16)" }} />
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", margin: 0 }}>
              What happens next
            </p>
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
              We’re onboarding founding families in small groups. We’ll email you as your spot opens, and your founding price stays locked until then.
            </p>
            <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>
              Built by Dave and Amanda in Minneapolis for their own family first. Private by design. Export anytime. No app required for family members.
            </p>
          </div>
          <form onSubmit={handleWaitlistSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
              Free to reserve · No card required · Child birthday optional
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
