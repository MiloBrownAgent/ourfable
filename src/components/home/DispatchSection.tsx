"use client";
import Link from "next/link";
import { Reveal } from "./Reveal";

export function DispatchSection() {
  return (
    <section style={{
      padding: "100px 40px",
      background: "var(--bg-2)",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
    }}>
      <style>{`
        @media (max-width: 680px) {
          .dispatch-inner { padding: 0 !important; }
          .dispatch-h2 { font-size: 2rem !important; }
          .dispatch-body { font-size: 16px !important; }
          .dispatch-tier { flex-direction: column !important; gap: 16px !important; align-items: flex-start !important; }
        }
      `}</style>

      <div className="dispatch-inner" style={{ maxWidth: 680, margin: "0 auto" }}>
        <Reveal>
          {/* Label */}
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.16em",
            textTransform: "uppercase", color: "#6B8F6E",
            marginBottom: 24,
          }}>
            Dispatches
          </p>

          {/* Headline */}
          <h2 className="dispatch-h2" style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800, lineHeight: 1.1,
            letterSpacing: "-0.025em",
            color: "var(--text)",
            marginBottom: 40,
          }}>
            One update.<br />
            <em style={{ color: "#6B8F6E", fontStyle: "italic" }}>Everyone who matters.</em>
          </h2>

          {/* Body copy */}
          <div className="dispatch-body" style={{ fontSize: 18, lineHeight: 1.85, color: "var(--text-2)", maxWidth: 580 }}>
            <p style={{ marginBottom: 20 }}>
              Your mom wants photos. Your sister wants videos. Your best friend just wants to know how the baby's doing. And you're supposed to remember to send all of it, to all of them, while running on three hours of sleep.
            </p>
            <p style={{ marginBottom: 20, color: "var(--text)" }}>
              Not anymore.
            </p>
            <p style={{ marginBottom: 20 }}>
              Record a voice memo. Snap a photo. Shoot a quick video. Write a few lines. Then hit send — once — and Our Fable delivers it to every person in your child's circle.
            </p>
            <p style={{ marginBottom: 20 }}>
              Grandparents. Aunts. Uncles. Godparents. The college friend who's already obsessed. Everyone gets the update. Nobody gets forgotten.
            </p>
            <p style={{ marginBottom: 40, color: "var(--text)", fontStyle: "italic", fontFamily: "var(--font-playfair)", fontSize: 20, lineHeight: 1.6 }}>
              No group texts. No "sorry I forgot to send you that." No guilt.<br />
              Just one moment, shared with everyone who cares.
            </p>
          </div>

          {/* Tier callout */}
          <div className="dispatch-tier" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 24,
            padding: "20px 24px",
            background: "rgba(107,143,111,0.12)",
            border: "1px solid rgba(107,143,111,0.25)",
            borderRadius: 14,
            marginBottom: 40,
          }}>
            <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: "#6B8F6E" }}>Our Fable+</strong> — dispatch to your child's full circle, not just your inner ring.
            </p>
            <Link href="/reserve" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              whiteSpace: "nowrap",
              padding: "10px 20px", borderRadius: 100,
              background: "#4A5E4C", color: "#fff",
              fontSize: 13, fontWeight: 600,
              textDecoration: "none", letterSpacing: "-0.01em",
              flexShrink: 0,
            }}>
              Join the waitlist
            </Link>
          </div>

          {/* Media type chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["🎙 Voice memo", "📷 Photo", "🎥 Video", "✍️ Written note"].map(label => (
              <span key={label} style={{
                padding: "8px 16px",
                background: "rgba(107,143,111,0.08)",
                border: "1px solid rgba(107,143,111,0.2)",
                borderRadius: 100,
                fontSize: 12, color: "var(--text-2)",
                fontWeight: 500,
              }}>
                {label}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
