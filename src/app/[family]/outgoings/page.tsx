"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { Send, ChevronDown, ChevronUp, Check, Users, User, Loader2, Sparkles, ArrowRight, Paperclip, X, Mic, Video, Image as ImageIcon, Square } from "lucide-react";
import Link from "next/link";
import { useChildContext } from "@/components/ChildContext";

interface UploadedFile {
  mediaType: "photo" | "video" | "voice" | "document";
  fileName: string;
  fileType: string;
  fileSize: number;
  mediaUrl: string;
  storageId: string;
}

interface CircleMember {
  _id: string;
  name: string;
  relationship: string;
  email?: string;
}

interface Outgoing {
  _id: string;
  subject: string;
  body: string;
  sentToAll: boolean;
  sentToMemberIds?: string[];
  sentAt: number;
  sentByName: string;
  recipientCount?: number;
  mediaType?: string;
  mediaUrls?: string[];
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  if (MediaRecorder.isTypeSupported("audio/aac")) return "audio/aac";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  return "";
}

function getVideoMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("video/mp4")) return "video/mp4";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) return "video/webm;codecs=vp9,opus";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) return "video/webm;codecs=vp8,opus";
  if (MediaRecorder.isTypeSupported("video/webm")) return "video/webm";
  return "";
}

function getMediaType(fileType: string): UploadedFile["mediaType"] {
  if (fileType.startsWith("image/")) return "photo";
  if (fileType.startsWith("video/")) return "video";
  if (fileType.startsWith("audio/")) return "voice";
  return "document";
}

function OutgoingCard({ item }: { item: Outgoing }) {
  const [expanded, setExpanded] = useState(false);
  const mediaUrls = Array.isArray(item.mediaUrls) ? item.mediaUrls.filter(Boolean) : [];
  const title = item.subject?.trim() || "Dispatch";
  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "20px 24px", display: "flex", gap: 14, alignItems: "flex-start", textAlign: "left" }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Send size={15} color="var(--sage)" strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 400, color: "var(--text)", marginBottom: 4, lineHeight: 1.3 }}>
            {title}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>
            {formatDate(item.sentAt)} · {item.sentToAll ? "Everyone in the circle" : `${item.recipientCount ?? item.sentToMemberIds?.length ?? "?"} people`}
          </p>
        </div>
        <div style={{ flexShrink: 0, marginTop: 4, color: "var(--text-3)", transition: "transform 200ms", transform: expanded ? "rotate(180deg)" : "none" }}>
          <ChevronDown size={16} strokeWidth={1.5} />
        </div>
      </button>
      {expanded && (
        <div style={{ padding: "0 24px 24px", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 16, fontWeight: 300, lineHeight: 1.9, color: "var(--text-2)", paddingTop: 20, whiteSpace: "pre-wrap", marginBottom: mediaUrls.length ? 16 : 0 }}>
            {item.body}
          </p>
          {mediaUrls.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {mediaUrls.map((url, i) => {
                if (item.mediaType === "photo") {
                  return <img key={i} src={url} alt="Dispatch photo" style={{ maxWidth: "100%", borderRadius: 10, display: "block" }} />;
                }
                if (item.mediaType === "voice") {
                  return (
                    <div key={i} style={{ padding: "12px 16px", background: "var(--bg-2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Voice memo</p>
                      <audio controls src={url} style={{ width: "100%", height: 36 }} />
                    </div>
                  );
                }
                if (item.mediaType === "video") {
                  return (
                    <video key={i} controls src={url} style={{ maxWidth: "100%", borderRadius: 10, display: "block" }} />
                  );
                }
                return <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--sage)" }}>View attachment</a>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UpgradePrompt({ childName }: { childName: string }) {
  return (
    <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Sparkles size={22} color="var(--sage)" strokeWidth={1.5} />
      </div>
      <h2 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
        Dispatches
      </h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.65, color: "var(--text-2)", maxWidth: 380, margin: "0 auto 8px" }}>
        Send photos, updates, and moments to {childName}&apos;s circle — beautiful emails they&apos;ll keep forever.
      </p>
      <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7, maxWidth: 380, margin: "0 auto 28px" }}>
        Dispatches are available on <strong style={{ color: "var(--sage)" }}>Our Fable+</strong>.
      </p>
      <Link
        href="/signup"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--sage)", color: "#fff", border: "none",
          borderRadius: 10, padding: "13px 28px", fontSize: 14, fontWeight: 600,
          textDecoration: "none", transition: "opacity 200ms",
        }}
      >
        Upgrade to Our Fable+ <ArrowRight size={15} strokeWidth={2} />
      </Link>
      <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 16 }}>
        $99/yr (founding rate) · Includes voice messages, unlimited circle, 25GB storage
      </p>
    </div>
  );
}

export default function OutgoingsPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);

  const { children: childList, selectedChild } = useChildContext();
  const hasMultipleChildren = childList.length >= 2;

  // "family update" = send to ALL circle members across all children
  const [dispatchTarget, setDispatchTarget] = useState<string>("selected"); // childId or "family"

  const [circle, setCircle] = useState<CircleMember[]>([]);
  const [outgoings, setOutgoings] = useState<Outgoing[]>([]);
  const [childName, setChildName] = useState("them");
  const [parentNames, setParentNames] = useState("");
  const [planType, setPlanType] = useState<string | null>(null);
  const [loadingCircle, setLoadingCircle] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Compose state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [showAttach, setShowAttach] = useState(false);
  const [sentToAll, setSentToAll] = useState(true);
  const [uploadError, setUploadError] = useState("");

  // Recording state
  const [voiceReady, setVoiceReady] = useState(false);
  const [previewingVideo, setPreviewingVideo] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [uploadingLabel, setUploadingLabel] = useState("Uploading file…");
  const [recorderError, setRecorderError] = useState("");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  const recordingSecondsRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearPendingStream = useCallback(() => {
    if (!pendingStreamRef.current) return;
    pendingStreamRef.current.getTracks().forEach((track) => track.stop());
    pendingStreamRef.current = null;
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  }, []);

  const videoPreviewRefCallback = useCallback((element: HTMLVideoElement | null) => {
    videoPreviewRef.current = element;
    if (element && pendingStreamRef.current) {
      element.srcObject = pendingStreamRef.current;
      element.muted = true;
      element.setAttribute("playsinline", "");
      element.setAttribute("webkit-playsinline", "");
      element.play().catch(() => {});
    }
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingVoice(false);
    setIsRecordingVideo(false);
    setPreviewingVideo(false);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  };

  const prepareVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      clearPendingStream();
      pendingStreamRef.current = stream;
      setRecorderError("");
      setUploadError("");
      setVoiceReady(true);
    } catch {
      setRecorderError("Microphone access denied. Please allow access in your browser settings.");
    }
  };

  const startVoiceRecording = async () => {
    const stream = pendingStreamRef.current;
    if (!stream) return;
    try {
      const mimeType = getAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const actualMimeType = recorder.mimeType || mimeType || "audio/mp4";
      recordingChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const ext = actualMimeType.includes("mp4") || actualMimeType.includes("aac") ? "m4a" : "webm";
        const blob = new Blob(recordingChunksRef.current, { type: actualMimeType });
        clearPendingStream();
        setVoiceReady(false);
        setRecordingSeconds(0);
        recordingSecondsRef.current = 0;
        const uploadedFile = await uploadBlobAttachment(blob, `voice-${Date.now()}.${ext}`, "voice");
        if (uploadedFile) {
          setAttachedFiles(prev => [...prev, uploadedFile]);
          setUploadError("");
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setVoiceReady(false);
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(seconds => {
          recordingSecondsRef.current = seconds + 1;
          return seconds + 1;
        });
      }, 1000);
    } catch {
      clearPendingStream();
      setVoiceReady(false);
      setRecorderError("Unable to start voice recording. Please try again.");
    }
  };

  const openVideoPreview = useCallback(async () => {
    setRecorderError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      clearPendingStream();
      pendingStreamRef.current = stream;
      setUploadError("");
      setVoiceReady(false);
      setPreviewingVideo(true);
    } catch {
      setRecorderError("Camera access denied. Please allow access in your browser settings.");
    }
  }, [clearPendingStream]);

  const startVideoRecording = useCallback(() => {
    const stream = pendingStreamRef.current;
    if (!stream) return;
    const mimeType = getVideoMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const actualMimeType = recorder.mimeType || mimeType || "video/mp4";
    const ext = actualMimeType.includes("mp4") ? "mp4" : "webm";
    recordingChunksRef.current = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
      pendingStreamRef.current = null;
      const blob = new Blob(recordingChunksRef.current, { type: actualMimeType });
      setVideoBlob(blob);
      setVideoFileName(`video-${Date.now()}.${ext}`);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setPreviewingVideo(false);
    setIsRecordingVideo(true);
    setRecordingSeconds(0);
    recordingSecondsRef.current = 0;
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(seconds => {
        recordingSecondsRef.current = seconds + 1;
        return seconds + 1;
      });
    }, 1000);
  }, []);

  const cancelVideoPreview = useCallback(() => {
    clearPendingStream();
    setPreviewingVideo(false);
  }, [clearPendingStream]);

  const removeRecordedVideo = () => {
    setVideoBlob(null);
    setVideoFileName(null);
  };

  const uploadBlobAttachment = async (blob: Blob, fileName: string, type: "voice" | "video"): Promise<UploadedFile | null> => {
    setUploadingRecording(true);
    setUploadingLabel(type === "video" ? "Uploading video…" : "Uploading voice memo…");
    try {
      if (blob.size === 0) throw new Error("Recording was empty. Please record again.");

      const uploadUrlRes = await fetch("/api/ourfable/upload-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileSize: blob.size }),
      });
      const uploadUrlData = await uploadUrlRes.json().catch(() => ({}));
      if (!uploadUrlRes.ok || !uploadUrlData.uploadUrl) {
        throw new Error(uploadUrlData.error ?? "Failed to prepare upload.");
      }

      const uploadRes = await fetch(uploadUrlData.uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type || (type === "video" ? "video/mp4" : "audio/mp4") },
        body: blob,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadData.storageId) {
        throw new Error(uploadData.error ?? "Failed to upload recording.");
      }

      const mediaUrlRes = await fetch("/api/ourfable/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "ourfable:getMediaUrl",
          args: { storageId: uploadData.storageId },
          type: "query",
        }),
      });
      const mediaUrlData = await mediaUrlRes.json().catch(() => ({}));
      if (!mediaUrlRes.ok || !mediaUrlData.value) {
        throw new Error(mediaUrlData.error ?? "Failed to resolve uploaded media.");
      }

      return {
        fileName,
        fileType: blob.type || (type === "video" ? "video/mp4" : "audio/mp4"),
        fileSize: blob.size,
        mediaType: type,
        mediaUrl: mediaUrlData.value,
        storageId: uploadData.storageId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
      setUploadError(message);
      return null;
    } finally {
      setUploadingRecording(false);
    }
  };

  const uploadSelectedFile = async (file: File) => {
    setUploadingRecording(true);
    setUploadingLabel(`Uploading ${getMediaType(file.type || "application/octet-stream")}…`);
    try {
      const fileType = file.type || "application/octet-stream";
      const uploadUrlRes = await fetch("/api/ourfable/upload-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileSize: file.size }),
      });
      const uploadUrlData = await uploadUrlRes.json().catch(() => ({}));
      if (!uploadUrlRes.ok || !uploadUrlData.uploadUrl) {
        throw new Error(uploadUrlData.error ?? "Failed to prepare upload.");
      }

      const uploadRes = await fetch(uploadUrlData.uploadUrl, {
        method: "POST",
        headers: { "Content-Type": fileType },
        body: file,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadData.storageId) {
        throw new Error(uploadData.error ?? "Failed to upload file.");
      }

      const mediaUrlRes = await fetch("/api/ourfable/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "ourfable:getMediaUrl",
          args: { storageId: uploadData.storageId },
          type: "query",
        }),
      });
      const mediaUrlData = await mediaUrlRes.json().catch(() => ({}));
      if (!mediaUrlRes.ok || !mediaUrlData.value) {
        throw new Error(mediaUrlData.error ?? "Failed to resolve uploaded media.");
      }

      setAttachedFiles(prev => [
        ...prev,
        {
          fileName: file.name,
          fileType,
          fileSize: file.size,
          mediaType: getMediaType(fileType),
          mediaUrl: mediaUrlData.value,
          storageId: uploadData.storageId,
        },
      ]);
      setShowAttach(false);
      setUploadError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
      setUploadError(message);
    } finally {
      setUploadingRecording(false);
    }
  };

  const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ count: number; total: number } | null>(null);
  const [sendError, setSendError] = useState("");

  const isPlus = planType === "plus";

  const loadData = async () => {
    const [circleRes, outgoingsRes, familyRes, accountRes] = await Promise.all([
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:listCircle", args: { familyId } }) }).then(r => r.json()),
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:listOutgoings", args: { familyId } }) }).then(r => r.json()),
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId } }) }).then(r => r.json()),
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:getOurFableFamilyByIdSafe", args: { familyId } }) }).then(r => r.json()),
    ]);
    setCircle(circleRes.value ?? []);
    setOutgoings(outgoingsRes.value ?? []);
    setChildName((familyRes.value?.childName ?? "them").split(" ")[0]);
    setParentNames(familyRes.value?.parentNames ?? "");
    setPlanType(accountRes.value?.planType ?? "standard");
    setLoadingCircle(false);
    setLoadingHistory(false);
    setLoadingPlan(false);
  };

  // Default dispatch target to selected child
  useEffect(() => {
    if (selectedChild && dispatchTarget === "selected") {
      setDispatchTarget(selectedChild._id);
    }
  }, [selectedChild]);

  useEffect(() => { loadData(); }, [familyId]);

  useEffect(() => {
    return () => {
      clearPendingStream();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [clearPendingStream]);

  useEffect(() => {
    if ((previewingVideo || isRecordingVideo) && videoPreviewRef.current && pendingStreamRef.current) {
      const element = videoPreviewRef.current;
      if (!element.srcObject) {
        element.srcObject = pendingStreamRef.current;
        element.muted = true;
        element.setAttribute("playsinline", "");
        element.setAttribute("webkit-playsinline", "");
        element.play().catch(() => {});
      }
    }
  }, [previewingVideo, isRecordingVideo]);

  const toggleMember = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const withEmail = circle.filter(m => m.email);
  const recipientCount = sentToAll ? withEmail.length : Array.from(selectedIds).filter(id => circle.find(m => m._id === id && m.email)).length;
  const selectedChildId = dispatchTarget !== "family"
    ? (dispatchTarget === "selected" ? selectedChild?.childId || selectedChild?._id : dispatchTarget)
    : undefined;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    if (!sentToAll && selectedIds.size === 0) { setSendError("Select at least one recipient."); return; }
    setSending(true);
    setSendError("");
    try {
      const memberIds = sentToAll ? undefined : Array.from(selectedIds);
      let outgoingFiles = attachedFiles;

      if (videoBlob && videoFileName) {
        const uploadedVideo = await uploadBlobAttachment(videoBlob, videoFileName, "video");
        if (!uploadedVideo) {
          throw new Error("Failed to upload recorded video.");
        }
        outgoingFiles = [...attachedFiles, uploadedVideo];
      }

      const mediaUrls = outgoingFiles.map(f => f.mediaUrl);
      const mediaType = outgoingFiles.length > 0 ? outgoingFiles[0].mediaType : undefined;

      // Save to Convex first
      const saveRes = await fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "ourfable:createOutgoing",
          args: {
            familyId,
            childId: selectedChildId,
            dispatchTarget,
            subject,
            body,
            sentToAll,
            sentToMemberIds: memberIds,
            sentByName: parentNames || "Your family",
            recipientCount,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
            mediaType,
            scheduleEmailDelivery: false,
          },
          type: "mutation",
        }),
      });
      const saveData = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) throw new Error(saveData.error ?? "Failed to save dispatch");

      // Send emails
      const res = await fetch(`/api/ourfable/send-outgoing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          childId: selectedChildId,
          dispatchTarget,
          subject,
          messageBody: body,
          sentToAll,
          memberIds,
          sentByName: parentNames || "Your family",
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          mediaType,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Send failed");

      setSent({ count: data.sent, total: data.total });
      setSubject("");
      setBody("");
      setAttachedFiles([]);
      setVideoBlob(null);
      setVideoFileName(null);
      setShowAttach(false);
      setUploadError("");
      setRecorderError("");
      setSelectedIds(new Set());
      setSentToAll(true);
      await loadData();
    } catch (e) {
      setSendError(String(e));
    } finally {
      setSending(false);
    }
  };

  if (loadingPlan) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
        <Loader2 size={20} strokeWidth={1.5} color="var(--text-3)" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 44, height: 44, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Send size={18} color="var(--sage)" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
            Dispatches
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, lineHeight: 1.5 }}>
            Share a photo, video, or update with everyone in {childName}&apos;s circle.
          </p>
        </div>
      </div>

      {/* Gate: show upgrade prompt for standard plan */}
      {!isPlus ? (
        <UpgradePrompt childName={childName} />
      ) : (
        <>
          {/* Sent confirmation */}
          {sent && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.25)", borderRadius: 12 }}>
              <Check size={16} color="var(--sage)" strokeWidth={2.5} />
              <p style={{ fontSize: 14, color: "var(--text-2)" }}>
                Sent to <strong>{sent.count}</strong> of {sent.total} circle members.
              </p>
              <button onClick={() => setSent(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 12 }}>Dismiss</button>
            </div>
          )}

          {/* Compose card */}
          <div className="card" style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: 22 }}>
            <div>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 20, fontWeight: 400, color: "var(--text)", marginBottom: 4 }}>
                New update
              </p>
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                {withEmail.length > 0 ? `${withEmail.length} circle member${withEmail.length !== 1 ? "s" : ""} have email addresses` : "No circle members with email addresses yet"}
              </p>
            </div>

            {/* Child selector — only shown when 2+ children */}
            {hasMultipleChildren && (
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                  Sending for
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {childList.map((child) => {
                    const first = child.childName.split(" ")[0];
                    const isActive = dispatchTarget === child._id;
                    return (
                      <button
                        key={child._id}
                        onClick={() => setDispatchTarget(child._id)}
                        style={{
                          padding: "8px 16px", borderRadius: 9, fontSize: 13, cursor: "pointer",
                          background: isActive ? "var(--sage-dim)" : "var(--surface)",
                          border: `1px solid ${isActive ? "rgba(107,143,111,0.3)" : "var(--border)"}`,
                          color: isActive ? "var(--sage)" : "var(--text-3)",
                          fontWeight: isActive ? 500 : 400,
                          fontFamily: "var(--font-body)",
                          transition: "all 160ms",
                        }}
                      >
                        {first}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setDispatchTarget("family")}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 9, fontSize: 13, cursor: "pointer",
                      background: dispatchTarget === "family" ? "var(--sage-dim)" : "var(--surface)",
                      border: `1px solid ${dispatchTarget === "family" ? "rgba(107,143,111,0.3)" : "var(--border)"}`,
                      color: dispatchTarget === "family" ? "var(--sage)" : "var(--text-3)",
                      fontWeight: dispatchTarget === "family" ? 500 : 400,
                      fontFamily: "var(--font-body)",
                      transition: "all 160ms",
                    }}
                  >
                    <Users size={12} strokeWidth={1.5} />
                    Family update (everyone)
                  </button>
                </div>
                {dispatchTarget === "family" && (
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8, fontStyle: "italic" }}>
                    Will send to all circle members across all children (deduplicated by email).
                  </p>
                )}
              </div>
            )}

            {/* Subject */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                Subject
              </label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={`A subject line…`}
                className="input"
                style={{ fontFamily: "var(--font-cormorant)", fontSize: 17 }}
              />
            </div>

            {/* Body */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                Message
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={7}
                placeholder={`Share what's happening with ${childName} — a milestone, a moment, something worth keeping…`}
                className="input"
                style={{ resize: "vertical", fontFamily: "var(--font-cormorant)", fontSize: 16, lineHeight: 1.85 }}
              />
            </div>

            {/* Recipients */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>
                Recipients
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <button
                  onClick={() => setSentToAll(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, fontSize: 13, cursor: "pointer", transition: "all 160ms",
                    background: sentToAll ? "var(--sage-dim)" : "var(--surface)",
                    border: `1px solid ${sentToAll ? "rgba(107,143,111,0.3)" : "var(--border)"}`,
                    color: sentToAll ? "var(--sage)" : "var(--text-3)",
                    fontWeight: sentToAll ? 500 : 400,
                  }}
                >
                  <Users size={13} strokeWidth={1.5} />
                  Everyone ({withEmail.length})
                </button>
                <button
                  onClick={() => setSentToAll(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, fontSize: 13, cursor: "pointer", transition: "all 160ms",
                    background: !sentToAll ? "var(--sage-dim)" : "var(--surface)",
                    border: `1px solid ${!sentToAll ? "rgba(107,143,111,0.3)" : "var(--border)"}`,
                    color: !sentToAll ? "var(--sage)" : "var(--text-3)",
                    fontWeight: !sentToAll ? 500 : 400,
                  }}
                >
                  <User size={13} strokeWidth={1.5} />
                  Select people
                </button>
              </div>

              {!sentToAll && !loadingCircle && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {withEmail.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>No circle members with email addresses.</p>
                  ) : withEmail.map(m => {
                    const selected = selectedIds.has(m._id);
                    return (
                      <button
                        key={m._id}
                        onClick={() => toggleMember(m._id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", transition: "all 140ms",
                          background: selected ? "var(--sage-dim)" : "var(--surface)",
                          border: `1px solid ${selected ? "rgba(107,143,111,0.3)" : "var(--border)"}`,
                          color: selected ? "var(--sage)" : "var(--text-2)",
                        }}
                      >
                        {selected && <Check size={11} strokeWidth={2.5} />}
                        {m.name}
                        <span style={{ fontSize: 10, color: selected ? "rgba(107,143,111,0.6)" : "var(--text-3)" }}>· {m.relationship}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Media attachments */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>
                Attach
              </label>

              {/* Active recording UI */}
              {(voiceReady || previewingVideo || isRecordingVoice || isRecordingVideo) && (
                <div style={{ padding: "16px 20px", background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.3)", borderRadius: 12, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E07070", animation: (isRecordingVoice || isRecordingVideo) ? "pulse 1s infinite" : "none" }} />
                    <span style={{ fontSize: 13, color: "var(--text-2)", fontFamily: "var(--font-body)" }}>
                      {voiceReady
                        ? "Microphone ready"
                        : previewingVideo
                          ? "Camera ready"
                          : isRecordingVoice
                            ? `Recording voice — ${formatSeconds(recordingSeconds)}`
                            : `Recording video — ${formatSeconds(recordingSeconds)}`}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(voiceReady || previewingVideo) && (
                      <button
                        onClick={() => {
                          clearPendingStream();
                          setVoiceReady(false);
                          setPreviewingVideo(false);
                        }}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-2)", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)" }}
                      >
                        Cancel
                      </button>
                    )}
                    {voiceReady && (
                      <button onClick={startVoiceRecording} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#E07070", border: "none", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff" }} /> Start
                      </button>
                    )}
                    {previewingVideo && (
                      <button onClick={startVideoRecording} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#E07070", border: "none", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff" }} /> Start
                      </button>
                    )}
                    {(isRecordingVoice || isRecordingVideo) && (
                      <button onClick={stopRecording} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#E07070", border: "none", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-body)" }}>
                        <Square size={12} strokeWidth={2.5} fill="#fff" /> Stop
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Video preview */}
              {(previewingVideo || isRecordingVideo) && (
                <video ref={videoPreviewRefCallback} muted playsInline style={{ width: "100%", borderRadius: 10, marginBottom: 12, maxHeight: 200, background: "#000", display: "block", transform: "scaleX(-1)" }} />
              )}

              {videoBlob && videoFileName && !isRecordingVideo && !previewingVideo && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 2 }}>Recorded video ready</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{videoFileName}</p>
                  </div>
                  <button onClick={removeRecordedVideo} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--text-3)", lineHeight: 1 }}>
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              )}

              {/* Uploading indicator */}
              {uploadingRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", fontSize: 13, color: "var(--text-3)" }}>
                  <Loader2 size={14} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} /> {uploadingLabel}
                </div>
              )}

              {/* Action buttons */}
              {!voiceReady && !previewingVideo && !isRecordingVoice && !isRecordingVideo && !uploadingRecording && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={openVideoPreview}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 13, color: "var(--text-2)", fontFamily: "var(--font-body)", transition: "all 160ms" }}
                  >
                    <Video size={15} strokeWidth={1.5} color="var(--sage)" /> Record video
                  </button>
                  <button
                    onClick={prepareVoiceRecording}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 13, color: "var(--text-2)", fontFamily: "var(--font-body)", transition: "all 160ms" }}
                  >
                    <Mic size={15} strokeWidth={1.5} color="var(--sage)" /> Record voice
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 13, color: "var(--text-2)", fontFamily: "var(--font-body)", transition: "all 160ms" }}
                  >
                    <ImageIcon size={15} strokeWidth={1.5} color="var(--sage)" /> Add photo / file
                  </button>
                </div>
              )}

              {/* Hidden file upload (homepage-style trigger) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.m4a,.mp3,.wav,.ogg"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadSelectedFile(file);
                  event.target.value = "";
                }}
                style={{ display: "none" }}
              />

              {/* Attached files list */}
              {(attachedFiles.length > 0 || videoBlob) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {attachedFiles.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.25)", borderRadius: 8, fontSize: 12, color: "var(--sage)" }}>
                      {f.mediaType === "photo" ? "Photo" : f.mediaType === "video" ? "Video" : "Voice"} {f.fileName}
                      <button onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--text-3)", lineHeight: 1 }}>
                        <X size={11} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {recorderError && (
                <p style={{ fontSize: 13, color: "#E07070", marginTop: 10 }}>{recorderError}</p>
              )}

              {uploadError && (
                <p style={{ fontSize: 13, color: "#E07070", marginTop: 10 }}>{uploadError}</p>
              )}
            </div>

            {sendError && (
              <p style={{ fontSize: 13, color: "#E07070" }}>{sendError}</p>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim() || withEmail.length === 0}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 24px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: (sending || !subject.trim() || !body.trim()) ? "default" : "pointer",
                background: "var(--sage)", border: "none", color: "#fff",
                opacity: (sending || !subject.trim() || !body.trim()) ? 0.5 : 1,
                transition: "opacity 160ms",
              }}
            >
              {sending ? (
                <><Loader2 size={15} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} /> Sending…</>
              ) : (
                <><Send size={15} strokeWidth={2} /> Send to {sentToAll ? `everyone (${withEmail.length})` : `${recipientCount} ${recipientCount === 1 ? "person" : "people"}`}</>
              )}
            </button>

            {withEmail.length === 0 && !loadingCircle && (
              <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>
                Add email addresses to your circle members first.
              </p>
            )}
          </div>
        </>
      )}

      {/* Past dispatches — visible to all plans */}
      {!loadingHistory && outgoings.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--sage)", marginBottom: 12 }}>
            Past updates · {outgoings.length}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {outgoings.map(item => (
              <OutgoingCard key={item._id} item={item} />
            ))}
          </div>
        </div>
      )}

      {!loadingHistory && outgoings.length === 0 && isPlus && (
        <div className="card" style={{ padding: "40px 28px", textAlign: "center" }}>
          <p className="font-display" style={{ fontStyle: "italic", fontSize: 18, color: "var(--text-3)", lineHeight: 1.6 }}>
            No updates sent yet.<br />Your first one stays forever.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
