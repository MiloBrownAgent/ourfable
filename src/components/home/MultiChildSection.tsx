"use client";
import { Reveal } from "./Reveal";

export function MultiChildSection() {
  return (
    <section
      className="section-pad"
      style={{
        padding: "80px 40px",
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--green)",
              marginBottom: 16,
            }}
          >
            Multiple Children
          </p>
        </Reveal>

        <Reveal>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.2,
              marginBottom: 16,
            }}
          >
            Every child deserves their own story.
          </h2>
        </Reveal>

        <Reveal>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-2)",
              lineHeight: 1.8,
              maxWidth: 560,
              margin: "0 auto 40px",
            }}
          >
            One account. Separate vaults. Each child gets their own Fable —
            their own memories, their own circle, their own sealed collection
            of love from the people who matter most. No child left out.
          </p>
        </Reveal>

        <Reveal>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 20,
              flexWrap: "wrap",
              marginBottom: 40,
            }}
          >
            {["Emma", "Liam", "Nora"].map((name, i) => (
              <div
                key={name}
                style={{
                  width: 160,
                  padding: "28px 20px",
                  background: i === 0 ? "linear-gradient(160deg, #1C2B1E 0%, #142016 100%)" : "var(--surface)",
                  border: `1px solid ${i === 0 ? "rgba(200,168,122,0.3)" : "var(--border)"}`,
                  borderRadius: 16,
                  textAlign: "center",
                  transition: "all 300ms ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Vault icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: i === 0 ? "rgba(200,168,122,0.15)" : "var(--green-light)",
                    border: `1px solid ${i === 0 ? "rgba(200,168,122,0.25)" : "var(--green-border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    fontSize: 18,
                  }}
                >
                  🔒
                </div>

                <p
                  className="font-display"
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: i === 0 ? "#F5F2ED" : "var(--text)",
                    marginBottom: 4,
                  }}
                >
                  {name}&apos;s Fable
                </p>

                <p
                  style={{
                    fontSize: 11,
                    color: i === 0 ? "rgba(245,242,237,0.5)" : "var(--text-3)",
                  }}
                >
                  {i === 0 ? "47 entries · 2 years" : i === 1 ? "23 entries · 1 year" : "New · just started"}
                </p>

                {i === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      fontSize: 8,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: 100,
                      background: "rgba(200,168,122,0.2)",
                      color: "var(--gold)",
                      border: "0.5px solid rgba(200,168,122,0.3)",
                    }}
                  >
                    Active
                  </div>
                )}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 24px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 14,
              color: "var(--text-2)",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 600 }}>
              $7/mo
            </span>
            <span style={{ color: "var(--text-3)" }}>per additional child</span>
            <span style={{ width: 1, height: 16, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
              Same circle can contribute to all
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
