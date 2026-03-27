"use client";
import Link from "next/link";

export function FooterSection() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 40px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <span style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700, color: "var(--green)" }}>Our Fable</span>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          <Link href="/reserve?gift=true" className="nav-link" style={{ fontSize: 13, padding: "12px 0" }}>Give as a gift</Link>
          <Link href="/faq" className="nav-link" style={{ fontSize: 13, padding: "12px 0" }}>FAQ</Link>
          <Link href="/journal" className="nav-link" style={{ fontSize: 13, padding: "12px 0" }}>Journal</Link>
          <Link href="/partners" className="nav-link" style={{ fontSize: 13, padding: "12px 0" }}>Partner with us</Link>
          <Link href="/privacy" className="nav-link" style={{ fontSize: 13, padding: "12px 0" }}>Privacy</Link>
          <Link href="/terms" className="nav-link" style={{ fontSize: 13, padding: "12px 0" }}>Terms</Link>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-4)" }}>© {new Date().getFullYear()} Our Fable, Inc. · Private by design.</p>
      </div>
    </footer>
  );
}
