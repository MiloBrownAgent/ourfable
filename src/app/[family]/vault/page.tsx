"use client";
import React, { use, useEffect, useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import Link from "next/link";
import {
  FolderLock, Lock, Unlock, FileText, Image as ImageIcon,
  Mic, Video, ChevronDown, ChevronUp, Plus, X, Upload,
  CheckCircle, AlertCircle, FileAudio, FileVideo, GraduationCap,
  Heart, Calendar, Clock, Sparkles,
} from "lucide-react";
import { useChildContext } from "@/components/ChildContext";
import { useVaultKey } from "@/lib/vault-key-context";
import {
  encryptBlob,
  encryptText,
  hashContent,
  serializeEncryptedText,
} from "@/lib/vault-encryption";

// ─── Types ──────────────────────────────────────────────────────────────────

interface VaultEntry {
  _id: string;
  memberId: string;
  memberName: string;
  memberRelationship?: string;
  promptText?: string;
  contentType: "text" | "photo" | "voice" | "video" | "dispatch";
  textContent?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  mediaMimeType?: string;
  textDeferred?: boolean;
  isSealed: boolean;
  unlockAge?: number;
  createdAt?: number;
  sourceTable: "contributions" | "vault_entries"; // which Convex table
  sourceType?: string; // "letter" | "dispatch" | "prompt_reply"
  // Encryption
  encryptedBody?: string;
  contentHash?: string;
  encryptionVersion?: number;
  isEncrypted?: boolean;
  mediaEncryptionIv?: string;
  mediaEncryptionTag?: string;
  mediaEncryptionVersion?: number;
  mediaDeferred?: boolean;
}

interface Family {
  childName: string;
  childDob: string;
  familyName: string;
  parentNames?: string;
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

class VaultErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean }> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[vault] render crash", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, borderRadius: 12, border: "1px solid rgba(180,75,75,0.3)", background: "rgba(180,75,75,0.08)", color: "#FDFBF7" }}>
          <p style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,190,190,0.9)", marginBottom: 8 }}>
            Vault error
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            Part of the vault failed to render. The page stayed up instead of crashing. Reload once, and if it happens again we’ll know it’s a rendering fault, not your data disappearing.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

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

          {entry.sourceType && (
            <span style={{
              display: "inline-flex", alignItems: "center",
              border: "0.5px solid rgba(200,168,122,0.25)",
              borderRadius: 100, padding: "3px 10px", marginTop: 4,
              fontSize: 10, color: "rgba(200,168,122,0.6)", fontFamily: "var(--font-body)",
            }}>
              {entry.sourceType === "letter" ? "Letter" : entry.sourceType === "dispatch" ? "Dispatch" : entry.sourceType === "prompt_reply" ? "Prompt Reply" : entry.sourceType}
            </span>
          )}
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

function OpenCard({ entry, familyId }: { entry: VaultEntry; familyId: string }) {
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

          {entry.textDeferred ? (
            <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(253,251,247,0.08)" }}>
              <p style={{ fontSize: 12, color: "rgba(253,251,247,0.55)", lineHeight: 1.6, margin: 0 }}>
                Text is sealed safely, but deferred on first load to keep the vault stable on mobile.
              </p>
            </div>
          ) : entry.contentType === "text" && entry.textContent && (
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

          {entry.mediaDeferred ? (
            <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(253,251,247,0.08)" }}>
              <p style={{ fontSize: 12, color: "rgba(253,251,247,0.55)", lineHeight: 1.6, margin: 0 }}>
                Media is available, but deferred on first load to keep the vault stable on mobile.
              </p>
            </div>
          ) : (
            <>
              {entry.contentType === "photo" && (entry.mediaUrls && entry.mediaUrls.length > 0 ? (
                <div
                  className="vault-dispatch-media"
                  style={{
                  display: "flex", gap: 8, overflowX: "auto", marginTop: 6,
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(107,143,111,0.72) rgba(255,255,255,0.04)",
                  WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
                  paddingBottom: 8,
                }}>
                  {entry.mediaUrls.map((url, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={idx}
                      src={url}
                      alt={`Photo ${idx + 1} from ${entry.memberName}`}
                      style={{ height: 200, width: "auto", maxWidth: "none", objectFit: "contain", borderRadius: 10, flexShrink: 0, display: "block" }}
                    />
                  ))}
                </div>
              ) : entry.mediaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.mediaUrl}
                  alt={`Photo from ${entry.memberName}`}
                  style={{ maxWidth: "100%", width: "auto", height: "auto", objectFit: "contain", borderRadius: 10, marginTop: 6, display: "block" }}
                />
              ) : null)}

              {entry.contentType === "voice" && entry.mediaUrl && (
                <audio controls src={entry.mediaUrl} style={{ width: "100%", marginTop: 6 }} />
              )}

              {entry.contentType === "video" && entry.mediaUrl && (
                <video controls playsInline src={entry.mediaUrl} style={{ width: "100%", borderRadius: 10, marginTop: 6, maxHeight: 300, background: "#000" }}
                  webkit-playsinline=""
                />
              )}
            </>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {entry.sourceType === "dispatch" && entry.sourceTable === "vault_entries" && (
              <Link
                href={`/${familyId}/vault/dispatch/${entry._id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  border: "1px solid rgba(200,168,122,0.35)", borderRadius: 100,
                  padding: "5px 12px", fontSize: 11, color: "rgba(200,168,122,0.9)",
                  textDecoration: "none",
                }}
              >
                Open dispatch
              </Link>
            )}
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
            {entry.sourceType && (
              <span style={{
                display: "inline-flex", alignItems: "center",
                border: "0.5px solid rgba(200,168,122,0.3)",
                borderRadius: 100, padding: "3px 10px",
                fontSize: 10, color: "rgba(200,168,122,0.7)", fontFamily: "var(--font-body)",
              }}>
                {entry.sourceType === "letter" ? "Letter" : entry.sourceType === "dispatch" ? "Dispatch" : entry.sourceType === "prompt_reply" ? "Prompt Reply" : entry.sourceType}
              </span>
            )}
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
  status: "ready" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  storageId?: string;
  mediaType?: string;
  mediaMimeType?: string;
  mediaEncryptionIv?: string;
  mediaEncryptionTag?: string;
  mediaEncryptionVersion?: number;
}

function QuickAddModal({
  familyId,
  childDob,
  childFirst,
  onClose,
  onSuccess,
  parentName,
}: {
  familyId: string;
  childDob: string;
  childFirst: string;
  onClose: () => void;
  onSuccess: () => void;
  parentName: string;
}) {
  const { familyKey, isEncryptionEnabled } = useVaultKey();
  const [addType, setAddType] = useState<QuickAddType>("note");
  const [noteText, setNoteText] = useState("");
  const [caption, setCaption] = useState("");
  const [sealPreset, setSealPreset] = useState<SealPreset>("18th");
  const [customDate, setCustomDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentTypeConfig = QUICK_ADD_TYPES.find(t => t.key === addType)!;

  // ── File handling ────────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setUploadState({
      file,
      preview,
      status: "ready",
      progress: 0,
      mediaType: addType,
      mediaMimeType: file.type || "application/octet-stream",
    });
    setSubmitError("");
  }, [addType]);

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

  useEffect(() => {
    return () => {
      if (uploadState?.preview) URL.revokeObjectURL(uploadState.preview);
    };
  }, [uploadState?.preview]);

  const uploadEncryptedMedia = useCallback(async (
    file: File,
    encryptionKey: CryptoKey
  ): Promise<{ storageId: string; iv: string; tag: string }> => {
    const encrypted = await encryptBlob(file, encryptionKey);
    const uploadBlob = new Blob([encrypted.data], { type: "application/octet-stream" });

    const uploadUrlRes = await fetch("/api/ourfable/upload-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const uploadUrlData = await uploadUrlRes.json().catch(() => ({}));
    if (!uploadUrlRes.ok || !uploadUrlData.uploadUrl) {
      const err = uploadUrlData as { error?: string };
      throw new Error(err.error ?? "Upload failed");
    }

    setUploadState(prev => prev ? { ...prev, status: "uploading", progress: 25 } : prev);

    const uploadRes = await fetch(uploadUrlData.uploadUrl as string, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: uploadBlob,
    });
    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok || !uploadData.storageId) {
      const err = uploadData as { error?: string };
      throw new Error(err.error ?? "Upload failed");
    }

    setUploadState(prev => prev ? { ...prev, progress: 100 } : prev);

    return {
      storageId: uploadData.storageId as string,
      iv: encrypted.iv,
      tag: encrypted.tag,
    };
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitError("");

    // Validate
    if (addType === "note" && !noteText.trim()) return;
    if (addType !== "note" && !uploadState?.file) return;
    if (!isEncryptionEnabled || !familyKey) {
      setSubmitError("Unlock vault encryption before adding anything to the Vault.");
      return;
    }

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
        authorName: parentName || "Parent",
        isSealed,
        unlockAge: unlockAge ?? null,
      };

      const textBody = addType === "note" ? noteText.trim() : caption.trim();
      if (textBody) {
        const encrypted = await encryptText(textBody, familyKey);
        const hash = await hashContent(textBody);
        args.encryptedBody = serializeEncryptedText(encrypted);
        args.contentHash = hash;
        args.encryptionVersion = 1;
      }

      if (addType !== "note" && uploadState?.file) {
        const mediaMimeType = uploadState.file.type || "application/octet-stream";
        const upload = await uploadEncryptedMedia(uploadState.file, familyKey);
        args.mediaStorageId = upload.storageId;
        args.mediaMimeType = mediaMimeType;
        args.mediaEncryptionIv = upload.iv;
        args.mediaEncryptionTag = upload.tag;
        args.mediaEncryptionVersion = 1;
        setUploadState(prev => prev ? {
          ...prev,
          status: "done",
          progress: 100,
          storageId: upload.storageId,
          mediaMimeType,
          mediaEncryptionIv: upload.iv,
          mediaEncryptionTag: upload.tag,
          mediaEncryptionVersion: 1,
        } : prev);
      }

      const res = await fetch("/api/ourfable/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "ourfable:addOurFableVaultEntry",
          args,
          type: "mutation",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = data as { error?: string };
        throw new Error(err.error ?? "Failed to save entry");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setUploadState(prev => prev?.status === "uploading"
        ? { ...prev, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
        : prev);
      setSubmitError(err instanceof Error ? err.message : "Failed to save entry");
      setSubmitting(false);
    }
  };

  // ── Determine if submit is ready ─────────────────────────────────────────

  const canSubmit =
    addType === "note"
      ? noteText.trim().length > 0 && !!familyKey
      : !!uploadState?.file && !!familyKey;

  // ── Success state ────────────────────────────────────────────────────────

  if (success) {
    return (
      <div>
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
      </div>
    );
  }

  // ── Main modal ───────────────────────────────────────────────────────────

  return (
    <div>
      <div className="qa-overlay" onClick={onClose} />
      <div className="qa-modal">
        <div className="qa-shell">
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
            <div style={{
              width: 36, height: 4, borderRadius: 999,
              background: "rgba(26,26,24,0.14)",
            }} />
          </div>

          <div className="qa-head">
            <div>
              <p style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(74,94,76,0.7)",
                fontWeight: 600,
                marginBottom: 8,
              }}>
                Add to Vault
              </p>
              <h3 style={{
                fontFamily: "var(--font-cormorant)", fontSize: 32, fontWeight: 400, color: "var(--text)",
                lineHeight: 1.05, marginBottom: 6,
              }}>
                A note for {childFirst}
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
                Write it now, seal it for later.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#FFFFFF", border: "1px solid rgba(26,26,24,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--text-3)", flexShrink: 0,
              }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div className="qa-body">
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 8,
              marginBottom: 20,
            }}>
            {QUICK_ADD_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => {
                  setAddType(t.key);
                  setSubmitError("");
                  clearUpload();
                }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "12px 8px", borderRadius: 999, cursor: "pointer",
                  minHeight: 44,
                  background: addType === t.key ? "rgba(74,94,76,0.12)" : "rgba(255,255,255,0.86)",
                  border: `1px solid ${addType === t.key ? "rgba(74,94,76,0.3)" : "rgba(26,26,24,0.08)"}`,
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

            {addType === "note" ? (
              <div className="qa-card" style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <FileText size={15} strokeWidth={1.7} color="var(--green)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Letter
                  </span>
                </div>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder={`A thought, a memory, a wish for ${childFirst}...`}
                rows={8}
                style={{
                  width: "100%", padding: 0, borderRadius: 0,
                  border: "none", background: "transparent",
                  fontSize: 16, lineHeight: 1.9, color: "var(--text)",
                  fontFamily: "var(--font-body)", resize: "vertical", minHeight: 220,
                  outline: "none",
                }}
              />
              </div>
            ) : (
              <div className="qa-card" style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                      {addType === "photo" ? "Photo" : addType === "voice" ? "Voice Memo" : "Video"}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-3)" }}>
                      {addType === "photo"
                        ? "Add a single image from your camera roll or camera."
                        : addType === "voice"
                          ? "Attach one voice memo file."
                          : "Attach one video clip."}
                    </p>
                  </div>
                  {uploadState?.status === "done" && (
                    <CheckCircle size={18} color="var(--green)" />
                  )}
                </div>

              {!uploadState ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={onDrop}
                  style={{
                    border: `1.5px dashed ${isDragging ? "var(--green)" : "rgba(26,26,24,0.12)"}`,
                    borderRadius: 18, padding: "36px 24px", textAlign: "center",
                    cursor: "pointer", minHeight: 44,
                    background: isDragging ? "rgba(74,94,76,0.06)" : "rgba(247,243,236,0.72)",
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
                  borderRadius: 16, padding: "14px 16px", marginBottom: 18,
                  background: "#FFFFFF", border: `1.5px solid ${uploadState.status === "error" ? "#E07070" : "rgba(26,26,24,0.08)"}`,
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

                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder={`Add a note about this ${addType}...`}
                  rows={4}
                  style={{
                    width: "100%", padding: 0,
                    border: "none", background: "transparent",
                    fontSize: 15, lineHeight: 1.8, color: "var(--text)",
                    minHeight: 88, outline: "none", resize: "vertical",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>
            )}

            <div className="qa-card" style={{ marginBottom: 18 }}>
            <label style={{
              fontSize: 11, color: "var(--text-3)", textTransform: "uppercase",
              letterSpacing: "0.1em", marginBottom: 10, display: "block",
            }}>
              <Lock size={11} strokeWidth={2} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Seal until
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SEAL_PRESETS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setSealPreset(p.key)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", borderRadius: 999, cursor: "pointer",
                    minHeight: 44,
                    background: sealPreset === p.key
                      ? (p.key === "none" ? "rgba(107,143,111,0.14)" : "rgba(200,168,122,0.14)")
                      : "#FFFFFF",
                    border: `1px solid ${sealPreset === p.key
                      ? (p.key === "none" ? "rgba(107,143,111,0.28)" : "rgba(200,168,122,0.32)")
                      : "rgba(26,26,24,0.08)"}`,
                    color: sealPreset === p.key
                      ? (p.key === "none" ? "var(--sage)" : "var(--gold)")
                      : "var(--text-3)",
                    transition: "all 160ms",
                  }}
                >
                  {p.icon}
                  <span style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2, textAlign: "center" }}>
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
                    width: "100%", padding: "12px 16px", borderRadius: 14,
                    border: "1px solid rgba(200,168,122,0.32)", background: "rgba(200,168,122,0.08)",
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

            {submitError && (
              <p style={{ fontSize: 12, color: "#B44C4C", lineHeight: 1.5 }}>{submitError}</p>
            )}
          </div>
          </div>

          <div className="qa-foot">
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>
                {!familyKey
                  ? "Unlock vault encryption to save securely."
                  : sealPreset === "none"
                    ? "This will be visible right away."
                    : `This will be sealed for ${childFirst}.`}
              </p>
              <p style={{ fontSize: 11, color: "rgba(26,26,24,0.45)" }}>
                {addType === "note" ? "Letter" : addType === "photo" ? "Photo" : addType === "voice" ? "Voice memo" : "Video"} ready
                {addType === "note"
                  ? noteText.trim() ? " to save." : " when you add your words."
                  : uploadState?.file ? " to encrypt and save." : " when you choose a file."}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              style={{
                minWidth: 180, padding: "16px 20px", borderRadius: 999,
                background: canSubmit && !submitting ? "var(--green)" : "rgba(26,26,24,0.12)",
                color: canSubmit && !submitting ? "#fff" : "rgba(26,26,24,0.38)",
                border: "none", fontSize: 15, fontWeight: 600,
                cursor: canSubmit && !submitting ? "pointer" : "default",
                transition: "all 200ms", minHeight: 52,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                flexShrink: 0,
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
                  Add to Vault
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{quickAddStyles}</style>
    </div>
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
    max-height: min(92vh, 880px);
    background: linear-gradient(180deg, #FDFBF7 0%, #F6F1E8 100%);
    border-radius: 20px 20px 0 0;
    z-index: 1000;
    animation: qa-slideUp 300ms cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: 0 -20px 60px rgba(0,0,0,0.18);
    overflow: hidden;
  }

  .qa-shell {
    display: flex;
    flex-direction: column;
    max-height: inherit;
  }

  .qa-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 20px 18px;
    border-bottom: 1px solid rgba(26,26,24,0.06);
  }

  .qa-body {
    overflow-y: auto;
    flex: 1;
    padding: 20px;
  }

  .qa-card {
    background: rgba(255,255,255,0.76);
    border: 1px solid rgba(26,26,24,0.08);
    border-radius: 22px;
    padding: 18px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
  }

  .qa-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid rgba(26,26,24,0.06);
    background: rgba(253,251,247,0.94);
    backdrop-filter: blur(12px);
  }

  @media (min-width: 640px) {
    .qa-modal {
      left: 50%;
      right: auto;
      bottom: 50%;
      transform: translate(-50%, 50%);
      max-width: 640px;
      width: 100%;
      border-radius: 20px;
      max-height: min(88vh, 900px);
      animation: qa-fadeScale 300ms cubic-bezier(0.32, 0.72, 0, 1);
    }
  }

  @media (max-width: 639px) {
    .qa-foot {
      flex-direction: column;
      align-items: stretch;
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
  const [loadError, setLoadError] = useState<string>("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [personFilter, setPersonFilter] = useState<string>("all");
  const [personOpen, setPersonOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const queryArgs = childId ? { familyId, childId } : { familyId };
      const fetchData = async (path: string, args: Record<string, unknown>) => {
        const res = await fetch("/api/ourfable/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, args, format: "json" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err = data as { error?: string };
          throw new Error(err.error ?? `Failed to load ${path}`);
        }
        return data as { value?: unknown };
      };

      const [entriesResult, ourfableEntriesResult, familyResult] = await Promise.allSettled([
        fetchData("ourfable:listVaultEntries", { ...queryArgs, includeSealed: true }),
        fetchData("ourfable:listOurFableVaultEntries", queryArgs),
        fetchData("ourfable:getFamily", { familyId }),
      ]);

      const entriesRes = entriesResult.status === "fulfilled" ? entriesResult.value : { value: [] };
      const ourfableEntriesRes = ourfableEntriesResult.status === "fulfilled" ? ourfableEntriesResult.value : { value: [] };
      const familyRes = familyResult.status === "fulfilled" ? familyResult.value : { value: null };

      if (entriesResult.status === "rejected" && ourfableEntriesResult.status === "rejected") {
        throw new Error("Both vault data sources failed to load.");
      }

    // Normalize legacy contributions entries
    // SECURITY: Strip content from sealed entries — parents see metadata only
    const legacyEntries: VaultEntry[] = (Array.isArray(entriesRes.value) ? entriesRes.value : []).map((e: Record<string, unknown>) => {
      const sealed = e.isOpen === false || e.isSealed === true;
      const hasEncryptedBody = !!e.encryptedBody;
      return {
        _id: e._id as string,
        memberId: e.memberId as string ?? "",
        memberName: (e.memberName as string) ?? (e.authorName as string) ?? "Family Member",
        memberRelationship: e.memberRelationship as string | undefined,
        promptText: sealed ? undefined : (e.prompt as string | undefined),
        contentType: (e.type as string ?? e.contentType as string ?? "text") as VaultEntry["contentType"],
        textContent: sealed ? undefined : (hasEncryptedBody ? undefined : ((e.body as string) ?? (e.content as string) ?? (e.textContent as string))),
        mediaUrl: sealed ? undefined : ((e.photoUrl as string) ?? (e.audioUrl as string) ?? (e.videoUrl as string) ?? (e.mediaUrl as string)),
        mediaMimeType: e.mediaMimeType as string | undefined,
        isSealed: sealed,
        unlockAge: (e.unlocksAtAge as number) ?? (e.unlockAge as number),
        createdAt: (e.submittedAt as number) ?? (e.createdAt as number),
        sourceTable: "contributions" as const,
        sourceType: e.promptId || e.prompt ? "prompt_reply" : e.subject ? "letter" : "prompt_reply",
        encryptedBody: sealed ? undefined : (e.encryptedBody as string | undefined),
        contentHash: e.contentHash as string | undefined,
        encryptionVersion: e.encryptionVersion as number | undefined,
        isEncrypted: hasEncryptedBody,
        mediaEncryptionIv: e.mediaEncryptionIv as string | undefined,
        mediaEncryptionTag: e.mediaEncryptionTag as string | undefined,
        mediaEncryptionVersion: e.mediaEncryptionVersion as number | undefined,
      };
    });

    for (const entry of legacyEntries) {
      if (entry.encryptedBody && !entry.textContent && !entry.isSealed) {
        entry.textDeferred = true;
      }
      if (entry.mediaUrl && entry.mediaEncryptionIv && entry.mediaEncryptionTag && entry.mediaMimeType && !entry.isSealed) {
        entry.mediaDeferred = true;
      }
    }

    // Resolve parent name from family data
    const familyData = (familyRes.value as Family | null) ?? null;
    const parentNames = (familyData?.parentNames as string | undefined) ?? null;

    // Normalize ourfable_vault_entries
    // SECURITY: Strip content from sealed entries — parents see metadata only
    const ourfableEntries: VaultEntry[] = (Array.isArray(ourfableEntriesRes.value) ? ourfableEntriesRes.value : []).map((e: Record<string, unknown>) => {
      const sealed = e.isSealed === true;
      // Use stored authorName; fall back to parentNames if it's still "Parent"
      const rawName = (e.authorName as string) ?? "Parent";
      const displayName = (rawName === "Parent" && parentNames) ? parentNames : rawName;
      const hasEncryptedBody = !!e.encryptedBody;
      const entryType = (e.type as string) ?? "text";
      return {
        _id: e._id as string,
        memberId: "",
        memberName: displayName,
        memberRelationship: undefined,
        promptText: undefined,
        contentType: entryType as VaultEntry["contentType"],
        textContent: sealed ? undefined : (hasEncryptedBody ? undefined : (e.content as string | undefined)),
        mediaUrl: sealed ? undefined : ((e.photoUrl as string) ?? (e.audioUrl as string) ?? (e.videoUrl as string) ?? (e.mediaUrl as string)),
        mediaUrls: sealed ? undefined : (e.mediaUrls as string[] | undefined),
        mediaMimeType: e.mediaMimeType as string | undefined,
        isSealed: sealed,
        unlockAge: e.unlockAge as number | undefined,
        createdAt: e.createdAt as number | undefined,
        sourceTable: "vault_entries" as const,
        sourceType: (e.sourceType as string | undefined) ?? (entryType === "dispatch" ? "dispatch" : undefined),
        encryptedBody: sealed ? undefined : (e.encryptedBody as string | undefined),
        contentHash: e.contentHash as string | undefined,
        encryptionVersion: e.encryptionVersion as number | undefined,
        isEncrypted: hasEncryptedBody,
        mediaEncryptionIv: e.mediaEncryptionIv as string | undefined,
        mediaEncryptionTag: e.mediaEncryptionTag as string | undefined,
        mediaEncryptionVersion: e.mediaEncryptionVersion as number | undefined,
      };
    });

    for (const entry of ourfableEntries) {
      if (entry.encryptedBody && !entry.textContent && !entry.isSealed) {
        entry.textDeferred = true;
      }
      if (entry.mediaUrl && entry.mediaEncryptionIv && entry.mediaEncryptionTag && entry.mediaMimeType && !entry.isSealed) {
        entry.mediaDeferred = true;
      }
    }

    // Merge and sort by createdAt descending
    const merged = [...legacyEntries, ...ourfableEntries].sort(
      (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
    );

      setEntries(merged);
      setFamily((familyRes.value as Family | null) ?? null);
      if (entriesResult.status === "rejected" || ourfableEntriesResult.status === "rejected" || familyResult.status === "rejected") {
        setLoadError("Part of the vault data source failed, but the page stayed up and loaded what it could.");
      }
      setLoading(false);
    } catch (err) {
      console.error("[vault] load failed", err);
      setEntries([]);
      setFamily(null);
      setLoadError("The vault hit a loading fault. The page stayed up and we logged it.");
      setLoading(false);
    }
  }, [childId, familyId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const handleUnlock = async (entryId: string) => {
    if (!confirm("Unlock this entry early? This will open the entry for reading.")) return;
    try {
      const res = await fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "ourfable:unlockVaultEntryEarly",
          args: { familyId, entryId },
          type: "mutation",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to unlock: ${err.error ?? "Unknown error"}`);
        return;
      }
      await load();
    } catch (err) {
      alert("Failed to unlock entry. Please try again.");
      console.error("[vault] unlock error:", err);
    }
  };

  const childFirst = family?.childName?.split(" ")[0] ?? "them";
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
      <style>{`
        .vault-dispatch-media::-webkit-scrollbar {
          height: 10px;
        }

        .vault-dispatch-media::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.04);
          border-radius: 999px;
        }

        .vault-dispatch-media::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, rgba(107,143,111,0.92) 0%, rgba(74,94,76,0.92) 100%);
          border-radius: 999px;
          border: 2px solid rgba(20,32,22,0.92);
        }
      `}</style>
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

      {loadError && (
        <div style={{ padding: 16, borderRadius: 12, border: "1px solid rgba(180,75,75,0.3)", background: "rgba(180,75,75,0.08)", color: "#FDFBF7" }}>
          <p style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,190,190,0.9)", marginBottom: 6 }}>
            Vault load warning
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{loadError}</p>
        </div>
      )}

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

      <VaultErrorBoundary>
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
              : <OpenCard key={entry._id} entry={entry} familyId={familyId} />
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
          parentName={family.parentNames ?? "Parent"}
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => load()}
        />
      )}
      </VaultErrorBoundary>

      <style>{quickAddStyles}</style>
    </div>
  );
}
