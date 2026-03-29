"use client";
import { Reveal } from "./Reveal";

export function VaultOpeningSection() {
  return (
    <section style={{
      background: "#141412",
      padding: "120px 40px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(74,94,76,0.2) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <Reveal>
        <div style={{
          maxWidth: 680,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
        }}>
          <div style={{
            width: 48,
            height: 1,
            background: "rgba(201,169,110,0.4)",
            margin: "0 auto 48px",
          }} />

          <h2 style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(2rem, 4vw, 3.2rem)",
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            color: "#FFFFFF",
            marginBottom: 40,
          }}>
            Imagine the day<br />they open it.
          </h2>

          <div style={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "clamp(1.1rem, 2.2vw, 1.35rem)",
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.85)",
            maxWidth: 580,
            margin: "0 auto",
            textAlign: "left",
          }}>
            <p style={{ marginBottom: 24 }}>
              Your daughter turns 18. She opens her Fable.
            </p>
            <p style={{ marginBottom: 24 }}>
              There&apos;s a voice recording from her grandmother — recorded when she was 3 months old. A video from her uncle on her first birthday. A letter from you, written at 2am, about the night she said her first word.
            </p>
            <p style={{ marginBottom: 24 }}>
              Photos from people she barely remembers, with stories she&apos;s never heard.
            </p>
            <p style={{ marginBottom: 0 }}>
              She&apos;s laughing. She&apos;s crying. She&apos;s calling everyone.
            </p>
          </div>

          <div style={{
            width: 48,
            height: 1,
            background: "rgba(201,169,110,0.4)",
            margin: "48px auto 32px",
          }} />

          <p style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
            fontWeight: 700,
            color: "var(--gold)",
            letterSpacing: "-0.01em",
          }}>
            That&apos;s what you&apos;re building.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
