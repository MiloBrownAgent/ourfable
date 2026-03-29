"use client";
import { Shield, Download, Users, Clock } from "lucide-react";
import { Reveal } from "./Reveal";

const PILLARS = [
  {
    icon: Shield,
    title: "Encrypted with your key",
    body: "Vault content is encrypted with your family\u2019s unique key \u2014 we can\u2019t read it even if we wanted to. No ads. No data sharing. No one sees your vault but you.",
  },
  {
    icon: Download,
    title: "Always exportable",
    body: "Download everything — letters, photos, voice memos, videos — anytime, in standard formats you own forever.",
  },
  {
    icon: Users,
    title: "Vault guardians",
    body: "Assign trusted people who can access the vault if something happens to you. Your child's memories are never lost.",
  },
  {
    icon: Clock,
    title: "Built to last",
    body: "If Our Fable ever shuts down, you get 60 days notice plus a full export. But we're building this for 18 years, not 18 months.",
  },
];

export function TrustSection() {
  return (
    <section style={{
      padding: "80px 40px",
      background: "var(--bg)",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--green)",
              marginBottom: 14,
            }}>
              Private by design
            </p>
            <h2 style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              color: "var(--text)",
            }}>
              Built on trust. Designed to endure.
            </h2>
          </div>
        </Reveal>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}>
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 40}>
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 20,
                padding: "28px 0",
                borderBottom: i < PILLARS.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--green-light)",
                  border: "1px solid var(--green-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  <p.icon size={16} color="var(--green)" strokeWidth={2} />
                </div>
                <div>
                  <p style={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}>
                    {p.title}
                  </p>
                  <p style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "var(--text-2)",
                  }}>
                    {p.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
