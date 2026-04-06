"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, HeartHandshake, Lock, Shield, Sparkles } from "lucide-react";
import { captureUtmParams, getUtmParams } from "../../lib/utm";
import { trackLead, generateEventId } from "../../lib/analytics";
import { ReserveProofModule } from "../../components/reserve/ReserveProofModule";
import { LandingNav, LandingPageStyles, LandingSection } from "../../components/landing/LandingSystem";

export default function ReservePage() {
  return (
    <Suspense>
      <ReservePageInner />
    </Suspense>
  );
}

function ReservePageInner() {
  const searchParams = useSearchParams();
  const [childBirthday, setChildBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [successEmail, setSuccessEmail] = useState("");

  useEffect(() => {
    if (searchParams.get("gift") === "true") {
      window.location.href = "/gift";
      return;
    }
    captureUtmParams();
  }, [searchParams]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || loading) return;
    setLoading(true);
    setError("");
    try {
      const utms = getUtmParams();
      const eventId = generateEventId();
      const res = await fetch("/api/ourfable/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          childBirthday,
          source: "reserve",
          eventId,
          referralCode: searchParams.get("ref") ?? undefined,
          ...utms,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      trackLead(eventId);
      setSuccessEmail(email.trim().toLowerCase());
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
          <h1 className="of-hero-display" style={{ fontSize: 42, marginBottom: 12 }}>You locked in your spot.</h1>
          <p className="of-hero-copy" style={{ margin: "0 auto 14px", maxWidth: 520 }}>
            You&apos;re on the founding-families list. We&apos;ll email you as your onboarding spot opens, and your founding price stays locked in.
          </p>
          <p className="of-muted-copy" style={{ marginBottom: 28 }}>
            Confirmation sent to <strong style={{ color: "var(--text)" }}>{successEmail}</strong>
          </p>
          <Link href="/" className="of-secondary-link">← Back to ourfable.ai</Link>
        </div>
      </main>
    );
  }

  const reserveReasons = [
    "Lock founding pricing for life",
    "Start collecting the voices and stories that will matter later",
    "Join before onboarding spots fill",
    "No card required today",
  ];

  const reserving = [
    {
      title: "A private vault for your child",
      body: "A calm, family-first place for letters, voice notes, photos, and videos that will matter later.",
    },
    {
      title: "Monthly prompts to the right people",
      body: "Grandparents, aunts, uncles, godparents, and family friends get simple invitations to leave something meaningful.",
    },
    {
      title: "A record that compounds over time",
      body: "The archive gets more precious as more voices, memories, and seasons of life accumulate around your child.",
    },
  ];

  const trustCards = [
    {
      icon: Shield,
      title: "Built by Dave and Amanda for their own family first",
      body: "This was designed as a serious family product, not a growth-hack memory app.",
    },
    {
      icon: Lock,
      title: "Private by design",
      body: "No public feed. No social posting. No family content used for advertising.",
    },
    {
      icon: HeartHandshake,
      title: "Export anytime · no app required",
      body: "Families can own what they collect, and contributors can participate without installing anything.",
    },
  ];

  return (
    <main className="of-landing-root">
      <LandingPageStyles />
      <div className="of-landing-shell">
        <LandingNav links={[{ href: "/gift", label: "Gift" }, { href: "/faq", label: "FAQ" }, { href: "/login", label: "Sign in" }]} />

        <section className="of-hero-grid">
          <div>
            <span className="of-pill"><Sparkles size={12} strokeWidth={2.2} /> For parents starting this for their child</span>
            <h1 className="of-hero-display" style={{ marginTop: 18 }}>
              The people who love your child won’t always be here. Start preserving them now.
            </h1>
            <p className="of-hero-copy">
              Our Fable gives grandparents, family, and close friends a simple way to leave letters, voice notes, photos, and videos now — so your child can hear them later.
            </p>
            <p className="of-muted-copy" style={{ maxWidth: 660 }}>
              A private family vault that gets more meaningful over time, without becoming another app you have to manage every day.
            </p>
            <div className="of-mini-list" style={{ marginTop: 24 }}>
              {reserveReasons.map((line) => (
                <div key={line} className="of-mini-item"><Check size={14} color="var(--green)" style={{ marginTop: 4, flexShrink: 0 }} /> <span>{line}</span></div>
              ))}
            </div>
            <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 18 }}>
              <Link href="#reserve-form" className="of-primary-btn">Reserve your spot <ArrowRight size={16} /></Link>
              <Link href="/gift" className="of-secondary-link">Looking for a gift instead?</Link>
            </div>
          </div>

          <div id="reserve-form" className="of-card" style={{ padding: 28 }}>
            <p className="of-section-label" style={{ marginBottom: 8 }}>Reserve your family&apos;s spot</p>
            <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-playfair)", fontSize: 34, lineHeight: 1.1 }}>Founders pricing is live now.</h2>
            <p className="of-section-copy" style={{ marginBottom: 18 }}>
              Reserve free now, keep your founding price, and we&apos;ll invite you in as onboarding opens.
            </p>
            <div style={{ padding: 16, borderRadius: 16, background: "var(--bg-2)", border: "1px solid var(--border)", marginBottom: 18 }}>
              <p style={{ margin: "0 0 6px", fontSize: 14, lineHeight: 1.6 }}>Our Fable: <strong>$12/mo or $99/yr</strong></p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>Our Fable+: <strong>$19/mo or $149/yr</strong></p>
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--text-3)" }}>See later pricing and additional-child details</summary>
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  <p className="of-muted-copy" style={{ fontSize: 13 }}>After founders, pricing becomes $16/mo or $149/yr for Our Fable and $25/mo or $199/yr for Our Fable+.</p>
                  <p className="of-muted-copy" style={{ fontSize: 13 }}>Additional children are $7/mo or $59/yr during founders, then $9/mo or $79/yr. Each child gets their own vault and can share the same circle or have a completely separate one.</p>
                </div>
              </details>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label htmlFor="reserve-birthday" className="of-field-label">Child&apos;s birthday (optional)</label>
                <input id="reserve-birthday" className="of-input" type="date" value={childBirthday} onChange={(e) => setChildBirthday(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
              </div>
              <div>
                <label htmlFor="reserve-email" className="of-field-label">Your email</label>
                <input id="reserve-email" className="of-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              {error ? <p style={{ margin: 0, color: "#D46565", fontSize: 13 }}>{error}</p> : null}
              <button type="submit" className="of-primary-btn" disabled={!emailValid || loading} style={{ width: "100%" }}>
                {loading ? "Reserving…" : <>Reserve your spot <ArrowRight size={16} /></>}
              </button>
            </form>
            <div className="of-mini-list" style={{ marginTop: 16 }}>
              <div className="of-mini-item"><Check size={14} color="var(--green)" style={{ marginTop: 4, flexShrink: 0 }} /> Free to reserve</div>
              <div className="of-mini-item"><Check size={14} color="var(--green)" style={{ marginTop: 4, flexShrink: 0 }} /> No card required today</div>
              <div className="of-mini-item"><Check size={14} color="var(--green)" style={{ marginTop: 4, flexShrink: 0 }} /> Gift page available if you&apos;re buying for another family</div>
            </div>
          </div>
        </section>

        <LandingSection label="Why reserve now" title="Because the people who love your child are here now." copy="This is not just about storing memories. It is about asking the right people while their voices, stories, and perspective are still available in this season of life." />

        <LandingSection label="What you&apos;re reserving" title="A more serious beginning than a waitlist form.">
          <div className="of-feature-grid">
            {reserving.map((item) => (
              <div key={item.title} className="of-feature-card">
                <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>{item.title}</p>
                <p className="of-muted-copy">{item.body}</p>
              </div>
            ))}
          </div>
        </LandingSection>

        <LandingSection label="What happens next" title="A clear 3-step path, not a vague someday promise.">
          <div className="of-step-grid">
            {[
              ["1", "Reserve now", "Tell us where to reach you. That locks your founding price and puts your family in line."],
              ["2", "We invite you in", "We onboard founding families in small groups so the early experience feels personal and high-trust."],
              ["3", "Your vault starts feeling alive", "You add the first pieces, invite your circle, and start seeing the archive become emotionally real fast."],
            ].map(([num, title, body]) => (
              <div key={title} className="of-step-card">
                <div className="of-step-number">{num}</div>
                <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>{title}</p>
                <p className="of-muted-copy">{body}</p>
              </div>
            ))}
          </div>
        </LandingSection>

        <LandingSection label="Trust" title="Private, exportable, and built to feel worthy of family trust.">
          <div className="of-trust-grid">
            {trustCards.map(({ icon: Icon, title, body }) => (
              <div key={title} className="of-feature-card">
                <Icon size={18} color="var(--green)" style={{ marginBottom: 10 }} />
                <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>{title}</p>
                <p className="of-muted-copy">{body}</p>
              </div>
            ))}
          </div>
        </LandingSection>

        <LandingSection label="Proof" title="What families will soon be able to see here." copy="As real reactions, screenshots, and parent proof come in, this section will hold them close to the decision moment.">
          <div className="of-proof-placeholder">
            <p className="of-muted-copy" style={{ marginBottom: 12 }}>Founder-backed trust notes, parent reactions, and real family proof will live here once approved.</p>
            <ReserveProofModule />
          </div>
        </LandingSection>

        <section className="of-section">
          <div className="of-close-cta">
            <p className="of-section-label">Start now</p>
            <h2 className="of-section-title" style={{ marginBottom: 10 }}>Start preserving the people your child will one day want to hear from most.</h2>
            <p className="of-section-copy" style={{ marginBottom: 18 }}>Reserve now, keep your founding price, and we&apos;ll reach out when your onboarding spot opens.</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href="#reserve-form" className="of-primary-btn">Reserve your spot <ArrowRight size={16} /></Link>
              <Link href="/gift" className="of-secondary-link">Give this as a gift instead</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
