"use client";
import { useState, useEffect, useRef } from "react";
import { Music } from "lucide-react";
import {
  getMusicLink,
  getSavedPlatform,
  savePlatform,
  MUSIC_PLATFORMS,
  type MusicPlatform,
} from "@/lib/music-link";

/**
 * ListenButton — tap to play a song on the user's preferred music app.
 *
 * First tap: shows a small picker (Spotify, Apple Music, YouTube Music, Amazon Music, Tidal).
 * Choice is saved to localStorage. Every future tap goes straight to their app.
 */
export default function ListenButton({ song }: { song: string }) {
  const [showPicker, setShowPicker] = useState(false);
  const [saved, setSaved] = useState<MusicPlatform | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSaved(getSavedPlatform());
  }, []);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const handleClick = () => {
    if (saved) {
      // Already chose a platform — go straight there
      window.open(getMusicLink(song, saved), "_blank", "noopener,noreferrer");
    } else {
      // First time — show picker
      setShowPicker(true);
    }
  };

  const handleSelect = (platform: MusicPlatform) => {
    savePlatform(platform);
    setSaved(platform);
    setShowPicker(false);
    window.open(getMusicLink(song, platform), "_blank", "noopener,noreferrer");
  };

  return (
    <div ref={pickerRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={handleClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 10px",
          borderRadius: 100,
          border: "0.5px solid var(--border)",
          background: "transparent",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--sage)",
          textDecoration: "none",
          fontFamily: "var(--font-body)",
          cursor: "pointer",
          transition: "border-color 160ms, color 160ms",
          flexShrink: 0,
        }}
      >
        <Music size={10} strokeWidth={2} /> Listen
      </button>

      {/* Platform picker */}
      {showPicker && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#FFFFFF",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(26,26,24,0.12), 0 2px 8px rgba(26,26,24,0.06)",
            padding: "12px 4px",
            zIndex: 100,
            minWidth: 200,
            animation: "fadeUp 160ms ease both",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-3)",
              padding: "0 12px 8px",
              fontFamily: "var(--font-body)",
              borderBottom: "0.5px solid var(--border)",
              marginBottom: 4,
            }}
          >
            Listen with
          </p>
          {MUSIC_PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handleSelect(platform.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                borderRadius: 8,
                transition: "background 120ms",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--green-light)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--green-light)",
                  border: "0.5px solid var(--green-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: "var(--green)",
                  flexShrink: 0,
                }}
              >
                {platform.icon}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text)",
                  letterSpacing: "0.01em",
                }}
              >
                {platform.name}
              </span>
            </button>
          ))}
          <p
            style={{
              fontSize: 10,
              color: "var(--text-4)",
              padding: "6px 12px 2px",
              fontFamily: "var(--font-body)",
              borderTop: "0.5px solid var(--border)",
              marginTop: 4,
            }}
          >
            We&apos;ll remember your choice
          </p>
        </div>
      )}
    </div>
  );
}
