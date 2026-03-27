"use client";
import { Reveal } from "./Reveal";

export function LetterMomentSection() {
  return (
    <section className="dark-section" style={{ background: "#141412", padding: "120px 40px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(74,94,76,0.25) 0%, transparent 65%)", pointerEvents: "none" }} />
      <Reveal>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{ width: 48, height: 1, background: "rgba(201,169,110,0.4)", margin: "0 auto 40px" }} />
          <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontWeight: 500, fontSize: "clamp(1.25rem, 3vw, 2.4rem)", lineHeight: 1.6, color: "#FFFFFF", marginBottom: 32 }}>
            &ldquo;Imagine your child at 18, opening a voice memo from their great-grandmother — recorded when they were 9 months old.
            <br /><br />
            Their great-grandmother, who is no longer alive.
            <br /><br />
            Telling them how she wants to be remembered.&rdquo;
          </p>
          <div style={{ width: 48, height: 1, background: "rgba(201,169,110,0.4)", margin: "0 auto 32px" }} />
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 500, margin: "0 auto" }}>
            Our Fable makes this happen because once a month, it asked. She answered. Her voice is in the Vault — sealed, waiting.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

const VIGNETTES = [
  {
    who: "Grandpa",
    age: "84 years old",
    excerpt: "He forgets things now. Some days are harder than others. But last Tuesday, he called the Our Fable number and talked for eleven minutes — about the farm he grew up on, about his own father, about what he hopes for the baby he's only met twice.",
    seal: "Sealed until age 18.",
    color: "var(--gold)",
  },
  {
    who: "Great-Aunt Carol",
    age: "She passed last spring",
    excerpt: "She submitted three voice memos before she died. None of them knew it would be the last time they'd hear her voice. Our Fable did. It was waiting.",
    seal: "Her voice is still there.",
    color: "var(--sage)",
  },
  {
    who: "Your best friend from college",
    age: "Knew you before any of this",
    excerpt: "She knew you when you were 22 and had no idea what you were doing. She wrote about who you were before you became someone's parent — things your child will never be able to find out any other way.",
    seal: "Sealed until graduation.",
    color: "var(--gold)",
  },
  {
    who: "Grandma",
    age: "Lives two states away",
    excerpt: "She's not good with technology. She said so herself. But she clicked the link, hit record, and sang the lullaby her mother sang to her. In a language your child doesn't speak yet.",
    seal: "Sealed until age 13.",
    color: "var(--sage)",
  },
];

export function VignettesSection() {
  return (
    <>
      <section id="why-it-matters" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <p className="label label-green" style={{ marginBottom: 16 }}>Why it matters</p>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, maxWidth: 600, margin: "0 auto" }}>
              The people who love your child<br />won&apos;t always be here.
            </h2>
          </div>
        </Reveal>

        {/* 4 pillars with single line dividers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderTop: "1px solid var(--border)",
        }} className="vignettes-pillars">
          {VIGNETTES.map((v, i) => (
            <Reveal key={i} delay={i * 80}>
              <div style={{
                padding: "48px 36px 48px 0",
                borderRight: i < VIGNETTES.length - 1 ? "1px solid var(--border)" : "none",
                paddingRight: i < VIGNETTES.length - 1 ? 36 : 0,
                paddingLeft: i > 0 ? 36 : 0,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                height: "100%",
              }}>
                <div>
                  <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4, lineHeight: 1.2 }}>{v.who}</p>
                  <p style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em" }}>{v.age}</p>
                </div>
                <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 15, lineHeight: 1.9, color: "var(--text-2)", flex: 1 }}>
                  &ldquo;{v.excerpt}&rdquo;
                </p>
                <p style={{ fontSize: 11, fontWeight: 700, color: v.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{v.seal}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .vignettes-pillars {
            grid-template-columns: 1fr !important;
          }
          .vignettes-pillars > div > div {
            border-right: none !important;
            border-bottom: 1px solid var(--border);
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .vignettes-pillars > div:last-child > div {
            border-bottom: none !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .vignettes-pillars {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .vignettes-pillars > div:nth-child(2) > div {
            border-right: none !important;
          }
          .vignettes-pillars > div:nth-child(3) > div {
            border-top: 1px solid var(--border);
          }
          .vignettes-pillars > div:nth-child(4) > div {
            border-top: 1px solid var(--border);
            border-right: none !important;
          }
        }
      `}</style>
    </>
  );
}

export function VideoMomentSection() {
  return (
    <section style={{ padding: "120px 40px", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
      <Reveal>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ width: 40, height: 1, background: "var(--gold-border)", marginBottom: 48 }} />

          <p style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(1.75rem, 4vw, 3rem)",
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            color: "var(--text)",
            marginBottom: 40,
          }}>
            What would you give to have a video of your grandmother — just talking to you?
          </p>

          <p style={{
            fontSize: 18,
            lineHeight: 1.9,
            color: "var(--text-2)",
            marginBottom: 28,
            maxWidth: 580,
          }}>
            Not a photo. Not a memory someone else told you. A video. Her, looking at the camera, saying your name. Telling you what she hoped for you. Laughing the way she laughed.
          </p>

          <p style={{
            fontSize: 18,
            lineHeight: 1.9,
            color: "var(--text-2)",
            marginBottom: 48,
            maxWidth: 580,
          }}>
            Your child could have that. From you. From their grandparents. From everyone who loves them right now — while they&apos;re still here, while the light is still good, while there&apos;s still time.
          </p>

          <div style={{
            borderLeft: "2px solid var(--gold)",
            paddingLeft: 28,
          }}>
            <p style={{
              fontFamily: "var(--font-playfair)",
              fontStyle: "italic",
              fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
              lineHeight: 1.7,
              color: "var(--text)",
              marginBottom: 12,
            }}>
              &ldquo;Every person in your child&apos;s circle can record a video message directly into the Vault. No app. No login. Just a link in their email and a button that says record.&rdquo;
            </p>
            <p style={{
              fontSize: 13,
              color: "var(--text-3)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}>
              Sealed until your child is ready to watch.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

