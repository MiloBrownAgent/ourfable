"use client";
import { Reveal } from "./Reveal";

export function MultiChildSection() {
  return (
    <section
      className="section-pad dark-section"
      style={{
        padding: "100px 40px",
        background: "linear-gradient(160deg, #1C2B1E 0%, #142016 100%)",
        color: "#F5F2ED",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Reveal>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--gold)",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            Built for families
          </p>
        </Reveal>

        <Reveal>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(1.8rem, 4.5vw, 2.8rem)",
              fontWeight: 700,
              color: "#F5F2ED",
              lineHeight: 1.15,
              marginBottom: 16,
              textAlign: "center",
              letterSpacing: "-0.02em",
            }}
          >
            One dashboard.<br />Every child gets their own story.
          </h2>
        </Reveal>

        <Reveal>
          <p
            style={{
              fontSize: 16,
              color: "rgba(245,242,237,0.65)",
              lineHeight: 1.8,
              maxWidth: 580,
              margin: "0 auto 48px",
              textAlign: "center",
            }}
          >
            Each child&apos;s vault is completely separate — their own memories, their own
            circle, their own sealed collection. Your circle members contribute to
            every child without extra work. Manage it all from one place.
          </p>
        </Reveal>

        <Reveal>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 48,
            }}
          >
            {[
              { name: "Emma", entries: 47, span: "2 years", active: true },
              { name: "Liam", entries: 23, span: "1 year", active: false },
              { name: "Nora", entries: 4, span: "just started", active: false },
            ].map((child) => (
              <div
                key={child.name}
                style={{
                  width: 180,
                  padding: "32px 24px",
                  background: child.active
                    ? "rgba(200,168,122,0.08)"
                    : "rgba(245,242,237,0.04)",
                  border: `1px solid ${child.active ? "rgba(200,168,122,0.25)" : "rgba(245,242,237,0.08)"}`,
                  borderRadius: 16,
                  textAlign: "center",
                  transition: "all 300ms ease",
                  position: "relative",
                }}
              >
                {/* Vault lock */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: child.active
                      ? "rgba(200,168,122,0.12)"
                      : "rgba(245,242,237,0.06)",
                    border: `1px solid ${child.active ? "rgba(200,168,122,0.2)" : "rgba(245,242,237,0.1)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                    fontSize: 20,
                  }}
                >
                  🔒
                </div>

                <p
                  className="font-display"
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#F5F2ED",
                    marginBottom: 6,
                  }}
                >
                  {child.name}
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(245,242,237,0.45)",
                    lineHeight: 1.5,
                  }}
                >
                  {child.entries} entries · {child.span}
                </p>

                {child.active && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "3px 10px",
                      borderRadius: 100,
                      background: "rgba(200,168,122,0.15)",
                      color: "var(--gold)",
                      border: "0.5px solid rgba(200,168,122,0.25)",
                    }}
                  >
                    Viewing
                  </div>
                )}
              </div>
            ))}
          </div>
        </Reveal>

        {/* Dashboard mockup hint */}
        <Reveal>
          <div
            style={{
              maxWidth: 520,
              margin: "0 auto",
              padding: "24px 28px",
              background: "rgba(245,242,237,0.04)",
              border: "1px solid rgba(245,242,237,0.08)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#F5F2ED",
                  marginBottom: 4,
                }}
              >
                Add any child for $7/mo
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(245,242,237,0.5)",
                  lineHeight: 1.5,
                }}
              >
                Same circle. Same account. Separate vaults.
                <br />
                No child left out.
              </p>
            </div>
            <a
              href="/reserve"
              className="btn-gold"
              style={{
                padding: "10px 22px",
                fontSize: 13,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              Get started →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
