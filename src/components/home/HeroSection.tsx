"use client";
import { useEffect, useState } from "react";

import { AnimatedHeadline } from "./AnimatedHeadline";
import Link from "next/link";
import { Mic, Image as ImageIcon, Video } from "lucide-react";

// ── Product screenshot mockups ─────────────────────────────────────────────────
function VaultMockup() {
  return (
    <div className="mockup-scale-wrapper"><div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
      {/* Dark vault page — matches live vault page design */}
      <div style={{ background: "linear-gradient(160deg, #1C2B1E 0%, #142016 100%)", padding: "28px 24px 32px", position: "relative" }}>
        {/* Gold ambient glow */}
        <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", width: "60%", height: 60, pointerEvents: "none", background: "radial-gradient(ellipse, rgba(200,168,122,0.09), transparent 70%)" }} />
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8A87A", marginBottom: 8 }}>THE VAULT</p>
        <div style={{ width: 36, height: "0.5px", background: "rgba(200,168,122,0.4)", marginBottom: 14 }} />
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 400, fontStyle: "italic", color: "#FDFBF7", marginBottom: 18, lineHeight: 1.25 }}>Sealed memories for Noah</h2>
        {/* Stats bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {[{ n: "47", l: "Total" }, { n: "45", l: "Sealed" }, { n: "2", l: "Open" }].map(s => (
            <div key={s.l} style={{ flex: 1, padding: "10px 0", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(253,251,247,0.08)", borderRadius: 8 }}>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700, color: "#FDFBF7", marginBottom: 2 }}>{s.n}</p>
              <p style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(253,251,247,0.35)" }}>{s.l}</p>
            </div>
          ))}
        </div>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {["All", "Sealed", "Open"].map((t, i) => (
            <span key={t} style={{ padding: "5px 14px", borderRadius: 100, fontSize: 10, fontWeight: 500, border: i === 0 ? "1px solid #C8A87A" : "1px solid rgba(253,251,247,0.1)", color: i === 0 ? "#C8A87A" : "rgba(253,251,247,0.35)", letterSpacing: "0.06em" }}>{t}</span>
          ))}
        </div>
        {/* Entries */}
        {[
          { name: "Grandma", rel: "Grandmother", type: "Letter" },
          { name: "Uncle", rel: "Uncle", type: "Voice memo" },
          { name: "Godmother", rel: "Godparent", type: "Photo" },
        ].map((entry, i) => (
          <div key={i} style={{ padding: "14px 16px", marginBottom: 8, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(253,251,247,0.07)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 14, fontStyle: "italic", color: "#FDFBF7", marginBottom: 3 }}>{entry.name}</p>
              <p style={{ fontSize: 10, color: "rgba(253,251,247,0.45)" }}>{entry.type} · {entry.rel}</p>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", border: "0.5px solid rgba(200,168,122,0.45)", borderRadius: 100, padding: "3px 10px", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C8A87A" }}>Sealed</span>
          </div>
        ))}
        <p style={{ fontSize: 11, color: "rgba(253,251,247,0.3)", marginTop: 8 }}>+44 more sealed</p>
      </div>
    </div></div>
  );
}

function WritingBlockMockup() {
  return (
    <div className="mockup-scale-wrapper"><div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.10)" }}>
      {/* Greeting + child name — compact layout matching live dashboard */}
      <div style={{ background: "#FDFBF7", padding: "24px 24px 0" }}>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(107,143,111,0.7)", marginBottom: 8 }}>Good evening</p>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, fontSize: 28, color: "#4A5E4C", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 10 }}>Noah</h1>
        <div style={{ width: 36, height: "0.5px", background: "linear-gradient(90deg, #C8A87A, transparent)", marginBottom: 6 }} />
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(107,143,111,0.7)" }}>9 months, 3 days · 280 days &nbsp;&nbsp; ✦ 13 years · 4,468 days away</p>
      </div>
      {/* Writing block */}
      <div style={{ background: "#FDFBF7", padding: "20px 24px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 12, boxShadow: "0 2px 24px rgba(26,26,24,0.07), 0 1px 4px rgba(26,26,24,0.04)", overflow: "hidden" }}>
          {/* Top accent bar */}
          <div style={{ height: 3, background: "linear-gradient(90deg, #4A5E4C 0%, rgba(107,143,111,0.5) 50%, #C8A87A 100%)" }} />
          <div style={{ padding: "16px 20px 0" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 16, fontWeight: 400, color: "#4A5E4C" }}>Dear Noah,</span>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, color: "rgba(107,143,111,0.7)", letterSpacing: "0.04em" }}>March 25, 2026</span>
            </div>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, lineHeight: 1.85, color: "#6A6A65", fontStyle: "italic" }}>Something happened today I want you to know about…</p>
          </div>
          {/* Attachment strip */}
          <div style={{ display: "flex", gap: 6, padding: "10px 20px", borderTop: "0.5px solid #E8E2D8", marginTop: 12 }}>
            {[
              { label: "Voice", icon: <Mic size={10} strokeWidth={1.5} /> },
              { label: "Photo", icon: <ImageIcon size={10} strokeWidth={1.5} /> },
              { label: "Video", icon: <Video size={10} strokeWidth={1.5} /> },
            ].map(btn => (
              <span key={btn.label} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 100, border: "1px solid #E8E2D8", fontSize: 10, color: "#9A9590" }}>{btn.icon} {btn.label}</span>
            ))}
          </div>
          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderTop: "0.5px solid #E8E2D8", background: "#FDFBF7" }}>
            <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #E8E2D8", borderRadius: 100, overflow: "hidden" }}>
              <span style={{ padding: "4px 10px", background: "#4A5E4C", color: "#fff", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Seal</span>
              <span style={{ padding: "4px 10px", fontSize: 10, color: "#9A9590", letterSpacing: "0.06em", textTransform: "uppercase" }}>Dispatch</span>
            </div>
            <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: 100, background: "#4A5E4C", color: "#fff", fontSize: 11, fontWeight: 600 }}>Seal letter</span>
          </div>
        </div>
      </div>
    </div></div>
  );
}

// ── Mockup data for tab switcher ───────────────────────────────────────────────
const MOCKUPS = [
  { label: "Dashboard", component: <WritingBlockMockup /> },
  { label: "The Vault", component: <VaultMockup /> },
];

export function HeroSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [tabPaused, setTabPaused] = useState(false);

  useEffect(() => {
    if (tabPaused) return;
    const t = setInterval(() => setActiveTab(i => (i + 1) % MOCKUPS.length), 4000);
    return () => clearInterval(t);
  }, [tabPaused]);

  return (
    <section className="hero-section" style={{ padding: "148px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      <div className="hero-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          {/* Urgency badge - above headline */}
          <div style={{ marginBottom: 20, animation: "fadeUp 0.5s ease both" }}>
            <span style={{
              display: "inline-block",
              background: "var(--green-light)",
              border: "1px solid var(--green-border)",
              color: "var(--green)",
              padding: "6px 16px",
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              Founding families only · Onboarding slowly to support every family
            </span>
          </div>
          <AnimatedHeadline />
          {/* Desktop sub-headline */}
          <p className="hero-sub-desktop" style={{ fontSize: 19, lineHeight: 1.8, color: "var(--text-2)", marginBottom: 40, maxWidth: 440, animation: "fadeUp 0.5s ease 0.7s both", opacity: 0 }}>
            A private vault for your child&apos;s letters, voice notes, photos, and videos. Every month, the people who love them are invited to add something worth keeping.
          </p>
          {/* Mobile sub-headline — matches desktop */}
          <p className="hero-sub-mobile" style={{ fontSize: 17, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 24, maxWidth: 440, animation: "fadeUp 0.5s ease 0.7s both", opacity: 0 }}>
            A private vault for your child&apos;s letters, voice notes, photos, and videos. Every month, family can add something worth keeping.
          </p>
          <div id="waitlist" style={{ maxWidth: 520, animation: "fadeUp 0.5s ease 0.85s both", opacity: 0 }}>
            <Link href="/reserve" className="btn-primary" style={{ display: "inline-flex", padding: "15px 32px", fontSize: 16, textDecoration: "none" }}>
              Reserve your spot →
            </Link>
            <p style={{ marginTop: 10, fontSize: 11, color: "var(--sage)", fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
              Reserve now · No card required today · Keep your founding price
            </p>
            <p style={{ marginTop: 6, fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
              Built by a parent who wanted something better than group texts · Private by design · Export anytime
            </p>
            <div style={{ marginTop: 22, display: "grid", gap: 12, padding: "16px 18px", borderRadius: 14, background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)" }}>
                How it works
              </p>
              {[
                ["Create your child’s private vault", "Start with a simple reserve. We invite you in as onboarding opens."],
                ["Invite the people who matter most", "Grandparents, aunts, uncles, family friends — whoever you want preserved."],
                ["Our Fable prompts them over time", "Letters, voice notes, photos, and videos build quietly for your child’s future."],
              ].map(([title, copy]) => (
                <div key={title} style={{ display: "grid", gridTemplateColumns: "20px 1fr", gap: 10, alignItems: "start" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--green-light)", color: "var(--green)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    {title.startsWith("Create") ? "1" : title.startsWith("Invite") ? "2" : "3"}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{title}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, lineHeight: 1.6, color: "var(--text-3)" }}>{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-right" style={{ animation: "fadeIn 0.8s ease 0.4s both", opacity: 0 }} onMouseEnter={() => setTabPaused(true)} onMouseLeave={() => setTabPaused(false)}>
          {/* Tab pills — hidden on mobile, auto-cycles instead */}
          <div className="mockup-tabs" role="tablist" aria-label="Product screenshots" style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {MOCKUPS.map((m, i) => (
              <button key={i} role="tab" aria-selected={activeTab === i} aria-controls={`mockup-panel-${i}`} onClick={() => setActiveTab(i)} style={{ padding: "10px 18px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all 160ms", minHeight: 44, background: activeTab === i ? "var(--green)" : "var(--card)", border: `1px solid ${activeTab === i ? "transparent" : "var(--border)"}`, color: activeTab === i ? "#fff" : "var(--text-3)" }}>
                {m.label}
              </button>
            ))}
          </div>
          {/* Mobile label — shows which mockup is active */}
          <p className="mockup-mobile-label" style={{ display: "none", textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)", marginBottom: 12 }}>
            {MOCKUPS[activeTab].label}
          </p>
          <div className="mockup-height-container" style={{ position: "relative", animation: "float 6s ease-in-out infinite" }}>
            {MOCKUPS.map((m, i) => (
              <div key={i} id={`mockup-panel-${i}`} role="tabpanel" aria-label={m.label} style={{
                ...(activeTab === i ? {} : { position: "absolute", top: 0, left: 0, right: 0 }),
                opacity: activeTab === i ? 1 : 0,
                transform: activeTab === i ? "translateY(0) scale(1)" : "translateY(6px) scale(0.99)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
                pointerEvents: activeTab === i ? "auto" : "none",
                overflow: "hidden",
                borderRadius: 16,
              }}>
                {m.component}
              </div>
            ))}
          </div>
          {/* Mobile dot indicators */}
          <div className="mockup-dots" style={{ display: "none", justifyContent: "center", gap: 8, marginTop: 16 }}>
            {MOCKUPS.map((_, i) => (
              <div key={i} style={{
                width: activeTab === i ? 20 : 6, height: 6,
                borderRadius: 100,
                background: activeTab === i ? "var(--green)" : "var(--border)",
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
