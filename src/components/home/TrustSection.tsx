"use client";
import { Shield, Download, Users, Clock } from "lucide-react";
import { Reveal } from "./Reveal";

const PILLARS = [
  {
    icon: Shield,
    title: "Encrypted & private",
    body: "End-to-end encryption at rest and in transit. No ads. No data sharing. No one sees your vault but you.",
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
    body: "If Our Fable ever shuts down, you get 60 days notice plus a full export of everything. But we're building this for 18 years, not 18 months.",
  },
];

export function TrustSection() {
  return (
    <>
      <section style={{ padding: "100px 40px", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <p className="label label-green" style={{ marginBottom: 14 }}>Your vault is protected</p>
              <h2 style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
                maxWidth: 560,
                margin: "0 auto",
              }}>
                Built on trust,<br />designed to endure.
              </h2>
            </div>
          </Reveal>

          <div className="trust-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 32,
          }}>
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 60}>
                <div style={{
                  padding: "32px 24px",
                  borderRadius: 16,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  height: "100%",
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "var(--green-light)",
                    border: "1px solid var(--green-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}>
                    <p.icon size={18} color="var(--green)" strokeWidth={2} />
                  </div>
                  <h3 style={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 10,
                    lineHeight: 1.3,
                  }}>
                    {p.title}
                  </h3>
                  <p style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "var(--text-2)",
                  }}>
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .trust-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .trust-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </>
  );
}
