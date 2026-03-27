"use client";
import { useState } from "react";

interface FAQItem {
  q: string;
  a: string;
}

export function FAQAccordion({ faqs }: { faqs: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(prev => (prev === i ? null : i));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {faqs.map(({ q, a }, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            style={{
              borderTop: "1px solid var(--border)",
              borderBottom: i === faqs.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <button
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "22px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--text)",
                fontFamily: "var(--font-playfair)",
                fontWeight: 700,
                fontSize: "clamp(1rem, 1.5vw, 1.15rem)",
                lineHeight: 1.35,
              }}
            >
              <span>{q}</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                style={{
                  flexShrink: 0,
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s ease",
                }}
                aria-hidden="true"
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="var(--text-3)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              style={{
                overflow: "hidden",
                maxHeight: isOpen ? 600 : 0,
                opacity: isOpen ? 1 : 0,
                transition: "max-height 0.35s ease, opacity 0.25s ease",
              }}
            >
              <p style={{
                fontSize: 15,
                color: "var(--text-2)",
                lineHeight: 1.8,
                padding: "0 0 24px",
                margin: 0,
              }}>
                {a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
