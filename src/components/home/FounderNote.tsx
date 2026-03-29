"use client";
import { Reveal } from "./Reveal";

export function FounderNote() {
  return (
    <section style={{
      padding: "100px 40px",
      background: "var(--bg)",
      position: "relative",
    }}>
      <Reveal>
        <div style={{
          maxWidth: 640,
          margin: "0 auto",
        }}>
          {/* Label */}
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--green)",
            marginBottom: 20,
            textAlign: "center",
          }}>
            A note from the founders
          </p>

          {/* Letter container */}
          <div style={{
            padding: "52px 48px",
            background: "#FDFBF5",
            border: "1px solid #E8E2D4",
            borderRadius: 2,
            position: "relative",
          }}>
            {/* Opening */}
            <p style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: "clamp(1.1rem, 2vw, 1.3rem)",
              lineHeight: 2.1,
              color: "#2A2A28",
              textAlign: "left",
              marginBottom: 24,
              letterSpacing: "0.005em",
            }}>
              We&apos;re Dave and Amanda — the founders of Our Fable, and parents to a 9-month-old named Soren.
            </p>

            <p style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)",
              lineHeight: 2.1,
              color: "#3A3A38",
              textAlign: "left",
              marginBottom: 20,
              letterSpacing: "0.005em",
            }}>
              We built Our Fable because we realized something that scared us: the people who love Soren most — his grandparents, his aunts, his uncles, our closest friends — they all have stories about him, about us, about our family. And none of it was being captured. Not the voice memos. Not the funny moments. Not the things they&apos;d want him to know someday.
            </p>

            <p style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)",
              lineHeight: 2.1,
              color: "#3A3A38",
              textAlign: "left",
              marginBottom: 20,
              letterSpacing: "0.005em",
            }}>
              So we built something to fix that. Our Fable asks the people in your child&apos;s life one simple question a month. They answer however they want — a letter, a voice recording, a photo, a video. It all seals in a vault that your child opens when they&apos;re ready.
            </p>

            <p style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: "clamp(1rem, 1.9vw, 1.2rem)",
              lineHeight: 2.1,
              color: "#2A2A28",
              textAlign: "left",
              marginBottom: 0,
              letterSpacing: "0.005em",
            }}>
              We&apos;re not a big company. We&apos;re two parents who wanted this for our own kid and decided to build it for yours too. Every family on Our Fable matters to us personally. And we built it so your memories are always yours — encrypted, exportable, and portable — no matter what happens to us.
            </p>

            {/* Signature */}
            <div style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: "1px solid #E8E2D4",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}>
              <div>
                <p style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontStyle: "italic",
                  fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
                  fontWeight: 400,
                  color: "#2A2A28",
                  letterSpacing: "0.01em",
                  marginBottom: 4,
                }}>
                  Dave &amp; Amanda Sweeney
                </p>
                <p style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  color: "#9A9590",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>
                  Co-Founders, Our Fable · Minneapolis
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
