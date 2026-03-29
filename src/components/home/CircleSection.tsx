"use client";
import { useState } from "react";
import { Reveal } from "./Reveal";
import { ChevronDown } from "lucide-react";

const CIRCLE_NODES = [
  { id: "mom",          label: "Mom & Dad",     emoji: "💛", prompt: "Write them a letter for their wedding day. Tell them what love actually looks like." },
  { id: "grandma",      label: "Grandma",       emoji: "🤍", prompt: "What do you want them to know about where this family came from?" },
  { id: "grandpa",      label: "Grandpa",       emoji: "🤍", prompt: "Tell them a story about your own father. Something you've never said out loud." },
  { id: "godparent",    label: "Godparent",     emoji: "✨", prompt: "What do you hope they carry with them from this family?" },
  { id: "aunt",         label: "Aunt",          emoji: "💜", prompt: "What do you see in them that reminds you of their parent at that age?" },
  { id: "uncle",        label: "Uncle",         emoji: "💙", prompt: "Tell them something about their parent that they'd never tell themselves." },
  { id: "familyfriend", label: "Family friend",  emoji: "🧡", prompt: "Tell them who their parent was before they became someone's parent." },
  { id: "neighbor",     label: "Neighbor",      emoji: "🏡", prompt: "What was life like on this street when they were small?" },
  { id: "oldfriend",    label: "Old friend",    emoji: "💚", prompt: "Share a memory of their parent that made you proud to know them." },
];

export function CircleSection() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  return (
    <section style={{ padding: "100px 0", background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "var(--green)", marginBottom: 14,
            }}>
              The circle
            </p>
            <h2 style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              marginBottom: 16,
            }}>
              Everyone who loves them.<br />Each with a different story.
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.75, maxWidth: 480, margin: "0 auto" }}>
              Our Fable sends each person a prompt tailored to their relationship. Every voice is unique. Every story is irreplaceable.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CIRCLE_NODES.map((node) => {
              const isActive = activeNode === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setActiveNode(isActive ? null : node.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    padding: 0,
                    background: isActive ? "var(--surface)" : "transparent",
                    border: isActive ? "1px solid var(--green-border)" : "1px solid var(--border)",
                    borderRadius: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 200ms ease",
                    overflow: "hidden",
                  }}
                >
                  {/* Row header */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    width: "100%",
                  }}>
                    {/* Emoji avatar */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: isActive ? "var(--green-light)" : "var(--surface)",
                      border: `1px solid ${isActive ? "var(--green-border)" : "var(--border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0,
                      transition: "all 200ms ease",
                    }}>
                      {node.emoji}
                    </div>

                    {/* Name + preview */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: "var(--font-playfair)",
                        fontSize: 16,
                        fontWeight: 700,
                        color: isActive ? "var(--green)" : "var(--text)",
                        transition: "color 200ms",
                        marginBottom: 2,
                      }}>
                        {node.label}
                      </p>
                      {!isActive && (
                        <p style={{
                          fontSize: 13,
                          color: "var(--text-3)",
                          fontStyle: "italic",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          &ldquo;{node.prompt.slice(0, 50)}...&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      color={isActive ? "var(--green)" : "var(--text-3)"}
                      style={{
                        transition: "transform 200ms, color 200ms",
                        transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                        flexShrink: 0,
                      }}
                    />
                  </div>

                  {/* Expanded prompt */}
                  {isActive && (
                    <div style={{
                      padding: "0 20px 20px",
                      animation: "fadeIn 0.2s ease both",
                    }}>
                      <div style={{
                        padding: "18px 22px",
                        background: "var(--green-light)",
                        border: "1px solid var(--green-border)",
                        borderRadius: 10,
                      }}>
                        <p style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "var(--green)",
                          marginBottom: 10,
                        }}>
                          Monthly prompt for {node.label.toLowerCase()}
                        </p>
                        <p style={{
                          fontFamily: "var(--font-playfair)",
                          fontStyle: "italic",
                          fontSize: 16,
                          color: "var(--text)",
                          lineHeight: 1.8,
                        }}>
                          &ldquo;{node.prompt}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
