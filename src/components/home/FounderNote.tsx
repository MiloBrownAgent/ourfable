"use client";
import { Reveal } from "./Reveal";

export function FounderNote() {
  return (
    <section style={{ padding: "80px 40px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <Reveal>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 52px", background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 20, boxShadow: "var(--shadow-sm)", textAlign: "center" }}>
          <div style={{ width: 40, height: 1, background: "var(--gold)", margin: "0 auto 28px" }} />
          <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: "clamp(1.15rem, 2.2vw, 1.45rem)", lineHeight: 1.8, color: "var(--text)", marginBottom: 24 }}>
            &ldquo;We built Our Fable as a gift for our son — and to fix something that&apos;s been broken about parenting for a long time. The people who love your child most are getting older. Their stories, their voices, their memories of who you were before you were a parent — none of that gets preserved automatically. We decided to build something that would.&rdquo;
          </p>
          <div style={{ width: 32, height: 1, background: "var(--border)", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 14, color: "var(--text-2)", letterSpacing: "0.04em", fontWeight: 500 }}>Dave &amp; Amanda · Minneapolis</p>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Parents to a 9 month old son</p>
        </div>
      </Reveal>
    </section>
  );
}
