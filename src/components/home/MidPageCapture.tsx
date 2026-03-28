"use client";
import Link from "next/link";
import { Reveal } from "./Reveal";

export function MidPageCapture() {
  return (
    <section style={{ padding: "80px 40px", maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
      <Reveal>
        {/* Gold rule above */}
        <div style={{ width: 60, height: 0.5, background: "var(--gold)", margin: "0 auto 32px" }} />

        <p
          className="font-display"
          style={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)",
            fontWeight: 500,
            color: "var(--text)",
            lineHeight: 1.5,
            marginBottom: 32,
          }}
        >
          Start preserving what matters.
        </p>

        <div style={{ maxWidth: 420, margin: "0 auto 16px" }}>
          <Link href="/reserve" className="btn-primary" style={{ display: "inline-flex", padding: "15px 32px", fontSize: 16, textDecoration: "none" }}>
            Reserve your spot →
          </Link>
        </div>

        <p style={{ fontSize: 11, color: "var(--sage)", marginBottom: 8, fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
          Free to reserve · No card required
        </p>
        <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 32, fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
          Private vault · Your data is never shared · Export anytime
        </p>

        {/* Gold rule below */}
        <div style={{ width: 60, height: 0.5, background: "var(--gold)", margin: "0 auto" }} />
      </Reveal>
    </section>
  );
}
