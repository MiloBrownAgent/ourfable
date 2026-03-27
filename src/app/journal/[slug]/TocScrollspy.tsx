"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface Props {
  toc: TocItem[];
}

export function TocDesktop({ toc }: Props) {
  const [activeId, setActiveId] = useState("");

  const handleScroll = useCallback(() => {
    const headings = toc
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    let current = "";
    for (const el of headings) {
      if (el.getBoundingClientRect().top <= 120) current = el.id;
    }
    setActiveId(current);
  }, [toc]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <aside style={{
      position: "sticky",
      top: 80,
      paddingTop: 0,
      maxHeight: "calc(100vh - 120px)",
      overflowY: "auto",
    }}>
      <p style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--text-4)",
        marginBottom: 16,
      }}>
        In this article
      </p>
      <nav>
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            style={{
              display: "block",
              padding: `8px 0 8px ${item.level === 3 ? "12px" : "0"}`,
              fontSize: 13,
              lineHeight: 1.5,
              color: activeId === item.id ? "var(--green)" : "var(--text-3)",
              fontWeight: activeId === item.id ? 600 : 400,
              textDecoration: "none",
              borderLeft: item.level === 3 ? "2px solid var(--border)" : "none",
              transition: "color 0.2s",
            }}
          >
            {item.text}
          </a>
        ))}
      </nav>

      <div style={{
        marginTop: 36,
        background: "var(--green-light)",
        border: "1px solid var(--green-border)",
        borderRadius: 12,
        padding: "20px",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "var(--font-playfair)",
          fontSize: 14,
          fontWeight: 700,
          color: "var(--green)",
          marginBottom: 8,
          lineHeight: 1.35,
        }}>
          Start writing letters to your child
        </p>
        <Link href="/reserve" style={{
          display: "block",
          background: "var(--green)",
          color: "#fff",
          fontWeight: 600,
          fontSize: 13,
          padding: "10px 16px",
          borderRadius: 100,
          textDecoration: "none",
          marginTop: 12,
        }}>
          OurFable →
        </Link>
      </div>
    </aside>
  );
}

export function TocMobile({ toc }: Props) {
  const [activeId, setActiveId] = useState("");
  const [open, setOpen] = useState(false);

  const handleScroll = useCallback(() => {
    const headings = toc
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    let current = "";
    for (const el of headings) {
      if (el.getBoundingClientRect().top <= 120) current = el.id;
    }
    setActiveId(current);
  }, [toc]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div style={{ marginBottom: 40 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: open ? "12px 12px 0 0" : 12,
          padding: "14px 18px",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-2)",
        }}
      >
        <span>Table of Contents</span>
        <span style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>↓</span>
      </button>
      {open && (
        <nav style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          padding: "12px 18px",
        }}>
          {toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: `8px 0 8px ${item.level === 3 ? "16px" : "0"}`,
                fontSize: 14,
                color: activeId === item.id ? "var(--green)" : "var(--text-3)",
                fontWeight: activeId === item.id ? 600 : 400,
                textDecoration: "none",
              }}
            >
              {item.text}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
