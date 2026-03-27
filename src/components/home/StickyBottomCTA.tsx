"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export function StickyBottomCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => {
      const hero = document.getElementById("waitlist");
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      // Show when the hero CTA is scrolled out of view
      setVisible(rect.bottom < 0);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      className="sticky-bottom-cta"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(253,251,247,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "0.5px solid var(--border)",
        padding: "12px 16px",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 300ms ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <Link href="/reserve" className="btn-primary" style={{ display: "inline-flex", width: "100%", justifyContent: "center", padding: "12px 22px", fontSize: 15, textDecoration: "none" }}>
          Reserve your spot →
        </Link>
        <p style={{ marginTop: 6, fontSize: 11, color: "var(--text-3)", textAlign: "center", fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
          Free to reserve · No card required
        </p>
      </div>
    </div>
  );
}
