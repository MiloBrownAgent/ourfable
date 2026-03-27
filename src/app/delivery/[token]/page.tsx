"use client";

import { use, useEffect, useState, useRef } from "react";
import { Play, Pause, ChevronDown, Download } from "lucide-react";

interface VaultEntry {
  type: string;
  content?: string;
  mediaUrl?: string;
  authorName: string;
  authorEmail?: string;
  createdAt: number;
  isSealed: boolean;
}

interface Letter {
  authorName: string;
  content: string;
  createdAt: number;
}

interface DeliveryData {
  childName: string;
  parentNames?: string;
  entries: VaultEntry[];
  letters: Letter[];
  familyId: string;
}

async function fetchDeliveryData(token: string): Promise<DeliveryData | null> {
  const res = await fetch(`/api/ourfable/delivery-data?token=${token}`);
  if (!res.ok) return null;
  return res.json();
}

function timeAgoFromBirth(createdAt: number, childDob?: string): string {
  if (!childDob) return "";
  const born = new Date(childDob).getTime();
  const diff = createdAt - born;
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30.4375);
  const years = Math.floor(months / 12);

  if (years > 0) {
    const remainingMonths = months - years * 12;
    return `when you were ${years} year${years > 1 ? "s" : ""}${remainingMonths > 0 ? ` and ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}` : ""} old`;
  }
  if (months > 0) return `when you were ${months} month${months > 1 ? "s" : ""} old`;
  if (days > 0) return `when you were ${days} day${days > 1 ? "s" : ""} old`;
  return "before you were born";
}

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    const ended = () => setPlaying(false);
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("ended", ended);
    return () => { audio.removeEventListener("timeupdate", update); audio.removeEventListener("ended", ended); };
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        onClick={() => { const a = audioRef.current; if (!a) return; playing ? a.pause() : a.play(); setPlaying(!playing); }}
        style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#4A5E4C,#6B8F6F)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
      >
        {playing ? <Pause size={18} color="#F5F2ED" /> : <Play size={18} color="#F5F2ED" style={{ marginLeft: 2 }} />}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#4A5E4C,#8AA88D)", borderRadius: 2, width: `${progress}%`, transition: "width 0.3s" }} />
        </div>
      </div>
    </div>
  );
}

export default function DeliveryExperiencePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = intro, then 0..N = entries
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    fetchDeliveryData(token).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [token]);

  const allContent = data ? [
    ...data.letters.map(l => ({ type: "letter" as const, authorName: l.authorName, content: l.content, createdAt: l.createdAt })),
    ...data.entries.map(e => ({ ...e })),
  ].sort((a, b) => a.createdAt - b.createdAt) : [];

  function advance() {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentIndex(i => i + 1);
      setFadeIn(true);
    }, 400);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0D0F0B", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 48, height: 48, border: "2px solid rgba(200,212,201,0.2)", borderTop: "2px solid #8AA88D", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "#0D0F0B", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia,serif", fontSize: 24, color: "#F5F2ED", marginBottom: 12 }}>This vault link has expired or doesn&apos;t exist.</p>
          <p style={{ fontSize: 14, color: "rgba(245,242,237,0.5)" }}>Contact whoever sent you this link for a new one.</p>
        </div>
      </div>
    );
  }

  const childFirst = data.childName.split(" ")[0];

  // Intro screen
  if (currentIndex === -1) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0D0F0B",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "60px 32px", textAlign: "center",
        opacity: fadeIn ? 1 : 0, transition: "opacity 600ms ease",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          border: "1.5px solid rgba(200,212,201,0.2)",
          background: "rgba(74,94,76,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 40,
        }}>
          <span style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "#C8D4C9" }}>Our Fable</span>
        </div>

        <p style={{
          fontFamily: "Georgia,serif", fontSize: 36, color: "#F5F2ED",
          lineHeight: 1.3, marginBottom: 24, maxWidth: 500, letterSpacing: "-0.01em",
        }}>
          Dear {childFirst},
        </p>

        <p style={{
          fontFamily: "-apple-system,sans-serif", fontSize: 18,
          color: "rgba(245,242,237,0.6)", lineHeight: 1.8, maxWidth: 440,
          marginBottom: 48,
        }}>
          The people who love you most have been writing to you since before you could read.
        </p>

        <button
          onClick={advance}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 32px", fontSize: 15, fontWeight: 600,
            background: "linear-gradient(135deg,#4A5E4C,#6B8F6F)",
            color: "#F5F2ED", border: "none", borderRadius: 12,
            cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.02em",
          }}
        >
          Begin <ChevronDown size={16} />
        </button>
      </div>
    );
  }

  // Outro screen
  if (currentIndex >= allContent.length) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0D0F0B",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "60px 32px", textAlign: "center",
        opacity: fadeIn ? 1 : 0, transition: "opacity 600ms ease",
      }}>
        <p style={{
          fontFamily: "Georgia,serif", fontSize: 28, color: "#F5F2ED",
          lineHeight: 1.4, marginBottom: 24, maxWidth: 500,
        }}>
          This is your story, written by the people who loved you first.
        </p>

        <p style={{
          fontSize: 14, color: "rgba(245,242,237,0.4)", marginBottom: 40,
        }}>
          {allContent.length} messages from your vault
        </p>

        <a
          href={`/api/ourfable/export?familyId=${data.familyId}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 24px", fontSize: 13, fontWeight: 600,
            background: "transparent", color: "rgba(245,242,237,0.6)",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
            textDecoration: "none", cursor: "pointer",
          }}
        >
          <Download size={14} /> Download everything
        </a>
      </div>
    );
  }

  // Content reveal
  const entry = allContent[currentIndex];

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0F0B",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "60px 32px",
      opacity: fadeIn ? 1 : 0, transition: "opacity 600ms ease",
    }}>
      <div style={{ maxWidth: 560, width: "100%" }}>
        {/* Author attribution */}
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "rgba(138,158,140,0.8)", marginBottom: 20,
        }}>
          Written by {entry.authorName} {timeAgoFromBirth(entry.createdAt)}
        </p>

        {/* Letter */}
        {entry.type === "letter" && entry.content && (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: "36px 32px",
          }}>
            <p style={{
              fontFamily: "Georgia,serif", fontSize: 18, color: "#F5F2ED",
              lineHeight: 1.8, whiteSpace: "pre-wrap",
            }}>
              {entry.content}
            </p>
          </div>
        )}

        {/* Photo */}
        {entry.type === "photo" && entry.mediaUrl && (
          <div>
            <img
              src={entry.mediaUrl}
              alt={`From ${entry.authorName}`}
              style={{ width: "100%", borderRadius: 16, marginBottom: 16 }}
            />
            {entry.content && (
              <p style={{ fontSize: 15, color: "rgba(245,242,237,0.7)", lineHeight: 1.7, fontStyle: "italic" }}>
                {entry.content}
              </p>
            )}
          </div>
        )}

        {/* Voice memo */}
        {entry.type === "voice" && entry.mediaUrl && (
          <div>
            <AudioPlayer url={entry.mediaUrl} />
            {entry.content && (
              <p style={{ fontSize: 14, color: "rgba(245,242,237,0.5)", marginTop: 12, fontStyle: "italic" }}>
                {entry.content}
              </p>
            )}
          </div>
        )}

        {/* Video */}
        {entry.type === "video" && entry.mediaUrl && (
          <div>
            <video
              src={entry.mediaUrl}
              controls
              style={{ width: "100%", borderRadius: 16, marginBottom: 16 }}
            />
            {entry.content && (
              <p style={{ fontSize: 14, color: "rgba(245,242,237,0.5)", fontStyle: "italic" }}>
                {entry.content}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
          <span style={{ fontSize: 12, color: "rgba(245,242,237,0.3)" }}>
            {currentIndex + 1} of {allContent.length}
          </span>
          <button
            onClick={advance}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 20px", fontSize: 13, fontWeight: 600,
              background: "linear-gradient(135deg,#4A5E4C,#6B8F6F)",
              color: "#F5F2ED", border: "none", borderRadius: 10,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {currentIndex + 1 >= allContent.length ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
