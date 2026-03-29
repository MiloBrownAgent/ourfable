"use client";
import { Reveal } from "./Reveal";

export function FounderNote() {
  return (
    <section style={{
      padding: "100px 40px",
      background: "var(--bg)",
      position: "relative",
    }}>
      <Reveal>
        <div style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "56px 48px",
          background: "#FDFBF5",
          border: "1px solid #E8E2D4",
          borderRadius: 2,
          position: "relative",
        }}>
          {/* Subtle corner ornament feel */}
          <div style={{
            position: "absolute",
            top: 20,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 10,
            letterSpacing: "0.5em",
            color: "#C8A87A",
            opacity: 0.5,
          }}>
            ✦
          </div>

          {/* Letter body */}
          <p style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
            lineHeight: 2.1,
            color: "#2A2A28",
            textAlign: "left",
            marginBottom: 0,
            letterSpacing: "0.005em",
          }}>
            We built Our Fable as a gift for our son — and to fix something that&apos;s been broken about parenting for a long time. The people who love your child most are getting older. Their stories, their voices, their memories of who you were before you were a parent — none of that gets preserved automatically. We decided to build something that would.
          </p>

          {/* Signature */}
          <div style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid #E8E2D4",
          }}>
            <p style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
              fontWeight: 400,
              color: "#2A2A28",
              letterSpacing: "0.01em",
              marginBottom: 6,
            }}>
              Amanda &amp; Dave Sweeney
            </p>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "#9A9590",
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
