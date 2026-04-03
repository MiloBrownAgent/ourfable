"use client";
import { Reveal } from "./Reveal";
import { Counter } from "./Counter";

const STATS = [
  { value: 1, suffix: "", label: "Born Day front page capturing the day they arrived" },
  { value: 18, suffix: "", label: "Years of memories, sealed in the Vault" },
  { value: 10, suffix: "+", label: "People in their circle, each telling their story" },
];

export function StatsSection() {
  return (
    <section style={{ padding: "80px 40px", maxWidth: 860, margin: "0 auto" }}>
      <Reveal>
        <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: "36px 32px", textAlign: "center", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2.8rem, 5vw, 4rem)", fontWeight: 800, color: "var(--green)", lineHeight: 1, marginBottom: 8 }}>
                <Counter target={s.value} suffix={s.suffix} />
              </p>
              <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.5 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
