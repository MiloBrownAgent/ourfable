"use client";
import Link from "next/link";
import { Check } from "lucide-react";

const SECTION_NAV = [
  { label: "Why it matters", href: "#why-it-matters" },
  { label: "How it works", href: "#how-it-works" },
  { label: "What's inside", href: "#whats-inside" },
  { label: "Pricing", href: "#pricing" },
];

const PROOF_ITEMS = ["Automatic monthly prompts", "Photos, video & voice memos", "Dispatches to your whole circle", "Sealed until they're ready", "Private by design"];

interface StickyNavProps {
  scrolled: boolean;
  showSecondNav: boolean;
  activeSection: string;
}

export function StickyNav({ scrolled, showSecondNav, activeSection }: StickyNavProps) {
  return (
    <>
      {/* ── PRIMARY NAV (desktop) ── */}
      <nav className="desktop-nav" role="navigation" aria-label="Main navigation" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, minHeight: 64, display: "flex", alignItems: "center", padding: "env(safe-area-inset-top, 0px) 24px 0 24px", background: scrolled ? "rgba(253,251,247,0.97)" : "transparent", borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent", backdropFilter: scrolled ? "blur(20px)" : "none", transition: "all 300ms ease" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" onClick={(e) => { if (window.location.pathname === "/") { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); } }} style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", letterSpacing: "-0.01em", textDecoration: "none", cursor: "pointer" }}>Our Fable</a>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <Link href="/" className="nav-link" style={{ fontSize: 14 }}>Home</Link>
              <Link href="/faq" className="nav-link" style={{ fontSize: 14 }}>FAQ</Link>
              <Link href="/reserve" className="nav-link" style={{ fontSize: 14 }}>Give as a gift</Link>
              <Link href="/login" className="nav-link" style={{ fontSize: 14 }}>Sign in</Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/demo" style={{ padding: "10px 20px", fontSize: 14, fontWeight: 600, color: "var(--green)", border: "1.5px solid var(--green-border)", borderRadius: 100, textDecoration: "none", transition: "all 160ms", background: "var(--green-light)" }}>
                Try the demo
              </Link>
              <Link href="/reserve" className="btn-primary nav-cta" style={{ padding: "10px 22px", fontSize: 14 }}>
                Reserve your spot
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── SECTION NAV (desktop scrollspy) ── */}
      <div className="desktop-nav section-subnav" style={{
        position: "fixed", top: 64, left: 0, right: 0, zIndex: 99,
        height: 44, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(253,251,247,0.97)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        opacity: showSecondNav ? 1 : 0, pointerEvents: showSecondNav ? "auto" : "none",
        transform: showSecondNav ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {SECTION_NAV.map(s => (
            <a key={s.href} href={s.href} aria-current={activeSection === s.href.slice(1) ? "true" : undefined} onClick={e => {
              e.preventDefault();
              document.getElementById(s.href.slice(1))?.scrollIntoView({ behavior: "smooth" });
            }} style={{
              padding: "6px 16px", borderRadius: 100, fontSize: 13,
              fontWeight: activeSection === s.href.slice(1) ? 600 : 400,
              color: activeSection === s.href.slice(1) ? "var(--green)" : "var(--text-2)",
              background: activeSection === s.href.slice(1) ? "var(--green-light)" : "transparent",
              border: "1px solid", borderColor: activeSection === s.href.slice(1) ? "var(--green-border)" : "transparent",
              textDecoration: "none", transition: "all 0.2s", whiteSpace: "nowrap",
            }}>
              {s.label}
            </a>
          ))}
          <Link href="/reserve" style={{
            marginLeft: 12, padding: "6px 18px", borderRadius: 100, fontSize: 13,
            fontWeight: 700, color: "#fff", background: "var(--green)",
            textDecoration: "none", transition: "opacity 0.2s",
          }}>
            Reserve your spot →
          </Link>
        </div>
      </div>
    </>
  );
}

export function ProofStrip() {
  return (
    <div style={{ background: "linear-gradient(180deg, rgba(74,94,76,0) 0%, var(--green) 8%, var(--green) 92%, rgba(74,94,76,0) 100%)", padding: "64px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
        {PROOF_ITEMS.map(p => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={11} color="rgba(255,255,255,0.55)" strokeWidth={2.5} aria-hidden="true" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
