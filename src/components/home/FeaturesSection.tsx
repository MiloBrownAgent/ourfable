"use client";
import { Reveal } from "./Reveal";

const FEATURES = [
  { num: "01", title: "The Vault", body: "Every letter, photo, voice memo, and video — sealed until the milestone age you choose. Your child opens it at 13. At 18. At their wedding. Your child will hear voices that might otherwise be lost forever." },
  { num: "02", title: "Monthly Prompts", body: "On the 1st of every month, Our Fable sends a personalized prompt to every person in your circle. Grandma gets a different question than the family friend. They respond with text, a photo, or a voice memo. No app required." },
  { num: "03", title: "Dispatches", body: "Send photos, videos, voice memos, or updates to your whole circle — privately. No group chat. No social media. Just the people who matter. Our Fable+ only." },
  { num: "04", title: "World Snapshot", body: "One page per month of your child's life — the top headlines, the #1 song, the weather. By the time they turn 18, they'll have 216 of them." },
  { num: "05", title: "The Day They Were Born", body: "A permanent front page capturing everything happening in the world the day your child arrived — weather, headlines, music. Theirs forever." },
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

          <div style={{ borderTop: "1px solid var(--border)" }}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 40}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr",
                  gap: "0 40px",
                  padding: "36px 0",
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
                      fontSize: 21,
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
        }
      `}</style>
    </>
  );
}
