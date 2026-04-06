"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, HeartHandshake, Lock, Mail, Users } from "lucide-react";
import { captureUtmParams, getUtmParams } from "@/lib/utm";
import { generateEventId, trackLead } from "@/lib/analytics";
import { LandingNav, LandingPageStyles, LandingSection, MobileStickyCTA } from "@/components/landing/LandingSystem";

export default function WarmConversionClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    captureUtmParams();
  }, []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || loading) return;
    setLoading(true);
    setError("");
    try {
      const eventId = generateEventId();
      const utms = getUtmParams();
      const res = await fetch("/api/ourfable/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          source: "warm-conversion",
          eventId,
          ...utms,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      trackLead(eventId);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="of-landing-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <LandingPageStyles />
        <div style={{ maxWidth: 560, textAlign: "center" }}>
          <div style={{ width: 74, height: 74, margin: "0 auto 26px", borderRadius: 999, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={34} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 className="of-hero-display" style={{ fontSize: 42, marginBottom: 12 }}>You&apos;re on the list.</h1>
          <p className="of-hero-copy" style={{ margin: "0 auto 12px", maxWidth: 520 }}>
            We&apos;ll reach out when your family&apos;s vault is ready and keep your founding rate reserved.
          </p>
          <p className="of-muted-copy" style={{ marginBottom: 24 }}>
            This is the same kind of private, compounding family record you&apos;ve already seen from the inside — now for your own child.
          </p>
          <Link href="/" className="of-secondary-link">← Back to ourfable.ai</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="of-landing-root">
      <LandingPageStyles />
      <div className="of-landing-shell">
        <LandingNav links={[{ href: "/gift", label: "Gift" }, { href: "/reserve", label: "Parent flow" }, { href: "/login", label: "Sign in" }]} />

        <section className="of-hero-grid">
          <div>
            <span className="of-pill"><Users size={12} strokeWidth={2.2} /> For people who have already seen Our Fable from the inside</span>
            <h1 className="of-hero-display" style={{ marginTop: 18 }}>
              You&apos;ve already felt what this can become. Start it for your own child now.
            </h1>
            <p className="of-hero-copy">
              If another family&apos;s prompts, updates, and growing archive made you wish your own child had the same kind of private record waiting for them, this is where you begin.
            </p>
            <p className="of-muted-copy" style={{ maxWidth: 650 }}>
              The power of Our Fable is easier to feel once you&apos;ve already seen it working from the inside.
            </p>
            <div className="of-mini-list" style={{ marginTop: 24 }}>
              {[
                "You already understand what the prompts feel like",
                "You already know why the quiet accumulation matters",
                "You do not need the whole category explained from scratch",
              ].map((line) => (
                <div key={line} className="of-mini-item"><Check size={14} color="var(--green)" style={{ marginTop: 4, flexShrink: 0 }} /> <span>{line}</span></div>
              ))}
            </div>
          </div>

          <div className="of-card" style={{ padding: 28 }}>
            <p className="of-section-label" style={{ marginBottom: 8 }}>Start it for your family</p>
            <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-playfair)", fontSize: 34, lineHeight: 1.1 }}>Start the same kind of vault for your child.</h2>
            <p className="of-section-copy" style={{ marginBottom: 18 }}>
              Reserve now, keep your founding price, and we&apos;ll invite you in as onboarding opens.
            </p>
            <div style={{ padding: 16, borderRadius: 16, background: "var(--bg-2)", border: "1px solid var(--border)", marginBottom: 18 }}>
              <p className="of-section-label" style={{ marginBottom: 6 }}>Founders pricing</p>
              <p style={{ margin: "0 0 4px", fontSize: 14, lineHeight: 1.6 }}>Our Fable: <strong>$12/mo or $99/yr</strong></p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>Our Fable+: <strong>$19/mo or $149/yr</strong></p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <div>
                <label htmlFor="warm-email" className="of-field-label">Your email</label>
                <input id="warm-email" className="of-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              {error ? <p style={{ margin: 0, color: "#D46565", fontSize: 13 }}>{error}</p> : null}
              <button type="submit" className="of-primary-btn" disabled={!emailValid || loading} style={{ width: "100%" }}>
                {loading ? "Reserving…" : <>Reserve your spot <ArrowRight size={16} /></>}
              </button>
            </form>
            <p className="of-muted-copy" style={{ fontSize: 12, marginTop: 14 }}>Free to reserve · No card required today · Private by design</p>
          </div>
        </section>

        <LandingSection label="What you already know" title="You&apos;ve seen the prompts, the replies, and the emotional logic already working.">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.95fr) minmax(0, 1fr)", gap: 20, marginTop: 24, alignItems: "start" }}>
            <div className="of-card" style={{ padding: 18 }}>
              <p className="of-section-label" style={{ marginBottom: 8 }}>Inside the product</p>
              <img src="/landing-artifacts/warm-contributor.png" alt="Real contributor response screen from Our Fable" style={{ width: "100%", borderRadius: 14, border: "1px solid var(--border)", display: "block", marginBottom: 12 }} />
              <p className="of-muted-copy" style={{ fontSize: 13 }}>A real contributor screen from the live product. If you&apos;ve already felt the emotional pull of this from another family, you do not need much more explanation.</p>
            </div>
            <div className="of-feature-grid" style={{ marginTop: 0, gridTemplateColumns: "1fr" }}>
              {[
                [Mail, "The prompts feel human", "You have already seen how simple it is for contributors to receive a question and reply without friction."],
                [Users, "The archive compounds", "What feels small in the moment becomes more moving as more family voices collect around a child."],
                [Lock, "It feels private and family-first", "You have already seen that this is not a public feed or a noisy social product."],
              ].map(([Icon, title, body]) => {
                const Glyph = Icon as typeof Mail;
                return (
                  <div key={title} className="of-feature-card">
                    <Glyph size={18} color="var(--green)" style={{ marginBottom: 10 }} />
                    <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>{title}</p>
                    <p className="of-muted-copy">{body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </LandingSection>

        <LandingSection label="Start your own" title="Getting your own family started should feel simple.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24, alignItems: "start" }}>
            <div className="of-step-grid" style={{ marginTop: 0, gridTemplateColumns: "1fr" }}>
              {[
                ["1", "Reserve", "Tell us where to reach you and lock your founding price."],
                ["2", "We invite you in", "You get the parent setup flow and start your child’s vault."],
                ["3", "Your circle starts answering", "The people who matter most begin leaving things your child will one day receive."],
              ].map(([n, title, body]) => (
                <div key={title} className="of-step-card">
                  <div className="of-step-number">{n}</div>
                  <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>{title}</p>
                  <p className="of-muted-copy">{body}</p>
                </div>
              ))}
            </div>
            <div className="of-card" style={{ padding: 22 }}>
              <p className="of-section-label" style={{ marginBottom: 8 }}>Why this matters for your child</p>
              <p className="of-muted-copy" style={{ fontSize: 15 }}>The same thing that felt powerful when it belonged to someone else becomes more urgent when you imagine your own child one day hearing those voices, reading those letters, and opening those memories.</p>
              <div className="of-mini-list">
                {[
                  "Hear grandma’s voice years later",
                  "Read a note from an uncle at the right moment",
                  "Keep something now that cannot be recreated later",
                ].map((line) => (
                  <div key={line} className="of-mini-item"><Check size={14} color="var(--green)" style={{ marginTop: 4, flexShrink: 0 }} /> <span>{line}</span></div>
                ))}
              </div>
            </div>
          </div>
        </LandingSection>

        <LandingSection label="Trust" title="Still private, serious, and family-first.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 24 }}>
            {[
              [Lock, "Private by design", "No public posting. No social-feed incentives. No ad-driven family content."],
              [HeartHandshake, "Built by Dave and Amanda for their own family first", "A product meant to feel enduring enough for the families who decide to trust it."],
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
            <p className="of-section-label">Warm close</p>
            <h2 className="of-section-title" style={{ marginBottom: 10 }}>If you already know what this becomes, start it for your own child.</h2>
            <p className="of-section-copy" style={{ marginBottom: 18 }}>Reserve now, keep your founding price, and we&apos;ll invite you in as onboarding opens.</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button type="button" className="of-primary-btn" onClick={() => document.getElementById("warm-email")?.focus()}>Start your family’s vault <ArrowRight size={16} /></button>
              <Link href="/" className="of-secondary-link">Back to homepage context</Link>
            </div>
          </div>
        </section>
        <MobileStickyCTA label="Start your family’s vault" href="#warm-email" />
      </div>
    </main>
  );
}
