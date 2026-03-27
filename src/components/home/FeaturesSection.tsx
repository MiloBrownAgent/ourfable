"use client";
import { Lock, Users, Send, BookOpen, Star } from "lucide-react";
import { Reveal } from "./Reveal";

const FEATURES = [
  { icon: Lock, title: "The Vault", body: "Every letter, photo, voice memo, and video — sealed until the milestone age you choose. Your child opens it at 13. At 18. At their wedding. Your child will hear voices that might otherwise be lost forever." },
  { icon: Users, title: "Monthly Prompts", body: "On the 1st of every month, Our Fable sends a personalized prompt to every person in your circle. Grandma gets a different question than the family friend. They respond with text, a photo, or a voice memo. No app required." },
  { icon: Send, title: "Dispatches", body: "Send photos, videos, voice memos, or updates to your whole circle — privately. No group chat. No social media. Just the people who matter. Our Fable+ only." },
  { icon: BookOpen, title: "World Snapshot", body: "One page per month of your child's life — the top headlines, the #1 song, the weather. By the time they turn 18, they'll have 216 of them." },
  { icon: Star, title: "Day They Were Born", body: "A permanent front page capturing everything happening in the world the day your child arrived — weather, headlines, music. Theirs forever." },
];

export function FeaturesSection() {
  return (
    <>
      <section id="whats-inside" style={{ padding: "100px 40px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <div style={{ marginBottom: 56, maxWidth: 560 }}>
              <p className="label label-green" style={{ marginBottom: 14 }}>What&apos;s inside</p>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                Everything your child<br />will want someday.
              </h2>
            </div>
          </Reveal>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={i * 50}>
                  <div className="card" style={{ padding: "28px 26px", height: "100%", transition: "transform 200ms, box-shadow 200ms" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--green-light)", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                      <Icon size={20} color="var(--green)" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 10, lineHeight: 1.3 }}>{f.title}</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-2)" }}>{f.body}</p>
                  </div>
                </Reveal>
              );
            })}
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
    </>
  );
}
