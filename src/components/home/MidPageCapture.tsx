"use client";
import { useState } from "react";
import { Reveal } from "./Reveal";
import { Share2, MessageCircle, Mail, Copy, Check, X } from "lucide-react";

const SHARE_URL = "https://ourfable.ai";
const SHARE_TEXT = "Our Fable — a private vault where the people who love your child leave letters, voice memos, photos, and videos, sealed until they're ready.";

function ShareModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = SHARE_URL;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const options = [
    {
      label: "Messages",
      icon: <MessageCircle size={18} strokeWidth={1.5} />,
      onClick: () => window.open(`sms:?&body=${encodeURIComponent(SHARE_TEXT + "\n" + SHARE_URL)}`, "_blank"),
    },
    {
      label: "Email",
      icon: <Mail size={18} strokeWidth={1.5} />,
      onClick: () => window.open(`mailto:?subject=${encodeURIComponent("You need to see this — Our Fable")}&body=${encodeURIComponent(SHARE_TEXT + "\n\n" + SHARE_URL)}`, "_blank"),
    },
    {
      label: "Facebook",
      icon: <span style={{ fontSize: 16, fontWeight: 700 }}>f</span>,
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`, "_blank", "width=600,height=400"),
    },
    {
      label: "X",
      icon: <span style={{ fontSize: 14, fontWeight: 700 }}>𝕏</span>,
      onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`, "_blank", "width=600,height=400"),
    },
  ];

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)", zIndex: 999,
      }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--bg)", borderRadius: "20px 20px 0 0",
        zIndex: 1000, padding: "24px 24px calc(24px + env(safe-area-inset-bottom, 0px))",
        maxWidth: 480, margin: "0 auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
        animation: "shareSlideUp 300ms cubic-bezier(0.32, 0.72, 0, 1)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-dark)", opacity: 0.5 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 400, color: "var(--text)" }}>
            Share Our Fable
          </h3>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--surface)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--text-3)",
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {options.map(opt => (
            <button
              key={opt.label}
              onClick={opt.onClick}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "16px 8px", borderRadius: 12, cursor: "pointer",
                background: "var(--surface)", border: "1px solid var(--border)",
                color: "var(--text-2)", transition: "all 160ms",
              }}
            >
              {opt.icon}
              <span style={{ fontSize: 11, fontWeight: 500 }}>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Copy link */}
        <button onClick={handleCopy} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "14px 20px", borderRadius: 12,
          background: copied ? "var(--green-light)" : "var(--surface)",
          border: `1px solid ${copied ? "var(--green-border)" : "var(--border)"}`,
          color: copied ? "var(--green)" : "var(--text-2)",
          fontSize: 13, fontWeight: 500, cursor: "pointer",
          transition: "all 200ms",
        }}>
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy link</>}
        </button>
      </div>
      <style>{`@keyframes shareSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </>
  );
}

export function MidPageCapture() {
  const [showShare, setShowShare] = useState(false);

  const handleShare = async () => {
    // Try native share first (mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Our Fable",
          text: SHARE_TEXT,
          url: SHARE_URL,
        });
        return;
      } catch {
        // User cancelled or not supported — fall through to modal
      }
    }
    setShowShare(true);
  };

  return (
    <section style={{ padding: "80px 40px", maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
      <Reveal>
        {/* Gold rule above */}
        <div style={{ width: 60, height: 0.5, background: "var(--gold)", margin: "0 auto 32px" }} />

        <p
          className="font-display"
          style={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "clamp(1.3rem, 2.5vw, 1.7rem)",
            fontWeight: 500,
            color: "var(--text)",
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          Know someone who would love Our Fable?<br />Share it with them.
        </p>

        <div style={{ maxWidth: 420, margin: "0 auto 16px" }}>
          <button
            onClick={handleShare}
            className="btn-primary"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "15px 32px", fontSize: 16,
              background: "var(--green)", color: "#fff",
              border: "none", borderRadius: 100,
              cursor: "pointer", fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            <Share2 size={18} strokeWidth={2} />
            Share Our Fable
          </button>
        </div>

        <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 32, fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
          ourfable.ai · Private by design
        </p>

        {/* Gold rule below */}
        <div style={{ width: 60, height: 0.5, background: "var(--gold)", margin: "0 auto" }} />
      </Reveal>

      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
    </section>
  );
}
