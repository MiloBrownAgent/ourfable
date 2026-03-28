"use client";
import { use, useEffect, useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import {
  FolderLock, Lock, Unlock, FileText, Image as ImageIcon,
  Mic, Video, ChevronDown, ChevronUp, Plus, X, Upload,
  CheckCircle, AlertCircle, FileAudio, FileVideo, GraduationCap,
  Heart, Calendar, Clock, Sparkles,
} from "lucide-react";
import { useChildContext } from "@/components/ChildContext";

// ─── Types ──────────────────────────────────────────────────────────────────

interface VaultEntry {
  _id: string;
  memberId: string;
  memberName: string;
  memberRelationship?: string;
  promptText?: string;
  contentType: "text" | "photo" | "voice" | "video";
  textContent?: string;
  mediaUrl?: string;
  isSealed: boolean;
  unlockAge?: number;
  createdAt?: number;
}

interface Family {
  childName: string;
  childDob: string;
  familyName: string;
}

type QuickAddType = "note" | "photo" | "voice" | "video";
type SealPreset = "13th" | "16th" | "18th" | "graduation" | "wedding" | "custom" | "none";

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <FileText size={12} strokeWidth={1.5} />,
  photo: <ImageIcon size={12} strokeWidth={1.5} />,
  voice: <Mic size={12} strokeWidth={1.5} />,
  video: <Video size={12} strokeWidth={1.5} />,
};

const QUICK_ADD_TYPES: { key: QuickAddType; label: string; icon: React.ReactNode; accept?: string }[] = [
  { key: "note", label: "Quick Note", icon: <FileText size={20} strokeWidth={1.5} /> },
  { key: "photo", label: "Photo", icon: <ImageIcon size={20} strokeWidth={1.5} />, accept: "image/*" },
  { key: "voice", label: "Voice Memo", icon: <Mic size={20} strokeWidth={1.5} />, accept: "audio/*" },
  { key: "video", label: "Video", icon: <Video size={20} strokeWidth={1.5} />, accept: "video/mp4,video/quicktime" },
];

const SEAL_PRESETS: { key: SealPreset; label: string; icon: React.ReactNode; age?: number }[] = [
  { key: "none", label: "Don\u2019t seal", icon: <Unlock size={16} strokeWidth={1.5} /> },
  { key: "13th", label: "13th birthday", icon: <Sparkles size={16} strokeWidth={1.5} />, age: 13 },
  { key: "16th", label: "16th birthday", icon: <Sparkles size={16} strokeWidth={1.5} />, age: 16 },
  { key: "18th", label: "18th birthday", icon: <GraduationCap size={16} strokeWidth={1.5} />, age: 18 },
  { key: "graduation", label: "Graduation", icon: <GraduationCap size={16} strokeWidth={1.5} />, age: 18 },
  { key: "wedding", label: "Wedding day", icon: <Heart size={16} strokeWidth={1.5} /> },
  { key: "custom", label: "Custom date", icon: <Calendar size={16} strokeWidth={1.5} /> },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(ts?: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getNextPromptDate(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function computeAgeFromCustomDate(childDob: string, customDate: string): number | undefined {
  if (!childDob || !customDate) return undefined;
  const dob = new Date(childDob + "T00:00:00");
  const target = new Date(customDate + "T00:00:00");
  const diffYears = (target.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.round(diffYears));
}

// ─── Existing Card Components ───────────────────────────────────────────────

function SealedCard({ entry, onUnlock }: { entry: VaultEntry; onUnlock: (id: string) => void }) {
  return (
    <div style={{
      padding: 24,
      borderLeft: "3px solid rgba(200,168,122,0.55)",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(253,251,247,0.07)",
      borderRadius: 12,
      transition: "background 200ms",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "rgba(200,168,122,0.08)", border: "1px solid rgba(200,168,122,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Lock size={16} color="rgba(200,168,122,0.9)" strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 400, fontStyle: "italic", color: "#FDFBF7" }}>
              {entry.memberName}
            </p>
            {entry.memberRelationship && (
              <span style={{ fontSize: 10, color: "rgba(253,251,247,0.45)" }}>· {entry.memberRelationship}</span>
            )}
          </div>

          {/* Sealed: metadata only — no content, no prompts, no previews */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              border: "0.5px solid rgba(200,168,122,0.45)",
              borderRadius: 100, padding: "3px 10px",
              fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(200,168,122,0.9)", fontFamily: "var(--font-body)",
            }}>
              <Lock size={9} strokeWidth={2} />
              Sealed
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              border: "0.5px solid rgba(253,251,247,0.15)",
              borderRadius: 100, padding: "3px 10px",
              fontSize: 10, letterSpacing: "0.05em", textTransform: "capitalize",
              color: "rgba(253,251,247,0.4)", fontFamily: "var(--font-body)",
            }}>
              {TYPE_ICONS[entry.contentType]}
              {entry.contentType}
            </span>
            {entry.unlockAge != null && (
              <span style={{
                display: "inline-flex", alignItems: "center",
                border: "0.5px solid rgba(253,251,247,0.15)",
                borderRadius: 100, padding: "3px 10px",
                fontSize: 10, color: "rgba(253,251,247,0.4)", fontFamily: "var(--font-body)",
              }}>
                Opens at {entry.unlockAge}
              </span>
            )}
          </div>

          {entry.createdAt && (
            <p style={{ fontSize: 11, color: "rgba(253,251,247,0.25)", marginTop: 10 }}>
              Sealed {formatDate(entry.createdAt)}
            </p>
          )}
        </div>

        <button
          onClick={() => onUnlock(entry._id)}
          style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(253,251,247,0.12)",
            borderRadius: 8, padding: "7px 14px", fontSize: 11,
            color: "rgba(253,251,247,0.45)", cursor: "pointer", flexShrink: 0,
            transition: "all 160ms", whiteSpace: "nowrap",
          }}
        >
          Unlock early
        </button>
      </div>
    </div>
  );
}

function OpenCard({ entry }: { entry: VaultEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      padding: 24,
      borderLeft: "3px solid rgba(107,143,111,0.45)",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(253,251,247,0.07)",
      borderRadius: 12,
      transition: "background 200ms",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "rgba(107,143,111,0.1)", border: "1px solid rgba(107,143,111,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Unlock size={16} color="rgba(107,143,111,0.9)" strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 400, fontStyle: "italic", color: "#FDFBF7" }}>
              {entry.memberName}
            </p>
            {entry.memberRelationship && (
              <span style={{ fontSize: 10, color: "rgba(253,251,247,0.45)" }}>· {entry.memberRelationship}</span>
            )}
          </div>

          {entry.promptText && (
            <p style={{ fontSize: 12, color: "rgba(253,251,247,0.4)", fontStyle: "italic", marginBottom: 10 }}>
              &ldquo;{entry.promptText}&rdquo;
            </p>
          )}

          {entry.contentType === "text" && entry.textContent && (
            <div>
              <p style={{
                fontSize: 14, color: "rgba(253,251,247,0.75)", lineHeight: 1.8,
                overflow: expanded ? "visible" : "hidden",
                display: expanded ? "block" : "-webkit-box",
                WebkitLineClamp: expanded ? undefined : 3,
                WebkitBoxOrient: "vertical",
              } as React.CSSProperties}>
                {entry.textContent}
              </p>
              {entry.textContent.length > 200 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(200,168,122,0.9)", fontSize: 11, padding: "6px 0",
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
                </button>
              )}
            </div>
          )}

          {entry.contentType === "photo" && entry.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.mediaUrl}
              alt={`Photo from ${entry.memberName}`}
              style={{ maxWidth: "100%", borderRadius: 10, marginTop: 6, display: "block" }}
            />
          )}

          {entry.contentType === "voice" && entry.mediaUrl && (
            <audio controls src={entry.mediaUrl} style={{ width: "100%", marginTop: 6 }} />
          )}

          {entry.contentType === "video" && entry.mediaUrl && (
            <video controls src={entry.mediaUrl} style={{ width: "100%", borderRadius: 10, marginTop: 6 }} />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              border: "0.5px solid rgba(107,143,111,0.35)",
              borderRadius: 100, padding: "3px 10px",
              fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(107,143,111,0.9)", fontFamily: "var(--font-body)",
            }}>
              <Unlock size={9} strokeWidth={2} />
              Open
            </span>
            {entry.createdAt && (
              <p style={{ fontSize: 11, color: "rgba(253,251,247,0.25)" }}>
                Written {formatDate(entry.createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Add Modal ────────────────────────────────────────────────────────

interface UploadState {
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  r2Url?: string;
  mediaType?: string;
}

function QuickAddModal({
  familyId,
  childDob,
  childFirst,
  onClose,
  onSuccess,
}: {
  familyId: string;
  childDob: string;
  childFirst: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [addType, setAddType] = useState<QuickAddType>("note");
  const [noteText, setNoteText] = useState("");
  const [caption, setCaption] = useState("");
  const [sealPreset, setSealPreset] = useState<SealPreset>("18th");
  const [customDate, setCustomDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentTypeConfig = QUICK_ADD_TYPES.find(t => t.key === addType)!;

  // ── File handling ────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setUploadState({ file, preview, status: "uploading", progress: 5 });

    try {
      const metaRes = await fetch("/api/ourfable/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          familyId,
          contributionType: "quick-add",
        }),
      });

      if (!metaRes.ok) {
        const err = await metaRes.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }

      const { uploadUrl, r2Url, mediaType } = await metaRes.json();
      setUploadState(prev => prev ? { ...prev, progress: 20 } : prev);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = 20 + Math.round((e.loaded / e.total) * 75);
            setUploadState(prev => prev ? { ...prev, progress: pct } : prev);
          }
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setUploadState(prev => prev ? { ...prev, status: "done", progress: 100, r2Url, mediaType } : prev);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadState(prev => prev ? { ...prev, status: "error", error: msg } : prev);
    }
  }, [familyId]);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const clearUpload = () => {
    if (uploadState?.preview) URL.revokeObjectURL(uploadState.preview);
    setUploadState(null);
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (submitting) return;

    // Validate
    if (addType === "note" && !noteText.trim()) return;
    if (addType !== "note" && uploadState?.status !== "done") return;

    setSubmitting(true);

    try {
      // Compute seal params
      let isSealed = true;
      let unlockAge: number | undefined;

      const preset = SEAL_PRESETS.find(p => p.key === sealPreset);
      if (sealPreset === "none") {
        isSealed = false;
      } else if (sealPreset === "custom" && customDate && childDob) {
        unlockAge = computeAgeFromCustomDate(childDob, customDate);
      } else if (preset?.age) {
        unlockAge = preset.age;
      }

      // Map type to content type string
      const typeMap: Record<QuickAddType, string> = {
        note: "text",
        photo: "photo",
        voice: "voice",
        video: "video",
      };

      const args: Record<string, unknown> = {
        familyId,
        type: typeMap[addType],
        authorEmail: "parent@family",
        authorName: "Parent",
        isSealed,
        unlockAge: unlockAge ?? null,
      };

      if (addType === "note") {
        args.content = noteText.trim();
      } else {
        args.mediaUrl = uploadState?.r2Url ?? null;
        if (caption.trim()) args.content = caption.trim();
      }

      await fetch("/api/ourfable/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "ourfable:addOurFableVaultEntry",
          args,
          type: "mutation",
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      setSubmitting(false);
    }
  };

  // ── Determine if submit is ready ─────────────────────────────────────────

  const canSubmit =
    addType === "note"
      ? noteText.trim().length > 0
      : uploadState?.status === "done";

  // ── Success state ────────────────────────────────────────────────────────

  if (success) {
    return (
      <>
        <div className="qa-overlay" onClick={onClose} />
        <div className="qa-modal">
          <div style={{ padding: "64px 24px", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "var(--green-light)", border: "2px solid var(--green)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <CheckCircle size={28} color="var(--green)" strokeWidth={1.5} />
            </div>
            <h3 style={{
              fontFamily: "var(--font-cormorant)", fontSize: 24, fontWeight: 300,
              color: "var(--text)", marginBottom: 8,
            }}>
              Added to the Vault
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
              {sealPreset === "none"
                ? `Your ${addType === "note" ? "note" : addType} has been saved.`
                : `Sealed for ${childFirst} — they\u2019ll find it when the time is right.`}
            </p>
          </div>
        </div>
        <style>{quickAddStyles}</style>
      </>
    );
  }

  // ── Main modal ───────────────────────────────────────────────────────────

  return (
    <>
      <div className="qa-overlay" onClick={onClose} />
      <div className="qa-modal">
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: "var(--border-dark)", opacity: 0.5,
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 20px 16px",
        }}>
          <h3 style={{
            fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 300, color: "var(--text)",
          }}>
            Add to Vault
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "var(--surface)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--text-3)",
            }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 20px" }}>

          {/* Type selector */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 24,
          }}>
            {QUICK_ADD_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => { setAddType(t.key); clearUpload(); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "14px 8px", borderRadius: 12, cursor: "pointer",
                  minHeight: 44,
                  background: addType === t.key ? "var(--green-light)" : "var(--surface)",
                  border: `1.5px solid ${addType === t.key ? "var(--green)" : "var(--border)"}`,
                  color: addType === t.key ? "var(--green)" : "var(--text-3)",
                  transition: "all 160ms",
                }}
              >
                {t.icon}
                <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.2, textAlign: "center" }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          {/* Content area */}
          {addType === "note" ? (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, display: "block" }}>
                Your note
              </label>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder={`A thought, a memory, a wish for ${childFirst}...`}
                rows={5}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 12,
                  border: "1.5px solid var(--border)", background: "var(--surface)",
                  fontSize: 15, lineHeight: 1.7, color: "var(--text)",
                  fontFamily: "inherit", resize: "vertical", minHeight: 120,
                }}
              />
            </div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              {/* Upload zone */}
              {!uploadState ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={onDrop}
                  style={{
                    border: `2px dashed ${isDragging ? "var(--green)" : "var(--border)"}`,
                    borderRadius: 12, padding: "36px 24px", textAlign: "center",
                    cursor: "pointer", minHeight: 44,
                    background: isDragging ? "var(--green-light)" : "var(--surface)",
                    transition: "all 200ms", marginBottom: 16,
                  }}
                >
                  <Upload
                    size={28} strokeWidth={1.5}
                    color={isDragging ? "var(--green)" : "var(--text-3)"}
                    style={{ margin: "0 auto 10px", display: "block" }}
                  />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>
                    {addType === "photo" ? "Upload a photo" : addType === "voice" ? "Upload a voice memo" : "Upload a video"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                    Drag & drop or tap to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={currentTypeConfig.accept}
                    onChange={onFileInput}
                    style={{ display: "none" }}
                  />
                </div>
              ) : (
                <div style={{
                  borderRadius: 12, padding: "14px 16px", marginBottom: 16,
                  background: "var(--surface)", border: `1.5px solid ${uploadState.status === "error" ? "#E07070" : "var(--border)"}`,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  {/* Preview */}
                  <div style={{
                    width: 48, height: 48, flexShrink: 0, borderRadius: 8,
                    overflow: "hidden", background: "var(--bg)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {uploadState.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={uploadState.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : uploadState.file.type.startsWith("audio/") ? (
                      <FileAudio size={20} color="var(--text-3)" />
                    ) : (
                      <FileVideo size={20} color="var(--text-3)" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 500, color: "var(--text)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4,
                    }}>
                      {uploadState.file.name}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6 }}>
                      {formatBytes(uploadState.file.size)}
                      {uploadState.error && <span style={{ color: "#E07070", marginLeft: 8 }}>{uploadState.error}</span>}
                    </p>
                    {(uploadState.status === "uploading" || uploadState.status === "done") && (
                      <div style={{ height: 3, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${uploadState.progress}%`,
                          background: "var(--green)", borderRadius: 2, transition: "width 200ms",
                        }} />
                      </div>
                    )}
                  </div>

                  <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    {uploadState.status === "done" && <CheckCircle size={18} color="var(--green)" />}
                    {uploadState.status === "error" && <AlertCircle size={18} color="#E07070" />}
                    <button
                      onClick={clearUpload}
                      style={{
                        width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                        background: "none", border: "none", cursor: "pointer", color: "var(--text-3)",
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Caption */}
              <label style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, display: "block" }}>
                Caption <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder={`Add a note about this ${addType}...`}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 10,
                  border: "1.5px solid var(--border)", background: "var(--surface)",
                  fontSize: 14, color: "var(--text)", minHeight: 44,
                }}
              />
            </div>
          )}

          {/* Seal date picker */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontSize: 11, color: "var(--text-3)", textTransform: "uppercase",
              letterSpacing: "0.1em", marginBottom: 10, display: "block",
            }}>
              <Lock size={11} strokeWidth={2} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Seal until
            </label>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
            }}>
              {SEAL_PRESETS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setSealPreset(p.key)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "12px 6px", borderRadius: 10, cursor: "pointer",
                    minHeight: 44,
                    background: sealPreset === p.key
                      ? (p.key === "none" ? "var(--sage-dim)" : "var(--gold-dim)")
                      : "var(--surface)",
                    border: `1.5px solid ${sealPreset === p.key
                      ? (p.key === "none" ? "var(--sage-border)" : "var(--gold-border)")
                      : "var(--border)"}`,
                    color: sealPreset === p.key
                      ? (p.key === "none" ? "var(--sage)" : "var(--gold)")
                      : "var(--text-3)",
                    transition: "all 160ms",
                  }}
                >
                  {p.icon}
                  <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1.2, textAlign: "center" }}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom date input */}
            {sealPreset === "custom" && (
              <div style={{ marginTop: 12 }}>
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 10,
                    border: "1.5px solid var(--gold-border)", background: "var(--gold-dim)",
                    fontSize: 14, color: "var(--text)", minHeight: 44,
                  }}
                />
                {customDate && childDob && (
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>
                    {childFirst} will be ~{computeAgeFromCustomDate(childDob, customDate)} years old
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            style={{
              width: "100%", padding: "16px", borderRadius: 12,
              background: canSubmit && !submitting ? "var(--green)" : "var(--border)",
              color: canSubmit && !submitting ? "#fff" : "var(--text-3)",
              border: "none", fontSize: 15, fontWeight: 600,
              cursor: canSubmit && !submitting ? "pointer" : "default",
              transition: "all 200ms", minHeight: 52,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {submitting ? (
              <>
                <Clock size={16} className="qa-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={2} />
                Add to {childFirst}&apos;s Vault
              </>
            )}
          </button>
        </div>
      </div>
      <style>{quickAddStyles}</style>
    </>
  );
}

// ─── Quick Add Styles ───────────────────────────────────────────────────────

const quickAddStyles = `
  .qa-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(4px);
    z-index: 999;
    animation: qa-fadeIn 200ms ease;
  }

  .qa-modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 85vh;
    background: var(--bg);
    border-radius: 20px 20px 0 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    animation: qa-slideUp 300ms cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: 0 -8px 40px rgba(0,0,0,0.12);
  }

  @media (min-width: 640px) {
    .qa-modal {
      left: 50%;
      right: auto;
      bottom: 50%;
      transform: translate(-50%, 50%);
      max-width: 480px;
      width: 100%;
      border-radius: 20px;
      max-height: 85vh;
      animation: qa-fadeScale 300ms cubic-bezier(0.32, 0.72, 0, 1);
    }
  }

  .qa-fab {
    position: fixed;
    bottom: calc(24px + env(safe-area-inset-bottom, 0px));
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--green);
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(74, 94, 76, 0.35), 0 2px 8px rgba(0,0,0,0.1);
    z-index: 100;
    transition: all 200ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  .qa-fab:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 28px rgba(74, 94, 76, 0.45), 0 3px 12px rgba(0,0,0,0.12);
  }

  .qa-fab:active {
    transform: scale(0.95);
  }

  @keyframes qa-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes qa-slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  @keyframes qa-fadeScale {
    from { opacity: 0; transform: translate(-50%, 50%) scale(0.95); }
    to { opacity: 1; transform: translate(-50%, 50%) scale(1); }
  }

  .qa-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ─── Main Page ──────────────────────────────────────────────────────────────

type FilterTab = "all" | "sealed" | "open";

export default function VaultPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);
  const { selectedChild } = useChildContext();
  const childId = selectedChild?.childId || selectedChild?._id;
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [personFilter, setPersonFilter] = useState<string>("all");
  const [personOpen, setPersonOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const load = async () => {
    const queryArgs = childId ? { familyId, childId } : { familyId };
    const [entriesRes, ourfableEntriesRes, familyRes] = await Promise.all([
      fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:listVaultEntries", args: { ...queryArgs }, format: "json" }),
      }).then(r => r.json()),
      fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:listOurFableVaultEntries", args: { ...queryArgs }, format: "json" }),
      }).then(r => r.json()),
      fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId }, format: "json" }),
      }).then(r => r.json()),
    ]);

    // Normalize legacy contributions entries
    // SECURITY: Strip content from sealed entries — parents see metadata only
    const legacyEntries: VaultEntry[] = (entriesRes.value ?? []).map((e: Record<string, unknown>) => {
      const sealed = e.isOpen === false || e.isSealed === true;
      return {
        _id: e._id as string,
        memberId: e.memberId as string ?? "",
        memberName: (e.memberName as string) ?? (e.authorName as string) ?? "Family Member",
        memberRelationship: e.memberRelationship as string | undefined,
        promptText: sealed ? undefined : (e.prompt as string | undefined),
        contentType: (e.type as string ?? e.contentType as string ?? "text") as VaultEntry["contentType"],
        textContent: sealed ? undefined : ((e.body as string) ?? (e.content as string) ?? (e.textContent as string)),
        mediaUrl: sealed ? undefined : ((e.photoUrl as string) ?? (e.audioUrl as string) ?? (e.videoUrl as string) ?? (e.mediaUrl as string)),
        isSealed: sealed,
        unlockAge: (e.unlocksAtAge as number) ?? (e.unlockAge as number),
        createdAt: (e.submittedAt as number) ?? (e.createdAt as number),
      };
    });

    // Normalize ourfable_vault_entries
    // SECURITY: Strip content from sealed entries — parents see metadata only
    const ourfableEntries: VaultEntry[] = (ourfableEntriesRes.value ?? []).map((e: Record<string, unknown>) => {
      const sealed = e.isSealed === true;
      return {
        _id: e._id as string,
        memberId: "",
        memberName: (e.authorName as string) ?? "Parent",
        memberRelationship: undefined,
        promptText: undefined,
        contentType: (e.type as string ?? "text") as VaultEntry["contentType"],
        textContent: sealed ? undefined : (e.content as string | undefined),
        mediaUrl: sealed ? undefined : (e.mediaUrl as string | undefined),
        isSealed: sealed,
        unlockAge: e.unlockAge as number | undefined,
        createdAt: e.createdAt as number | undefined,
      };
    });

    // Merge and sort by createdAt descending
    const merged = [...legacyEntries, ...ourfableEntries].sort(
      (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
    );

    setEntries(merged);
    setFamily(familyRes.value ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [familyId, childId]);

  const handleUnlock = async (entryId: string) => {
    if (!confirm("Unlock this entry early? The contributor will be notified.")) return;
    await fetch(`/api/ourfable/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:unlockEntry", args: { entryId }, type: "mutation" }),
    });
    await load();
  };

  const childFirst = family?.childName.split(" ")[0] ?? "them";
  const sealed = entries.filter(e => e.isSealed);
  const open = entries.filter(e => !e.isSealed);

  const uniquePeople = Array.from(new Set(entries.map(e => e.memberName)));

  let filtered = entries;
  if (filter === "sealed") filtered = sealed;
  if (filter === "open") filtered = open;
  if (personFilter !== "all") filtered = filtered.filter(e => e.memberName === personFilter);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: entries.length },
    { key: "sealed", label: "Sealed", count: sealed.length },
    { key: "open", label: "Open", count: open.length },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 28,
      background: "linear-gradient(160deg, #1C2B1E 0%, #142016 100%)",
      minHeight: "100vh",
      margin: "-40px -24px",
      padding: "40px 24px calc(80px + env(safe-area-inset-bottom, 0px))",
      position: "relative",
    }}>
      {/* Ambient gold glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 60% 10%, rgba(200,168,122,0.09), transparent 70%)",
      }} />

      {/* Header */}
      <div style={{ position: "relative" }}>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 11, fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(200,168,122,0.9)",
          marginBottom: 10,
        }}>
          THE VAULT
        </p>
        <div style={{
          width: 40, height: "0.5px",
          background: "rgba(200,168,122,0.4)",
          marginBottom: 20,
        }} />
        <h1 className="font-display" style={{
          fontSize: 28, fontWeight: 400, fontStyle: "italic",
          color: "#FDFBF7", marginBottom: 8, lineHeight: 1.25,
        }}>
          Sealed memories for {childFirst}
        </h1>
        <p style={{ fontSize: 12, color: "rgba(253,251,247,0.4)", lineHeight: 1.6 }}>
          Everything the people who love {childFirst} have shared — sealed until {childFirst} is ready.
        </p>
      </div>

      {/* Stats bar */}
      {!loading && entries.length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Total", value: entries.length, color: "rgba(253,251,247,0.85)" },
            { label: "Sealed", value: sealed.length, color: "rgba(200,168,122,0.9)" },
            { label: "Open", value: open.length, color: "rgba(107,143,111,0.9)" },
          ].map(s => (
            <div key={s.label} style={{
              flex: "1 1 80px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(253,251,247,0.07)",
              borderRadius: 12, padding: "14px 20px", textAlign: "center",
            }}>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 28, fontWeight: 300, color: s.color, lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(253,251,247,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {!loading && entries.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                background: "transparent",
                border: `1px solid ${filter === tab.key ? "rgba(200,168,122,0.55)" : "rgba(253,251,247,0.1)"}`,
                color: filter === tab.key ? "rgba(200,168,122,0.9)" : "rgba(253,251,247,0.35)",
                borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer",
                transition: "all 160ms", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {tab.label}
              <span style={{
                background: filter === tab.key ? "rgba(200,168,122,0.15)" : "rgba(255,255,255,0.05)",
                color: filter === tab.key ? "rgba(200,168,122,0.9)" : "rgba(253,251,247,0.25)",
                borderRadius: 20, padding: "1px 7px", fontSize: 10,
              }}>
                {tab.count}
              </span>
            </button>
          ))}

          {/* Person dropdown */}
          {uniquePeople.length > 1 && (
            <div style={{ position: "relative", marginLeft: "auto" }}>
              <button
                onClick={() => setPersonOpen(!personOpen)}
                style={{
                  background: "transparent",
                  border: `1px solid ${personFilter !== "all" ? "rgba(200,168,122,0.55)" : "rgba(253,251,247,0.1)"}`,
                  color: personFilter !== "all" ? "rgba(200,168,122,0.9)" : "rgba(253,251,247,0.35)",
                  borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {personFilter === "all" ? "By person" : personFilter}
                <ChevronDown size={12} strokeWidth={2} />
              </button>
              {personOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 10,
                  background: "#1C2B1E", border: "1px solid rgba(253,251,247,0.12)",
                  borderRadius: 10, overflow: "hidden", minWidth: 160,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}>
                  {["all", ...uniquePeople].map(p => (
                    <button
                      key={p}
                      onClick={() => { setPersonFilter(p); setPersonOpen(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "10px 14px", fontSize: 12, cursor: "pointer",
                        background: personFilter === p ? "rgba(200,168,122,0.1)" : "transparent",
                        color: personFilter === p ? "rgba(200,168,122,0.9)" : "rgba(253,251,247,0.55)",
                        border: "none",
                      }}
                    >
                      {p === "all" ? "Everyone" : p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              padding: 24, height: 100, borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(253,251,247,0.05)",
            }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div style={{
          padding: "64px 32px", textAlign: "center",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(253,251,247,0.06)",
          borderRadius: 16,
        }}>
          <FolderLock size={32} color="rgba(200,168,122,0.4)" strokeWidth={1} style={{ margin: "0 auto 20px" }} />
          <p style={{
            fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: 22,
            color: "rgba(253,251,247,0.65)", marginBottom: 10,
          }}>
            The Vault is waiting for its first letter.
          </p>
          <p style={{ fontSize: 13, color: "rgba(253,251,247,0.3)", lineHeight: 1.7, marginBottom: 24 }}>
            Your circle members will begin receiving prompts on {getNextPromptDate()}.
            <br />Their responses will appear here, sealed in time.
          </p>
          <button
            onClick={() => setShowQuickAdd(true)}
            style={{
              background: "rgba(200,168,122,0.15)", color: "rgba(200,168,122,0.9)",
              border: "1px solid rgba(200,168,122,0.35)",
              borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 500,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
              letterSpacing: "0.02em",
            }}
          >
            <Plus size={16} strokeWidth={2} />
            Add the first entry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: 48, textAlign: "center",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(253,251,247,0.05)",
          borderRadius: 16,
        }}>
          <p style={{ fontSize: 14, color: "rgba(253,251,247,0.3)" }}>No entries match this filter.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(entry =>
            entry.isSealed
              ? <SealedCard key={entry._id} entry={entry} onUnlock={handleUnlock} />
              : <OpenCard key={entry._id} entry={entry} />
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="qa-fab"
        onClick={() => setShowQuickAdd(true)}
        aria-label="Quick add to vault"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Quick Add Modal */}
      {showQuickAdd && family && (
        <QuickAddModal
          familyId={familyId}
          childDob={family.childDob}
          childFirst={childFirst}
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => load()}
        />
      )}

      <style>{quickAddStyles}</style>
    </div>
  );
}
