"use client";
import { useRef, useState, useCallback, DragEvent, ChangeEvent } from "react";
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, FileAudio, FileVideo, File } from "lucide-react";
import NextImage from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UploadedFile {
  r2Key: string;
  r2Url: string;
  mediaType: "photo" | "video" | "voice" | "document";
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface FileUploadProps {
  familyId: string;
  contributionType?: string;
  accept?: string;
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
  label?: string;
  hint?: string;
}

type FileState = {
  file: File;
  preview?: string; // object URL for images
  status: "pending" | "uploading" | "done" | "error";
  progress: number; // 0–100
  error?: string;
  result?: UploadedFile;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function FileTypeIcon({ fileType, size = 20 }: { fileType: string; size?: number }) {
  if (fileType.startsWith("image/")) return <ImageIcon size={size} />;
  if (fileType.startsWith("audio/")) return <FileAudio size={size} />;
  if (fileType.startsWith("video/")) return <FileVideo size={size} />;
  return <File size={size} />;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function FileUpload({
  familyId,
  contributionType = "direct",
  accept = "image/*,video/mp4,video/quicktime,audio/*",
  maxFiles = 10,
  onUploadComplete,
  onError,
  label = "Upload photos, videos, or voice notes",
  hint = "Drag & drop or click to browse",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileState[]>([]);

  // ── File selection ──────────────────────────────────────────────────────────

  const addFiles = useCallback((incoming: File[]) => {
    const newEntries: FileState[] = incoming.slice(0, maxFiles - files.length).map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      status: "pending",
      progress: 0,
    }));
    if (newEntries.length === 0) return;
    setFiles((prev) => [...prev, ...newEntries]);

    // Auto-upload each new file
    newEntries.forEach((entry) => uploadFile(entry.file));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.length, maxFiles, familyId, contributionType]);

  // ── Upload logic ────────────────────────────────────────────────────────────

  const uploadFile = async (file: File) => {
    // Mark as uploading
    setFiles((prev) =>
      prev.map((f) => f.file === file ? { ...f, status: "uploading", progress: 5 } : f)
    );

    try {
      // Step 1: Get presigned URL
      const metaRes = await fetch("/api/ourfable/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          familyId,
          contributionType,
        }),
      });

      if (!metaRes.ok) {
        const err = await metaRes.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }

      const { uploadUrl, r2Key, r2Url, mediaType } = await metaRes.json();

      setFiles((prev) =>
        prev.map((f) => f.file === file ? { ...f, progress: 20 } : f)
      );

      // Step 2: Upload directly to R2 via presigned URL using XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = 20 + Math.round((e.loaded / e.total) * 75);
            setFiles((prev) =>
              prev.map((f) => f.file === file ? { ...f, progress: pct } : f)
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`R2 upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      const result: UploadedFile = {
        r2Key,
        r2Url,
        mediaType,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };

      setFiles((prev) =>
        prev.map((f) =>
          f.file === file ? { ...f, status: "done", progress: 100, result } : f
        )
      );

      // Notify parent
      setFiles((prev) => {
        const done = prev.filter((f) => f.status === "done" && f.result).map((f) => f.result!);
        onUploadComplete?.(done);
        return prev;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setFiles((prev) =>
        prev.map((f) => f.file === file ? { ...f, status: "error", error: msg } : f)
      );
      onError?.(msg);
    }
  };

  // ── Drag handlers ───────────────────────────────────────────────────────────

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    addFiles(selected);
    e.target.value = ""; // reset so the same file can be re-selected
  };

  const removeFile = (file: File) => {
    setFiles((prev) => {
      const entry = prev.find((f) => f.file === file);
      if (entry?.preview) URL.revokeObjectURL(entry.preview);
      return prev.filter((f) => f.file !== file);
    });
  };

  const canAddMore = files.length < maxFiles;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Drop zone */}
      {canAddMore && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${isDragging ? "var(--green)" : "var(--border)"}`,
            borderRadius: 12,
            padding: "32px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: isDragging ? "var(--green-light)" : "var(--surface)",
            transition: "all 200ms",
          }}
        >
          <Upload
            size={32}
            strokeWidth={1.5}
            color={isDragging ? "var(--green)" : "var(--text-3)"}
            style={{ margin: "0 auto 12px", display: "block" }}
          />
          <p style={{
            fontFamily: "var(--font-playfair)",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 6,
          }}>
            {label}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>{hint}</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={onInputChange}
            style={{ display: "none" }}
          />
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {files.map((entry, i) => (
            <FileRow
              key={`${entry.file.name}-${i}`}
              entry={entry}
              onRemove={() => removeFile(entry.file)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── File Row ──────────────────────────────────────────────────────────────────

function FileRow({ entry, onRemove }: { entry: FileState; onRemove: () => void }) {
  const { file, preview, status, progress, error } = entry;

  const statusColor =
    status === "done" ? "var(--green)" :
    status === "error" ? "#E07070" :
    "var(--text-3)";

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "12px 14px",
      borderRadius: 10,
      background: "var(--surface)",
      border: `1px solid ${status === "error" ? "#E07070" : "var(--border)"}`,
    }}>
      {/* Preview or icon */}
      <div style={{
        width: 48, height: 48, flexShrink: 0, borderRadius: 6,
        overflow: "hidden", background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {preview ? (
          <NextImage src={preview} alt={file.name} fill style={{ objectFit: "cover" }} sizes="48px" />
        ) : (
          <FileTypeIcon fileType={file.type} size={22} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 500, color: "var(--text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginBottom: 4,
        }}>
          {file.name}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6 }}>
          {formatBytes(file.size)}
          {error && <span style={{ color: "#E07070", marginLeft: 8 }}>{error}</span>}
        </p>

        {/* Progress bar */}
        {(status === "uploading" || status === "done") && (
          <div style={{ height: 3, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "var(--green)",
              borderRadius: 2,
              transition: "width 200ms ease",
            }} />
          </div>
        )}
      </div>

      {/* Status icon / remove button */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {status === "done" && (
          <CheckCircle size={18} color="var(--green)" strokeWidth={2} />
        )}
        {status === "error" && (
          <AlertCircle size={18} color="#E07070" strokeWidth={2} />
        )}
        {(status === "pending" || status === "uploading" || status === "done" || status === "error") && (
          <button
            onClick={onRemove}
            style={{
              marginLeft: 8, padding: 4, cursor: "pointer",
              background: "none", border: "none", color: statusColor,
              display: "flex", alignItems: "center",
            }}
            title="Remove"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
