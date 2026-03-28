"use client";
import { useEffect, useState } from "react";

import { AnimatedHeadline } from "./AnimatedHeadline";
import Link from "next/link";
import { Mic, Image as ImageIcon, Video, Music, Globe, Cloud } from "lucide-react";

// ── Product screenshot mockups ─────────────────────────────────────────────────
function VaultMockup() {
  return (
    <div className="mockup-scale-wrapper"><div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
      {/* Dark vault section — matches actual dashboard */}
      <div style={{ background: "linear-gradient(160deg, #1C2B1E 0%, #142016 100%)", padding: "28px 24px 32px", position: "relative" }}>
        {/* Gold ambient glow */}
        <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", width: "60%", height: 60, pointerEvents: "none", background: "radial-gradient(ellipse, rgba(200,168,122,0.09), transparent 70%)" }} />
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8A87A", marginBottom: 8 }}>THE VAULT</p>
        <div style={{ width: 36, height: "0.5px", background: "rgba(200,168,122,0.4)", marginBottom: 18 }} />
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 400, color: "#FDFBF7", marginBottom: 24, lineHeight: 1.25 }}>Sealed memories for Noah</h2>
        {[
          { name: "Grandma", rel: "Grandmother", type: "Letter" },
          { name: "Uncle", rel: "Uncle", type: "Voice memo" },
          { name: "Godmother", rel: "Godparent", type: "Photo" },
        ].map((entry, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: i < 2 ? "0.5px solid rgba(253,251,247,0.07)" : "none" }}>
            <div>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 14, fontStyle: "italic", color: "#FDFBF7", marginBottom: 3 }}>{entry.name}</p>
              <p style={{ fontSize: 10, color: "rgba(253,251,247,0.45)" }}>{entry.type} · {entry.rel}</p>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", border: "0.5px solid rgba(200,168,122,0.45)", borderRadius: 100, padding: "3px 10px", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C8A87A" }}>Sealed</span>
          </div>
        ))}
        <p style={{ fontSize: 11, color: "rgba(253,251,247,0.3)", marginTop: 12 }}>+4 more sealed</p>
      </div>
      {/* Cream cards below vault */}
      <div style={{ background: "#FDFBF7", padding: "16px 24px 20px" }}>
        <div style={{ padding: "14px 0", borderBottom: "0.5px solid #E8E2D8", borderLeft: "2px solid rgba(107,143,111,0.5)", paddingLeft: 14 }}>
          <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9A9590", marginBottom: 3 }}>Dispatches</p>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 14, fontWeight: 400, color: "#1A1A18" }}>Send an update</p>
        </div>
        <div style={{ padding: "14px 0", borderLeft: "2px solid rgba(107,143,111,0.5)", paddingLeft: 14 }}>
          <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9A9590", marginBottom: 3 }}>People</p>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 14, fontWeight: 400, color: "#1A1A18" }}>Inner Circle</p>
        </div>
      </div>
    </div></div>
  );
}

function WritingBlockMockup() {
  return (
    <div className="mockup-scale-wrapper"><div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.10)" }}>
      {/* Greeting + child name — matches dashboard hero */}
      <div style={{ background: "#FDFBF7", padding: "28px 24px 0" }}>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(107,143,111,0.7)", marginBottom: 10 }}>Good evening</p>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, fontSize: 36, color: "#4A5E4C", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 14 }}>Noah</h1>
        <div style={{ width: 40, height: "0.5px", background: "linear-gradient(90deg, #C8A87A, transparent)", marginBottom: 8 }} />
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(107,143,111,0.7)" }}>9 months, 3 days</p>
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

export function SnapshotMockup() {
  return (
    <div className="mockup-scale-wrapper"><div style={{ background: "#FDFBF7", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.10)", border: "1px solid #E8E2D8" }}>
      <div style={{ padding: "28px 24px" }}>
        {/* Section header — matches dashboard editorial style */}
        <div style={{ borderTop: "2px solid #C8A87A", paddingTop: 16, marginBottom: 20 }}>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9A9590", marginBottom: 4 }}>The World</p>
          <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 400, color: "#1A1A18", lineHeight: 1.25, marginBottom: 10 }}>March 2026</h3>
          <p style={{ fontSize: 11, color: "#6A6A65", lineHeight: 1.75, marginBottom: 6 }}>Spring is arriving early — cherry blossoms ahead of schedule, everyone stepping outside again.</p>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 11, color: "#9A9590", fontStyle: "italic", display: "flex", alignItems: "center", gap: 4 }}><Music size={10} strokeWidth={1.5} /> Choosin&apos; Texas — Ella Langley</p>
        </div>
        {/* Ornament */}
        <p style={{ fontSize: 7, letterSpacing: "0.5em", color: "#C8A87A", textAlign: "center", marginBottom: 20 }}>✦ ✦ ✦</p>
        {/* Timeline entries */}
        {[
          {
            month: "February 2026", age: "8m 1d",
            items: [
              { icon: "globe", label: "In the world", text: "Valentine's month — love songs everywhere, the Super Bowl bringing everyone together." },
              { icon: "music", label: "Everyone was singing", text: "Choosin' Texas — Ella Langley" },
              { icon: "cloud", label: "The weather", text: "18°F · Heavy snow, but the days are getting longer" },
            ]
          },
        ].map((snap, i) => (
          <div key={i} style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12, paddingTop: 4, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4A5E4C", flexShrink: 0 }} />
              <div style={{ width: 1, flex: 1, background: "#E8E4DC", marginTop: 4 }} />
            </div>
            <div style={{ flex: 1, padding: "10px 14px", background: "#FFFFFF", border: "1px solid #E8E4DC", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontFamily: "var(--font-playfair)", fontSize: 12, fontWeight: 600, color: "#2A2A2A" }}>{snap.month}</p>
                <p style={{ fontSize: 9, color: "#9A9590", background: "#F0EDE6", padding: "1px 6px", borderRadius: 3 }}>{snap.age}</p>
              </div>
              {snap.items.map((item, j) => (
                <div key={j} style={{ display: "flex", gap: 7, marginBottom: j < snap.items.length - 1 ? 7 : 0, alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, marginTop: 1, color: "#9A9590" }}>{item.icon === "globe" ? <Globe size={10} strokeWidth={1.5} /> : item.icon === "music" ? <Music size={10} strokeWidth={1.5} /> : <Cloud size={10} strokeWidth={1.5} />}</span>
                  <p style={{ fontSize: 9, color: "#6A6660", lineHeight: 1.5 }}>
                    <span style={{ color: "#9A9590", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 8 }}>{item.label} · </span>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div></div>
  );
}

function BornMockup() {
  return (
    <div className="mockup-scale-wrapper"><div style={{ background: "#FDFBF7", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.10)", border: "1px solid #E8E2D8" }}>
      <div style={{ padding: "24px 20px" }}>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 8, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9A9590", marginBottom: 8, textAlign: "center" }}>The Our Fable Gazette</p>
        <div style={{ borderTop: "1px solid #E8E2D8", borderBottom: "1px solid #E8E2D8", padding: "16px 0", textAlign: "center", marginBottom: 14 }}>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 7, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9A9590", marginBottom: 8 }}>Born into this world</p>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "#4A5E4C", lineHeight: 1.1, marginBottom: 6 }}>Noah Ellis</p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 8, color: "#9A9590", letterSpacing: "0.1em" }}>March 15, 2025 · Portland, Oregon</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ padding: "10px 12px", borderRight: "1px solid #E8E2D8" }}>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase", color: "#9A9590", marginBottom: 6 }}>The Weather</p>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: 28, fontWeight: 800, color: "#1A1A18", lineHeight: 1 }}>96°</p>
            <p style={{ fontSize: 8, color: "#9A9590", marginTop: 4 }}>High · Low 72°F</p>
          </div>
          <div style={{ padding: "10px 12px" }}>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase", color: "#9A9590", marginBottom: 6 }}>#1 Song</p>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: 13, fontStyle: "italic", color: "#1A1A18", lineHeight: 1.3, marginBottom: 4 }}>&ldquo;Manchild&rdquo;</p>
            <p style={{ fontSize: 8, color: "#9A9590" }}>Sabrina Carpenter</p>
          </div>
        </div>
        <div style={{ padding: "10px 12px", background: "var(--green-light)", border: "1px solid var(--green-border)", borderRadius: 6, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase", color: "#9A9590", marginBottom: 6 }}>The World Welcomed You</p>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 11, fontWeight: 400, fontStyle: "italic", color: "#4A5E4C", lineHeight: 1.5 }}>&ldquo;Every child begins the world again.&rdquo;</p>
        </div>
      </div>
    </div></div>
  );
}

// ── Mockup data for tab switcher ───────────────────────────────────────────────
const MOCKUPS = [
  { label: "Dashboard", component: <WritingBlockMockup /> },
  { label: "The Vault", component: <VaultMockup /> },
  { label: "World Snapshot", component: <SnapshotMockup /> },
  { label: "The Day They Were Born", component: <BornMockup /> },
];

export function HeroSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [tabPaused, setTabPaused] = useState(false);

  useEffect(() => {
    if (tabPaused) return;
    const t = setInterval(() => setActiveTab(i => (i + 1) % 4), 4000);
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
              Founding families only · Limited spots
            </span>
          </div>
          <AnimatedHeadline />
          {/* Desktop sub-headline */}
          <p className="hero-sub-desktop" style={{ fontSize: 19, lineHeight: 1.8, color: "var(--text-2)", marginBottom: 40, maxWidth: 440, animation: "fadeUp 0.5s ease 0.7s both", opacity: 0 }}>
            The people who love your child won&apos;t always be here. Every month, Our Fable sends a simple question to grandparents, aunts, uncles, old friends. They write back with letters, voice recordings, photos, videos — all sealed in a private vault until your child is ready.
          </p>
          {/* Mobile sub-headline — one emotional sentence */}
          <p className="hero-sub-mobile" style={{ fontSize: 17, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 36, maxWidth: 440, animation: "fadeUp 0.5s ease 0.7s both", opacity: 0 }}>
            Capture the voices, stories, and love of the people in your child&apos;s life — before it&apos;s too late.
          </p>
          <div id="waitlist" style={{ maxWidth: 480, animation: "fadeUp 0.5s ease 0.85s both", opacity: 0 }}>
            <Link href="/reserve" className="btn-primary" style={{ display: "inline-flex", padding: "15px 32px", fontSize: 16, textDecoration: "none" }}>
              Reserve your spot →
            </Link>
            <p style={{ marginTop: 10, fontSize: 11, color: "var(--sage)", fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
              Free to reserve · No card required
            </p>
            <p style={{ marginTop: 6, fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
              🔒 Private vault · Your data is never shared · Export anytime
            </p>
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
