"use client";
import { useEffect, useRef, useState } from "react";
import { Lock, Unlock, Mail, Plus, ChevronDown, X, Image as ImageIcon, Mic, Video, Upload } from "lucide-react";
import NextImage from "next/image";
import { useChildContext } from "@/components/ChildContext";
import { useVaultKey } from "@/lib/vault-key-context";
import { decryptText, deserializeEncryptedText, encryptBlob, encryptText, hashContent, serializeEncryptedText } from "@/lib/vault-encryption";

interface Letter {
  _id: string; author: string; subject?: string; body?: string;
  encryptedBody?: string;
  displaySubject?: string;
  displayBody?: string;
  openOn: string; isOpen: boolean; writtenAt: number; openedAt?: number;
  mediaUrl?: string; mediaType?: string;
  mediaStorageId?: string;
  mediaMimeType?: string;
  mediaEncryptionIv?: string;
  mediaEncryptionTag?: string;
  mediaEncryptionVersion?: number;
}

function parseLetterPayload(text: string): { subject: string; body: string } {
  const normalized = text.replace(/\r\n/g, "\n");
  if (normalized.startsWith("Subject: ")) {
    const [first, ...rest] = normalized.split("\n");
    return {
      subject: first.replace(/^Subject:\s*/, "").trim() || "A letter for later",
      body: rest.join("\n").replace(/^\n+/, ""),
    };
  }
  return { subject: "A letter for later", body: normalized };
}

function countdown(openOn: string): string {
  const target = new Date(openOn + "T00:00:00");
  const now = new Date();
  if (target <= now) return "Open now";
  const diffMs = target.getTime() - now.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  if (years > 0 && months > 0) return `Opens in ${years}y ${months}m`;
  if (years > 0) return `Opens in ${years} year${years !== 1 ? "s" : ""}`;
  if (months > 0) return `Opens in ${months} month${months !== 1 ? "s" : ""}`;
  return `Opens in ${totalDays} day${totalDays !== 1 ? "s" : ""}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function MediaBadge({ mediaType }: { mediaType: string }) {
  const icon = mediaType === "photo" ? <ImageIcon size={10} aria-hidden="true" /> : mediaType === "voice" ? <Mic size={10} aria-hidden="true" /> : <Video size={10} aria-hidden="true" />;
  const label = mediaType === "photo" ? "Photo" : mediaType === "voice" ? "Voice memo" : "Video";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-3)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 6px", marginLeft: 8 }}>
      {icon} {label} attached
    </span>
  );
}

function MediaPlayer({ mediaUrl, mediaType }: { mediaUrl: string; mediaType: string }) {
  if (mediaType === "photo") {
    return (
      <div style={{ marginTop: 16, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", position: "relative", width: "100%", aspectRatio: "4/3" }}>
        <NextImage src={mediaUrl} alt="Letter attachment" fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
    );
  }
  if (mediaType === "voice") {
    return (
      <div style={{ marginTop: 16, padding: "14px 16px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Voice memo</p>
        <audio controls src={mediaUrl} style={{ width: "100%", height: 36 }} />
      </div>
    );
  }
  if (mediaType === "video") {
    return (
      <div style={{ marginTop: 16, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
        <video controls src={mediaUrl} style={{ width: "100%", maxHeight: 400, display: "block", background: "#000" }} />
      </div>
    );
  }
  return null;
}

function SealedCard({ letter }: { letter: Letter }) {
  return (
    <div className="card card-hover" style={{ padding: "20px 24px", display: "flex", gap: 16, cursor: "default" }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Lock size={16} color="var(--gold)" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 400, color: "var(--text)", marginBottom: 4 }}>
          {letter.subject}
        </p>
        <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
          From {letter.author} · Written {formatDate(letter.writtenAt)}
          {letter.mediaType && <MediaBadge mediaType={letter.mediaType} />}
        </p>
        <span className="chip chip-gold">{countdown(letter.openOn)}</span>
      </div>
    </div>
  );
}

function OpenCard({ letter }: { letter: Letter }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "20px 24px", display: "flex", gap: 16, alignItems: "flex-start", textAlign: "left" }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Unlock size={16} color="var(--sage)" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 400, color: "var(--text)", marginBottom: 4 }}>
            {letter.displaySubject ?? letter.subject ?? "A letter for later"}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>
            From {letter.author} · Written {formatDate(letter.writtenAt)}
            {letter.mediaType && <MediaBadge mediaType={letter.mediaType} />}
          </p>
        </div>
        <ChevronDown size={16} color="var(--text-3)" strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0, marginTop: 4, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
      </button>
      {expanded && (
        <div style={{ padding: "0 24px 28px", borderTop: "1px solid var(--border)" }}>
          <div style={{ paddingTop: 20, fontFamily: "var(--font-cormorant)", fontSize: 17, fontWeight: 300, lineHeight: 1.9, color: "var(--text)", whiteSpace: "pre-wrap" }}>
            {letter.displayBody ?? letter.body ?? "Unlock vault encryption to read this letter."}
          </div>
          {letter.mediaUrl && letter.mediaType && (
            <MediaPlayer mediaUrl={letter.mediaUrl} mediaType={letter.mediaType} />
          )}
        </div>
      )}
    </div>
  );
}

const SEAL_PRESETS = [
  { label: "16th birthday", value: "2041-06-21" },
  { label: "18th birthday", value: "2043-06-21" },
  { label: "21st", value: "2046-06-21" },
  { label: "Graduation", value: "2047-06-01" },
  { label: "Wedding day", value: "2055-06-21" },
];

function WriteForm({ familyId, childName, onDone }: { familyId: string; childName: string; onDone: () => void }) {
  const { familyKey, isEncryptionEnabled } = useVaultKey();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [author, setAuthor] = useState("Dave");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(`Dear ${childName},\n\n`);
  const [openOn, setOpenOn] = useState("2043-06-21");
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyKey || !isEncryptionEnabled) {
      setError("Unlock vault encryption before sealing this letter.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const fullBody = `Subject: ${subject.trim()}\n\n${body.trim()}`;
      const encrypted = await encryptText(fullBody, familyKey);
      const contentHash = await hashContent(fullBody);
      const mutationArgs: Record<string, string | number> = {
        familyId,
        author,
        openOn,
        encryptedBody: serializeEncryptedText(encrypted),
        contentHash,
        encryptionVersion: 1,
      };

      if (selectedFile) {
        const encryptedBlob = await encryptBlob(selectedFile, familyKey);
        const uploadUrlRes = await fetch('/api/ourfable/upload-media', { method: 'POST' });
        const uploadUrlData = await uploadUrlRes.json();
        if (!uploadUrlRes.ok) throw new Error(uploadUrlData.error ?? 'Failed to prepare upload');

        const uploadRes = await fetch(uploadUrlData.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: new Blob([encryptedBlob.data], { type: 'application/octet-stream' }),
        });
        if (!uploadRes.ok) throw new Error('Failed to upload encrypted attachment');

        const mediaType = selectedFile.type.startsWith('image/') ? 'photo' : selectedFile.type.startsWith('audio/') ? 'voice' : 'video';
        mutationArgs.mediaUrl = uploadUrlData.publicUrl;
        mutationArgs.mediaStorageId = uploadUrlData.storageId;
        mutationArgs.mediaType = mediaType;
        mutationArgs.mediaMimeType = selectedFile.type || 'application/octet-stream';
        mutationArgs.mediaEncryptionIv = encryptedBlob.iv;
        mutationArgs.mediaEncryptionTag = encryptedBlob.tag;
        mutationArgs.mediaEncryptionVersion = 1;
      }

      const res = await fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:writeLetter", args: mutationArgs, type: "mutation" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Failed to seal letter');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seal letter');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="card" style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
          Write a letter to {childName}
        </h2>
        <button type="button" onClick={onDone} className="btn-ghost"><X size={15} aria-hidden="true" /></button>
      </div>

      <div className="letters-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label htmlFor="letter-author" style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>From</label>
          <input id="letter-author" value={author} onChange={e => setAuthor(e.target.value)} className="input" placeholder="Your name" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Seal until</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SEAL_PRESETS.map(p => (
              <button key={p.value} type="button" onClick={() => setOpenOn(p.value)}
                style={{
                  padding: "10px 16px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                  minHeight: 44,
                  background: openOn === p.value ? "var(--gold-dim)" : "var(--surface)",
                  border: `1px solid ${openOn === p.value ? "var(--gold-border)" : "var(--border)"}`,
                  color: openOn === p.value ? "var(--gold)" : "var(--text-3)",
                  transition: "all 160ms",
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="letter-subject" style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Subject</label>
        <input id="letter-subject" value={subject} onChange={e => setSubject(e.target.value)} className="input" placeholder={`Something for ${childName} to know`} required />
      </div>

      <div>
        <label htmlFor="letter-body" style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Letter</label>
        <textarea id="letter-body" value={body} onChange={e => setBody(e.target.value)} rows={9} required
          className="input" style={{ resize: "none", fontFamily: "var(--font-cormorant)", fontSize: 16, lineHeight: 1.85 }} />
      </div>

      <div>
        <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
          Attach media <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime,audio/*,.m4a,.mp3,.wav,.ogg"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setSelectedFile(file);
            e.target.value = '';
          }}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-outline" style={{ justifyContent: 'center', width: '100%' }}>
          <Upload size={14} /> {selectedFile ? selectedFile.name : 'Add a photo, video, or voice memo'}
        </button>
      </div>

      {error && <p style={{ fontSize: 12, color: '#B44B4B', margin: 0 }}>{error}</p>}

      <button type="submit" disabled={saving || !subject.trim() || !body.trim()} className="btn-gold" style={{ justifyContent: "center" }}>
        {saving ? "Sealing…" : "Seal this letter"}
      </button>
    </form>
  );
}

export default function LettersInner({ familyId }: { familyId: string }) {
  const { selectedChild } = useChildContext();
  const { familyKey } = useVaultKey();
  const childId = selectedChild?.childId || selectedChild?._id;
  const [letters, setLetters] = useState<Letter[]>([]);
  const [family, setFamily] = useState<{ childName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const letterArgs = childId ? { familyId, childId } : { familyId };
    const [lettersRes, familyRes] = await Promise.all([
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:listLetters", args: letterArgs }) }).then(r => r.json()),
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId } }) }).then(r => r.json()),
    ]);

    const nextLetters: Letter[] = await Promise.all((lettersRes.value ?? []).map(async (letter: Letter) => {
      if (letter.encryptedBody && familyKey) {
        try {
          const decrypted = await decryptText(deserializeEncryptedText(letter.encryptedBody), familyKey);
          const parsed = parseLetterPayload(decrypted);
          return { ...letter, displaySubject: parsed.subject, displayBody: parsed.body };
        } catch {
          return { ...letter, displaySubject: letter.subject ?? "A sealed letter", displayBody: letter.body };
        }
      }
      return { ...letter, displaySubject: letter.subject, displayBody: letter.body };
    }));

    setLetters(nextLetters);
    setFamily(familyRes.value ?? null);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [familyId, childId, familyKey]);

  const today = new Date().toISOString().slice(0, 10);
  const sealed = letters.filter(l => l.openOn > today);
  const open = letters.filter(l => l.openOn <= today);
  const childName = family?.childName.split(" ")[0] ?? "them";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Mail size={18} color="var(--gold)" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>Letters to {childName}</h1>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>{letters.length} letter{letters.length !== 1 ? "s" : ""} sealed for {childName} — waiting for the right moment</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-outline" style={{ fontSize: 12, padding: "9px 16px", minHeight: 44 }}>
          <Plus size={13} strokeWidth={2} aria-hidden="true" /> Write
        </button>
      </div>

      {showForm && (
        <WriteForm familyId={familyId} childName={childName} onDone={() => { setShowForm(false); load(); }} />
      )}

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Loading…</p>
        </div>
      ) : (
        <>
          {sealed.length > 0 && (
            <section>
              <div className="section-header"><span>Sealed · {sealed.length}</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sealed.map(l => <SealedCard key={l._id} letter={l} />)}
              </div>
            </section>
          )}
          {open.length > 0 && (
            <section>
              <div className="section-header"><span>Open · {open.length}</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {open.map(l => <OpenCard key={l._id} letter={l} />)}
              </div>
            </section>
          )}
          {letters.length === 0 && !showForm && (
            <div className="card" style={{ padding: 64, textAlign: "center" }}>
              <Lock size={28} color="var(--text-3)" strokeWidth={1} aria-hidden="true" style={{ margin: "0 auto 16px" }} />
              <p className="font-display" style={{ fontStyle: "italic", fontSize: 20, color: "var(--text-2)", marginBottom: 8 }}>
                The vault is empty.
              </p>
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>One letter from Milo is being written — sealed for {childName}&apos;s 18th birthday.</p>
            </div>
          )}
        </>
      )}

      <style>{`
        @media (max-width: 480px) {
          .letters-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
