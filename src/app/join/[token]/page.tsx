"use client";
import { useState, useEffect, use } from "react";
import { Heart, Send, Check, Lock } from "lucide-react";

// All Convex calls go through /api/ourfable/data proxy

interface Member { _id: string; familyId: string; name: string; relationship: string; relationshipKey: string; }
interface Family { childName: string; childDob: string; parentNames?: string; childPhotoUrl?: string; }

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
        // Default open: child's 18th birthday
        const dob = new Date(fd.value.childDob);
        setOpenOn(new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate()).toISOString().slice(0, 10));
      }
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSubmitting(true);
    try {
      await fetch(`/api/ourfable/data`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "ourfable:submitContribution",
          type: "mutation",
          args: { familyId: member.familyId, memberId: member._id, type: "letter", subject: subject || `A letter from ${member.name}`, body, openOn },
        }),
      });
      setSubmitted(true);
    } finally { setSubmitting(false); }
  };

  const childFirst = family?.childName.split(" ")[0] ?? "them";
  const recipientFirst = member?.name.split(" ")[0] ?? "";
  const prompt = PROMPTS[member?.relationshipKey ?? ""] ?? PROMPTS.default;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--gold)", opacity: 0.4, animation: "pulse 1.4s ease-in-out infinite" }} />
      <style>{`@keyframes pulse{0%,100%{opacity:.2}50%{opacity:.8}}`}</style>
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
      <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Our Fable wordmark */}
        <p style={{ textAlign: "center", fontFamily: "var(--font-playfair)", fontSize: 16, fontWeight: 300, color: "var(--green)", letterSpacing: "0.15em", marginBottom: 8 }}>
          Our Fable
        </p>

        {/* Welcome — child voice */}
        <div className="card" style={{ padding: "36px 28px", textAlign: "center" }}>
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
        <div className="card" style={{ padding: "24px 28px" }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--green)", marginBottom: 12 }}>
            A prompt for you
          </p>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 17, fontWeight: 300, lineHeight: 1.8, color: "var(--text)", fontStyle: "italic" }}>
            &ldquo;{prompt}&rdquo;
          </p>
        </div>

        {/* Write form */}
        <form onSubmit={submit} className="card" style={{ padding: "28px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 300, color: "var(--text)" }}>
            Write something for {childFirst}
          </h2>

          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="input" placeholder={`Something for ${childFirst} to know`} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Your letter</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={10} required className="input"
              style={{ resize: "none", fontFamily: "var(--font-playfair)", fontSize: 16, lineHeight: 1.85 }} />
          </div>

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

          <button type="submit" disabled={submitting || !body.trim()} className="btn-gold" style={{ justifyContent: "center" }}>
            <Send size={14} strokeWidth={1.5} />
            {submitting ? "Sealing…" : `Seal this letter for ${childFirst}`}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)" }}>
          Private. Not on social. Not public.{family.parentNames ? ` Set up by ${family.parentNames}.` : ""}
        </p>
      </div>
    </div>
  );
}
