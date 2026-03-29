"use client";
import { Reveal } from "./Reveal";

export function FounderNote() {
  return (
    <section style={{
      padding: "100px 40px",
      background: "linear-gradient(180deg, var(--bg-2) 0%, var(--bg) 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle background texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(200,168,122,0.06) 0%, transparent 60%)",
      }} />
      <Reveal>
        <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }}>
          {/* Gold divider */}
          <div style={{
            width: 60, height: 1,
            background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
            margin: "0 auto 48px",
          }} />

          {/* Pull quote — large Playfair italic */}
          <p style={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "clamp(1.25rem, 2.5vw, 1.65rem)",
            lineHeight: 1.85,
            color: "var(--text)",
            textAlign: "center",
            marginBottom: 40,
            letterSpacing: "-0.01em",
          }}>
            &ldquo;We built Our Fable as a gift for our son — and to fix something that&apos;s been broken about parenting for a long time. The people who love your child most are getting older. Their stories, their voices, their memories of who you were before you were a parent — none of that gets preserved automatically. We decided to build something that would.&rdquo;
          </p>

          {/* Bottom divider */}
          <div style={{
            width: 40, height: "0.5px",
            background: "rgba(200,168,122,0.4)",
            margin: "0 auto 28px",
          }} />

          {/* Signature block */}
          <div style={{ textAlign: "center" }}>
            <p style={{
              fontFamily: "var(--font-playfair)",
              fontStyle: "italic",
              fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
              fontWeight: 500,
              color: "var(--text)",
              letterSpacing: "0.01em",
              marginBottom: 6,
            }}>
              Amanda &amp; Dave Sweeney
            </p>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--text-3)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}>
              Minneapolis · Parents to a 9 month old son
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
