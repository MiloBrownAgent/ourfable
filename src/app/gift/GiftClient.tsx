"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, Gift, Lock, Users, Newspaper, Check, Loader2, Sparkles } from "lucide-react";
import { trackGiftPageView } from "../../lib/analytics";

type GiftTier = "standard" | "plus";
type GiftMode = "one_year" | "annual_sponsorship";

const TIERS = {
  standard: {
    name: "Our Fable",
    annualPrice: 99,
    originalPrice: 149,
    monthlyEquiv: "$8.25/mo",
    tagline: "The Vault for one child",
    features: ["The Vault", "Unlimited circle members", "Monthly prompts", "5GB storage"],
  },
  plus: {
    name: "Our Fable+",
    annualPrice: 149,
    originalPrice: 199,
    monthlyEquiv: "$12.42/mo",
    tagline: "Everything in Our Fable, plus Dispatches",
    features: ["Everything in Our Fable", "Dispatches", "Unlimited circle members", "1 additional child included", "25GB storage"],
  },
};

export default function GiftClient() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedTier, setSelectedTier] = useState<GiftTier>("standard");
  const [giftMode, setGiftMode] = useState<GiftMode>("one_year");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [gifterName, setGifterName] = useState("");
  const [gifterEmail, setGifterEmail] = useState("");
  const [gifterMessage, setGifterMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    trackGiftPageView();
  }, []);

  const tier = TIERS[selectedTier];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim()) { setError("Recipient's email is required."); return; }
    if (!gifterName.trim()) { setError("Your name is required."); return; }
    if (!gifterEmail.trim()) { setError("Your email is required."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/gift-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          gifterName: gifterName.trim(),
          gifterEmail: gifterEmail.trim(),
          gifterMessage: gifterMessage.trim() || undefined,
          planType: selectedTier,
          giftMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  };

  const FEATURES = [
    { icon: Lock, title: "The Vault", body: "Every letter, photo, voice memo, and video from every circle member — sealed and waiting." },
    { icon: Users, title: "Monthly Prompts", body: "Our Fable interviews the people in the child's life automatically. They just reply." },
    { icon: Newspaper, title: "Day They Were Born", body: "A permanent front page for their birthday — headlines, weather, the #1 song." },
  ];

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <style>{`
        @keyframes revealUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 680px) { .nav-text-links { display: none !important; } .gift-tiers { grid-template-columns: 1fr !important; } }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: var(--green); color: #fff; border: none; border-radius: 10px; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; transition: opacity 200ms; }
        .btn-primary:hover { opacity: 0.88; }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .nav-link { color: var(--text-2); text-decoration: none; font-size: 14px; }
        .nav-link:hover { color: var(--text); }
        .chip-green { background: var(--green-light); border: 1px solid var(--green-border); color: var(--green); border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600; display: inline-block; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64, display: "flex", alignItems: "center", padding: "0 40px", background: scrolled ? "rgba(253,251,247,0.96)" : "transparent", borderBottom: `1px solid ${scrolled ? "var(--border)" : "transparent"}`, backdropFilter: scrolled ? "blur(16px)" : "none", transition: "all 250ms" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", letterSpacing: "-0.01em" }}>Our Fable</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="nav-text-links" style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Link href="/" className="nav-link" style={{ fontSize: 14 }}>Home</Link>
              <Link href="/faq" className="nav-link" style={{ fontSize: 14 }}>FAQ</Link>
              <Link href="/login" className="nav-link" style={{ fontSize: 14 }}>Sign in</Link>
            </div>
            <Link href="/reserve" className="btn-primary" style={{ padding: "10px 20px", fontSize: 14 }}>Reserve your spot</Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "120px 40px 100px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ marginBottom: 20, animation: "revealUp 0.5s ease both" }}>
            <span className="chip chip-green" style={{ fontSize: 12 }}>For grandparents, godparents, aunts, uncles, and family friends</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontWeight: 800, fontSize: "clamp(2.8rem, 6vw, 4.4rem)", lineHeight: 1.08, letterSpacing: "-0.025em", marginBottom: 24, animation: "revealUp 0.5s ease 0.08s both" }}>
            Give a child <em style={{ color: "var(--green)", fontStyle: "italic" }}>something lasting.</em>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.75, color: "var(--text-2)", marginBottom: 16, maxWidth: 640, margin: "0 auto 16px", animation: "revealUp 0.5s ease 0.16s both" }}>
            Our Fable is a private family vault where the people who love a child leave letters, voice notes, photos, and videos for their future. It feels less like software and more like helping a family begin an heirloom.
          </p>
        </div>

        {/* Founding member badge */}
        <div style={{ textAlign: "center", marginBottom: 32, animation: "revealUp 0.5s ease 0.18s both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #FFF8EC, #FFF3E0)", border: "1px solid #F0C060", borderRadius: 100, padding: "8px 20px" }}>
            <Sparkles size={14} color="#C8890A" strokeWidth={2} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#A06B08", letterSpacing: "0.06em" }}>Founding Member Rate — Limited to 1,000 founding families</span>
          </div>
        </div>

        {/* Tier selection */}
        <div style={{ marginBottom: 40, animation: "revealUp 0.5s ease 0.2s both" }}>
          <div className="gift-tiers" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {(["standard", "plus"] as GiftTier[]).map((t) => {
              const info = TIERS[t];
              const selected = selectedTier === t;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  style={{
                    padding: "24px 20px",
                    borderRadius: 14,
                    border: `2px solid ${selected ? "var(--green)" : "var(--border)"}`,
                    background: selected ? "var(--green-light)" : "var(--card)",
                    cursor: "pointer",
                    textAlign: "left",
                    position: "relative",
                    transition: "all 200ms",
                  }}
                >
                  {t === "plus" && (
                    <div style={{ position: "absolute", top: -10, right: 12, background: "var(--green)", color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
                      <Sparkles size={10} strokeWidth={2.5} /> Premium
                    </div>
                  )}
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green)", marginBottom: 8 }}>{info.name}</p>
                  {/* Founding member pricing with strikethrough */}
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontFamily: "var(--font-playfair)", fontSize: 32, fontWeight: 800, color: "var(--text)" }}>${info.annualPrice}</span>
                      <span style={{ fontSize: 14, color: "var(--text-3)" }}>/ year</span>
                      <span style={{ fontSize: 14, color: "var(--text-4, #B0A9A0)", textDecoration: "line-through" }}>${info.originalPrice}</span>
                    </div>
                    <div style={{ display: "inline-block", background: "#FFF3E0", border: "1px solid #F0C060", borderRadius: 6, padding: "2px 8px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#A06B08", letterSpacing: "0.06em" }}>FOUNDING MEMBER RATE</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, marginTop: 8 }}>{info.tagline}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {info.features.map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Check size={10} color="var(--green)" strokeWidth={2.5} />
                        <span style={{ fontSize: 12, color: "var(--text-2)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  {selected && (
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      <Check size={11} strokeWidth={2.5} color="var(--green)" />
                      <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 500 }}>Selected</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gift form */}
        <div className="card" style={{ padding: "36px 32px", marginBottom: 56, animation: "revealUp 0.5s ease 0.24s both" }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Gift {tier.name}</h2>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 18 }}>{giftMode === "annual_sponsorship" ? `${tier.annualPrice}/year · Annual sponsorship · Renews yearly until cancelled` : `${tier.annualPrice}/year · One year gifted upfront · Founding member rate locked in`}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <button type="button" onClick={() => setGiftMode("one_year")} style={{ padding: "16px 14px", borderRadius: 12, border: `2px solid ${giftMode === "one_year" ? "var(--green)" : "var(--border)"}`, background: giftMode === "one_year" ? "var(--green-light)" : "#fff", textAlign: "left", cursor: "pointer" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)" }}>Gift 1 year</p>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>${tier.annualPrice} today</p>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--text-3)" }}>Best default. A beautiful one-time gift that gets the family started.</p>
            </button>
            <button type="button" onClick={() => setGiftMode("annual_sponsorship")} style={{ padding: "16px 14px", borderRadius: 12, border: `2px solid ${giftMode === "annual_sponsorship" ? "var(--green)" : "var(--border)"}`, background: giftMode === "annual_sponsorship" ? "var(--green-light)" : "#fff", textAlign: "left", cursor: "pointer" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)" }}>Sponsor annually</p>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>${tier.annualPrice}/year</p>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--text-3)" }}>Keeps the gift going each year. You can cancel anytime.</p>
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Recipient email */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                Recipient&apos;s email *
              </label>
              <input
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                type="email"
                placeholder="parents@email.com"
                className="input"
                required
              />
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>We&apos;ll send them a beautiful email with their gift code and redemption link.</p>
            </div>

            {/* Gifter name */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                Your name *
              </label>
              <input
                value={gifterName}
                onChange={e => setGifterName(e.target.value)}
                placeholder="e.g. Grandma Sarah"
                className="input"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                Your email *
              </label>
              <input
                value={gifterEmail}
                onChange={e => setGifterEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="input"
                required
              />
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>We&apos;ll send you the confirmation and receipt here.</p>
            </div>

            {/* Personal message */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                Personal message <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>(optional)</span>
              </label>
              <textarea
                value={gifterMessage}
                onChange={e => setGifterMessage(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Write a note to go with your gift..."
                className="input"
                style={{ resize: "none" }}
                maxLength={500}
              />
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, textAlign: "right" }}>{gifterMessage.length}/500</p>
            </div>

            {error && <p style={{ fontSize: 13, color: "#E07070" }}>{error}</p>}

            <button
              type="submit"
              disabled={loading || !recipientEmail.trim() || !gifterName.trim() || !gifterEmail.trim()}
              className="btn-primary"
              style={{ fontSize: 15, padding: "16px", justifyContent: "center" }}
            >
              {loading
                ? <><Loader2 size={15} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} /> Redirecting to checkout…</>
                : <>{giftMode === "annual_sponsorship" ? `Sponsor this annually — $${tier.annualPrice}/year` : `Gift this year — $${tier.annualPrice}`} <ArrowRight size={16} strokeWidth={2.5} /></>
              }
            </button>

            <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>
              Secure checkout via Stripe · Recipient gets a beautiful email with their redemption code{giftMode === "annual_sponsorship" ? " · Annual sponsorship renews until cancelled" : ""}
            </p>
          </form>
        </div>

        <div style={{ marginBottom: 48, padding: "24px 28px", background: "var(--bg-2)", borderRadius: 16, border: "1px solid var(--border)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", margin: "0 0 10px" }}>Why gifting works</p>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-2)", margin: "0 0 10px" }}>
            If you&apos;re a grandparent or someone close to the family, this is a beautiful way to give more than a present. You&apos;re helping create a place where your voice, your stories, and the voices of the rest of the circle can stay with the child for years.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-3)", margin: 0 }}>
            The family receives a polished gift email and redeems when they&apos;re ready. You cover the first year. They receive something thoughtful, private, and easy to begin.
          </p>
        </div>

        {/* Features — pillar layout */}
        <div style={{ borderTop: "1px solid var(--border)", marginBottom: 56 }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                gap: "0 40px",
                padding: "28px 0",
                borderBottom: "1px solid var(--border)",
                alignItems: "start",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon size={16} color="var(--green)" strokeWidth={1.75} />
                  <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 17, fontWeight: 700, margin: 0 }}>{f.title}</h3>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-2)", margin: 0 }}>{f.body}</p>
              </div>
            );
          })}
        </div>

        {/* Trust signals */}
        <div style={{ padding: "36px 28px", background: "var(--bg-2)", borderRadius: 16, border: "1px solid var(--border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24, textAlign: "center" }}>
            <div>
              <Lock size={18} color="var(--green)" strokeWidth={1.75} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Private by design</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>No ads. No data sharing. No social feeds. Built for families, not followers.</p>
            </div>
            <div>
              <Gift size={18} color="var(--green)" strokeWidth={1.75} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>They pay nothing</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>You cover the full year upfront. Recipient just redeems the code and starts their vault.</p>
            </div>
            <div>
              <Users size={18} color="var(--green)" strokeWidth={1.75} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Built for 18 years</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>Not a subscription trap. Priced to stay in a family&apos;s life from birth to adulthood.</p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7 }}>
            The people who love a child won&apos;t be here forever.<br/>
            Our Fable makes sure their voices are.
          </p>
        </div>
      </div>
    </div>
  );
}
