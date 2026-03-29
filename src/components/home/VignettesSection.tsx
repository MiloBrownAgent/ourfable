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
            &ldquo;Your daughter turns 13 and opens a letter from her aunt — written when she was six weeks old.
            <br /><br />
            It&apos;s about the first time she held her. How tiny her fingers were. How she smelled like milk and laundry detergent.
            <br /><br />
            She reads it three times.&rdquo;
          </p>
          <div style={{ width: 48, height: 1, background: "rgba(201,169,110,0.4)", margin: "0 auto 32px" }} />
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 500, margin: "0 auto" }}>
            That letter exists because once a month, Our Fable asked. Her aunt answered. And it waited — sealed in the vault — for the right moment.
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
    excerpt: "Last Tuesday, he recorded a video message — eleven minutes about the farm he grew up on, about his own father, about what he hopes for the baby he's only met twice. He laughed so hard telling the tractor story he had to start over.",
    seal: "Sealed until age 18.",
    color: "var(--gold)",
  },
  {
    who: "Uncle Mike",
    age: "Lives for the group chat",
    excerpt: "He sent a video of himself doing the worst impression of your child's laugh — then got serious for thirty seconds and said something so genuine it made you cry. Classic Mike.",
    seal: "Sealed until age 13.",
    color: "var(--sage)",
  },
  {
    who: "Your best friend from college",
    age: "Knew you before any of this",
    excerpt: "She wrote about the road trip where you got lost in New Mexico and slept in the car. About the version of you that existed before parenthood. Things your child would never hear otherwise.",
    seal: "Sealed until graduation.",
    color: "var(--gold)",
  },
  {
    who: "Grandma",
    age: "Lives two states away",
    excerpt: "She's not good with technology. She said so herself. But she clicked the link, hit record, and sang the lullaby her mother sang to her. Three generations of the same melody, now in the vault.",
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
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, maxWidth: 600, margin: "0 auto 20px" }}>
              Every person in your child&apos;s life<br />sees them differently.
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.8, maxWidth: 520, margin: "0 auto" }}>
              Grandpa tells the farm stories. Your college roommate remembers who you were at 22. Uncle Mike makes everyone laugh. Grandma sings. Our Fable collects all of it — every perspective, every voice, every version of the truth.
            </p>
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
            A photo captures a face.<br />A video captures a person.
          </p>

          <p style={{
            fontSize: 18,
            lineHeight: 1.9,
            color: "var(--text-2)",
            marginBottom: 28,
            maxWidth: 580,
          }}>
            Grandma looking at the camera, saying your child&apos;s name. The way she laughs. The way she tilts her head when she&apos;s thinking about what to say next. The pause before she says &ldquo;I love you.&rdquo;
          </p>

          <p style={{
            fontSize: 18,
            lineHeight: 1.9,
            color: "var(--text-2)",
            marginBottom: 28,
            maxWidth: 580,
          }}>
            Uncle Mike doing his terrible impression. Dad reading a bedtime story at midnight, half-asleep, making up the ending. Your neighbor telling the story of the day you moved in.
          </p>

          <p style={{
            fontSize: 18,
            lineHeight: 1.9,
            color: "var(--text-2)",
            marginBottom: 48,
            maxWidth: 580,
          }}>
            These aren&apos;t just memories. They&apos;re people — being exactly who they are, preserved exactly as they were.
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
              &ldquo;No app. No login. Just a link in their email and a button that says record. Anyone in the circle can leave a video message for the vault.&rdquo;
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
