"use client";
import { Reveal } from "./Reveal";

const CORE_FEATURES = [
  { num: "01", title: "The Vault", body: "Every letter, photo, voice memo, and video — sealed until the milestone age you choose. Each child gets their own vault, managed from one dashboard. They open it at 13. At 18. At their wedding." },
  { num: "02", title: "Monthly Prompts", body: "On the 1st of every month, Our Fable sends a personalized prompt to every person in your circle. Grandma gets a different question than the family friend. They respond with text, a photo, a voice memo, or a video. No app required." },
  { num: "03", title: "The Circle", body: "Grandparents, aunts, uncles, godparents, family friends — everyone who loves your child gets invited. They each get their own prompts and their own way to contribute. The more people in the circle, the richer the vault." },
];

const SECONDARY_FEATURES = [
  { num: "04", title: "Dispatches", body: "Send photos, videos, voice memos, or updates to your whole circle — privately. No group chat. No social media. Just the people who matter." },
  { num: "05", title: "World Snapshot", body: "One page per month — the headlines, the #1 song, the weather. A time capsule of the world your child grew up in." },
  { num: "06", title: "The Day They Were Born", body: "A permanent front page capturing the world the day your child arrived. Theirs forever." },
];

export function FeaturesSection() {
  return (
    <>
      <section id="whats-inside" style={{ padding: "100px 40px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Reveal>
            <div style={{ marginBottom: 64, maxWidth: 560 }}>
              <p className="label label-green" style={{ marginBottom: 14 }}>What&apos;s inside</p>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                Everything your child<br />will want someday.
              </h2>
            </div>
          </Reveal>

          {/* Core features — prominent */}
          <div style={{ borderTop: "1px solid var(--border)" }}>
            {CORE_FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 40}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr",
                  gap: "0 40px",
                  padding: "40px 0",
                  borderBottom: "1px solid var(--border)",
                  alignItems: "start",
                }}>
                  <p style={{
                    fontFamily: "var(--font-body, Inter, sans-serif)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-4)",
                    letterSpacing: "0.1em",
                    paddingTop: 4,
                  }}>
                    {f.num}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "0 48px", alignItems: "start" }} className="feature-row-inner">
                    <h3 style={{
                      fontFamily: "var(--font-playfair)",
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.25,
                      color: "var(--text)",
                    }}>
                      {f.title}
                    </h3>
                    <p style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: "var(--text-2)",
                    }}>
                      {f.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Secondary features — smaller, more compact */}
          <div style={{ marginTop: 48 }}>
            <Reveal>
              <p style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-4)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}>
                Also included
              </p>
            </Reveal>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }} className="secondary-features-grid">
              {SECONDARY_FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 40}>
                  <div style={{
                    padding: "24px 20px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    height: "100%",
                  }}>
                    <p style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--text-4)",
                      letterSpacing: "0.1em",
                      marginBottom: 8,
                    }}>
                      {f.num}
                    </p>
                    <h3 style={{
                      fontFamily: "var(--font-playfair)",
                      fontSize: 17,
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: 8,
                      lineHeight: 1.3,
                    }}>
                      {f.title}
                    </h3>
                    <p style={{
                      fontSize: 13,
                      lineHeight: 1.7,
                      color: "var(--text-2)",
                    }}>
                      {f.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section style={{ padding: "80px 40px", maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", fontWeight: 600, lineHeight: 1.6, color: "var(--text)", marginBottom: 16 }}>
            When Grandma gets her invite, the subject line reads:{" "}
            <em style={{ color: "var(--green)" }}>&ldquo;Hi — it&apos;s me.&rdquo;</em>
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-2)" }}>
            She&apos;s not receiving a parent newsletter. She&apos;s receiving a letter from a child. Our Fable is built around the child. Parents are the setup. Everything else belongs to them.
          </p>
        </Reveal>
      </section>

      <style>{`
        @media (max-width: 640px) {
          .feature-row-inner {
            grid-template-columns: 1fr !important;
            gap: 10px 0 !important;
          }
          .secondary-features-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 641px) and (max-width: 860px) {
          .secondary-features-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
