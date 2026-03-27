"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Reveal } from "./Reveal";
import Link from "next/link";
import { trackPricingScroll } from "../../lib/analytics";

type BillingPeriod = "monthly" | "annual";

const FOUNDING_SPOTS = 1000;

const TIERS = [
  {
    name: "Our Fable",
    monthlyPrice: 12,
    annualPrice: 79,
    originalMonthly: 16,
    originalAnnual: 99,
    badge: "Founding Member" as string | undefined,
    highlight: false,
    features: [
      "The Vault — sealed entries from circle members",
      "Up to 10 circle members",
      "Monthly prompts to circle",
      "World Snapshots",
      "Before You Were Born",
      "Birthday Letters",
      "Letters with media attachments",
      "5GB storage",
      "Data export",
    ],
  },
  {
    name: "Our Fable+",
    monthlyPrice: 19,
    annualPrice: 99,
    originalMonthly: 25,
    originalAnnual: 149,
    badge: "Founding Member",
    highlight: true,
    features: [
      "Everything in Our Fable",
      "Dispatches — parent updates to circle",
      "Unlimited circle members",
      "Voice Messages",
      "25GB storage",
      "1 additional child included",
      "Custom prompt editing",
    ],
  },
];

function annualSavings(monthly: number, annual: number): number {
  return monthly * 12 - annual;
}

export function PricingSection() {
  const [billing, setBilling] = useState<BillingPeriod>("annual");

  useEffect(() => {
    const pricingEl = document.getElementById("pricing");
    if (!pricingEl) return;
    let fired = false;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !fired) {
        fired = true;
        trackPricingScroll();
        obs.disconnect();
      }
    }, { threshold: 0.2 });
    obs.observe(pricingEl);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <section id="pricing" style={{ padding: "100px 40px", maxWidth: 900, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p className="label label-green" style={{ marginBottom: 14 }}>Pricing</p>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 16 }}>
              Simple, honest pricing.
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75, maxWidth: 480, margin: "0 auto 28px" }}>
              One family. One vault. Two plans to fit how your family shares.
            </p>

            {/* Billing toggle */}
            <div style={{ display: "inline-flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
              {(["monthly", "annual"] as BillingPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setBilling(p)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: billing === p ? "var(--green)" : "transparent",
                    color: billing === p ? "#fff" : "var(--text-3)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 200ms",
                  }}
                >
                  {p === "monthly" ? "Monthly" : "Annual"}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }} className="pricing-grid">
            {TIERS.map((tier) => {
              const price = billing === "monthly" ? tier.monthlyPrice : tier.annualPrice;
              const period = billing === "monthly" ? "/mo" : "/yr";
              const savings = annualSavings(tier.monthlyPrice, tier.annualPrice);

              return (
                <div key={tier.name} style={{
                  padding: "40px 32px",
                  borderRadius: 20,
                  border: tier.highlight ? "2px solid var(--green)" : "1.5px solid var(--border)",
                  background: tier.highlight ? "var(--green-light)" : "var(--card)",
                  position: "relative",
                  boxShadow: tier.highlight ? "0 8px 32px rgba(74,94,76,0.12)" : "var(--shadow-sm)",
                }}>
                  {tier.badge && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--green)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 100, whiteSpace: "nowrap" }}>
                      {tier.badge}
                    </div>
                  )}

                  {/* Founding member spots */}
                  <p style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 16, fontStyle: "italic" }}>
                    Limited to {FOUNDING_SPOTS.toLocaleString()} founding families
                  </p>

                  <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)", marginBottom: 12 }}>
                    {tier.name}
                  </p>

                  {/* Original price — large, crossed out */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-playfair)", fontSize: 44, fontWeight: 800, color: "var(--text-4)", letterSpacing: "-0.03em", lineHeight: 1, textDecoration: "line-through" }}>
                      ${billing === "monthly" ? tier.originalMonthly : tier.originalAnnual}
                    </span>
                    <span style={{ fontSize: 15, color: "var(--text-4)", textDecoration: "line-through" }}>{period}</span>
                  </div>

                  {/* Founding price — smaller, green */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-playfair)", fontSize: 28, fontWeight: 800, color: "var(--green)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                      ${price}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 600 }}>{period} founding</span>
                  </div>

                  {billing === "annual" && (
                    <p style={{ fontSize: 12, color: "var(--green)", fontWeight: 600, marginBottom: 12 }}>
                      Locked for life · Save ${tier.originalAnnual - tier.annualPrice}/yr
                    </p>
                  )}
                  {billing === "monthly" && (
                    <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
                      or ${tier.annualPrice}/yr annual founding rate — save ${savings}
                    </p>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                    {tier.features.map(f => (
                      <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--green-light)", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                          <Check size={9} color="var(--green)" strokeWidth={3} aria-hidden="true" />
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div style={{ marginTop: 16, padding: "16px 24px", background: "rgba(200,168,122,0.06)", border: "1px solid rgba(200,168,122,0.25)", borderRadius: 12, display: "flex", gap: 12, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text)" }}>Growing family?</strong>{" "}
              Add each additional child for <strong style={{ color: "var(--green)" }}>$7/mo</strong> — or $59/yr at the founding rate.
            </p>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div style={{ marginTop: 12, padding: "18px 24px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", marginTop: 7, flexShrink: 0 }} />
            <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7 }}>
              <strong style={{ color: "var(--text)" }}>Your vault, always yours.</strong>{" "}
              Export everything — every letter, photo, voice memo, and video — at any time. If you ever leave, you leave with everything. No questions asked.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="cta-section" style={{ padding: "80px 40px 140px", textAlign: "center", background: "var(--bg-2)", borderTop: "1px solid var(--border)" }}>
        <Reveal>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: "clamp(1.1rem, 2vw, 1.4rem)", color: "var(--text-3)", marginBottom: 24, lineHeight: 1.6 }}>
              &ldquo;The people who love your child won&apos;t be here forever.&rdquo;
            </p>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontWeight: 800, fontSize: "clamp(2.5rem, 5vw, 4rem)", letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 20 }}>
              Start{" "}
              <em style={{ color: "var(--green)", fontStyle: "italic" }}>their</em>
              {" "}story.
            </h2>
            <p style={{ fontSize: 17, color: "var(--text-2)", marginBottom: 40, lineHeight: 1.7 }}>
              Five minutes to set up. Every month, Our Fable sends a personalized prompt to every person in your child&apos;s circle — and holds every answer, sealed, until your child is old enough to read them.
            </p>
            <div style={{ maxWidth: 480, margin: "0 auto 16px" }}>
              <Link href="/reserve" className="btn-primary" style={{ display: "inline-flex", padding: "15px 36px", fontSize: 16, textDecoration: "none" }}>
                Reserve your spot →
              </Link>
            </div>
            <p style={{ fontSize: 11, color: "var(--sage)", marginBottom: 6, fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
              Free to reserve · No card required
            </p>
            <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6, fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
              🔒 Private vault · Your data is never shared · Export anytime
            </p>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>Founding rate: $79/yr · Limited to 1,000 families · Locked for life</p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
