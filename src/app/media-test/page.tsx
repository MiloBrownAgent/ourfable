"use client";

import { useRef, useState, useEffect, useCallback } from "react";

const MIME_TYPES = [
  "video/mp4",
  "video/mp4;codecs=avc1",
  "video/webm",
  "video/webm;codecs=vp8",
  "video/webm;codecs=vp9",
  "video/webm;codecs=h264",
  "audio/mp4",
  "audio/mp4;codecs=mp4a",
  "audio/aac",
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
];

type LogEntry = {
  ts: string;
  level: "info" | "ok" | "warn" | "error";
  msg: string;
};

type DiagSection = {
  title: string;
  lines: string[];
};

function now() {
  return new Date().toISOString().split("T")[1].replace("Z", "");
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function MediaTestPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [diag, setDiag] = useState<DiagSection[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackType, setPlaybackType] = useState<"video" | "audio" | null>(null);
  const [blobInfo, setBlobInfo] = useState<{ size: number; type: string } | null>(null);

  const previewRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((level: LogEntry["level"], msg: string) => {
    setLogs(prev => [...prev, { ts: now(), level, msg }]);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Run environment diagnostics on mount
  useEffect(() => {
    const sections: DiagSection[] = [];

    // Browser info
    sections.push({
      title: "BROWSER",
      lines: [
        `userAgent: ${navigator.userAgent}`,
        `platform: ${navigator.platform}`,
        `vendor: ${navigator.vendor}`,
        `language: ${navigator.language}`,
        `onLine: ${navigator.onLine}`,
        `cookieEnabled: ${navigator.cookieEnabled}`,
      ],
    });

    // Media APIs
    const mediaLines: string[] = [];
    mediaLines.push(`navigator.mediaDevices: ${!!navigator.mediaDevices}`);
    mediaLines.push(`getUserMedia: ${typeof navigator.mediaDevices?.getUserMedia}`);
    mediaLines.push(`MediaRecorder: ${typeof (window as unknown as Record<string, unknown>)["MediaRecorder"]}`);
    mediaLines.push(`URL.createObjectURL: ${typeof URL.createObjectURL}`);
    mediaLines.push(`Blob: ${typeof Blob}`);
    sections.push({ title: "MEDIA APIs", lines: mediaLines });

    // Supported mime types
    const mimeLines: string[] = [];
    const MR = (window as unknown as Record<string, unknown>)["MediaRecorder"] as typeof MediaRecorder | undefined;
    if (MR && typeof MR.isTypeSupported === "function") {
      for (const mt of MIME_TYPES) {
        const supported = MR.isTypeSupported(mt);
        mimeLines.push(`${supported ? "✓" : "✗"} ${mt}`);
      }
    } else {
      mimeLines.push("MediaRecorder not available — cannot check mime types");
    }
    sections.push({ title: "SUPPORTED MIME TYPES", lines: mimeLines });

    // HTTPS check
    const secLines = [
      `protocol: ${location.protocol}`,
      `isSecureContext: ${window.isSecureContext}`,
      `hostname: ${location.hostname}`,
    ];
    sections.push({ title: "SECURITY CONTEXT", lines: secLines });

    setDiag(sections);
  }, []);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }
    setPreviewUrl(null);
  }

  function cleanup() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    stopStream();
    chunksRef.current = [];
  }

  function pickMimeType(prefer: "video" | "audio"): string {
    const MR = (window as unknown as Record<string, unknown>)["MediaRecorder"] as typeof MediaRecorder | undefined;
    if (!MR || typeof MR.isTypeSupported !== "function") return "";

    if (prefer === "video") {
      const candidates = [
        "video/mp4;codecs=avc1",
        "video/mp4",
        "video/webm;codecs=h264",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      return candidates.find(t => MR.isTypeSupported(t)) ?? "";
    } else {
      const candidates = [
        "audio/mp4;codecs=mp4a",
        "audio/mp4",
        "audio/aac",
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
      ];
      return candidates.find(t => MR.isTypeSupported(t)) ?? "";
    }
  }

  async function runTest(mode: "audio" | "video" | "photo") {
    cleanup();
    setPlaybackUrl(null);
    setPlaybackType(null);
    setBlobInfo(null);
    setRunning(mode);
    addLog("info", `=== Starting ${mode.toUpperCase()} test ===`);

    try {
      // Check prerequisites
      if (!navigator.mediaDevices) {
        throw new Error("navigator.mediaDevices is not available. Are you on HTTPS?");
      }
      addLog("ok", "navigator.mediaDevices ✓");

      const MR = (window as unknown as Record<string, unknown>)["MediaRecorder"] as typeof MediaRecorder | undefined;
      if (!MR && mode !== "photo") {
        throw new Error("MediaRecorder is not available in this browser.");
      }
      if (mode !== "photo") addLog("ok", "MediaRecorder ✓");

      // Build constraints
      const constraints: MediaStreamConstraints =
        mode === "audio"
          ? { audio: true, video: false }
          : {
              audio: mode === "video",
              video: {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 },
              },
            };

      addLog("info", `Requesting getUserMedia: ${JSON.stringify(constraints)}`);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        const e = err as DOMException;
        addLog("error", `getUserMedia failed: ${e.name}: ${e.message}`);
        if (e.name === "NotAllowedError") {
          addLog("warn", "→ Permission denied. Check browser camera/mic permissions.");
        } else if (e.name === "NotFoundError") {
          addLog("warn", "→ No camera/mic found on this device.");
        } else if (e.name === "NotSupportedError") {
          addLog("warn", "→ getUserMedia not supported (HTTPS required?).");
        }
        throw err;
      }

      streamRef.current = stream;
      addLog("ok", `getUserMedia success — ${stream.getTracks().length} track(s)`);

      // Log track info
      for (const track of stream.getTracks()) {
        const settings = track.getSettings();
        addLog("info", `Track: kind=${track.kind} label="${track.label}" readyState=${track.readyState}`);
        addLog("info", `  Settings: ${JSON.stringify(settings)}`);
        const caps = track.getCapabilities?.();
        if (caps) addLog("info", `  Capabilities: ${JSON.stringify(caps)}`);
      }

      // Show preview for video/photo
      if (mode !== "audio" && previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.muted = true;
        previewRef.current.playsInline = true;
        previewRef.current.setAttribute("playsinline", "");
        previewRef.current.setAttribute("webkit-playsinline", "");
        try {
          await previewRef.current.play();
          addLog("ok", "Preview video playing ✓");
        } catch (e) {
          addLog("warn", `Preview play() failed: ${(e as Error).message}`);
        }
      }

      // Photo: grab a frame and stop
      if (mode === "photo") {
        await new Promise(r => setTimeout(r, 500)); // let preview settle
        const canvas = document.createElement("canvas");
        const video = previewRef.current!;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        addLog("info", `Canvas size: ${canvas.width}x${canvas.height}`);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get 2D canvas context");
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        addLog("ok", `Photo captured — data URL length: ${dataUrl.length}`);
        stopStream();
        setPlaybackUrl(dataUrl);
        setPlaybackType("video"); // use img tag via separate logic
        setRunning(null);
        addLog("ok", "=== Photo test COMPLETE ===");
        return;
      }

      // Recording
      const mimeType = pickMimeType(mode === "video" ? "video" : "audio");
      addLog("info", `Selected mimeType: "${mimeType || "(browser default)"}"`);

      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) recorderOptions.mimeType = mimeType;

      let recorder: MediaRecorder;
      try {
        recorder = new MR!(stream, recorderOptions);
      } catch (err) {
        addLog("warn", `MediaRecorder with mimeType failed: ${(err as Error).message}. Retrying with no mimeType.`);
        recorder = new MR!(stream);
      }

      recorderRef.current = recorder;
      chunksRef.current = [];

      addLog("info", `MediaRecorder created — state: ${recorder.state} mimeType: ${recorder.mimeType}`);

      recorder.ondataavailable = (e) => {
        addLog("info", `ondataavailable: size=${e.data?.size ?? 0} type=${e.data?.type}`);
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onerror = (e) => {
        addLog("error", `MediaRecorder error: ${(e as ErrorEvent).message ?? JSON.stringify(e)}`);
      };

      recorder.onstart = () => addLog("ok", `Recording started — state: ${recorder.state}`);
      recorder.onpause = () => addLog("info", `Recording paused`);
      recorder.onresume = () => addLog("info", `Recording resumed`);

      const recordingDone = new Promise<void>((resolve, reject) => {
        recorder.onstop = () => {
          addLog("ok", `Recording stopped — chunks: ${chunksRef.current.length}`);
          resolve();
        };
        recorder.onerror = (e) => {
          reject(new Error(`MediaRecorder error: ${JSON.stringify(e)}`));
        };
      });

      addLog("info", "Starting recording (3 seconds)...");
      recorder.start(100); // collect chunks every 100ms
      addLog("info", `After start — recorder.state: ${recorder.state}`);

      // Record for 3 seconds
      await new Promise(r => setTimeout(r, 3000));
      addLog("info", `Before stop — recorder.state: ${recorder.state}`);
      if (recorder.state !== "inactive") {
        recorder.stop();
      }

      await recordingDone;
      stopStream();

      const totalChunks = chunksRef.current.length;
      const totalSize = chunksRef.current.reduce((s, b) => s + b.size, 0);
      addLog("info", `Total chunks: ${totalChunks}, total size: ${fmtBytes(totalSize)}`);

      if (totalSize === 0) {
        addLog("error", "Recording blob is EMPTY — no data captured!");
        addLog("warn", "→ Common on iOS Safari: MediaRecorder may not be fully supported.");
        setRunning(null);
        return;
      }

      // Build playback blob
      const blobMime = mimeType || (mode === "video" ? "video/mp4" : "audio/mp4");
      const blob = new Blob(chunksRef.current, { type: blobMime });
      addLog("ok", `Blob created: ${fmtBytes(blob.size)} type=${blob.type}`);
      setBlobInfo({ size: blob.size, type: blob.type });

      const url = URL.createObjectURL(blob);
      setPlaybackUrl(url);
      setPlaybackType(mode === "video" ? "video" : "audio");
      addLog("ok", `Object URL created: ${url.slice(0, 60)}...`);

      // Try playing it
      setTimeout(async () => {
        const el = playbackRef.current;
        if (el) {
          el.src = url;
          el.load();
          try {
            await (el as HTMLVideoElement).play();
            addLog("ok", "Playback started ✓ — blob is playable!");
          } catch (e) {
            addLog("warn", `Playback autoplay failed (normal): ${(e as Error).message}`);
            addLog("info", "→ Tap the playback element to play manually.");
          }
        }
      }, 200);

      addLog("ok", `=== ${mode.toUpperCase()} test COMPLETE ===`);
    } catch (err) {
      const e = err as Error;
      addLog("error", `FATAL: ${e.name ?? "Error"}: ${e.message}`);
      if (e.stack) {
        for (const line of e.stack.split("\n").slice(0, 8)) {
          addLog("error", `  ${line}`);
        }
      }
      stopStream();
    } finally {
      setRunning(null);
    }
  }

  const levelColor: Record<LogEntry["level"], string> = {
    info: "#aaffaa",
    ok: "#00ff88",
    warn: "#ffff00",
    error: "#ff4444",
  };

  return (
    <div style={{
      background: "#0a0a0a",
      minHeight: "100vh",
      color: "#00ff88",
      fontFamily: "monospace",
      fontSize: "13px",
      padding: "16px",
      boxSizing: "border-box",
    }}>
      <h1 style={{ color: "#00ff88", fontSize: "18px", margin: "0 0 4px 0", borderBottom: "1px solid #00ff88", paddingBottom: "8px" }}>
        📹 Media Capture Diagnostics
      </h1>
      <p style={{ color: "#888", margin: "4px 0 16px 0", fontSize: "11px" }}>
        iOS Safari / Mobile Browser QA Tool
      </p>

      {/* Static diagnostics */}
      <div style={{ marginBottom: "16px" }}>
        {diag.map(sec => (
          <div key={sec.title} style={{ marginBottom: "8px" }}>
            <div style={{ color: "#00ccff", fontWeight: "bold", marginBottom: "2px" }}>
              [{sec.title}]
            </div>
            {sec.lines.map((l, i) => (
              <div key={i} style={{ paddingLeft: "12px", color: l.startsWith("✓") ? "#00ff88" : l.startsWith("✗") ? "#ff4444" : "#aaffaa" }}>
                {l}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Test buttons */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {(["audio", "video", "photo"] as const).map(mode => (
          <button
            key={mode}
            onClick={() => runTest(mode)}
            disabled={!!running}
            style={{
              background: running === mode ? "#003300" : "#001a00",
              color: running === mode ? "#ffff00" : "#00ff88",
              border: `1px solid ${running === mode ? "#ffff00" : "#00ff88"}`,
              padding: "10px 20px",
              fontFamily: "monospace",
              fontSize: "14px",
              cursor: running ? "not-allowed" : "pointer",
              borderRadius: "4px",
              minWidth: "120px",
            }}
          >
            {running === mode ? `⏳ Testing...` : `▶ Test ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
          </button>
        ))}
        <button
          onClick={() => { setLogs([]); setPlaybackUrl(null); setBlobInfo(null); cleanup(); }}
          style={{
            background: "#1a0000",
            color: "#ff4444",
            border: "1px solid #ff4444",
            padding: "10px 20px",
            fontFamily: "monospace",
            fontSize: "14px",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          ✕ Clear
        </button>
      </div>

      {/* Preview + Playback side by side */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: "1", minWidth: "200px" }}>
          <div style={{ color: "#00ccff", marginBottom: "4px" }}>[LIVE PREVIEW]</div>
          <video
            ref={previewRef}
            muted
            playsInline
            style={{
              width: "100%",
              maxWidth: "320px",
              background: "#111",
              border: "1px solid #333",
              display: "block",
              borderRadius: "4px",
            }}
          />
        </div>

        {playbackUrl && (
          <div style={{ flex: "1", minWidth: "200px" }}>
            <div style={{ color: "#00ccff", marginBottom: "4px" }}>
              [PLAYBACK] {blobInfo ? `${fmtBytes(blobInfo.size)} · ${blobInfo.type}` : ""}
            </div>
            {playbackType === "video" && playbackUrl.startsWith("data:image") ? (
              // Photo mode
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={playbackUrl}
                alt="Captured photo"
                style={{ width: "100%", maxWidth: "320px", border: "1px solid #00ff88", borderRadius: "4px" }}
              />
            ) : playbackType === "video" ? (
              <video
                ref={playbackRef as React.RefObject<HTMLVideoElement>}
                controls
                playsInline
                style={{
                  width: "100%",
                  maxWidth: "320px",
                  background: "#111",
                  border: "1px solid #00ff88",
                  display: "block",
                  borderRadius: "4px",
                }}
              />
            ) : (
              <audio
                ref={playbackRef as React.RefObject<HTMLAudioElement>}
                controls
                style={{
                  width: "100%",
                  border: "1px solid #00ff88",
                  borderRadius: "4px",
                  background: "#111",
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Log output */}
      <div style={{ color: "#00ccff", marginBottom: "4px" }}>[LOG]</div>
      <div style={{
        background: "#050505",
        border: "1px solid #222",
        borderRadius: "4px",
        padding: "8px",
        minHeight: "200px",
        maxHeight: "400px",
        overflowY: "auto",
        fontSize: "12px",
      }}>
        {logs.length === 0 && (
          <span style={{ color: "#444" }}>Press a test button to begin...</span>
        )}
        {logs.map((entry, i) => (
          <div key={i} style={{ marginBottom: "2px", color: levelColor[entry.level], wordBreak: "break-all" }}>
            <span style={{ color: "#555", marginRight: "8px" }}>{entry.ts}</span>
            {entry.msg}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      <p style={{ color: "#333", marginTop: "12px", fontSize: "11px" }}>
        /media-test — OurFable diagnostics page — no auth required
      </p>
    </div>
  );
}
