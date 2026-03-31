"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Image as ImageIcon, Mic, Video } from "lucide-react";

interface DispatchEntry {
  _id: string;
  type?: string;
  content?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  audioUrl?: string;
  photoUrl?: string;
  videoUrl?: string;
  authorName?: string;
  createdAt?: number;
  sourceType?: string;
  childId?: string;
}

function formatDate(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function VaultDispatchDetailPage({ params }: { params: Promise<{ family: string; entryId: string }> }) {
  const { family: familyId, entryId } = use(params);
  const [entry, setEntry] = useState<DispatchEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/ourfable/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "ourfable:getOurFableVaultEntry",
            args: { familyId, entryId },
            format: "json",
          }),
        });
        const data = await res.json();
        const value = data?.value as DispatchEntry | null;
        if (!value || value.sourceType !== "dispatch") {
          setError("Dispatch not found.");
          setEntry(null);
          return;
        }
        setEntry(value);
      } catch (err) {
        console.error("[vault-dispatch] load failed", err);
        setError("Could not load this dispatch.");
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [familyId, entryId]);

  const gallery = entry?.mediaUrls?.length ? entry.mediaUrls : [entry?.photoUrl || entry?.mediaUrl].filter(Boolean) as string[];
  const videoUrl = entry?.videoUrl || (entry?.type === "video" ? entry?.mediaUrl : undefined);
  const audioUrl = entry?.audioUrl || (entry?.type === "voice" ? entry?.mediaUrl : undefined);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 24,
      background: "linear-gradient(160deg, #1C2B1E 0%, #142016 100%)",
      minHeight: "100vh",
      margin: "-40px -24px",
      padding: "40px 24px calc(80px + env(safe-area-inset-bottom, 0px))",
    }}>
      <Link href={`/${familyId}/vault`} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(200,168,122,0.9)", textDecoration: "none", fontSize: 13 }}>
        <ArrowLeft size={15} /> Back to vault
      </Link>

      {loading ? (
        <div style={{ padding: 28, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(253,251,247,0.06)", color: "rgba(253,251,247,0.55)" }}>Loading dispatch…</div>
      ) : error || !entry ? (
        <div style={{ padding: 28, borderRadius: 16, background: "rgba(180,75,75,0.08)", border: "1px solid rgba(180,75,75,0.25)", color: "#FDFBF7" }}>{error || "Dispatch not found."}</div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(200,168,122,0.9)", margin: 0 }}>
              Dispatch
            </p>
            <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 34, fontStyle: "italic", fontWeight: 400, color: "#FDFBF7", margin: 0 }}>
              Dispatch from {entry.authorName || "Parent"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", color: "rgba(253,251,247,0.45)", fontSize: 12 }}>
              <span>From {entry.authorName || "Parent"}</span>
              {entry.createdAt && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Calendar size={12} /> {formatDate(entry.createdAt)}</span>}
            </div>
          </div>

          {entry.content && (
            <div style={{ padding: 22, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(253,251,247,0.07)" }}>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 23, lineHeight: 1.75, color: "rgba(253,251,247,0.88)", margin: 0, whiteSpace: "pre-wrap" }}>
                {entry.content}
              </p>
            </div>
          )}

          {gallery.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {gallery.map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ display: "block", textDecoration: "none" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Dispatch image ${idx + 1}`} style={{ width: "100%", height: "auto", objectFit: "contain", borderRadius: 16, display: "block", background: "rgba(255,255,255,0.03)" }} />
                </a>
              ))}
            </div>
          )}

          {videoUrl && (
            <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(253,251,247,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(200,168,122,0.9)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
                <Video size={14} /> Video
              </div>
              <video controls playsInline src={videoUrl} style={{ width: "100%", borderRadius: 14, background: "#000" }} />
            </div>
          )}

          {audioUrl && (
            <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(253,251,247,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(200,168,122,0.9)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
                <Mic size={14} /> Voice memo
              </div>
              <audio controls src={audioUrl} style={{ width: "100%" }} />
            </div>
          )}

          {!gallery.length && !videoUrl && !audioUrl && (
            <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(253,251,247,0.07)", color: "rgba(253,251,247,0.55)", display: "flex", alignItems: "center", gap: 10 }}>
              <ImageIcon size={16} /> No media attached to this dispatch.
            </div>
          )}
        </>
      )}
    </div>
  );
}
