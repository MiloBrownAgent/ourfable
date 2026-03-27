"use client";
import { Reveal } from "./Reveal";

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
    excerpt: "She's not good with technology. She said so herself. But she called the number. She sang the lullaby her mother sang to her. In a language your child doesn't speak yet.",
    seal: "Sealed until age 13.",
    color: "var(--sage)",
  },
];

export function VignettesSection() {
  return (
    <>
      {/* ── EMOTIONAL VIGNETTES ── */}
      <section id="why-it-matters" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <p className="label label-green" style={{ marginBottom: 16 }}>Why it matters</p>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, maxWidth: 600, margin: "0 auto" }}>
              The people who love your child<br />won&apos;t always be here.
            </h2>
          </div>
        </Reveal>

        <div className="vignettes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {VIGNETTES.map((v, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="card" style={{ padding: "32px 28px", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 20, fontWeight: 400, color: "var(--text)", marginBottom: 3 }}>{v.who}</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)" }}>{v.age}</p>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.color, flexShrink: 0, marginTop: 6 }} />
                </div>
                <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 15, lineHeight: 1.85, color: "var(--text-2)", flex: 1 }}>
                  &ldquo;{v.excerpt}&rdquo;
                </p>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: v.color }}>{v.seal}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div style={{ marginTop: 56, padding: "32px 40px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 16, textAlign: "center", maxWidth: 680, margin: "56px auto 0" }}>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.2rem, 2.5vw, 1.7rem)", fontWeight: 700, color: "var(--text)", lineHeight: 1.45, marginBottom: 16 }}>
              You can&apos;t predict who will still be here when your child is 18.
            </p>
            <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75 }}>
              Our Fable doesn&apos;t wait. It asks now. Every month. So that when the time comes — no matter what has changed — the people who loved your child from the beginning are still speaking to them.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── THE LETTER MOMENT — dark, cinematic ── */}
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
    </>
  );
}
