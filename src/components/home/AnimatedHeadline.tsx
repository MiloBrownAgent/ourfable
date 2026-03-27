"use client";
import { useEffect, useState } from "react";

export const CHILD_NAMES = ["Sam", "Lily", "Benny", "Joy", "Mia", "Theo", "Ella", "Noah", "Grace", "Leo"];

export function AnimatedHeadline() {
  const [ready, setReady] = useState(false);
  const [nameIndex, setNameIndex] = useState(0);
  const [nameVisible, setNameVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

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

  // Find the widest name to lock the container width
  const longestName = CHILD_NAMES.reduce((a, b) => a.length > b.length ? a : b, "");

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
        position: "relative",
        verticalAlign: "baseline",
      }}>
        {/* Invisible longest name to reserve width */}
        <span style={{ visibility: "hidden" }} aria-hidden="true">{longestName}</span>
        {/* Visible animated name, absolutely positioned over the spacer */}
        <span style={{
          position: "absolute",
          left: 0,
          top: 0,
          color: "var(--green)",
          opacity: nameVisible ? 1 : 0,
          transform: nameVisible ? "translateY(0)" : "translateY(-10px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          whiteSpace: "nowrap",
        }}>
          {name}
        </span>
      </span>
      {" "}can read, someone should be{" "}
      <em style={{ color: "var(--green)", fontStyle: "italic" }}>writing.</em>
    </h1>
  );
}
