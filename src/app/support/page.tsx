import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — Our Fable",
  description: "Get in touch with the Our Fable team. We're here to help.",
};

export default function SupportPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        {/* Logo */}
        <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", letterSpacing: "-0.01em", marginBottom: 48 }}>Our Fable</p>

        {/* Icon */}
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green-light)", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", fontSize: 24 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 5vw, 2.75rem)", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: 16 }}>
          We&rsquo;re here to help.
        </h1>

        <p style={{ fontSize: 16, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 40, maxWidth: 440, margin: "0 auto 40px" }}>
          Whether you have a question about your vault, need help with your account, or just want to say hello &mdash; we&rsquo;d love to hear from you.
        </p>

        {/* CTA */}
        <a
          href="mailto:hello@ourfable.ai"
          style={{
            display: "inline-block",
            padding: "16px 36px",
            borderRadius: 100,
            background: "var(--green)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            letterSpacing: "-0.01em",
            transition: "opacity 160ms",
          }}
        >
          Get in touch &rarr;
        </a>

        <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-3)" }}>
          hello@ourfable.ai
        </p>

        {/* Response time */}
        <div style={{ marginTop: 48, padding: "20px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
            We typically respond within a few hours. If it&rsquo;s urgent, include &ldquo;urgent&rdquo; in your subject line.
          </p>
        </div>

        {/* Links */}
        <div style={{ marginTop: 32, display: "flex", gap: 24, justifyContent: "center" }}>
          <a href="/faq" style={{ color: "var(--green)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>FAQ</a>
          <a href="/privacy" style={{ color: "var(--green)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Privacy</a>
          <a href="/terms" style={{ color: "var(--green)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Terms</a>
          <a href="/" style={{ color: "var(--green)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Home</a>
        </div>
      </div>
    </div>
  );
}
