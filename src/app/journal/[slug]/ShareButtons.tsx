"use client";
import { useState } from "react";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  }

  function shareFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  }

  return (
    <div style={{
      marginTop: 60,
      paddingTop: 40,
      borderTop: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 14, color: "var(--text-3)", fontWeight: 500 }}>Share:</span>
      <button onClick={copyLink} style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: 100,
        padding: "8px 18px",
        fontSize: 13,
        cursor: "pointer",
        color: "var(--text-2)",
        fontWeight: 500,
      }}>
        {copied ? "Copied!" : "Copy link"}
      </button>
      <button onClick={shareTwitter} style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: 100,
        padding: "8px 18px",
        fontSize: 13,
        cursor: "pointer",
        color: "var(--text-2)",
        fontWeight: 500,
      }}>
        Twitter / X
      </button>
      <button onClick={shareFacebook} style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: 100,
        padding: "8px 18px",
        fontSize: 13,
        cursor: "pointer",
        color: "var(--text-2)",
        fontWeight: 500,
      }}>
        Facebook
      </button>
    </div>
  );
}
