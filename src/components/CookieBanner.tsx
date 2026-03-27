"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookie-consent");
      if (consent === null) setVisible(true);
    } catch {
      // localStorage unavailable
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem("cookie-consent", "1");
      // Notify MetaPixel via storage event (same-tab workaround)
      window.dispatchEvent(new StorageEvent("storage", {
        key: "cookie-consent",
        newValue: "1",
        storageArea: localStorage,
      }));
    } catch {}
    setVisible(false);
  }

  function decline() {
    try {
      localStorage.setItem("cookie-consent", "0");
      window.dispatchEvent(new StorageEvent("storage", {
        key: "cookie-consent",
        newValue: "0",
        storageArea: localStorage,
      }));
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999,
      background: "var(--bg)",
      borderTop: "1px solid var(--border)",
      padding: "16px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, flexWrap: "wrap",
      boxShadow: "0 -4px 24px rgba(0,0,0,0.06)",
      animation: "fadeIn 0.3s ease both",
    }}>
      <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
        We use cookies to keep you signed in and to measure how people find us (via the Meta Pixel).
        No family content is ever used for advertising.{" "}
        <Link href="/privacy#cookies" style={{ color: "var(--green)", textDecoration: "underline" }}>
          Privacy Policy
        </Link>
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            padding: "10px 20px", borderRadius: 100,
            background: "transparent", color: "var(--text-3)",
            border: "1px solid var(--border)", fontSize: 13, fontWeight: 500,
            cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
          }}
        >
          Decline
        </button>
        <button
          onClick={accept}
          style={{
            padding: "10px 24px", borderRadius: 100,
            background: "var(--green)", color: "#fff",
            border: "none", fontSize: 13, fontWeight: 600,
            cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
