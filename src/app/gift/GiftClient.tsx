"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Gift, HeartHandshake, Loader2, Lock, Shield, Sparkles } from "lucide-react";
import { trackGiftPageView } from "../../lib/analytics";
import { LandingNav, LandingPageStyles, LandingSection, MobileStickyCTA } from "../../components/landing/LandingSystem";

type GiftTier = "standard" | "plus";
type GiftMode = "one_year" | "annual_sponsorship";

const TIERS = {
  standard: {
    name: "Our Fable",
    annualPrice: 99,
    originalPrice: 149,
    tagline: "The private family vault for one child",
    features: ["The Vault", "Unlimited circle members", "Monthly prompts"],
  },
  plus: {
    name: "Our Fable+",
    annualPrice: 149,
    originalPrice: 199,
    tagline: "Everything in Our Fable, plus Dispatches",
    features: ["Everything in Our Fable", "Dispatches", "Unlimited circle members", "1 additional child included"],
  },
};

export default function GiftClient() {
  const [selectedTier, setSelectedTier] = useState<GiftTier>("standard");
  const [giftMode, setGiftMode] = useState<GiftMode>("one_year");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [gifterName, setGifterName] = useState("");
  const [gifterEmail, setGifterEmail] = useState("");
  const [gifterMessage, setGifterMessage] = useState("");
  const [showAdvancedGiftOptions, setShowAdvancedGiftOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    trackGiftPageView();
  }, []);

  const tier = TIERS[selectedTier];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientEmail.trim() || !gifterName.trim() || !gifterEmail.trim()) {
      setError("Please complete the required fields.");
      return;
    }
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
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="of-landing-root">
      <LandingPageStyles />
      <div className="of-landing-shell">
        <LandingNav links={[{ href: "/reserve", label: "Parent flow" }, { href: "/faq", label: "FAQ" }, { href: "/login", label: "Sign in" }]} />

        <section className="of-hero-grid">
          <div>
            <span className="of-pill"><Gift size={12} strokeWidth={2.2} /> For grandparents, godparents, aunts, uncles, and family friends</span>
            <h1 className="of-hero-display" style={{ marginTop: 18 }}>
              Give a child something that grows more meaningful with time.
            </h1>
            <p className="of-hero-copy">
              This is not another baby gift that gets used once and disappears. It gives a family a private place where the people who love a child can leave letters, voice notes, photos, and videos for years to come.
            </p>
            <p className="of-muted-copy" style={{ maxWidth: 660 }}>
              A graceful, lasting gift that feels meaningful now and keeps becoming more valuable to the family over time.
            </p>
            <div className="of-mini-list" style={{ marginTop: 24 }}>
              {[
                "Meaningful enough to feel special",
                "Simple enough for the family to redeem and begin",
                giftMode === "annual_sponsorship" ? "You keep it going yearly until you stop" : "You can cover the family’s first year in one purchase",
              ].map((line) => (
                <div key={line} className="of-mini-item"><Check size={14} color="var(--green)" style={{ marginTop: 4, flexShrink: 0 }} /> <span>{line}</span></div>
              ))}
            </div>
          </div>

          <div className="of-card" style={{ padding: 28 }}>
            <p className="of-section-label" style={{ marginBottom: 8 }}>Gift Our Fable</p>
            <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-playfair)", fontSize: 34, lineHeight: 1.1 }}>Give the family something they will still care about years from now.</h2>
            <p className="of-section-copy" style={{ marginBottom: 18 }}>
              Choose the plan, choose whether you want to gift the first year or sponsor it annually, and we&apos;ll take you to secure checkout.
            </p>

            <div style={{ padding: 16, borderRadius: 16, background: "var(--bg-2)", border: "1px solid var(--border)", marginBottom: 16 }}>
              <p className="of-section-label" style={{ marginBottom: 6 }}>Default gift</p>
              <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600 }}>{tier.name} · {giftMode === "one_year" ? "1 year gift" : "annual sponsorship"}</p>
              <p className="of-muted-copy" style={{ fontSize: 13 }}>{giftMode === "one_year" ? `The family gets their first year for $${tier.annualPrice} today.` : `You sponsor ${tier.name} for $${tier.annualPrice}/year until you cancel.`}</p>
            </div>

            <button type="button" onClick={() => setShowAdvancedGiftOptions((v) => !v)} className="of-secondary-link" style={{ marginBottom: 18 }}>
              {showAdvancedGiftOptions ? "Hide other gift options" : "Choose another plan or annual sponsorship"}
            </button>

            {showAdvancedGiftOptions ? (
              <div style={{ display: "grid", gap: 14, marginBottom: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {(["standard", "plus"] as GiftTier[]).map((key) => {
                    const info = TIERS[key];
                    const selected = selectedTier === key;
                    return (
                      <button key={key} type="button" onClick={() => setSelectedTier(key)} style={{ padding: 18, borderRadius: 16, border: `2px solid ${selected ? "var(--green)" : "var(--border)"}`, background: selected ? "var(--green-light)" : "#fff", textAlign: "left", cursor: "pointer" }}>
                        {key === "plus" ? <span className="of-pill" style={{ marginBottom: 10 }}><Sparkles size={12} /> Premium</span> : null}
                        <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green)" }}>{info.name}</p>
                        <p style={{ margin: "0 0 4px", fontFamily: "var(--font-playfair)", fontSize: 30, fontWeight: 700 }}>${info.annualPrice}</p>
                        <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--text-4)", textDecoration: "line-through" }}>${info.originalPrice} later</p>
                        <p className="of-muted-copy" style={{ fontSize: 13 }}>{info.tagline}</p>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <button type="button" onClick={() => setGiftMode("one_year")} style={{ padding: 16, borderRadius: 14, border: `2px solid ${giftMode === "one_year" ? "var(--green)" : "var(--border)"}`, background: giftMode === "one_year" ? "var(--green-light)" : "#fff", textAlign: "left", cursor: "pointer" }}>
                    <p className="of-section-label" style={{ marginBottom: 6 }}>Gift 1 year</p>
                    <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>${tier.annualPrice} today</p>
                    <p className="of-muted-copy" style={{ fontSize: 13 }}>A one-time purchase for the family&apos;s first year.</p>
                  </button>
                  <button type="button" onClick={() => setGiftMode("annual_sponsorship")} style={{ padding: 16, borderRadius: 14, border: `2px solid ${giftMode === "annual_sponsorship" ? "var(--green)" : "var(--border)"}`, background: giftMode === "annual_sponsorship" ? "var(--green-light)" : "#fff", textAlign: "left", cursor: "pointer" }}>
                    <p className="of-section-label" style={{ marginBottom: 6 }}>Sponsor annually</p>
                    <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>${tier.annualPrice}/year</p>
                    <p className="of-muted-copy" style={{ fontSize: 13 }}>You keep the gift active until you cancel.</p>
                  </button>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <div>
                <label className="of-field-label">Recipient&apos;s email</label>
                <input className="of-input" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="parents@email.com" type="email" />
              </div>
              <div>
                <label className="of-field-label">Your name</label>
                <input className="of-input" value={gifterName} onChange={(e) => setGifterName(e.target.value)} placeholder="e.g. Grandma Sarah" />
              </div>
              <div>
                <label className="of-field-label">Your email</label>
                <input className="of-input" value={gifterEmail} onChange={(e) => setGifterEmail(e.target.value)} placeholder="you@example.com" type="email" />
              </div>
              <div>
                <label className="of-field-label">Personal message (optional)</label>
                <textarea className="of-textarea" rows={3} value={gifterMessage} onChange={(e) => setGifterMessage(e.target.value.slice(0, 500))} placeholder="Write a note to go with your gift..." />
              </div>
              {error ? <p style={{ margin: 0, color: "#D46565", fontSize: 13 }}>{error}</p> : null}
              <button type="submit" className="of-primary-btn" disabled={loading} style={{ width: "100%" }}>
                {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Redirecting to checkout…</> : <>{giftMode === "annual_sponsorship" ? `Sponsor this annually — $${tier.annualPrice}/year` : `Gift this year — $${tier.annualPrice}`} <ArrowRight size={16} /></>}
              </button>
            </form>
            <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <p className="of-muted-copy" style={{ fontSize: 12 }}>
                Secure checkout via Stripe · The family gets a beautiful email with their gift code and redemption link.
              </p>
              <p className="of-muted-copy" style={{ fontSize: 12, marginTop: 6 }}>
                Private by design · They pay nothing today · Easy to redeem when ready.
              </p>
            </div>
          </div>
        </section>

        <LandingSection label="Why this is meaningful" title="It gives the family something emotionally important, not just useful.">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.95fr)", gap: 20, marginTop: 24, alignItems: "start" }}>
            <div className="of-feature-grid" style={{ marginTop: 0, gridTemplateColumns: "1fr" }}>
              {[
                ["The gift keeps growing", "A normal gift is opened once. This becomes more meaningful every time someone adds to it."],
                ["It feels graceful to give", "You are giving a family a serious, lasting place for the child’s story — not a novelty product."],
                ["It makes contribution easier", "Grandparents and family friends get gentle prompts and can simply reply when the moment feels right."],
              ].map(([title, body]) => (
                <div key={title} className="of-feature-card">
                  <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>{title}</p>
                  <p className="of-muted-copy">{body}</p>
                </div>
              ))}
            </div>
            <div className="of-card" style={{ padding: 18 }}>
              <p className="of-section-label" style={{ marginBottom: 8 }}>Gift preview</p>
              <img src="/landing-artifacts/gift-email-preview.png" alt="Our Fable gift email preview" style={{ width: "100%", borderRadius: 14, border: "1px solid var(--border)", display: "block", marginBottom: 12 }} />
              <p className="of-muted-copy" style={{ fontSize: 13 }}>A real gift email preview based on the live product. The gift should land with clarity, warmth, and zero awkwardness.</p>
            </div>
          </div>
        </LandingSection>

        <LandingSection label="What the family receives" title="A private place for the child&apos;s story to keep growing.">
          <div className="of-feature-grid">
            {[
              "A private vault for letters, voice notes, photos, and video",
              "Gentle prompts that help family respond without being chased",
              selectedTier === "plus" ? "Dispatches and one additional child included" : "Unlimited circle members and a simple first year to begin",
            ].map((feature) => (
              <div key={feature} className="of-feature-card">
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{feature}</p>
              </div>
            ))}
          </div>
        </LandingSection>

        <LandingSection label="Why this is better than a normal baby gift" title="Because years later, the family can still care about it.">
          <p className="of-section-copy">The family receives something that keeps compounding: voices, stories, photos, letters, and perspective that can become deeply important later.</p>
        </LandingSection>

        <LandingSection label="Questions" title="Simple answers before you buy.">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.95fr) minmax(0, 1fr)", gap: 20, marginTop: 24, alignItems: "start" }}>
            <div className="of-card" style={{ padding: 18 }}>
              <p className="of-section-label" style={{ marginBottom: 8 }}>Redemption preview</p>
              <img src="/landing-artifacts/gift-redeem.png" alt="Our Fable gift redemption preview" style={{ width: "100%", borderRadius: 14, border: "1px solid var(--border)", display: "block", marginBottom: 12 }} />
              <p className="of-muted-copy" style={{ fontSize: 13 }}>A real redemption experience from the live product. The family should immediately understand what they received and how to begin.</p>
            </div>
            <div className="of-step-grid" style={{ marginTop: 0, gridTemplateColumns: "1fr" }}>
              {[
                ["What does the family receive?", "A private Our Fable vault for their child, where family can leave letters, voice notes, photos, and videos over time."],
                ["Do they have to pay anything?", giftMode === "annual_sponsorship" ? "No. You pay each year until you cancel. They just redeem the gift and begin." : "No. You cover the first year. They just redeem the gift and begin."],
                ["Do they need to start right away?", "No. They can redeem when they are ready."],
              ].map(([title, body], i) => (
                <div key={title} className="of-step-card">
                  <div className="of-step-number">{i + 1}</div>
                  <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>{title}</p>
                  <p className="of-muted-copy">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </LandingSection>

        <LandingSection label="Trust" title="A serious family product, not a novelty checkout.">
          <div className="of-trust-grid">
            {[
              [Lock, "Private by design", "No ads. No public posting. No social-feed energy."],
              [Shield, "Built for long-term family trust", "Made to feel safe, lasting, and worthy of holding the people and memories a child may value most later."],
              [HeartHandshake, "Simple for non-technical families", "The family gets a clear email, can redeem when ready, and contributors do not need an app."],
            ].map(([Icon, title, body]) => {
              const Glyph = Icon as typeof Lock;
              return (
                <div key={title} className="of-feature-card">
                  <Glyph size={18} color="var(--green)" style={{ marginBottom: 10 }} />
                  <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>{title}</p>
                  <p className="of-muted-copy">{body}</p>
                </div>
              );
            })}
          </div>
        </LandingSection>

        <section className="of-section">
          <div className="of-close-cta">
            <p className="of-section-label">Gift close</p>
            <h2 className="of-section-title" style={{ marginBottom: 10 }}>Give the family something lasting.</h2>
            <p className="of-section-copy" style={{ marginBottom: 18 }}>Choose the plan, keep the gift simple, and we&apos;ll take you to secure checkout.</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="of-primary-btn">Continue gift <ArrowRight size={16} /></Link>
              <Link href="/reserve" className="of-secondary-link">Looking to start this for your own child?</Link>
            </div>
          </div>
        </section>
        <MobileStickyCTA label={giftMode === "annual_sponsorship" ? "Continue gift" : "Gift this year"} href="#" />
      </div>
    </main>
  );
}
