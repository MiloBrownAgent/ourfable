"use client";
import { use, useEffect, useState, useRef, useCallback } from "react";
import { Check, Upload, X, Mic, Video, Square, Pen, Camera, Lock } from "lucide-react";
import Image from "next/image";

// All Convex calls go through /api/ourfable/data proxy

type ResponseTab = "write" | "photo" | "voice" | "video";

interface PromptData {
  promptText: string;
  promptCategory: string;
  promptUnlocksAtAge?: number;
  promptUnlocksAtEvent?: string;
  memberName: string;
  childName: string;
  familyId: string;
  memberId: string;
  status: string;
  relationship?: string;
}

const GRANDPARENT_RELATIONSHIPS = new Set([
  "grandparent", "grandma", "grandpa", "grandfather", "grandmother",
  "nana", "papa", "granny", "gran", "nanny", "grammy", "gramps",
  "abuela", "abuelo", "oma", "opa", "mimi", "pop-pop", "poppop",
]);

function unlockLabel(data: PromptData): string {
  if (data.promptUnlocksAtEvent) return `Opens on ${data.promptUnlocksAtEvent}`;
  if (data.promptUnlocksAtAge) {
    const age = data.promptUnlocksAtAge;
    return `Opens when ${data.childName.split(" ")[0]} turns ${age}`;
  }
  return "Sealed in the Vault";
}

function FileDropZone({
  accept, label, note, onFile
}: { accept: string; label: string; note?: string; onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (f: File) => { setFile(f); onFile(f); };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${drag ? "var(--green)" : "var(--border)"}`,
          borderRadius: 14,
          padding: "32px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: drag ? "var(--green-light)" : "var(--surface)",
          transition: "all 200ms",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }}
        />
        {file ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--green-light)", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={20} color="var(--green)" strokeWidth={2} />
            </div>
            <p style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{file.name}</p>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setFile(null); onFile(null as unknown as File); }}
              style={{ fontSize: 12, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              <X size={12} /> Remove
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Upload size={24} color="var(--text-3)" strokeWidth={1.5} />
            <p style={{ fontSize: 14, color: "var(--text-2)" }}>{label}</p>
            {note && <p style={{ fontSize: 12, color: "var(--text-3)" }}>{note}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RespondPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PromptData | null>(null);
  const [childName, setChildName] = useState("");
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const [tab, setTab] = useState<ResponseTab>("write");
  const [body, setBody] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // In-browser recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false); // camera on but not recording yet
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingType, setRecordingType] = useState<"voice" | "video" | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Callback ref — attaches stream the instant the <video> element mounts (preview or recording)
  const videoRefCallback = useCallback((el: HTMLVideoElement | null) => {
    videoPreviewRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.muted = true;
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');
      el.play().catch(() => {});
    }
  }, []);

  // Open camera for preview without recording
  const openCameraPreview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      streamRef.current = stream;
      setIsPreviewing(true);
      setRecordingType("video");
    } catch {
      alert("Camera access denied. Please allow camera and microphone access in your browser settings.");
    }
  }, []);

  // Start actual recording (camera already open from preview)
  const beginVideoRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    // Negotiate mime type: prefer mp4 for Safari compatibility, then webm
    let mimeType = "";
    if (MediaRecorder.isTypeSupported("video/mp4")) mimeType = "video/mp4";
    else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) mimeType = "video/webm;codecs=vp9,opus";
    else if (MediaRecorder.isTypeSupported("video/webm")) mimeType = "video/webm";
    const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
    const recorder = new MediaRecorder(stream, options);
    const actualMime = recorder.mimeType || mimeType || "video/mp4";
    const ext = actualMime.includes("mp4") ? "mp4" : "webm";
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
      streamRef.current = null;
      const blob = new Blob(chunksRef.current, { type: actualMime });
      setRecordedBlob(blob);
      const file = new File([blob], `video-${Date.now()}.${ext}`, { type: actualMime });
      setVideoFile(file);
    };

    mediaRecorderRef.current = recorder;
    // Safari doesn't reliably support timeslice parameter — omit it
    recorder.start();
    setIsPreviewing(false);
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
  }, []);

  // Cancel preview without recording
  const cancelPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
    setIsPreviewing(false);
    setRecordingType(null);
  }, []);

  const startRecording = useCallback(async (type: "voice" | "video") => {
    try {
      const constraints = type === "voice"
        ? { audio: true }
        : { video: { facingMode: "user" }, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Negotiate mime type for cross-browser (Safari needs mp4)
      let targetMime = "";
      if (type === "voice") {
        // Safari: try mp4/aac first, then webm
        if (MediaRecorder.isTypeSupported("audio/mp4")) targetMime = "audio/mp4";
        else if (MediaRecorder.isTypeSupported("audio/aac")) targetMime = "audio/aac";
        else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) targetMime = "audio/webm;codecs=opus";
        else if (MediaRecorder.isTypeSupported("audio/webm")) targetMime = "audio/webm";
      } else {
        // Safari: try mp4 first, then webm
        if (MediaRecorder.isTypeSupported("video/mp4")) targetMime = "video/mp4";
        else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) targetMime = "video/webm;codecs=vp9,opus";
        else if (MediaRecorder.isTypeSupported("video/webm")) targetMime = "video/webm";
      }
      const options: MediaRecorderOptions = targetMime ? { mimeType: targetMime } : {};
      const recorder = new MediaRecorder(stream, options);
      const actualMime = recorder.mimeType || targetMime || (type === "voice" ? "audio/mp4" : "video/mp4");
      const ext = actualMime.includes("mp4") ? "mp4" : "webm";
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: actualMime });
        setRecordedBlob(blob);
        const file = new File([blob], `${type}-${Date.now()}.${ext}`, { type: actualMime });
        if (type === "voice") setVoiceFile(file);
        else setVideoFile(file);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      // Set state AFTER getUserMedia succeeds — this triggers re-render
      // which mounts the <video> element, then useEffect attaches the stream
      setIsRecording(true);
      setRecordingType(type);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      alert(type === "voice"
        ? "Microphone access denied. Please allow access in your browser settings."
        : "Camera access denied. Please allow camera and microphone access in your browser settings."
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
  }, []);

  const discardRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingType(null);
    setRecordingTime(0);
    setIsPreviewing(false);
    setVoiceFile(null);
    setVideoFile(null);
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ourfable/data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "ourfable:getPromptByToken", args: { token } }),
        });
        const json = await res.json();
        const val = json.value;

        if (!val || (!val.prompt && !val.promptText)) {
          setInvalid(true);
          setLoading(false);
          return;
        }

        // API returns { family, member, prompt } or flat PromptData
        let promptData: PromptData;
        if (val.prompt) {
          const { prompt, member, family } = val;
          promptData = {
            promptText: prompt.promptText,
            promptCategory: prompt.promptCategory,
            promptUnlocksAtAge: prompt.promptUnlocksAtAge,
            promptUnlocksAtEvent: prompt.promptUnlocksAtEvent,
            memberName: member.name,
            childName: family.childName,
            familyId: family.familyId,
            memberId: member._id,
            status: prompt.status,
            relationship: member.relationship ?? member.relationshipKey ?? "",
          };
        } else {
          promptData = val as PromptData;
        }

        if (promptData.status === "responded") {
          setAlreadyDone(true);
          setChildName(promptData.childName);
          setLoading(false);
          return;
        }

        setData(promptData);
        setChildName(promptData.childName);
      } catch {
        setInvalid(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  // Generate photo preview
  useEffect(() => {
    if (!photoFile) { setPhotoPreview(null); return; }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const canSubmit = () => {
    if (tab === "write") return body.trim().length > 0;
    if (tab === "photo") return photoFile !== null;
    if (tab === "voice") return voiceFile !== null;
    if (tab === "video") return videoFile !== null;
    return false;
  };

  const handleSubmit = async () => {
    if (!data || !canSubmit()) return;
    setSubmitting(true);
    setError("");

    try {
      const mediaFile = tab === "photo" ? photoFile : tab === "voice" ? voiceFile : tab === "video" ? videoFile : null;

      let storageId: string | undefined;
      if (mediaFile) {
        // Get upload URL via proxy
        const urlRes = await fetch(`/api/ourfable/data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "ourfable:generateUploadUrl", args: {}, type: "mutation" }),
        });
        const urlData = await urlRes.json();
        const uploadUrl = urlData.value as string;

        // Upload file directly to Convex storage (upload URLs are pre-signed)
        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": mediaFile.type },
          body: mediaFile,
        });
        const uploadData = await uploadRes.json();
        storageId = uploadData.storageId;
      }

      const entryArgs: Record<string, unknown> = {
        familyId: data.familyId,
        memberId: data.memberId,
        type: tab,
        submissionToken: token,
      };
      if (tab === "write") entryArgs.body = body;
      if (tab === "photo") { entryArgs.mediaStorageId = storageId; entryArgs.mediaMimeType = photoFile?.type; if (caption.trim()) entryArgs.body = caption; }
      if (tab === "voice") { entryArgs.mediaStorageId = storageId; entryArgs.mediaMimeType = voiceFile?.type ?? "audio/mp4"; }
      if (tab === "video") { entryArgs.mediaStorageId = storageId; entryArgs.mediaMimeType = videoFile?.type ?? "video/mp4"; }
      if (data.promptUnlocksAtAge) entryArgs.unlocksAtAge = data.promptUnlocksAtAge;
      if (data.promptUnlocksAtEvent) entryArgs.unlocksAtEvent = data.promptUnlocksAtEvent;

      const submitRes = await fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:submitVaultEntry", args: entryArgs, type: "mutation" }),
      });
      const submitData = await submitRes.json();

      // Verify the entry was actually created before showing "Sealed"
      if (!submitRes.ok || submitData.status === "error") {
        throw new Error(submitData.errorMessage ?? "Failed to seal entry");
      }

      // Double-check: query the prompt status to confirm it was marked as responded
      const verifyRes = await fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:getPromptByToken", args: { token } }),
      });
      const verifyData = await verifyRes.json();
      const status = verifyData.value?.prompt?.status;
      if (status !== "responded") {
        console.warn("[respond] Entry submitted but prompt not marked as responded — status:", status);
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const childFirst = childName.split(" ")[0] || "them";
  const memberFirst = data?.memberName.split(" ")[0] || "";
  const isGrandparent = data?.relationship
    ? GRANDPARENT_RELATIONSHIPS.has(data.relationship.toLowerCase().trim())
    : false;

  // ── Loading ──
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

  // ── Invalid token ──
  if (invalid) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: 360, textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--surface)", border: "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <span style={{ fontSize: 26 }}>🍂</span>
        </div>
        <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
          This link has expired.
        </p>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7 }}>
          This link has expired or isn&apos;t valid. Ask the family for a fresh invite.
        </p>
      </div>
    </div>
  );

  // ── Already responded ──
  if (alreadyDone) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: 400, textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--green-light)", border: "1.5px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <Check size={24} color="var(--green)" strokeWidth={2} />
        </div>
        <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
          Already sealed.
        </p>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7 }}>
          You&apos;ve already shared something this month. It&apos;s sealed safely in {childFirst}&apos;s Vault.
        </p>
      </div>
    </div>
  );

  // ── Success ──
  if (submitted) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: 400, textAlign: "center", animation: "fadeUp 0.5s ease both" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "var(--green-light)", border: "2px solid var(--green-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px",
        }}>
          <Check size={30} color="var(--green)" strokeWidth={2.5} />
        </div>
        <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 38, fontWeight: 600, color: "var(--text)", marginBottom: 16, letterSpacing: "-0.02em" }}>
          Sealed.
        </p>
        <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75 }}>
          This will be waiting for {childFirst} when they&apos;re ready.
        </p>
        <div style={{ width: 40, height: 1, background: "var(--border)", margin: "24px auto" }} />
        <p style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.08em" }}>
          Our Fable · private by design
        </p>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );

  if (!data) return null;

  const TABS: { id: ResponseTab; icon: typeof Pen; label: string }[] = [
    { id: "write", icon: Pen, label: "Write" },
    { id: "photo", icon: Camera, label: "Photo" },
    { id: "voice", icon: Mic, label: "Voice" },
    { id: "video", icon: Video, label: "Video" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "0 0 80px" }} className={isGrandparent ? "gp-mode" : ""}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .respond-container { max-width: 540px; margin: 0 auto; padding: 0 20px; }
        .tab-btn { background: none; border: none; cursor: pointer; transition: all 180ms; }
        .tab-btn:hover { opacity: 0.85; }
        textarea.vault-input:focus { border-color: var(--green) !important; box-shadow: 0 0 0 3px rgba(184,150,90,0.12); }
        @media (max-width: 480px) {
          .respond-hero-name { font-size: 2.4rem !important; }
          .respond-prompt { font-size: 1.25rem !important; }
          .tabs-row { gap: 3px !important; padding: 3px !important; }
        }

        /* ── Grandparent accessibility mode ── */
        .gp-mode { font-size: 18px; }
        .gp-mode .respond-container { max-width: 580px; }
        .gp-mode .respond-hero-name { font-size: clamp(3rem, 9vw, 4rem) !important; line-height: 1.15 !important; }
        .gp-mode .respond-prompt { font-size: clamp(1.5rem, 4.5vw, 2rem) !important; line-height: 1.7 !important; }
        .gp-mode textarea.vault-input {
          font-size: 18px !important;
          padding: 18px 20px !important;
          line-height: 1.8 !important;
          min-height: 200px !important;
        }
        .gp-mode .tab-btn {
          min-height: 56px !important;
          padding: 14px 20px !important;
          font-size: 15px !important;
        }
        .gp-mode .respond-submit-btn {
          min-height: 56px !important;
          font-size: 17px !important;
          padding: 18px 32px !important;
        }
        .gp-mode .gp-enhance { color: var(--text) !important; }
        .gp-mode .tab-label { display: inline !important; }
        .gp-mode .respond-seal-line { font-size: 14px !important; }
        .gp-mode input[type="file"] + div { min-height: 56px !important; }
        @media (max-width: 480px) {
          .gp-mode .respond-hero-name { font-size: 2.8rem !important; }
          .gp-mode .respond-prompt { font-size: 1.4rem !important; }
        }
      `}</style>

      {/* ── Top wordmark ── */}
      <div style={{ paddingTop: 48, paddingBottom: 8, textAlign: "center", animation: "fadeIn 0.4s ease both" }}>
        <p style={{
          fontFamily: "var(--font-playfair)", fontSize: 17, fontWeight: 700,
          color: "var(--green)", letterSpacing: "0.22em", textTransform: "uppercase",
        }}>
          Our Fable
        </p>
      </div>

      <div className="respond-container">

        {/* ── Hero greeting ── */}
        <div style={{ paddingTop: 40, paddingBottom: 8, animation: "fadeUp 0.5s ease 0.05s both" }}>
          <h1
            className="respond-hero-name"
            style={{
              fontFamily: "var(--font-playfair)", fontWeight: 700,
              fontSize: "clamp(2.6rem, 8vw, 3.6rem)",
              letterSpacing: "-0.025em", lineHeight: 1.1,
              color: "var(--text)",
            }}
          >
            Hi, {memberFirst}.
          </h1>
        </div>

        {/* ── Gold divider ── */}
        <div style={{ height: 2, width: 48, background: "var(--green)", borderRadius: 2, marginTop: 20, marginBottom: 32, animation: "fadeIn 0.4s ease 0.15s both" }} />

        {/* ── Prompt section ── */}
        <div style={{ animation: "fadeUp 0.5s ease 0.1s both" }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "var(--green)", marginBottom: 16,
          }}>
            This month&apos;s prompt
          </p>

          <p
            className="respond-prompt"
            style={{
              fontFamily: "var(--font-playfair)", fontStyle: "italic",
              fontSize: "clamp(1.3rem, 4vw, 1.7rem)",
              fontWeight: 400, lineHeight: 1.65,
              color: "var(--text)", marginBottom: 14,
            }}
          >
            &ldquo;{data.promptText}&rdquo;
          </p>

          <p className="respond-seal-line gp-enhance" style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={13} strokeWidth={1.5} color="var(--green)" />
            {unlockLabel(data)}
          </p>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "var(--border)", margin: "36px 0", animation: "fadeIn 0.3s ease 0.2s both" }} />

        {/* ── Response section ── */}
        <div style={{ animation: "fadeUp 0.5s ease 0.2s both" }}>

          {/* Tab toggle */}
          <div
            className="tabs-row"
            style={{
              display: "flex", gap: 8, marginBottom: 24,
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
                  <span className="tab-label">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Write tab ── */}
          {tab === "write" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <textarea
                className="vault-input"
                value={body}
                onChange={e => {
                  if (e.target.value.length <= 2000) setBody(e.target.value);
                }}
                rows={9}
                placeholder="Write from the heart. There's no wrong answer."
                style={{
                  resize: "none", width: "100%",
                  fontFamily: "var(--font-playfair)", fontSize: 16, lineHeight: 1.85,
                  background: "var(--card)", border: "1.5px solid var(--border)",
                  borderRadius: 14, padding: "18px 20px",
                  color: "var(--text)", outline: "none",
                  transition: "border-color 180ms, box-shadow 180ms",
                }}
              />
              <p style={{ textAlign: "right", fontSize: 11, color: body.length > 1800 ? "#E07070" : "var(--text-3)" }}>
                {body.length} / 2000
              </p>
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
                <FileDropZone
                  accept="image/*"
                  label="Drag & drop or tap to choose a photo"
                  onFile={setPhotoFile}
                />
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

              {/* Recording controls */}
              {isRecording && recordingType === "voice" ? (
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
              ) : voiceFile && !isRecording ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                  background: "var(--card)", border: "1.5px solid var(--green-border)",
                  borderRadius: 14, padding: "24px 20px",
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--green-light)", border: "1.5px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={22} color="var(--green)" strokeWidth={2} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Voice memo recorded</p>
                  {recordingTime > 0 && <p style={{ fontSize: 12, color: "var(--text-3)" }}>{formatTime(recordingTime)}</p>}
                  <button onClick={discardRecording} style={{
                    fontSize: 12, color: "var(--text-3)", background: "none",
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <X size={12} /> Discard and re-record
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button onClick={() => startRecording("voice")} style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    padding: "18px 24px", borderRadius: 14,
                    background: "var(--card)", border: "1.5px solid var(--border)",
                    cursor: "pointer", fontSize: 15, fontWeight: 500, color: "var(--text)",
                    transition: "all 180ms",
                  }}>
                    <Mic size={18} color="var(--green)" strokeWidth={1.5} /> Record a voice memo
                  </button>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 8 }}>or upload a file</p>
                  </div>
                  <FileDropZone
                    accept=".m4a,.mp3,.wav,.ogg,audio/*"
                    label="Upload a voice memo"
                    note=".m4a · .mp3 · .wav · .ogg"
                    onFile={setVoiceFile}
                  />
                </div>
              )}
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
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

              {/* Video recording controls — 3 states: preview / recording / done */}
              {isPreviewing && recordingType === "video" ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                  background: "var(--card)", border: "1.5px solid var(--green-border)",
                  borderRadius: 14, padding: "20px", overflow: "hidden",
                }}>
                  <video
                    ref={videoRefCallback}
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
                    <button onClick={cancelPreview} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "12px 20px", borderRadius: 100,
                      background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)",
                      fontSize: 14, fontWeight: 500, cursor: "pointer",
                    }}>
                      Cancel
                    </button>
                    <button onClick={beginVideoRecording} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "12px 24px", borderRadius: 100,
                      background: "var(--green)", border: "none", color: "#fff",
                      fontSize: 14, fontWeight: 600, cursor: "pointer",
                    }}>
                      <Video size={14} /> Start recording
                    </button>
                  </div>
                </div>
              ) : isRecording && recordingType === "video" ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                  background: "var(--card)", border: "1.5px solid var(--green-border)",
                  borderRadius: 14, padding: "20px", overflow: "hidden",
                }}>
                  <video
                    ref={videoRefCallback}
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
              ) : videoFile && !isRecording ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                  background: "var(--card)", border: "1.5px solid var(--green-border)",
                  borderRadius: 14, padding: "24px 20px",
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--green-light)", border: "1.5px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={22} color="var(--green)" strokeWidth={2} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Video recorded</p>
                  {recordingTime > 0 && <p style={{ fontSize: 12, color: "var(--text-3)" }}>{formatTime(recordingTime)}</p>}
                  <button onClick={discardRecording} style={{
                    fontSize: 12, color: "var(--text-3)", background: "none",
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <X size={12} /> Discard and re-record
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button onClick={openCameraPreview} style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    padding: "18px 24px", borderRadius: 14,
                    background: "var(--card)", border: "1.5px solid var(--border)",
                    cursor: "pointer", fontSize: 15, fontWeight: 500, color: "var(--text)",
                    transition: "all 180ms",
                  }}>
                    <Video size={18} color="var(--green)" strokeWidth={1.5} /> Record a video message
                  </button>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 8 }}>or upload a file</p>
                  </div>
                  <FileDropZone
                    accept=".mp4,.mov,video/*"
                    label="Upload a video"
                    note=".mp4 · .mov · max 100MB"
                    onFile={setVideoFile}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <p style={{ fontSize: 13, color: "#E07070", marginTop: 8 }}>{error}</p>
          )}

          {/* ── Submit ── */}
          <button
            className="respond-submit-btn"
            onClick={handleSubmit}
            disabled={!canSubmit() || submitting}
            style={{
              marginTop: 24,
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: canSubmit() && !submitting ? "var(--green)" : "var(--border-dark)",
              color: canSubmit() && !submitting ? "#fff" : "var(--text-3)",
              border: "none", borderRadius: 100,
              padding: "18px 28px",
              fontSize: 16, fontWeight: 600,
              cursor: canSubmit() && !submitting ? "pointer" : "not-allowed",
              transition: "all 200ms",
              letterSpacing: "-0.01em",
            }}
          >
            {submitting ? (
              <>
                <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Sealing…
              </>
            ) : (
              "Seal this in the Vault →"
            )}
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>

        {/* Footer */}
        <p className="gp-enhance" style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)", marginTop: 48, letterSpacing: "0.08em" }}>
          Private. Not on social. Not public.
        </p>

      </div>
    </div>
  );
}
