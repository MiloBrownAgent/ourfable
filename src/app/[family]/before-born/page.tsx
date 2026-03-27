"use client";
import { use, useEffect, useState, useRef } from "react";
import { Heart, Lock, ChevronDown, ChevronUp } from "lucide-react";

interface Prompt {
  _id: string;
  promptKey: string;
  displayPrompt: string;
  answer?: string;
  answeredAt?: number;
  sortOrder: number;
  sealedUntilAge: number;
}

function PromptCard({ prompt, familyId, onAnswered }: { prompt: Prompt; familyId: string; onAnswered: () => void }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState(prompt.answer ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answered = !!prompt.answer;

  const save = async () => {
    if (!answer.trim()) return;
    setSaving(true);
    await fetch(`/api/ourfable/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:answerBeforeBorn", args: { familyId, promptKey: prompt.promptKey, answer: answer.trim() }, type: "mutation" }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onAnswered(); }, 1200);
  };

  return (
    <div className="card" style={{ overflow: "hidden", borderLeft: answered ? "3px solid var(--gold)" : "3px solid var(--border)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "28px 32px", textAlign: "left", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--sage)" }}>
              {String(prompt.sortOrder).padStart(2, "0")}
            </span>
            {answered && (
              <span className="chip chip-gold" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                <Lock size={9} strokeWidth={2} /> Sealed · Opens at {prompt.sealedUntilAge}
              </span>
            )}
          </div>
          <p className="font-display" style={{ fontStyle: "italic", fontSize: "clamp(1.1rem, 2.5vw, 1.35rem)", fontWeight: 400, color: "var(--text)", lineHeight: 1.55, margin: 0 }}>
            "{prompt.displayPrompt}"
          </p>
        </div>
        <div style={{ flexShrink: 0, marginTop: 4, color: "var(--text-3)", transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms" }}>
          <ChevronDown size={16} strokeWidth={1.5} />
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 32px 32px", borderTop: "1px solid var(--border)" }}>
          {answered && !open ? null : null}
          <div style={{ paddingTop: 24 }}>
            {answered ? (
              <div>
                <div style={{ position: "relative", marginBottom: 16 }}>
                  <div style={{
                    fontFamily: "var(--font-cormorant)", fontSize: 17, lineHeight: 1.9, color: "var(--text-2)", whiteSpace: "pre-wrap",
                    filter: revealed ? "none" : "blur(5px)",
                    userSelect: revealed ? "text" : "none",
                    transition: "filter 300ms",
                  }}>
                    {prompt.answer}
                  </div>
                  {!revealed && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <button onClick={() => setRevealed(true)} style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)", borderRadius: 8, padding: "8px 18px", fontSize: 12, color: "var(--gold)", cursor: "pointer", fontWeight: 500, backdropFilter: "blur(2px)" }}>
                        Preview your answer
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => { setOpen(false); setTimeout(() => { setOpen(true); setRevealed(false); }, 50); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--text-3)", padding: 0, textDecoration: "underline" }}>
                  Edit answer
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <textarea
                  ref={textareaRef}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  autoFocus
                  rows={8}
                  placeholder="Write honestly. They'll read this when they're 18."
                  className="input"
                  style={{ resize: "none", fontFamily: "var(--font-cormorant)", fontSize: 17, lineHeight: 1.85, padding: "16px 20px" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={save}
                    disabled={saving || !answer.trim()}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10,
                      background: saved ? "var(--sage-dim)" : "var(--gold-dim)",
                      border: `1px solid ${saved ? "rgba(107,143,111,0.3)" : "var(--gold-border)"}`,
                      color: saved ? "var(--sage)" : "var(--gold)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 200ms",
                      opacity: (!answer.trim() || saving) ? 0.5 : 1,
                    }}
                  >
                    <Lock size={13} strokeWidth={2} />
                    {saved ? "Sealed ✓" : saving ? "Sealing…" : "Seal this answer"}
                  </button>
                  <p style={{ fontSize: 11, color: "var(--text-4)", fontStyle: "italic" }}>Opens at age {prompt.sealedUntilAge}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BeforeBornPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [childDob, setChildDob] = useState<string>("");
  const [childName, setChildName] = useState("them");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [familyRes, promptsRes] = await Promise.all([
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId } }) }).then(r => r.json()),
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:listBeforeBorn", args: { familyId } }) }).then(r => r.json()),
    ]);
    const fam = familyRes.value;
    setChildName((fam?.childName ?? "them").split(" ")[0]);
    setChildDob(fam?.childDob ?? "");
    let p = promptsRes.value ?? [];
    if (p.length === 0) {
      await fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:seedBeforeBorn", args: { familyId }, type: "mutation" }) });
      const refetch = await fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:listBeforeBorn", args: { familyId } }) }).then(r => r.json());
      p = refetch.value ?? [];
    }
    setPrompts(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, [familyId]);

  // How many prompts to reveal: 1 per month since birth anniversary, capped at 10
  const monthsOld = (() => {
    if (!childDob) return 1;
    const born = new Date(childDob + "T00:00:00");
    const now = new Date();
    // Count full month anniversaries that have passed
    let m = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
    // If we haven't reached the day-of-month yet this month, subtract one
    if (now.getDate() < born.getDate()) m -= 1;
    return Math.max(1, Math.min(m, 10)); // 1 prompt per month, capped at 10
  })();

  const visiblePrompts = prompts.slice(0, monthsOld);
  const nextUnlockMonth = monthsOld < 10 ? monthsOld + 1 : null;
  const answered = visiblePrompts.filter(p => p.answer).length;
  const total = visiblePrompts.length;
  const pct = total > 0 ? (answered / total) * 100 : 0;

  // Next unlock date — the Nth month anniversary of birth
  const nextUnlockDate = (() => {
    if (!nextUnlockMonth || !childDob) return null;
    const born = new Date(childDob + "T00:00:00");
    const d = new Date(born.getFullYear(), born.getMonth() + nextUnlockMonth, born.getDate());
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 44, height: 44, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Heart size={18} color="var(--gold)" strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>Before You Were Born</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.65, color: "var(--text-3)", marginTop: 2 }}>
            Questions {childName} will one day ask. One arrives each month — answer it while it's fresh.
          </p>
        </div>
      </div>

      {/* Progress */}
      {!loading && total > 0 && (
        <div className="card" style={{ padding: "18px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.65, color: "var(--text-2)" }}>
              {answered === total && total === 10
                ? `All 10 answers sealed for ${childName}.`
                : answered === total
                ? `${answered} of ${total} answered — next question arrives ${nextUnlockDate}.`
                : `${answered} of ${total} answered so far.`}
            </p>
            <span className="chip chip-gold" style={{ fontSize: 11 }}>{answered}/{total}</span>
          </div>
          <div style={{ height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "var(--gold)", borderRadius: 4, transition: "width 400ms ease" }} />
          </div>
          {answered === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-3)", fontStyle: "italic", marginTop: 10 }}>
              Sealed until {childName} turns 18. Write honestly — that's the whole point.
            </p>
          )}
        </div>
      )}

      {/* Prompts — only show unlocked ones */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="card" style={{ padding: 32, opacity: 0.25, height: 90 }} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visiblePrompts.map(p => (
            <PromptCard key={p._id} prompt={p} familyId={familyId} onAnswered={load} />
          ))}
        </div>
      )}

      {/* Next prompt teaser */}
      {!loading && nextUnlockDate && (
        <div style={{ padding: "16px 20px", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 12, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "var(--text-3)", fontStyle: "italic" }}>
            Question {monthsOld + 1} of 10 arrives {nextUnlockDate}.
          </p>
        </div>
      )}
    </div>
  );
}
