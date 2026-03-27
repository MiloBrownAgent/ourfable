"use client";
import { use, useEffect, useState } from "react";
import { Phone, Copy, Check, Mic, ChevronDown } from "lucide-react";

interface VoiceSubmission {
  _id: string;
  callerPhone: string;
  audioUrl?: string;
  transcription?: string;
  durationSeconds?: number;
  status: string;
  createdAt: number;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `••• •• ${digits.slice(-4)}`;
}

function formatDuration(s?: number): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const OURFABLE_PHONE = "(612) 555-0180";
const SHARE_MESSAGE = `You can leave a voice message any time — just call ${OURFABLE_PHONE}. Our Fable will keep it in the vault, and they'll hear your voice someday. No app, no login — just call.`;

function VoiceCard({ item }: { item: VoiceSubmission }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card">
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "20px 24px", display: "flex", gap: 14, alignItems: "center", textAlign: "left" }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Mic size={16} color="var(--sage)" strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 17, color: "var(--text)", marginBottom: 3 }}>
            {maskPhone(item.callerPhone)}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-3)" }}>
            {formatDate(item.createdAt)}{item.durationSeconds ? ` · ${formatDuration(item.durationSeconds)}` : ""}
          </p>
        </div>
        <ChevronDown size={15} color="var(--text-3)" strokeWidth={1.5} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
      </button>
      {expanded && (
        <div style={{ padding: "0 24px 24px", borderTop: "1px solid var(--border)" }}>
          {item.audioUrl && (
            <audio controls src={item.audioUrl} style={{ width: "100%", marginTop: 16, marginBottom: 12 }} />
          )}
          {item.transcription && (
            <div style={{ paddingTop: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Transcription</p>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 16, lineHeight: 1.8, color: "var(--text-2)" }}>{item.transcription}</p>
            </div>
          )}
          {!item.audioUrl && !item.transcription && (
            <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic", paddingTop: 16 }}>Processing…</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function VoicePage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);
  const [childName, setChildName] = useState("your child");
  const [submissions, setSubmissions] = useState<VoiceSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId } }) }).then(r => r.json()),
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:listVoiceSubmissions", args: { familyId } }) }).then(r => r.json()),
    ]).then(([fRes, vRes]) => {
      setChildName((fRes.value?.childName ?? "your child").split(" ")[0]);
      setSubmissions(vRes.value ?? []);
      setLoading(false);
    });
  }, [familyId]);

  const copyPhone = () => { navigator.clipboard.writeText(OURFABLE_PHONE).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const copyMessage = () => { navigator.clipboard.writeText(SHARE_MESSAGE).catch(() => {}); setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 2000); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 44, height: 44, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Phone size={18} color="var(--sage)" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
            Messages for {childName}
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, lineHeight: 1.5 }}>
            Anyone in {childName}'s circle can call and leave a voice message. No app. No login. Just their voice.
          </p>
        </div>
      </div>

      {/* Hero card — phone number */}
      <div className="card" style={{ padding: "36px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(107,143,111,0.05) 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--sage)", marginBottom: 16 }}>Our Fable Voice Line</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 300, color: "var(--text)", letterSpacing: "0.04em" }}>{OURFABLE_PHONE}</p>
            <button onClick={copyPhone} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: copied ? "var(--sage)" : "var(--text-3)", transition: "color 200ms" }}>
              {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={1.5} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.8, maxWidth: 420, margin: "0 auto 24px" }}>
            Call this number. You'll hear a greeting, then a tone. Say anything — a memory, a wish, a story. Our Fable records it and keeps it in {childName}'s vault.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <span className="chip" style={{ fontSize: 11 }}>Up to 3 minutes</span>
            <span className="chip chip-sage" style={{ fontSize: 11 }}>Stored in the vault</span>
            <span className="chip" style={{ fontSize: 11 }}>Parents notified</span>
          </div>
        </div>
      </div>

      {/* What happens on the call */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 16 }}>What callers hear</p>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: 16, color: "var(--text-2)", lineHeight: 1.75, margin: 0 }}>
            "Hi — you've reached {childName}'s memory vault. He'll hear this when he grows up. Take as long as you need, and say whatever you want him to know. Start whenever you're ready."
          </p>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 12, lineHeight: 1.6 }}>
          After the call, Our Fable sends the caller a text: <em>&quot;Your message for {childName} was saved. They'll hear your voice someday. ❤&quot;</em>
        </p>
      </div>

      {/* Share section */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>Share with your circle</p>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, margin: 0 }}>{SHARE_MESSAGE}</p>
        </div>
        <button onClick={copyMessage} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: copiedMsg ? "var(--sage-dim)" : "var(--surface)", border: `1px solid ${copiedMsg ? "rgba(107,143,111,0.3)" : "var(--border)"}`, color: copiedMsg ? "var(--sage)" : "var(--text-2)", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 160ms" }}>
          {copiedMsg ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={1.5} />}
          {copiedMsg ? "Copied!" : "Copy message"}
        </button>
      </div>

      {/* Past messages */}
      {!loading && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>
            Voice messages {submissions.length > 0 ? `· ${submissions.length}` : ""}
          </p>
          {submissions.length === 0 ? (
            <div className="card" style={{ padding: "40px 28px", textAlign: "center" }}>
              <Mic size={24} color="var(--text-3)" strokeWidth={1} style={{ margin: "0 auto 12px" }} />
              <p className="font-display" style={{ fontStyle: "italic", fontSize: 17, color: "var(--text-3)", lineHeight: 1.6 }}>
                No voice messages yet.<br />Share the number with your circle.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {submissions.map(s => <VoiceCard key={s._id} item={s} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
