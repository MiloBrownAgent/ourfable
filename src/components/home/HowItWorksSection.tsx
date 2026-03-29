"use client";
import { Reveal } from "./Reveal";

const STEPS = [
  { n: "01", title: "Tell Our Fable about your children.", body: "Name, birthday, a family password — that's it. Five minutes per child. Each one gets their own Vault, their own circle, their own story. One dashboard to manage them all." },
  { n: "02", title: "Add the people who love them.", body: "Each person gets a unique link. The invitation comes from your child. No accounts. No apps. Same circle can contribute to every child's Fable." },
  { n: "03", title: "Our Fable asks every circle member, every month.", body: "Personal prompts go out automatically — different for each relationship. They respond with text, photo, voice, or video." },
  { n: "04", title: "Everything seals in the Vault.", body: "Each child's vault is separate and private. Time-locked. Some open at 13. Some at 18. Some on graduation day, or their wedding." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" style={{ padding: "120px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <Reveal>
        <div style={{ maxWidth: 640 }}>
          <p className="label label-green" style={{ marginBottom: 14 }}>How it works</p>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 48 }}>
            Set up in five minutes.<br />Runs for a lifetime.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 20, paddingBottom: 32, borderLeft: i < 3 ? "1.5px solid var(--border)" : "1.5px solid transparent", marginLeft: 16, paddingLeft: 28, position: "relative" }}>
                <div style={{ position: "absolute", left: -10, top: 0, width: 20, height: 20, borderRadius: "50%", background: i === 0 ? "var(--green)" : "var(--card)", border: `2px solid ${i === 0 ? "var(--green)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i === 0 && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase" }}>{step.n}</p>
                  <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--text)", lineHeight: 1.3 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.75 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
