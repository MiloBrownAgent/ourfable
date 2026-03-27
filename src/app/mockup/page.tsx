"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Lock, Users, Send, BookOpen, Star, Shield, Play } from "lucide-react";

// ── Animated headline ──────────────────────────────────────────────────────────
const CHILD_NAMES = ["Sam", "Lily", "Benny", "Joy", "Mia", "Theo", "Ella", "Noah", "Grace", "Leo"];

function AnimatedHeadline() {
  const [ready, setReady] = useState(false);
  const [nameIndex, setNameIndex] = useState(0);
  const [nameVisible, setNameVisible] = useState(true);

  // Initial entrance
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Rotate name every 2.2s
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      setNameVisible(false);
      setTimeout(() => {
        setNameIndex(i => (i + 1) % CHILD_NAMES.length);
        setNameVisible(true);
      }, 350);
    }, 2200);
    return () => clearInterval(interval);
  }, [ready]);

  const name = CHILD_NAMES[nameIndex];

  return (
    <h1 style={{
      fontFamily: "var(--font-playfair)", fontWeight: 800,
      fontSize: "clamp(2.8rem, 4.8vw, 4.8rem)",
      lineHeight: 1.08, letterSpacing: "-0.025em",
      marginBottom: 28, color: "var(--text)",
      opacity: ready ? 1 : 0,
      transform: ready ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
    }}>
      Before{" "}
      <span style={{
        display: "inline-block",
        color: "var(--green)",
        opacity: nameVisible ? 1 : 0,
        transform: nameVisible ? "translateY(0)" : "translateY(-10px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        minWidth: "2ch",
      }}>
        {name}
      </span>
      {" "}can read, someone should be{" "}
      <em style={{ color: "var(--green)", fontStyle: "italic" }}>writing.</em>
    </h1>
  );
}

// ── Scroll reveal ──────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDone(true); obs.disconnect(); } }, { threshold: 0.01, rootMargin: "120px 0px 120px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: done ? 1 : 0, transform: done ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

// ── Animated counter ───────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = target / 40;
        const t = setInterval(() => {
          start += step;
          if (start >= target) { setVal(target); clearInterval(t); }
          else setVal(Math.floor(start));
        }, 30);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Product screenshot mockups ─────────────────────────────────────────────────
function VaultMockup() {
  return (
    <div style={{ background: "#1C1C1C", borderRadius: 16, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Window chrome */}
      <div style={{ height: 36, background: "#2A2A2A", display: "flex", alignItems: "center", padding: "0 14px", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {["#FF5F57","#FFBD2E","#28C840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
        <div style={{ flex: 1, margin: "0 12px", height: 18, background: "rgba(255,255,255,0.06)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>ourfable.ai / vault</span>
        </div>
      </div>
      {/* Content */}
      <div style={{ display: "flex", minHeight: 340 }}>
        {/* Sidebar — hidden on mobile/narrow */}
        <div className="mockup-sidebar" style={{ width: 180, background: "#242424", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "16px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ padding: "6px 10px", marginBottom: 10 }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 16, color: "#C9A96E", letterSpacing: "0.06em" }}>Our Fable</p>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>The Family</p>
          </div>
          {[
            { label: "Home", active: false },
            { label: "The Vault", active: true },
            { label: "Letters", active: false },
            { label: "Before You Were Born", active: false },
            { label: "Monthly Snapshot", active: false },
            { label: "Circle", active: false },
          ].map(item => (
            <div key={item.label} style={{ padding: "7px 10px", borderRadius: 6, background: item.active ? "rgba(201,169,110,0.12)" : "transparent", borderLeft: item.active ? "2px solid #C9A96E" : "2px solid transparent" }}>
              <p style={{ fontSize: 10, color: item.active ? "#C9A96E" : "rgba(255,255,255,0.35)", letterSpacing: "0.02em" }}>{item.label}</p>
            </div>
          ))}
        </div>
        {/* Main */}
        <div style={{ flex: 1, padding: "20px 20px", overflowY: "hidden" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 20, color: "rgba(255,255,255,0.85)", fontWeight: 300, flexShrink: 0 }}>The Vault</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All","Sealed","Open"].map((t, i) => (
                <div key={t} style={{ padding: "3px 10px", borderRadius: 6, background: i === 0 ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.05)", border: i === 0 ? "1px solid rgba(201,169,110,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ fontSize: 9, color: i === 0 ? "#C9A96E" : "rgba(255,255,255,0.3)" }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
          {[
            { name: "Grandma", rel: "Grandmother", type: "Letter", age: 13, color: "#C9A96E" },
            { name: "Uncle Paul", rel: "Uncle", type: "Voice memo", age: 18, color: "#C9A96E" },
            { name: "Godmother Sarah", rel: "Godparent", type: "Photo", age: 13, color: "#C9A96E" },
          ].map((entry, i) => (
            <div key={i} style={{ padding: "10px 12px", marginBottom: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `2px solid ${entry.color}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Lock size={11} color="#C9A96E" strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name} <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>· {entry.rel}</span></p>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.type} · Opens at age {entry.age}</p>
              </div>
              <div style={{ padding: "2px 8px", background: "rgba(201,169,110,0.1)", borderRadius: 4, flexShrink: 0 }}>
                <p style={{ fontSize: 9, color: "#C9A96E" }}>Sealed</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OutgoingsMockup() {
  return (
    <div style={{ background: "#F7F4EE", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.12)", border: "1px solid #E8E4DC", height: "100%" }}>
      <div style={{ height: 32, background: "#EDEAE3", display: "flex", alignItems: "center", padding: "0 12px", gap: 5, borderBottom: "1px solid #E0DDD6" }}>
        {["#FF5F57","#FFBD2E","#28C840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
        <div style={{ flex: 1, margin: "0 10px", height: 16, background: "#E0DDD6", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 8, color: "#9A9590", letterSpacing: "0.04em" }}>ourfable.ai / dispatches</span>
        </div>
      </div>
      <div style={{ padding: "18px 18px" }}>
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 17, fontWeight: 300, color: "#2A2A2A", marginBottom: 2 }}>Updates from Lily</p>
        <p style={{ fontSize: 9, color: "#9A9590", marginBottom: 14 }}>Send photos, videos, voice memos, or notes to your circle</p>

        {/* Compose card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E8E4DC", borderRadius: 10, padding: "12px 12px", marginBottom: 10 }}>

          {/* Subject */}
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9A9590", marginBottom: 4 }}>Subject</p>
            <div style={{ height: 22, background: "#F7F4EE", borderRadius: 5, border: "1px solid #E8E4DC", display: "flex", alignItems: "center", padding: "0 8px" }}>
              <p style={{ fontSize: 10, color: "#4A4A4A" }}>She said her first word today ✨</p>
            </div>
          </div>

          {/* Message */}
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9A9590", marginBottom: 4 }}>Message</p>
            <div style={{ background: "#F7F4EE", borderRadius: 5, border: "1px solid #E8E4DC", padding: "7px 8px" }}>
              <p style={{ fontSize: 10, color: "#4A4A4A", lineHeight: 1.55, fontFamily: "Georgia, serif", fontStyle: "italic" }}>She looked right at me and said "Mama." Just like that. I wasn't ready.</p>
            </div>
          </div>

          {/* Attachments */}
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9A9590", marginBottom: 6 }}>Attachments</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {/* Photo thumbnail 1 */}
              <div style={{ width: 52, height: 52, borderRadius: 6, background: "linear-gradient(135deg, #D4C9B0 0%, #BFB49A 100%)", border: "1px solid #E8E4DC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                <span style={{ fontSize: 18 }}>👶</span>
                <div style={{ position: "absolute", bottom: 3, right: 3, background: "rgba(0,0,0,0.4)", borderRadius: 3, padding: "1px 4px" }}>
                  <p style={{ fontSize: 7, color: "#fff" }}>JPG</p>
                </div>
              </div>
              {/* Photo thumbnail 2 */}
              <div style={{ width: 52, height: 52, borderRadius: 6, background: "linear-gradient(135deg, #C9D4C0 0%, #B0BFA8 100%)", border: "1px solid #E8E4DC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                <span style={{ fontSize: 18 }}>🌿</span>
                <div style={{ position: "absolute", bottom: 3, right: 3, background: "rgba(0,0,0,0.4)", borderRadius: 3, padding: "1px 4px" }}>
                  <p style={{ fontSize: 7, color: "#fff" }}>JPG</p>
                </div>
              </div>
              {/* Video thumbnail */}
              <div style={{ width: 52, height: 52, borderRadius: 6, background: "linear-gradient(135deg, #2A2A28 0%, #1A1A18 100%)", border: "1px solid #E8E4DC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "6px solid rgba(255,255,255,0.8)", marginLeft: 1 }} />
                </div>
                <div style={{ position: "absolute", bottom: 3, right: 3, background: "rgba(0,0,0,0.5)", borderRadius: 3, padding: "1px 4px" }}>
                  <p style={{ fontSize: 7, color: "#fff" }}>0:14</p>
                </div>
              </div>
              {/* Add more button */}
              <div style={{ width: 52, height: 52, borderRadius: 6, background: "#F7F4EE", border: "1.5px dashed #C8C0B4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                <p style={{ fontSize: 16, color: "#9A9590", lineHeight: 1 }}>+</p>
                <p style={{ fontSize: 7, color: "#9A9590", marginTop: 2 }}>Add</p>
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9A9590", marginBottom: 5 }}>Send to</p>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[
                { name: "Everyone (8)", active: true },
                { name: "Grandma", active: false },
                { name: "Uncle Paul", active: false },
              ].map(r => (
                <div key={r.name} style={{ padding: "3px 8px", borderRadius: 20, fontSize: 9, background: r.active ? "rgba(107,143,111,0.12)" : "#F0EDE6", border: `1px solid ${r.active ? "rgba(107,143,111,0.3)" : "#E8E4DC"}`, color: r.active ? "#4A5E4C" : "#9A9590", fontWeight: r.active ? 600 : 400 }}>
                  {r.name}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#4A5E4C", borderRadius: 7, padding: "7px 0", textAlign: "center" }}>
            <p style={{ fontSize: 10, color: "#FFFFFF", fontWeight: 600 }}>Send to everyone →</p>
          </div>
        </div>

        {/* Past outgoing with photo */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E8E4DC", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 7, background: "linear-gradient(135deg, #D4C9B0, #BFB49A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 16 }}>🌅</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: "#2A2A2A", marginBottom: 1 }}>She rolled over for the first time</p>
              <p style={{ fontSize: 8, color: "#9A9590", marginBottom: 4 }}>3 days ago · Sent to 8 people · 2 photos</p>
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ width: 28, height: 20, borderRadius: 3, background: "linear-gradient(135deg, #C9D4C0, #B0BFA8)" }} />
                <div style={{ width: 28, height: 20, borderRadius: 3, background: "linear-gradient(135deg, #D4C9B0, #C0B5A0)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SnapshotMockup() {
  return (
    <div style={{ background: "#F7F4EE", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.12)", border: "1px solid #E8E4DC" }}>
      <div style={{ height: 32, background: "#EDEAE3", display: "flex", alignItems: "center", padding: "0 12px", gap: 5, borderBottom: "1px solid #E0DDD6" }}>
        {["#FF5F57","#FFBD2E","#28C840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
        <div style={{ flex: 1, margin: "0 10px", height: 16, background: "#E0DDD6", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 8, color: "#9A9590", letterSpacing: "0.04em" }}>ourfable.ai / world</span>
        </div>
      </div>
      <div style={{ padding: "20px 22px" }}>
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 300, color: "#2A2A2A", marginBottom: 16, letterSpacing: "0.02em" }}>Lily's World</p>
        {[
          {
            month: "March 2026", age: "9m 3d",
            items: [
              { icon: "🌍", label: "In the world", text: "A season of change — countries and communities navigating new relationships with one another." },
              { icon: "🎵", label: "Everyone was singing", text: "Not Like Us — Kendrick Lamar" },
              { icon: "🌤", label: "The weather", text: "42°F · Early spring arriving in New York" },
            ]
          },
          {
            month: "February 2026", age: "8m 1d",
            items: [
              { icon: "🌍", label: "In the world", text: "Global conversations about trade and what countries owe each other." },
              { icon: "🎵", label: "Everyone was singing", text: "Pink Pony Club — Chappell Roan" },
              { icon: "🌤", label: "The weather", text: "18°F · Cold and grey across the Midwest" },
            ]
          },
        ].map((snap, i) => (
          <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < 1 ? 10 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12, paddingTop: 4, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C9A96E", flexShrink: 0 }} />
              {i < 1 && <div style={{ width: 1, flex: 1, background: "#E8E4DC", marginTop: 4 }} />}
            </div>
            <div style={{ flex: 1, padding: "10px 14px", background: "#FFFFFF", border: "1px solid #E8E4DC", borderRadius: 8, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 13, color: "#2A2A2A" }}>{snap.month}</p>
                <p style={{ fontSize: 9, color: "#9A9590", background: "#F0EDE6", padding: "1px 6px", borderRadius: 3 }}>{snap.age}</p>
              </div>
              {snap.items.map((item, j) => (
                <div key={j} style={{ display: "flex", gap: 7, marginBottom: j < snap.items.length - 1 ? 7 : 0, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 10, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <p style={{ fontSize: 9, color: "#6A6660", lineHeight: 1.5 }}>
                    <span style={{ color: "#9A9590", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 8 }}>{item.label} · </span>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BornMockup() {
  return (
    <div style={{ background: "#1A1A18", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.35)", border: "1px solid rgba(201,169,110,0.15)" }}>
      <div style={{ height: 30, background: "#222220", display: "flex", alignItems: "center", padding: "0 12px", gap: 5, borderBottom: "1px solid rgba(201,169,110,0.08)" }}>
        {["#FF5F57","#FFBD2E","#28C840"].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
      </div>
      <div style={{ padding: "20px 20px" }}>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 8, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(201,169,110,0.5)", marginBottom: 8, textAlign: "center" }}>The Our Fable Gazette</p>
        <div style={{ borderTop: "1px solid rgba(201,169,110,0.2)", borderBottom: "1px solid rgba(201,169,110,0.2)", padding: "16px 0", textAlign: "center", marginBottom: 14 }}>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 7, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(201,169,110,0.4)", marginBottom: 8 }}>Born into this world</p>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 28, fontWeight: 300, color: "#C9A96E", lineHeight: 1.1, marginBottom: 6 }}>Their Name</p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>June 21, 2025 · New York, New York</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ padding: "10px 12px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>The Weather</p>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 32, color: "#C9A96E", lineHeight: 1 }}>96°</p>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>High · Low 72°F</p>
          </div>
          <div style={{ padding: "10px 12px" }}>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>#1 Song</p>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 13, fontStyle: "italic", color: "rgba(255,255,255,0.75)", lineHeight: 1.3, marginBottom: 4 }}>"Manchild"</p>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>Sabrina Carpenter</p>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Circle Diagram ─────────────────────────────────────────────────────────────
// nodeR = circle radius, r = distance from center
const CIRCLE_NODES = [
  // Inner ring — parents, closest
  { id: "mom",         label: "Mom",            prompt: "Write them a letter for their wedding day. Tell them what love actually looks like.",        angle: 248, r: 118, nodeR: 38 },
  { id: "dad",         label: "Dad",            prompt: "What do you want them to know about the day they were born? Every detail you remember.",     angle: 292, r: 122, nodeR: 36 },

  // Mid ring — grandparents, godparent
  { id: "grandma",     label: "Grandma",        prompt: "What do you want them to know about where this family came from?",                           angle: 338, r: 185, nodeR: 30 },
  { id: "grandpa",     label: "Grandpa",        prompt: "Tell them a story about your own father. Something you've never said out loud.",             angle: 28,  r: 178, nodeR: 28 },
  { id: "godparent",   label: "Godparent",      prompt: "What do you hope they carry with them from this family?",                                    angle: 195, r: 182, nodeR: 29 },

  // Outer ring — friends, extended family, community
  { id: "aunt",        label: "Aunt",           prompt: "What do you see in them that reminds you of their parent at that age?",                      angle: 72,  r: 215, nodeR: 24 },
  { id: "uncle",       label: "Uncle",          prompt: "Tell them something about their parent that they'd never tell themselves.",                   angle: 148, r: 208, nodeR: 25 },
  { id: "familyfriend",label: "Family friend",  prompt: "Tell them who their parent was before they became someone's parent.",                         angle: 108, r: 222, nodeR: 22 },
  { id: "neighbor",    label: "Neighbor",       prompt: "What was life like on this street when they were small? What do you want them to remember?",  angle: 165, r: 218, nodeR: 20 },
  { id: "oldfriend",   label: "Old friend",     prompt: "Share a memory of their parent that made you proud to know them.",                           angle: 50,  r: 210, nodeR: 21 },
];

function CircleDiagram() {
  const [nameIndex, setNameIndex] = useState(0);
  const [nameVisible, setNameVisible] = useState(true);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const cx = 270, cy = 270, size = 540;

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
    <section style={{ padding: "100px 40px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p className="label label-green" style={{ marginBottom: 14 }}>The circle</p>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 16, maxWidth: 600, margin: "0 auto 16px" }}>
              Everyone who loves them.<br />Each with a different story to tell.
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75, maxWidth: 500, margin: "0 auto" }}>
              Our Fable sends each person a prompt tailored to their relationship. Grandma gets a different question than the old family friend. Every voice is unique. Every story is irreplaceable.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            {/* SVG diagram */}
            <div style={{ width: "100%", maxWidth: 560 }}>
              <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>

                {/* Subtle orbit rings */}
                <circle cx={cx} cy={cy} r={135} fill="none" stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 6" strokeOpacity={0.5} />
                <circle cx={cx} cy={cy} r={200} fill="none" stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 8" strokeOpacity={0.35} />

                {/* Connecting lines */}
                {CIRCLE_NODES.map(node => {
                  const rad = (node.angle * Math.PI) / 180;
                  const nx = cx + node.r * Math.cos(rad);
                  const ny = cy + node.r * Math.sin(rad);
                  const isActive = activeNode === node.id;
                  const isParent = node.id === "mom" || node.id === "dad";
                  return (
                    <line
                      key={node.id + "-line"}
                      x1={cx} y1={cy}
                      x2={nx} y2={ny}
                      stroke={isActive ? "#4A5E4C" : isParent ? "var(--gold-border)" : "var(--border)"}
                      strokeWidth={isActive ? 2 : isParent ? 1.5 : 1}
                      strokeDasharray={isActive || isParent ? "none" : "4 5"}
                      strokeOpacity={isActive ? 1 : isParent ? 0.6 : 0.7}
                      style={{ transition: "all 0.3s ease" }}
                    />
                  );
                })}

                {/* Center glow */}
                <circle cx={cx} cy={cy} r={68} fill="var(--green)" fillOpacity={0.08} />

                {/* Center circle — child */}
                <circle cx={cx} cy={cy} r={54} fill="var(--green)" />
                <circle cx={cx} cy={cy} r={58} fill="none" stroke="var(--green)" strokeWidth={1} strokeOpacity={0.25} />
                <circle cx={cx} cy={cy} r={64} fill="none" stroke="var(--green)" strokeWidth={0.5} strokeOpacity={0.12} />

                {/* Child name — cycling */}
                <text
                  x={cx} y={cy - 5}
                  textAnchor="middle"
                  fontFamily="Georgia, 'Times New Roman', serif"
                  fontSize={20}
                  fontWeight={700}
                  fill="#ffffff"
                  style={{ opacity: nameVisible ? 1 : 0, transition: "opacity 0.3s ease" }}
                >
                  {CHILD_NAMES[nameIndex]}
                </text>
                <text x={cx} y={cy + 13} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={8} fill="rgba(255,255,255,0.55)" letterSpacing={1.5}>
                  YOUR CHILD
                </text>

                {/* Nodes */}
                {CIRCLE_NODES.map(node => {
                  const rad = (node.angle * Math.PI) / 180;
                  const nx = cx + node.r * Math.cos(rad);
                  const ny = cy + node.r * Math.sin(rad);
                  const isActive = activeNode === node.id;
                  const isParent = node.id === "mom" || node.id === "dad";

                  return (
                    <g
                      key={node.id}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setActiveNode(node.id)}
                      onMouseLeave={() => setActiveNode(null)}
                      onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
                    >
                      {/* Glow for active */}
                      {isActive && (
                        <circle cx={nx} cy={ny} r={node.nodeR + 8} fill="var(--green)" fillOpacity={0.12} />
                      )}
                      <circle
                        cx={nx} cy={ny} r={node.nodeR}
                        fill={isActive ? "var(--green)" : isParent ? "var(--gold-dim)" : "var(--card)"}
                        stroke={isActive ? "var(--green)" : isParent ? "var(--gold-border)" : "var(--border)"}
                        strokeWidth={isActive ? 2 : 1.5}
                        style={{ transition: "all 0.25s ease" }}
                      />
                      {/* Split label for long names */}
                      {node.label.includes(" ") ? (
                        <>
                          <text x={nx} y={ny - 3} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={node.nodeR > 26 ? 10 : 9} fontWeight={600} fill={isActive ? "#ffffff" : isParent ? "var(--gold)" : "var(--text-2)"} style={{ transition: "fill 0.25s", pointerEvents: "none" }}>
                            {node.label.split(" ")[0]}
                          </text>
                          <text x={nx} y={ny + 9} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={node.nodeR > 26 ? 10 : 9} fontWeight={600} fill={isActive ? "#ffffff" : isParent ? "var(--gold)" : "var(--text-2)"} style={{ transition: "fill 0.25s", pointerEvents: "none" }}>
                            {node.label.split(" ")[1]}
                          </text>
                        </>
                      ) : (
                        <text x={nx} y={ny + 4} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={node.nodeR > 26 ? 11 : 9} fontWeight={600} fill={isActive ? "#ffffff" : isParent ? "var(--gold)" : "var(--text-2)"} style={{ transition: "fill 0.25s", pointerEvents: "none" }}>
                          {node.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Prompt callout */}
            <div style={{ minHeight: 90, maxWidth: 500, width: "100%", textAlign: "center" }}>
              {activeNodeData ? (
                <div style={{ padding: "22px 32px", background: "var(--card)", border: "1px solid var(--green-border)", borderRadius: 16, animation: "fadeIn 0.25s ease both" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)", marginBottom: 12 }}>
                    Our Fable asks the {activeNodeData.label.toLowerCase()}
                  </p>
                  <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 16, color: "var(--text)", lineHeight: 1.75 }}>
                    "{activeNodeData.prompt}"
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic", paddingTop: 30 }}>
                  Hover any person to see their prompt
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Lock, title: "The Vault", body: "Every letter, photo, voice memo, and video — sealed and waiting. Delivered at 13, 18, graduation, wedding day." },
  { icon: Users, title: "Monthly Prompts", body: "Our Fable interviews your circle automatically. Tailored to each relationship. They just reply." },
  { icon: Send, title: "Dispatches", body: "Send photos, videos, or updates to your whole circle — or just a few people. No group chat. No social media." },
  { icon: BookOpen, title: "World Snapshot", body: "One page per month of your child's life — headlines, music, weather. At 18, they have 216 of them." },
  { icon: Star, title: "Day They Were Born", body: "A permanent front page for their birthday. Everything happening in the world when they arrived." },
  { icon: Shield, title: "Private by design", body: "No public profiles. No search results. No ads. Your child's story belongs to your family." },
];

const STATS = [
  { value: 216, suffix: "", label: "World Snapshots by age 18" },
  { value: 18, suffix: "", label: "Years of memories, sealed" },
  { value: 1, suffix: "", label: "Place where it all lives" },
];

export default function MockupPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const mockups = [
    { label: "The Vault", component: <VaultMockup /> },
    { label: "Dispatches", component: <OutgoingsMockup /> },
    { label: "World Snapshot", component: <SnapshotMockup /> },
    { label: "Day They Were Born", component: <BornMockup /> },
  ];

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", overflowX: "hidden" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @media (max-width: 860px) { .hero-cols { grid-template-columns: 1fr !important; } .hero-right { display: none !important; } }
        @media (max-width: 640px) { .features-grid { grid-template-columns: 1fr 1fr !important; } .stats-row { grid-template-columns: 1fr !important; } }
        /* Vault mockup sidebar — hide when container is too narrow */
        @media (max-width: 520px) { .mockup-sidebar { display: none !important; } }
        @media (max-width: 680px) {
          .nav-links { display: none !important; }
          .nav-cta { padding: 9px 18px !important; font-size: 13px !important; }
          .hero-section { padding: 100px 20px 60px !important; }
          .section-pad { padding-left: 20px !important; padding-right: 20px !important; }
          .stats-row { gap: 0 !important; }
          .stats-row > div { border-right: none !important; border-bottom: 1px solid var(--border); padding: 24px 20px !important; }
          .vignettes-grid { grid-template-columns: 1fr !important; }
          .dark-section { padding: 72px 24px !important; }
          .cta-section { padding: 60px 24px 100px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64, display: "flex", alignItems: "center", padding: "0 24px", background: scrolled ? "rgba(253,251,247,0.97)" : "transparent", borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent", backdropFilter: scrolled ? "blur(20px)" : "none", transition: "all 300ms ease" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", letterSpacing: "-0.01em" }}>Our Fable</span>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <Link href="/" className="nav-link" style={{ fontSize: 14 }}>Home</Link>
              <Link href="/how-it-works" className="nav-link" style={{ fontSize: 14 }}>How it works</Link>
              <Link href="/gift" className="nav-link" style={{ fontSize: 14 }}>Give as a gift</Link>
              <Link href="/login" className="nav-link" style={{ fontSize: 14 }}>Sign in</Link>
            </div>
            <Link href="/reserve" className="btn-primary nav-cta" style={{ padding: "10px 22px", fontSize: 14 }}>
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" style={{ padding: "148px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="hero-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ marginBottom: 24, animation: "fadeUp 0.5s ease both" }}>
              <span className="chip chip-green" style={{ fontSize: 12 }}>Private · Permanent · Personal</span>
            </div>
            <AnimatedHeadline />
            <p style={{ fontSize: 19, lineHeight: 1.8, color: "var(--text-2)", marginBottom: 40, maxWidth: 440, animation: "fadeUp 0.5s ease 0.7s both", opacity: 0 }}>
              Our Fable automatically interviews the people in your child's life — and holds every answer until your child is ready.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", animation: "fadeUp 0.5s ease 0.85s both", opacity: 0 }}>
              <Link href="/reserve" className="btn-primary" style={{ fontSize: 15, padding: "15px 32px", gap: 10 }}>
                Begin their story <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link href="/how-it-works" className="btn-secondary" style={{ fontSize: 15, padding: "15px 24px" }}>
                See how it works
              </Link>
            </div>
            <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-3)", animation: "fadeUp 0.5s ease 1s both", opacity: 0 }}>
              $12 / month or $99 / year
            </p>
          </div>

          {/* Right — product mockup with tab switcher */}
          <div className="hero-right" style={{ animation: "fadeIn 0.8s ease 0.4s both", opacity: 0 }}>
            {/* Tab switcher */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {mockups.map((m, i) => (
                <button key={i} onClick={() => setActiveTab(i)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all 160ms", background: activeTab === i ? "var(--green)" : "var(--card)", border: `1px solid ${activeTab === i ? "transparent" : "var(--border)"}`, color: activeTab === i ? "#fff" : "var(--text-3)" }}>
                  {m.label}
                </button>
              ))}
            </div>
            {/* Fixed-height container — all tabs same size, crossfade */}
            <div style={{ position: "relative", height: 440, animation: "float 6s ease-in-out infinite" }}>
              {mockups.map((m, i) => (
                <div key={i} style={{
                  position: "absolute", inset: 0,
                  opacity: activeTab === i ? 1 : 0,
                  transform: activeTab === i ? "translateY(0) scale(1)" : "translateY(6px) scale(0.99)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                  pointerEvents: activeTab === i ? "auto" : "none",
                  overflowY: "auto",
                  borderRadius: 16,
                }}>
                  {m.component}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROOF STRIP ── */}
      <div style={{ background: "var(--green)", padding: "16px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {["Automatic monthly prompts", "Photos, video & voice memos", "Dispatches to your whole circle", "Sealed until they're ready", "Private by design"].map(p => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={11} color="rgba(255,255,255,0.55)" strokeWidth={2.5} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section style={{ padding: "80px 40px", maxWidth: 860, margin: "0 auto" }}>
        <Reveal>
          <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ padding: "36px 32px", textAlign: "center", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                <p style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2.8rem, 5vw, 4rem)", fontWeight: 800, color: "var(--green)", lineHeight: 1, marginBottom: 8 }}>
                  <Counter target={s.value} suffix={s.suffix} />
                </p>
                <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.5 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── CIRCLE DIAGRAM ── */}
      <CircleDiagram />

      {/* ── EMOTIONAL VIGNETTES ── */}
      <section style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <p className="label label-green" style={{ marginBottom: 16 }}>Why it matters</p>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, maxWidth: 600, margin: "0 auto" }}>
              The people who love your child<br />won't always be here.
            </h2>
          </div>
        </Reveal>

        <div className="vignettes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {[
            {
              who: "Grandpa",
              age: "74 years old",
              excerpt: "He forgets things now. Some days are harder than others. But last Tuesday, he called the Our Fable number and talked for eleven minutes — about the farm he grew up on, about his own father, about what he hopes for the baby he's only met twice.",
              seal: "Sealed until age 18.",
              color: "var(--gold)",
            },
            {
              who: "Great-Aunt Carol",
              age: "She passed last spring",
              excerpt: "She submitted three voice memos before she died. None of them knew it would be the last time they'd hear her voice. Our Fable did. It was waiting.",
              seal: "Her voice is still there.",
              color: "var(--sage)",
            },
            {
              who: "Your best friend from college",
              age: "Knew you before any of this",
              excerpt: "She knew you when you were 22 and had no idea what you were doing. She wrote about who you were before you became someone's parent — things your child will never be able to find out any other way.",
              seal: "Sealed until graduation.",
              color: "var(--gold)",
            },
            {
              who: "Grandma",
              age: "Lives two states away",
              excerpt: "She's not good with technology. She said so herself. But she called the number. She sang the lullaby her mother sang to her. In a language your child doesn't speak yet.",
              seal: "Sealed until age 13.",
              color: "var(--sage)",
            },
          ].map((v, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="card" style={{ padding: "32px 28px", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 20, fontWeight: 400, color: "var(--text)", marginBottom: 3 }}>{v.who}</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)" }}>{v.age}</p>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.color, flexShrink: 0, marginTop: 6 }} />
                </div>
                <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 15, lineHeight: 1.85, color: "var(--text-2)", flex: 1 }}>
                  "{v.excerpt}"
                </p>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: v.color }}>{v.seal}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div style={{ marginTop: 56, padding: "32px 40px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 16, textAlign: "center", maxWidth: 680, margin: "56px auto 0" }}>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.2rem, 2.5vw, 1.7rem)", fontWeight: 700, color: "var(--text)", lineHeight: 1.45, marginBottom: 16 }}>
              You can't predict who will still be here when your child is 18.
            </p>
            <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75 }}>
              Our Fable doesn't wait. It asks now. Every month. So that when the time comes — no matter what has changed — the people who loved your child from the beginning are still speaking to them.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── THE LETTER MOMENT — dark, cinematic ── */}
      <section className="dark-section" style={{ background: "#141412", padding: "120px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(74,94,76,0.25) 0%, transparent 65%)", pointerEvents: "none" }} />
        <Reveal>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <div style={{ width: 48, height: 1, background: "rgba(201,169,110,0.4)", margin: "0 auto 40px" }} />
            <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontWeight: 500, fontSize: "clamp(1.25rem, 3vw, 2.4rem)", lineHeight: 1.6, color: "#FFFFFF", marginBottom: 32 }}>
              "Imagine your child at 18, opening a voice memo from their great-grandmother — recorded when they were 9 months old.
              <br /><br />
              Their great-grandmother, who is no longer alive.
              <br /><br />
              Telling them how she wants to be remembered."
            </p>
            <div style={{ width: 48, height: 1, background: "rgba(201,169,110,0.4)", margin: "0 auto 32px" }} />
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 500, margin: "0 auto" }}>
              Our Fable makes this happen because once a month, it asked. She answered. Her voice is in the Vault — sealed, waiting.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── HOW IT WORKS — with product mockup beside steps ── */}
      <section style={{ padding: "120px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }} className="hero-cols">
            <div>
              <p className="label label-green" style={{ marginBottom: 14 }}>How it works</p>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 48 }}>
                Set up in five minutes.<br />Runs for a lifetime.
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { n: "01", title: "Tell Our Fable about your child.", body: "Name, birthday, a family password. Five minutes. Our Fable builds their Vault, their circle, and their world snapshot." },
                  { n: "02", title: "Add the people who love them.", body: "Each person gets a unique link. The invitation comes from your child. No accounts. No apps." },
                  { n: "03", title: "Our Fable asks every circle member, every month.", body: "Personal prompts go out automatically — different for each relationship. They respond with text, photo, voice, or video." },
                  { n: "04", title: "Everything seals in the Vault.", body: "Time-locked. Some open at 13. Some at 18. Some on graduation day, or their wedding." },
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 20, paddingBottom: 32, borderLeft: i < 3 ? "1.5px solid var(--border)" : "1.5px solid transparent", marginLeft: 16, paddingLeft: 28, position: "relative" }}>
                    <div style={{ position: "absolute", left: -10, top: 0, width: 20, height: 20, borderRadius: "50%", background: i === 0 ? "var(--green)" : "var(--card)", border: `2px solid ${i === 0 ? "var(--green)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {i === 0 && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase" }}>{step.n}</p>
                      <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--text)", lineHeight: 1.3 }}>{step.title}</h3>
                      <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.75 }}>{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-right" style={{ position: "sticky", top: 100 }}>
              <div style={{ animation: "float 7s ease-in-out infinite" }}>
                <SnapshotMockup />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "100px 40px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <div style={{ marginBottom: 56, maxWidth: 560 }}>
              <p className="label label-green" style={{ marginBottom: 14 }}>What's inside</p>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                Everything your child<br />will want someday.
              </h2>
            </div>
          </Reveal>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={i * 50}>
                  <div className="card" style={{ padding: "28px 26px", height: "100%", transition: "transform 200ms, box-shadow 200ms" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--green-light)", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                      <Icon size={20} color="var(--green)" strokeWidth={1.75} />
                    </div>
                    <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 10, lineHeight: 1.3 }}>{f.title}</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-2)" }}>{f.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section style={{ padding: "120px 40px", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <p className="label label-green" style={{ marginBottom: 20 }}>The philosophy</p>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 4vw, 3.4rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 28 }}>
            The invite comes from{" "}
            <em style={{ color: "var(--green)", fontStyle: "italic" }}>your child,</em>{" "}
            not from you.
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.85, color: "var(--text-2)", marginBottom: 16, maxWidth: 580, margin: "0 auto 16px" }}>
            When Grandma gets her invite, the subject line reads: <strong style={{ color: "var(--text)" }}>"Hi — it's me."</strong> She's not receiving a parent newsletter. She's receiving a letter from a child.
          </p>
          <p style={{ fontSize: 18, lineHeight: 1.85, color: "var(--text-2)", maxWidth: 580, margin: "0 auto" }}>
            Our Fable is built around the child. Parents are the setup. Everything else belongs to them.
          </p>
        </Reveal>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="cta-section" style={{ padding: "80px 40px 140px", textAlign: "center", background: "var(--bg-2)", borderTop: "1px solid var(--border)" }}>
        <Reveal>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: "clamp(1.1rem, 2vw, 1.4rem)", color: "var(--text-3)", marginBottom: 24, lineHeight: 1.6 }}>
              "The people who love your child won't be here forever."
            </p>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontWeight: 800, fontSize: "clamp(2.5rem, 5vw, 4rem)", letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 20 }}>
              Start{" "}
              <em style={{ color: "var(--green)", fontStyle: "italic" }}>their</em>
              {" "}story.
            </h2>
            <p style={{ fontSize: 17, color: "var(--text-2)", marginBottom: 40, lineHeight: 1.7 }}>
              Five minutes to set up. Our Fable interviews them every month — and holds every answer until your child is ready.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
              <Link href="/reserve" className="btn-primary" style={{ padding: "18px 40px", fontSize: 17 }}>
                Begin their story <ArrowRight size={17} strokeWidth={2.5} />
              </Link>
              <Link href="/gift" className="btn-secondary" style={{ padding: "18px 28px", fontSize: 15 }}>
                Give as a gift
              </Link>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>$12 / month or $99 / year · $12 / month or $99 / year</p>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 40px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700, color: "var(--green)" }}>Our Fable</span>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            <Link href="/how-it-works" className="nav-link" style={{ fontSize: 13 }}>How it works</Link>
            <Link href="/gift" className="nav-link" style={{ fontSize: 13 }}>Give as a gift</Link>
            <Link href="/login" className="nav-link" style={{ fontSize: 13 }}>Sign in</Link>
            <Link href="/reserve" className="nav-link" style={{ fontSize: 13 }}>Reserve your spot</Link>
            <Link href="/privacy" className="nav-link" style={{ fontSize: 13 }}>Privacy</Link>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-4)" }}>© {new Date().getFullYear()} Our Fable, Inc. · Private by design.</p>
        </div>
      </footer>
    </div>
  );
}
