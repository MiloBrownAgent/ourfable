"use client";
import { useState, useEffect, useRef, useCallback, use } from "react";
import { Heart, Send, Check, Lock, Mic, Camera, Video, Pen, Square, X, Upload } from "lucide-react";
import Image from "next/image";

// All Convex calls go through /api/ourfable/data proxy

interface Member { _id: string; familyId: string; name: string; relationship: string; relationshipKey: string; }
interface Family { childName: string; childDob: string; parentNames?: string; childPhotoUrl?: string; }

type ResponseTab = "write" | "photo" | "voice" | "video";

function getChildAge(dob: string): string {
  const born = new Date(dob + "T00:00:00");
  const now = new Date();
  const months = Math.floor((now.getTime() - born.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
  const days = Math.floor(((now.getTime() - born.getTime()) / (1000 * 60 * 60 * 24)) % 30.4375);
  if (months < 1) return `${Math.floor((now.getTime() - born.getTime()) / (1000 * 60 * 60 * 24))} days old`;
  return `${months} month${months !== 1 ? "s" : ""} and ${days} day${days !== 1 ? "s" : ""} old`;
}

// Writing prompts keyed by relationship
const PROMPTS: Record<string, string> = {
  grandmother: "What do you want me to know about where I come from? Tell me something about our family that took you years to understand.",
  grandfather: "What do you know about life that took you too long to learn? Not career advice — something real.",
  aunt: "What's something about my parents that only a sibling would know? Something I should hear from you.",
  uncle: "Tell me something about being the person you are. Something you'd want a nephew to know.",
  family_friend: "What's one thing you know now that you wish someone had told you at 22?",
  godparent: "You were chosen to be part of my story. Why does that matter to you? Tell me.",
  default: "What do you want me to know? Write it for the version of me who is old enough to really read it.",
};

const SEAL_PRESETS = [
  { label: "18th birthday", value: "2043-06-21" },
  { label: "21st", value: "2046-06-21" },
  { label: "Graduation", value: "2047-06-01" },
  { label: "Wedding day", value: "2055-06-21" },
];

// ── Detect supported mime types (Safari vs Chrome/Firefox) ──
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

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [member, setMember] = useState<Member | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [openOn, setOpenOn] = useState("2043-06-21");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Tab state
  const [tab, setTab] = useState<ResponseTab>("write");

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimeRef = useRef(0);

  // Video recording state
  const [recordingVideo, setRecordingVideo] = useState(false);
  const [previewingVideo, setPreviewingVideo] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const videoCameraRef = useRef<HTMLVideoElement | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);

  const [recorderError, setRecorderError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    fetch(`/api/ourfable/data`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:getMemberByInviteToken", args: { token }, format: "json" }),
    }).then(r => r.json()).then(async d => {
      if (!d.value) { setNotFound(true); setLoading(false); return; }
      setMember(d.value);
      const fr = await fetch(`/api/ourfable/data`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId: d.value.familyId }, format: "json" }),
      });
      const fd = await fr.json();
      if (fd.value) {
        setFamily(fd.value);
        setBody(`Dear ${fd.value.childName.split(" ")[0]},\n\n`);
        const dob = new Date(fd.value.childDob);
        setOpenOn(new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate()).toISOString().slice(0, 10));
      }
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [token]);

  // Photo preview
  useEffect(() => {
    if (!photoFile) { setPhotoPreview(null); return; }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  // Cleanup timer
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Voice Recording ──
  const startVoiceRecording = useCallback(async () => {
    setRecorderError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getAudioMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      const actualMime = recorder.mimeType || mimeType || "audio/mp4";
      const ext = actualMime.includes("mp4") ? "m4a" : "webm";
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: actualMime });
        setAudioBlob(blob);
        setAudioDuration(recordingTimeRef.current);
        setVoiceFile(new File([blob], `voice-${Date.now()}.${ext}`, { type: actualMime }));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      timerRef.current = setInterval(() => {
        setRecordingTime(t => { recordingTimeRef.current = t + 1; return t + 1; });
      }, 1000);
    } catch {
      setRecorderError("Microphone access denied. Please allow access in your browser settings.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setRecordingVideo(false);
    setPreviewingVideo(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (videoCameraRef.current) videoCameraRef.current.srcObject = null;
  }, []);

  const removeAudio = useCallback(() => {
    setAudioBlob(null);
    setAudioDuration(0);
    setAudioPlaying(false);
    setVoiceFile(null);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }, []);

  const toggleAudioPlay = useCallback(() => {
    if (!audioBlob) return;
    if (audioPlaying && audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.onended = () => setAudioPlaying(false);
      audio.play();
      audioRef.current = audio;
      setAudioPlaying(true);
    }
  }, [audioBlob, audioPlaying]);

  // ── Video Recording ──
  const videoCameraRefCallback = useCallback((el: HTMLVideoElement | null) => {
    videoCameraRef.current = el;
    if (el && pendingStreamRef.current) {
      el.srcObject = pendingStreamRef.current;
      el.muted = true;
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "");
      el.play().catch(() => {});
    }
  }, []);

  const openVideoPreview = useCallback(async () => {
    setRecorderError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      pendingStreamRef.current = stream;
      setPreviewingVideo(true);
    } catch {
      setRecorderError("Camera access denied. Please allow camera and microphone access in your browser settings.");
    }
  }, []);

  const startVideoRecording = useCallback(() => {
    const stream = pendingStreamRef.current;
    if (!stream) return;
    const mimeType = getVideoMimeType();
    const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
    const recorder = new MediaRecorder(stream, options);
    const actualMime = recorder.mimeType || mimeType || "video/mp4";
    const ext = actualMime.includes("mp4") ? "mp4" : "webm";
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      if (videoCameraRef.current) videoCameraRef.current.srcObject = null;
      pendingStreamRef.current = null;
      const blob = new Blob(chunksRef.current, { type: actualMime });
      setVideoBlob(blob);
      setVideoName(`video-${Date.now()}.${ext}`);
      setVideoFile(new File([blob], `video-${Date.now()}.${ext}`, { type: actualMime }));
      setAudioDuration(recordingTimeRef.current);
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setPreviewingVideo(false);
    setRecordingVideo(true);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    timerRef.current = setInterval(() => {
      setRecordingTime(t => { recordingTimeRef.current = t + 1; return t + 1; });
    }, 1000);
  }, []);

  const cancelVideoPreview = useCallback(() => {
    if (pendingStreamRef.current) {
      pendingStreamRef.current.getTracks().forEach(t => t.stop());
      pendingStreamRef.current = null;
    }
    if (videoCameraRef.current) videoCameraRef.current.srcObject = null;
    setPreviewingVideo(false);
  }, []);

  const discardVideo = useCallback(() => {
    setVideoBlob(null);
    setVideoFile(null);
    setVideoName(null);
  }, []);

  // Fallback: connect stream via effect
  useEffect(() => {
    if ((previewingVideo || recordingVideo) && videoCameraRef.current && pendingStreamRef.current) {
      const el = videoCameraRef.current;
      if (!el.srcObject) {
        el.srcObject = pendingStreamRef.current;
        el.muted = true;
        el.setAttribute("playsinline", "");
        el.setAttribute("webkit-playsinline", "");
        el.play().catch(() => {});
      }
    }
  }, [previewingVideo, recordingVideo]);

  // ── Upload media helper ──
  const uploadMedia = async (blob: Blob, mimeType: string): Promise<string | undefined> => {
    try {
      setUploadStatus("Preparing upload…");
      if (blob.size === 0) {
        setError("Recording was empty. Please try again.");
        setUploadStatus("");
        return undefined;
      }
      const urlRes = await fetch("/api/ourfable/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:generateUploadUrl", args: {}, type: "mutation" }),
      });
      const urlData = await urlRes.json();
      const uploadUrl = urlData.value as string;
      if (!uploadUrl) throw new Error("No upload URL");

      const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
      setUploadStatus(`Uploading ${sizeMB}MB…`);

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": mimeType },
        body: blob,
      });
      const uploadData = await uploadRes.json();
      setUploadStatus("Saving…");
      return uploadData.storageId;
    } catch {
      setUploadStatus("");
      return undefined;
    }
  };

  // ── Can submit? ──
  const canSubmit = () => {
    if (tab === "write") return body.trim().length > 0;
    if (tab === "photo") return photoFile !== null;
    if (tab === "voice") return voiceFile !== null || audioBlob !== null;
    if (tab === "video") return videoFile !== null || videoBlob !== null;
    return false;
  };

  // ── Submit ──
  const submit = async () => {
    if (!member || !canSubmit()) return;
    setSubmitting(true);
    setError("");
    try {
      let mediaStorageId: string | undefined;
      let mediaMimeType: string | undefined;
      let contentType = "letter";

      if (tab === "voice" && audioBlob) {
        contentType = "voice";
        mediaMimeType = audioBlob.type || "audio/mp4";
        mediaStorageId = await uploadMedia(audioBlob, mediaMimeType);
        if (!mediaStorageId) { setSubmitting(false); return; }
      } else if (tab === "video" && (videoBlob || videoFile)) {
        contentType = "video";
        const blob = videoBlob || videoFile!;
        mediaMimeType = blob.type || "video/mp4";
        mediaStorageId = await uploadMedia(blob, mediaMimeType);
        if (!mediaStorageId) { setSubmitting(false); return; }
      } else if (tab === "photo" && photoFile) {
        contentType = "photo";
        mediaMimeType = photoFile.type || "image/jpeg";
        mediaStorageId = await uploadMedia(photoFile, mediaMimeType);
        if (!mediaStorageId) { setSubmitting(false); return; }
      }

      const entryArgs: Record<string, unknown> = {
        familyId: member.familyId,
        memberId: member._id,
        type: contentType,
        subject: subject || `A ${contentType} from ${member.name}`,
        openOn,
        contentType,
      };

      // Include text
      if (tab === "write" && body.trim()) {
        entryArgs.body = body.trim();
      } else if (tab === "photo" && caption.trim()) {
        entryArgs.body = caption.trim();
      }

      // Include media
      if (mediaStorageId) {
        entryArgs.mediaStorageId = mediaStorageId;
        entryArgs.mediaMimeType = mediaMimeType;
      }

      await fetch(`/api/ourfable/data`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "ourfable:submitContribution",
          type: "mutation",
          args: entryArgs,
        }),
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadStatus("");
    }
  };

  const childFirst = family?.childName.split(" ")[0] ?? "them";
  const recipientFirst = member?.name.split(" ")[0] ?? "";
  const prompt = PROMPTS[member?.relationshipKey ?? ""] ?? PROMPTS.default;

  const TABS: { id: ResponseTab; icon: typeof Pen; label: string }[] = [
    { id: "write", icon: Pen, label: "Write" },
    { id: "photo", icon: Camera, label: "Photo" },
    { id: "voice", icon: Mic, label: "Voice" },
    { id: "video", icon: Video, label: "Video" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--green)", opacity: 0.3,
            animation: `dot-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes dot-pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:.9;transform:scale(1)}}`}</style>
    </div>
  );

  if (notFound || !member || !family) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <Heart size={32} color="var(--gold)" strokeWidth={1} style={{ margin: "0 auto 20px", opacity: 0.4 }} />
        <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 300, color: "var(--text)", marginBottom: 8 }}>This link has expired.</p>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>Ask the family for a fresh invite link.</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 440, width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green-light)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Lock size={20} color="var(--gold)" strokeWidth={1.5} />
          </div>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 26, fontWeight: 300, color: "var(--text)", marginBottom: 10 }}>
            {childFirst} will have it.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7 }}>
            Sealed and waiting. {childFirst} will read it when the time comes. Thank you for this.
          </p>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.08em" }}>
          Our Fable · ourfable.ai
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 24px 80px" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes recordPulse{0%,100%{opacity:.6}50%{opacity:1}}
        .tab-btn { background: none; border: none; cursor: pointer; transition: all 180ms; }
        .tab-btn:hover { opacity: 0.85; }
        textarea.join-input:focus { border-color: var(--green) !important; box-shadow: 0 0 0 3px rgba(184,150,90,0.12); }
        @media (max-width: 480px) {
          .tabs-row { gap: 3px !important; padding: 3px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Our Fable wordmark */}
        <p style={{ textAlign: "center", fontFamily: "var(--font-playfair)", fontSize: 16, fontWeight: 300, color: "var(--green)", letterSpacing: "0.15em", marginBottom: 8 }}>
          Our Fable
        </p>

        {/* Welcome — child voice */}
        <div className="card" style={{ padding: "36px 28px", textAlign: "center", animation: "fadeUp 0.5s ease both" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Heart size={24} color="var(--sage)" strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--green)", marginBottom: 16 }}>
            {getChildAge(family.childDob)}
          </p>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, fontWeight: 300, color: "var(--text)", marginBottom: 12, letterSpacing: "0.02em" }}>
            Hi — it&apos;s {childFirst}.
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.75 }}>
            You&apos;re in my circle, {recipientFirst}. My parents set this up for me. Anything you leave here will be waiting when I&apos;m old enough to really read it.
          </p>
        </div>

        {/* Prompt */}
        <div className="card" style={{ padding: "24px 28px", animation: "fadeUp 0.5s ease 0.1s both" }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--green)", marginBottom: 12 }}>
            A prompt for you
          </p>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 17, fontWeight: 300, lineHeight: 1.8, color: "var(--text)", fontStyle: "italic" }}>
            &ldquo;{prompt}&rdquo;
          </p>
        </div>

        {/* Response form */}
        <div className="card" style={{ padding: "28px 28px", display: "flex", flexDirection: "column", gap: 18, animation: "fadeUp 0.5s ease 0.2s both" }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 300, color: "var(--text)" }}>
            Leave something for {childFirst}
          </h2>

          {/* Tab toggle */}
          <div
            className="tabs-row"
            style={{
              display: "flex", gap: 8,
              background: "var(--surface)", borderRadius: 12,
              padding: 4, border: "1px solid var(--border)",
            }}
          >
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className="tab-btn"
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "10px 6px",
                    borderRadius: 9,
                    fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                    color: tab === t.id ? "var(--text)" : "var(--text-3)",
                    background: tab === t.id ? "var(--card)" : "transparent",
                    boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    minWidth: 0,
                  }}
                >
                  <Icon size={15} strokeWidth={tab === t.id ? 2 : 1.5} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Write tab ── */}
          {tab === "write" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} className="input" placeholder={`Something for ${childFirst} to know`} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Your letter</label>
                <textarea
                  className="join-input"
                  value={body} onChange={e => setBody(e.target.value)} rows={10} required
                  style={{
                    resize: "none", width: "100%",
                    fontFamily: "var(--font-playfair)", fontSize: 16, lineHeight: 1.85,
                    background: "var(--card)", border: "1.5px solid var(--border)",
                    borderRadius: 14, padding: "18px 20px",
                    color: "var(--text)", outline: "none",
                    transition: "border-color 180ms, box-shadow 180ms",
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Photo tab ── */}
          {tab === "photo" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {photoPreview ? (
                <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: "1.5px solid var(--border)", width: "100%", aspectRatio: "4/3" }}>
                  <Image src={photoPreview} alt="Preview" fill style={{ objectFit: "cover" }} sizes="(max-width: 540px) 100vw, 540px" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    style={{
                      position: "absolute", top: 10, right: 10,
                      background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
                      width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} color="#fff" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => photoInputRef.current?.click()}
                  style={{
                    border: "2px dashed var(--border)",
                    borderRadius: 14,
                    padding: "32px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "var(--surface)",
                    transition: "all 200ms",
                  }}
                >
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) setPhotoFile(f); e.target.value = ""; }}
                  />
                  <Upload size={24} color="var(--text-3)" strokeWidth={1.5} style={{ margin: "0 auto 10px", display: "block" }} />
                  <p style={{ fontSize: 14, color: "var(--text-2)" }}>Drag &amp; drop or tap to choose a photo</p>
                </div>
              )}
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                  Caption (optional)
                </label>
                <input
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder={`A note for ${childFirst} about this photo`}
                  style={{
                    background: "var(--card)", border: "1.5px solid var(--border)",
                    borderRadius: 10, padding: "12px 16px", fontSize: 14,
                    color: "var(--text)", outline: "none", width: "100%",
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Voice tab ── */}
          {tab === "voice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                background: "var(--green-light)", border: "1.5px solid var(--green-border)",
                borderRadius: 14, padding: "20px 22px",
              }}>
                <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7 }}>
                  Your voice — preserved exactly as it sounds today. Hit record and just talk.
                </p>
              </div>

              {isRecording ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                  background: "var(--card)", border: "1.5px solid var(--green-border)",
                  borderRadius: 14, padding: "28px 20px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#E07070", animation: "pulse 1.5s ease infinite" }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 20, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{formatTime(recordingTime)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-3)" }}>Recording…</p>
                  <button onClick={stopRecording} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 24px", borderRadius: 100,
                    background: "#E07070", border: "none", color: "#fff",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}>
                    <Square size={12} fill="#fff" /> Stop recording
                  </button>
                </div>
              ) : audioBlob ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                  background: "var(--card)", border: "1.5px solid var(--green-border)",
                  borderRadius: 14, padding: "24px 20px",
                }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 16px", borderRadius: 100,
                    background: "var(--green-light)", border: "1px solid var(--green-border)",
                  }}>
                    <button onClick={toggleAudioPlay} style={{
                      width: 28, height: 28, borderRadius: "50%", border: "none",
                      background: "var(--green)", color: "#fff", fontSize: 11,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {audioPlaying ? "⏸" : "▶"}
                    </button>
                    <span style={{ fontSize: 13, color: "var(--green)", fontFamily: "var(--font-body)", fontVariantNumeric: "tabular-nums" }}>
                      {formatTime(audioDuration)}
                    </span>
                  </div>
                  <button onClick={removeAudio} style={{
                    fontSize: 12, color: "var(--text-3)", background: "none",
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <X size={12} /> Discard and re-record
                  </button>
                </div>
              ) : (
                <button onClick={startVoiceRecording} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "18px 24px", borderRadius: 14,
                  background: "var(--card)", border: "1.5px solid var(--border)",
                  cursor: "pointer", fontSize: 15, fontWeight: 500, color: "var(--text)",
                  transition: "all 180ms",
                }}>
                  <Mic size={18} color="var(--green)" strokeWidth={1.5} /> Record a voice memo
                </button>
              )}

              {recorderError && (
                <p style={{ fontSize: 12, color: "#E53E3E" }}>{recorderError}</p>
              )}
            </div>
          )}

          {/* ── Video tab ── */}
          {tab === "video" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                background: "var(--green-light)", border: "1.5px solid var(--green-border)",
                borderRadius: 14, padding: "20px 22px",
              }}>
                <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7 }}>
                  A video message — your face, your voice, this moment. {childFirst} will watch it when the time comes.
                </p>
              </div>

              {/* Camera preview */}
              {previewingVideo && (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                  background: "var(--card)", border: "1.5px solid var(--green-border)",
                  borderRadius: 14, padding: "20px", overflow: "hidden",
                }}>
                  <video
                    ref={videoCameraRefCallback}
                    muted
                    playsInline
                    autoPlay
                    // @ts-expect-error webkit-playsinline is needed for older iOS Safari
                    webkit-playsinline=""
                    style={{
                      width: "100%", maxHeight: 280, borderRadius: 10,
                      background: "#000", display: "block", transform: "scaleX(-1)",
                    }}
                  />
                  <p style={{ fontSize: 13, color: "var(--text-3)" }}>Check your camera — when you&apos;re ready, hit record.</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={cancelVideoPreview} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "12px 20px", borderRadius: 100,
                      background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)",
                      fontSize: 14, fontWeight: 500, cursor: "pointer",
                    }}>
                      Cancel
                    </button>
                    <button onClick={startVideoRecording} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "12px 24px", borderRadius: 100,
                      background: "var(--green)", border: "none", color: "#fff",
                      fontSize: 14, fontWeight: 600, cursor: "pointer",
                    }}>
                      <Video size={14} /> Start recording
                    </button>
                  </div>
                </div>
              )}

              {/* Recording in progress */}
              {recordingVideo && (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                  background: "var(--card)", border: "1.5px solid var(--green-border)",
                  borderRadius: 14, padding: "20px", overflow: "hidden",
                }}>
                  <video
                    ref={videoCameraRefCallback}
                    muted
                    playsInline
                    autoPlay
                    // @ts-expect-error webkit-playsinline is needed for older iOS Safari
                    webkit-playsinline=""
                    style={{
                      width: "100%", maxHeight: 280, borderRadius: 10,
                      background: "#000", display: "block", transform: "scaleX(-1)",
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#E07070", animation: "pulse 1.5s ease infinite" }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 20, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{formatTime(recordingTime)}</span>
                  </div>
                  <button onClick={stopRecording} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 24px", borderRadius: 100,
                    background: "#E07070", border: "none", color: "#fff",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}>
                    <Square size={12} fill="#fff" /> Stop recording
                  </button>
                </div>
              )}

              {/* Video recorded */}
              {videoBlob && !recordingVideo && !previewingVideo && (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                  background: "var(--card)", border: "1.5px solid var(--green-border)",
                  borderRadius: 14, padding: "24px 20px",
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--green-light)", border: "1.5px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={22} color="var(--green)" strokeWidth={2} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Video recorded</p>
                  {videoName && <p style={{ fontSize: 12, color: "var(--text-3)" }}>{videoName}</p>}
                  <button onClick={discardVideo} style={{
                    fontSize: 12, color: "var(--text-3)", background: "none",
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <X size={12} /> Discard and re-record
                  </button>
                </div>
              )}

              {/* Initial state — show record button */}
              {!previewingVideo && !recordingVideo && !videoBlob && (
                <button onClick={openVideoPreview} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "18px 24px", borderRadius: 14,
                  background: "var(--card)", border: "1.5px solid var(--border)",
                  cursor: "pointer", fontSize: 15, fontWeight: 500, color: "var(--text)",
                  transition: "all 180ms",
                }}>
                  <Video size={18} color="var(--green)" strokeWidth={1.5} /> Record a video message
                </button>
              )}

              {recorderError && (
                <p style={{ fontSize: 12, color: "#E53E3E" }}>{recorderError}</p>
              )}
            </div>
          )}

          {/* Seal until */}
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Seal until</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SEAL_PRESETS.map(p => (
                <button key={p.value} type="button" onClick={() => setOpenOn(p.value)}
                  style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer", transition: "all 160ms", background: openOn === p.value ? "var(--green-light)" : "var(--surface)", border: `1px solid ${openOn === p.value ? "var(--green-border)" : "var(--border)"}`, color: openOn === p.value ? "var(--gold)" : "var(--text-3)" }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: 13, color: "#E07070" }}>{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={!canSubmit() || submitting}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: canSubmit() && !submitting ? "var(--green)" : "var(--border-dark)",
              color: canSubmit() && !submitting ? "#fff" : "var(--text-3)",
              border: "none", borderRadius: 100,
              padding: "16px 28px",
              fontSize: 15, fontWeight: 600,
              cursor: canSubmit() && !submitting ? "pointer" : "not-allowed",
              transition: "all 200ms",
            }}
          >
            {submitting ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                {uploadStatus || "Sealing…"}
              </>
            ) : (
              <>
                <Send size={14} strokeWidth={1.5} />
                Seal this for {childFirst}
              </>
            )}
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)" }}>
          Private. Not on social. Not public.{family.parentNames ? ` Set up by ${family.parentNames}.` : ""}
        </p>
      </div>
    </div>
  );
}
