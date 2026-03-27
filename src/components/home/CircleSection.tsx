"use client";
import { useEffect, useState } from "react";
import { Reveal } from "./Reveal";
import { CHILD_NAMES } from "./AnimatedHeadline";

const CX = 500, CY = 350, W = 1000, H = 700;

const CIRCLE_NODES = [
  { id: "mom",          label: "Mom",           prompt: "Write them a letter for their wedding day. Tell them what love actually looks like.",        x: CX - 155, y: CY - 20,  nodeR: 56, parent: true },
  { id: "dad",          label: "Dad",           prompt: "What do you want them to know about the day they were born? Every detail you remember.",     x: CX + 155, y: CY - 20,  nodeR: 52, parent: true },
  { id: "grandma",      label: "Grandma",       prompt: "What do you want them to know about where this family came from?",                           x: CX + 330, y: CY - 160, nodeR: 44 },
  { id: "grandpa",      label: "Grandpa",       prompt: "Tell them a story about your own father. Something you've never said out loud.",             x: CX + 360, y: CY + 90,  nodeR: 40 },
  { id: "godparent",    label: "Godparent",     prompt: "What do you hope they carry with them from this family?",                                    x: CX - 330, y: CY - 155, nodeR: 42 },
  { id: "aunt",         label: "Aunt",          prompt: "What do you see in them that reminds you of their parent at that age?",                      x: CX + 200, y: CY - 280, nodeR: 34 },
  { id: "uncle",        label: "Uncle",         prompt: "Tell them something about their parent that they'd never tell themselves.",                   x: CX - 200, y: CY + 230, nodeR: 36 },
  { id: "familyfriend", label: "Family friend", prompt: "Tell them who their parent was before they became someone's parent.",                         x: CX + 60,  y: CY + 280, nodeR: 32 },
  { id: "neighbor",     label: "Neighbor",      prompt: "What was life like on this street when they were small?",                                    x: CX - 370, y: CY + 100, nodeR: 30 },
  { id: "oldfriend",    label: "Old friend",    prompt: "Share a memory of their parent that made you proud to know them.",                           x: CX - 90,  y: CY - 280, nodeR: 30 },
];

function CircleMobile() {
  const [active, setActive] = useState(0);
  const nodes = CIRCLE_NODES;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", WebkitOverflowScrolling: "touch", marginBottom: 20 }}>
        {nodes.map((n, i) => (
          <button key={n.id} onClick={() => setActive(i)} style={{
            flexShrink: 0, padding: "8px 16px", borderRadius: 100, border: "1.5px solid",
            borderColor: active === i ? "var(--green)" : "var(--border)",
            background: active === i ? "var(--green)" : "var(--card)",
            color: active === i ? "#fff" : "var(--text-2)",
            fontSize: 13, fontWeight: active === i ? 700 : 400,
            fontFamily: "var(--font-playfair)", fontStyle: "italic",
            cursor: "pointer", transition: "all 0.2s",
          }}>
            {n.label}
          </button>
        ))}
      </div>

      <div key={active} style={{
        padding: "24px 24px", background: "var(--card)",
        border: "1.5px solid var(--green-border)", borderRadius: 16,
        animation: "fadeIn 0.2s ease both",
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", marginBottom: 12 }}>
          Our Fable asks the {nodes[active].label.toLowerCase()}
        </p>
        <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 17, color: "var(--text)", lineHeight: 1.8 }}>
          &ldquo;{nodes[active].prompt}&rdquo;
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
        {nodes.map((_, i) => (
          <div key={i} onClick={() => setActive(i)} style={{
            width: active === i ? 20 : 6, height: 6, borderRadius: 3,
            background: active === i ? "var(--green)" : "var(--border)",
            cursor: "pointer", transition: "all 0.25s",
          }} />
        ))}
      </div>
    </div>
  );
}

export function CircleSection() {
  const [nameIndex, setNameIndex] = useState(0);
  const [nameVisible, setNameVisible] = useState(true);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const centerR = 76;

  useEffect(() => {
    const interval = setInterval(() => {
      setNameVisible(false);
      setTimeout(() => {
        setNameIndex(i => (i + 1) % CHILD_NAMES.length);
        setNameVisible(true);
      }, 350);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const activeNodeData = CIRCLE_NODES.find(n => n.id === activeNode);

  return (
    <section style={{ padding: "100px 0", background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 40px" }}>
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

        <div className="circle-mobile" style={{ display: "none", padding: "0 20px" }}>
          <CircleMobile />
        </div>

        <Reveal delay={100}>
          <div className="circle-desktop" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
            <div className="circle-svg-wrap" style={{ width: "100%", maxWidth: 1100 }}>
              <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Interactive circle diagram showing your child at the center surrounded by family members and friends, each with a unique prompt" style={{ width: "100%", height: "auto", overflow: "visible", minWidth: 340 }}>
                <defs aria-hidden="true">
                  <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4A5E4C" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#4A5E4C" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {CIRCLE_NODES.map(node => {
                  const isActive = activeNode === node.id;
                  const isParent = node.parent;
                  const dx = node.x - CX, dy = node.y - CY;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const ux = dx / dist, uy = dy / dist;
                  const x1 = CX + ux * centerR, y1 = CY + uy * centerR;
                  const x2 = node.x - ux * node.nodeR, y2 = node.y - uy * node.nodeR;
                  return (
                    <line key={node.id + "-line"}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={isActive ? "#4A5E4C" : isParent ? "rgba(74,94,76,0.3)" : "var(--border)"}
                      strokeWidth={isActive ? 2.5 : isParent ? 2 : 1.5}
                      strokeDasharray={isActive || isParent ? "none" : "5 6"}
                      strokeOpacity={isActive ? 1 : 0.8}
                      style={{ transition: "all 0.35s ease" }}
                    />
                  );
                })}

                <circle cx={CX} cy={CY} r={centerR + 40} fill="url(#centerGlow)" />
                <circle cx={CX} cy={CY} r={centerR + 4} fill="none" stroke="#4A5E4C" strokeWidth={1} strokeOpacity={0.15} />
                <circle cx={CX} cy={CY} r={centerR} fill="#4A5E4C" />

                <text x={CX} y={CY - 8} textAnchor="middle" fontFamily="Georgia, serif" fontSize={26} fontWeight={700} fill="#ffffff"
                  style={{ opacity: nameVisible ? 1 : 0, transition: "opacity 0.35s ease" }}>
                  {CHILD_NAMES[nameIndex]}
                </text>
                <text x={CX} y={CY + 14} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={9} fill="rgba(255,255,255,0.5)" letterSpacing={2.5}>
                  YOUR CHILD
                </text>

                {CIRCLE_NODES.map(node => {
                  const isActive = activeNode === node.id;
                  const isParent = node.parent;

                  return (
                    <g key={node.id} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={`${node.label}: ${node.prompt}`}
                      onMouseEnter={() => setActiveNode(node.id)}
                      onMouseLeave={() => setActiveNode(null)}
                      onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveNode(activeNode === node.id ? null : node.id); } }}
                      onFocus={() => setActiveNode(node.id)}
                      onBlur={() => setActiveNode(null)}
                    >
                      {isActive && <circle cx={node.x} cy={node.y} r={node.nodeR + 12} fill="#4A5E4C" fillOpacity={0.1} />}

                      <circle cx={node.x} cy={node.y} r={node.nodeR}
                        fill={isActive ? "#4A5E4C" : isParent ? "var(--green-light)" : "var(--card)"}
                        stroke={isActive ? "#4A5E4C" : isParent ? "rgba(74,94,76,0.35)" : "var(--border)"}
                        strokeWidth={isActive ? 2.5 : isParent ? 2 : 1.5}
                        style={{ transition: "all 0.25s ease" }}
                      />

                      {node.label.includes(" ") ? (
                        <>
                          <text x={node.x} y={node.y - 5} textAnchor="middle"
                            fontFamily="Georgia, serif" fontSize={node.nodeR > 40 ? 14 : node.nodeR > 30 ? 12 : 11}
                            fontWeight={isParent ? 700 : 500} fontStyle="italic"
                            fill={isActive ? "#ffffff" : isParent ? "#4A5E4C" : "var(--text-2)"}
                            style={{ transition: "fill 0.25s", pointerEvents: "none" }}>
                            {node.label.split(" ")[0]}
                          </text>
                          <text x={node.x} y={node.y + 10} textAnchor="middle"
                            fontFamily="Georgia, serif" fontSize={node.nodeR > 40 ? 14 : node.nodeR > 30 ? 12 : 11}
                            fontWeight={isParent ? 700 : 500} fontStyle="italic"
                            fill={isActive ? "#ffffff" : isParent ? "#4A5E4C" : "var(--text-2)"}
                            style={{ transition: "fill 0.25s", pointerEvents: "none" }}>
                            {node.label.split(" ")[1]}
                          </text>
                        </>
                      ) : (
                        <text x={node.x} y={node.y + 5} textAnchor="middle"
                          fontFamily="Georgia, serif" fontSize={node.nodeR > 40 ? 16 : node.nodeR > 30 ? 14 : 12}
                          fontWeight={isParent ? 700 : 500} fontStyle="italic"
                          fill={isActive ? "#ffffff" : isParent ? "#4A5E4C" : "var(--text-2)"}
                          style={{ transition: "fill 0.25s", pointerEvents: "none" }}>
                          {node.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div style={{ minHeight: 88, maxWidth: 580, width: "100%", textAlign: "center" }}>
              {activeNodeData ? (
                <div style={{ padding: "24px 36px", background: "var(--card)", border: "1.5px solid var(--green-border)", borderRadius: 18, animation: "fadeIn 0.2s ease both" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", marginBottom: 14 }}>
                    Our Fable asks the {activeNodeData.label.toLowerCase()}
                  </p>
                  <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 17, color: "var(--text)", lineHeight: 1.8 }}>
                    &ldquo;{activeNodeData.prompt}&rdquo;
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic", paddingTop: 28 }}>
                  Tap any person to see their prompt
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
