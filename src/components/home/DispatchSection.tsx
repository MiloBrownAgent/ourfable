"use client";
import Link from "next/link";
import { Reveal } from "./Reveal";
import { Mic, Image as ImageIcon, Video, PenLine } from "lucide-react";

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
          {/* Section label */}
          <p className="label label-green" style={{ marginBottom: 16 }}>Dispatches</p>

          {/* Premium badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px",
              background: "#4A5E4C",
              borderRadius: 100,
              fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#fff",
            }}>
              ✦ Our Fable+
            </span>
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.16em",
              textTransform: "uppercase", color: "var(--text-3)",
              margin: 0,
            }}>
              Included only in Plus
            </p>
          </div>

          {/* Headline */}
          <h2 className="dispatch-h2" style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800, lineHeight: 1.1,
            letterSpacing: "-0.025em",
            color: "var(--text)",
            marginBottom: 16,
          }}>
            One update.<br />
            <em style={{ color: "#6B8F6E", fontStyle: "italic" }}>Everyone who matters.</em>
          </h2>

          {/* Subhead — what it is in one line */}
          <p style={{
            fontSize: 18, color: "#6B8F6E", fontWeight: 600,
            marginBottom: 36, lineHeight: 1.4,
          }}>
            Send a photo, voice memo, video, or note once. Our Fable+ privately delivers it to your child&apos;s circle.
          </p>

          {/* Body copy */}
          <div className="dispatch-body" style={{ fontSize: 17, lineHeight: 1.85, color: "var(--text-2)", maxWidth: 580 }}>
            <p style={{ marginBottom: 20 }}>
              Your mom wants photos. Your sister wants videos. Your best friend just wants to know how the baby&apos;s doing. And you&apos;re supposed to remember to send all of it, to all of them, while running on three hours of sleep.
            </p>
            <p style={{ marginBottom: 20, color: "var(--text)" }}>
              Not anymore.
            </p>
            <p style={{ marginBottom: 20 }}>
              Grandparents. Aunts. Uncles. Godparents. The college friend who&apos;s already obsessed. Everyone gets the update. Nobody gets forgotten.
            </p>
            <p style={{ marginBottom: 40, color: "var(--text)", fontStyle: "italic", fontFamily: "var(--font-playfair)", fontSize: 20, lineHeight: 1.6 }}>
              No group texts. No &ldquo;sorry I forgot to send you that.&rdquo; No guilt.<br />
              Just one moment, shared with everyone who cares.
            </p>
          </div>

          {/* Media type chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
            {[
              { label: "Voice memo", icon: <Mic size={14} strokeWidth={1.5} /> },
              { label: "Photo", icon: <ImageIcon size={14} strokeWidth={1.5} /> },
              { label: "Video", icon: <Video size={14} strokeWidth={1.5} /> },
              { label: "Written note", icon: <PenLine size={14} strokeWidth={1.5} /> },
            ].map(({ label, icon }) => (
              <span key={label} style={{
                padding: "8px 16px",
                background: "rgba(107,143,111,0.08)",
                border: "1px solid rgba(107,143,111,0.2)",
                borderRadius: 100,
                fontSize: 12, color: "var(--text-2)",
                fontWeight: 500,
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{icon} {label}</span>
              </span>
            ))}
          </div>

          {/* Premium upgrade callout — more prominent */}
          <div className="dispatch-tier" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 24,
            padding: "24px 28px",
            background: "#4A5E4C",
            borderRadius: 14,
          }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                Included only in Our Fable+
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: 0 }}>
                Dispatches to your full circle, plus everything in Our Fable.
              </p>
            </div>
            <Link href="/reserve" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              whiteSpace: "nowrap",
              padding: "11px 22px", borderRadius: 100,
              background: "#fff", color: "#4A5E4C",
              fontSize: 13, fontWeight: 700,
              textDecoration: "none", letterSpacing: "-0.01em",
              flexShrink: 0,
            }}>
              Reserve your spot
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
