"use client";
import { useState } from "react";
import { Reveal } from "./Reveal";

const CIRCLE_NODES = [
  { id: "mom",          label: "Mom & Dad",     prompt: "Write them a letter for their wedding day. Tell them what love actually looks like.",        parent: true },
  { id: "grandma",      label: "Grandma",       prompt: "What do you want them to know about where this family came from?" },
  { id: "grandpa",      label: "Grandpa",       prompt: "Tell them a story about your own father. Something you've never said out loud." },
  { id: "godparent",    label: "Godparent",     prompt: "What do you hope they carry with them from this family?" },
  { id: "aunt",         label: "Aunt",          prompt: "What do you see in them that reminds you of their parent at that age?" },
  { id: "uncle",        label: "Uncle",         prompt: "Tell them something about their parent that they'd never tell themselves." },
  { id: "familyfriend", label: "Family friend",  prompt: "Tell them who their parent was before they became someone's parent." },
  { id: "neighbor",     label: "Neighbor",      prompt: "What was life like on this street when they were small?" },
  { id: "oldfriend",    label: "Old friend",    prompt: "Share a memory of their parent that made you proud to know them." },
];

export function CircleSection() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  return (
    <section style={{ padding: "100px 0", background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 40px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p className="label label-green" style={{ marginBottom: 14 }}>The circle</p>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 16, maxWidth: 620, margin: "0 auto 16px" }}>
              Everyone who loves them.<br />Each with a different story to tell.
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75, maxWidth: 500, margin: "0 auto" }}>
              Our Fable sends each person a prompt tailored to their relationship. Grandma gets a different question than the old family friend. Every voice is unique. Every story is irreplaceable.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {CIRCLE_NODES.map((node, i) => {
              const isActive = activeNode === node.id;
              return (
                <div key={node.id}>
                  {i > 0 && (
                    <div style={{ height: 1, background: "var(--border)", margin: "0" }} />
                  )}
                  <button
                    onClick={() => setActiveNode(isActive ? null : node.id)}
                    onMouseEnter={() => setActiveNode(node.id)}
                    onMouseLeave={() => setActiveNode(null)}
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "140px 1fr auto",
                      alignItems: "center",
                      gap: 24,
                      padding: "22px 8px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 180ms",
                    }}
                  >
                    {/* Role */}
                    <span style={{
                      fontFamily: "var(--font-playfair)",
                      fontStyle: "italic",
                      fontSize: 18,
                      fontWeight: node.parent ? 700 : 400,
                      color: isActive ? "var(--green)" : "var(--text)",
                      transition: "color 180ms",
                    }}>
                      {node.label}
                    </span>

                    {/* Prompt preview */}
                    <span style={{
                      fontSize: 14,
                      color: isActive ? "var(--text)" : "var(--text-3)",
                      lineHeight: 1.6,
                      fontStyle: "italic",
                      fontFamily: "var(--font-playfair)",
                      transition: "color 180ms",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      &ldquo;{node.prompt}&rdquo;
                    </span>

                    {/* Expand indicator */}
                    <span style={{
                      fontSize: 16,
                      color: isActive ? "var(--green)" : "var(--text-3)",
                      transition: "color 180ms, transform 180ms",
                      transform: isActive ? "rotate(45deg)" : "rotate(0deg)",
                      flexShrink: 0,
                    }}>
                      +
                    </span>
                  </button>

                  {/* Expanded prompt */}
                  {isActive && (
                    <div style={{
                      padding: "0 8px 22px",
                      animation: "fadeIn 0.15s ease both",
                    }}>
                      <div style={{
                        padding: "20px 24px",
                        background: "var(--green-light)",
                        border: "1px solid var(--green-border)",
                        borderRadius: 12,
                      }}>
                        <p style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "var(--green)",
                          marginBottom: 12,
                        }}>
                          Our Fable asks the {node.label.toLowerCase()}
                        </p>
                        <p style={{
                          fontFamily: "var(--font-playfair)",
                          fontStyle: "italic",
                          fontSize: 17,
                          color: "var(--text)",
                          lineHeight: 1.8,
                        }}>
                          &ldquo;{node.prompt}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ height: 1, background: "var(--border)" }} />
          </div>
        </Reveal>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .circle-row { grid-template-columns: 1fr !important; gap: 8px !important; }
        }
      `}</style>
    </section>
  );
}
