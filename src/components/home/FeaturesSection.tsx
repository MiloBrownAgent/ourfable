"use client";
import Link from "next/link";
import { Reveal } from "./Reveal";

interface CoreFeature {
  num: string;
  title: string;
  body: string;
  plus?: boolean;
}

const CORE_FEATURES: CoreFeature[] = [
  { num: "01", title: "The Vault", body: "Every letter, photo, voice memo, and video — sealed until the milestone age you choose. Each child gets their own vault, managed from one dashboard. They open it at 13. At 18. At their wedding." },
  { num: "02", title: "Monthly Prompts", body: "On the 1st of every month, Our Fable sends a personalized prompt to every person in your circle. Grandma gets a different question than the family friend. They respond with text, a photo, a voice memo, or a video. No app required." },
  { num: "03", title: "The Circle", body: "Grandparents, aunts, uncles, godparents, family friends — everyone who loves your child gets invited. They each get their own prompts and their own way to contribute. The more people in the circle, the richer the vault." },
  { num: "04", title: "Dispatches", body: "Private family updates to your whole circle. Send one photo, video, voice memo, or note without a group chat. Included only in Our Fable+.", plus: true },
];



export function FeaturesSection() {
  return (
    <>
      <section id="whats-inside" style={{ padding: "100px 40px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Reveal>
            <div style={{ marginBottom: 64, maxWidth: 560 }}>
              <p className="label label-green" style={{ marginBottom: 14 }}>What&apos;s inside</p>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 16 }}>
                Everything your child<br />will want someday.
              </h2>
              <Link href="/demo" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 500, color: "var(--green)",
                textDecoration: "none", borderBottom: "1px solid var(--green-border)",
                paddingBottom: 2,
              }}>
                Try the interactive demo →
              </Link>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
                      {f.plus && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "3px 10px",
                          borderRadius: 100,
                          background: "var(--gold-dim)",
                          color: "var(--gold)",
                          border: "0.5px solid var(--gold-border)",
                          whiteSpace: "nowrap",
                        }}>
                          ✦ Our Fable+
                        </span>
                      )}
                    </div>
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

          {/* Born day note — inline, not a card */}
          <Reveal delay={160}>
            <p style={{
              marginTop: 32,
              fontSize: 14,
              fontStyle: "italic",
              color: "var(--text-3)",
              lineHeight: 1.7,
              paddingLeft: 48,
            }}>
              Included in every plan: the vault automatically captures the world the day your child arrived — weather, headlines, the #1 song.
            </p>
          </Reveal>
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
