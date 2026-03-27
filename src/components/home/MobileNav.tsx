"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export function MobileNav({ scrolled }: { scrolled: boolean }) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Focus trap when drawer is open
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") { setOpen(false); toggleRef.current?.focus(); return; }
    if (e.key === "Tab" && drawerRef.current) {
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>("button, a, input, [tabindex]");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [open]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open && drawerRef.current) {
      const first = drawerRef.current.querySelector<HTMLElement>("button, a");
      first?.focus();
    }
  }, [open]);

  const sections = [
    { label: "Reserve your spot", href: "/reserve", primary: true },
    { label: "Why it matters", href: "#why-it-matters" },
    { label: "How it works", href: "#how-it-works" },
    { label: "What's inside", href: "#whats-inside" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "/faq" },
    { label: "Give as a gift", href: "/gift" },
    { label: "Sign in", href: "/login" },
  ];

  function scrollTo(href: string) {
    setOpen(false);
    if (href.startsWith("#")) {
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      window.location.href = href;
    }
  }

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, minHeight: 64,
        display: "none", alignItems: "center", justifyContent: "space-between",
        padding: "env(safe-area-inset-top, 0px) 20px 0 20px",
        background: scrolled || open ? "rgba(253,251,247,0.97)" : "transparent",
        borderBottom: scrolled || open ? "1px solid var(--border)" : "1px solid transparent",
        backdropFilter: scrolled || open ? "blur(20px)" : "none",
        transition: "all 300ms ease",
      }} className="mobile-nav">
        <a href="/" onClick={(e) => { if (window.location.pathname === "/") { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); } }} style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700, color: "var(--green)", textDecoration: "none", cursor: "pointer" }}>Our Fable</a>
        <button
          ref={toggleRef}
          onClick={() => setOpen(o => !o)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 12, display: "flex", flexDirection: "column", gap: 5, minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}
          aria-label="Menu"
          aria-expanded={open}
        >
          <span style={{ display: "block", width: 22, height: 2, background: "var(--text)", borderRadius: 2, transition: "all 0.25s", transform: open ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
          <span style={{ display: "block", width: 22, height: 2, background: "var(--text)", borderRadius: 2, transition: "all 0.25s", opacity: open ? 0 : 1 }} />
          <span style={{ display: "block", width: 22, height: 2, background: "var(--text)", borderRadius: 2, transition: "all 0.25s", transform: open ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
        </button>
      </nav>

      {open && (
        <div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Navigation menu" style={{
          position: "fixed", top: 64, left: 0, right: 0, bottom: 0, zIndex: 199,
          background: "var(--bg)", display: "none", flexDirection: "column",
          padding: "16px 0", overflowY: "auto", animation: "fadeIn 0.2s ease both",
        }} className="mobile-drawer">
          {sections.map(s => (
            <button key={s.label} onClick={() => scrollTo(s.href)} style={{
              background: "none", border: "none", cursor: "pointer", textAlign: "left",
              padding: "16px 24px", fontSize: s.primary ? 16 : 15,
              fontWeight: s.primary ? 700 : 400,
              color: s.primary ? "var(--green)" : "var(--text-2)",
              borderBottom: "1px solid var(--border)",
              fontFamily: s.primary ? "var(--font-playfair)" : "inherit",
              width: "100%",
            }}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 680px) {
          .mobile-nav { display: flex !important; }
          .mobile-drawer { display: flex !important; }
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </>
  );
}
