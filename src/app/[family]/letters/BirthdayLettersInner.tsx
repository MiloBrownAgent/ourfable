"use client";
import { useEffect, useState } from "react";
import { Gift, Lock, RefreshCw, ChevronDown, Pencil, Check } from "lucide-react";
import { useChildContext } from "@/components/ChildContext";

interface BirthdayLetter {
  _id: string;
  year: number;
  milestonesText?: string;
  contributionCount: number;
  worldHighlight?: string;
  parentNote?: string;
  isSealed: boolean;
  sealedUntilAge: number;
  generatedAt: number;
}

interface Family {
  childName: string;
  childDob: string;
}

function yearRange(dob: string, year: number): string {
  const born = new Date(dob + "T12:00:00");
  const start = new Date(born.getFullYear() + year - 1, born.getMonth(), born.getDate());
  const end = new Date(born.getFullYear() + year, born.getMonth(), born.getDate());
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return `${fmt(start)} — ${fmt(end)}`;
}

function ordinal(n: number): string {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v-20)%10]||s[v]||s[0]);
}

function LetterCard({ letter, familyId, childFirst, dob, onRefresh }: {
  letter: BirthdayLetter; familyId: string; childFirst: string; dob: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(letter.parentNote ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    await fetch(`/api/ourfable/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:generateBirthdayLetter", args: { familyId, year: letter.year }, type: "mutation" }),
    });
    setGenerating(false);
    onRefresh();
  };

  const saveNote = async () => {
    setSavingNote(true);
    await fetch(`/api/ourfable/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:patchBirthdayLetterParentNote", args: { familyId, year: letter.year, note }, type: "mutation" }),
    });
    setSavingNote(false);
    setEditingNote(false);
    onRefresh();
  };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "24px 28px", textAlign: "left", display: "flex", alignItems: "center", gap: 16 }}
      >
        {/* Year badge */}
        <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 300, color: "var(--gold)", lineHeight: 1, margin: 0 }}>{letter.year}</p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 8, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "2px 0 0" }}>year</p>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 19, fontWeight: 400, color: "var(--text)", marginBottom: 4 }}>
            {childFirst}'s {ordinal(letter.year)} Year
          </p>
          <p style={{ fontSize: 11, color: "var(--text-3)" }}>{yearRange(dob, letter.year)}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span className="chip chip-gold" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
            <Lock size={9} strokeWidth={2} /> Age {letter.sealedUntilAge}
          </span>
          <ChevronDown size={15} color="var(--text-3)" strokeWidth={1.5} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
        </div>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* World highlight */}
          {letter.worldHighlight && (
            <div style={{ padding: "14px 18px", background: "var(--surface)", borderRadius: 10, borderLeft: "2px solid var(--gold-border)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>The world that year</p>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 16, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{letter.worldHighlight}</p>
            </div>
          )}

          {/* Milestones */}
          {letter.milestonesText && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>Milestones</p>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 15, color: "var(--text-2)", lineHeight: 1.7, margin: 0 }}>{letter.milestonesText}</p>
            </div>
          )}

          {/* Contributions */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="chip" style={{ fontSize: 11 }}>
              {letter.contributionCount} {letter.contributionCount === 1 ? "person" : "people"} wrote to {childFirst} this year
            </span>
          </div>

          {/* Parent note */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>Your note</p>
            {editingNote ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={5}
                  autoFocus
                  placeholder={`What do you want ${childFirst} to know about this year?`}
                  className="input"
                  style={{ fontFamily: "var(--font-cormorant)", fontSize: 16, lineHeight: 1.85, resize: "none" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveNote} disabled={savingNote} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", color: "var(--gold)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <Lock size={11} strokeWidth={2} /> {savingNote ? "Sealing…" : "Seal note"}
                  </button>
                  <button onClick={() => setEditingNote(false)} style={{ padding: "9px 14px", borderRadius: 8, background: "none", border: "1px solid var(--border)", color: "var(--text-3)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : letter.parentNote ? (
              <div>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 16, lineHeight: 1.85, color: "var(--text-2)", marginBottom: 10 }}>{letter.parentNote}</p>
                <button onClick={() => setEditingNote(true)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: "5px 10px", fontSize: 11, color: "var(--text-3)", cursor: "pointer" }}>
                  <Pencil size={10} strokeWidth={1.5} /> Edit note
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingNote(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 9, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)", fontSize: 13, cursor: "pointer" }}>
                <Pencil size={12} strokeWidth={1.5} /> Add your note to this letter
              </button>
            )}
          </div>

          {/* Refresh */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <button onClick={generate} disabled={generating} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: "7px 14px", fontSize: 11, color: "var(--text-3)", cursor: "pointer" }}>
              <RefreshCw size={11} strokeWidth={1.5} style={{ animation: generating ? "spin 1s linear infinite" : "none" }} />
              {generating ? "Regenerating…" : "Regenerate"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderCard({ year, childFirst, dob, familyId, onGenerated }: { year: number; childFirst: string; dob: string; familyId: string; onGenerated: () => void }) {
  const [generating, setGenerating] = useState(false);
  const generate = async () => {
    setGenerating(true);
    await fetch(`/api/ourfable/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:generateBirthdayLetter", args: { familyId, year }, type: "mutation" }),
    });
    setGenerating(false);
    onGenerated();
  };

  return (
    <div className="card" style={{ padding: "22px 28px", display: "flex", alignItems: "center", gap: 16, opacity: 0.5 }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--surface)", border: "1px dashed var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 300, color: "var(--text-3)", lineHeight: 1, margin: 0 }}>{year}</p>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 17, color: "var(--text-3)", marginBottom: 2 }}>{childFirst}'s {ordinal(year)} Year</p>
        <p style={{ fontSize: 11, color: "var(--text-4)" }}>{yearRange(dob, year)}</p>
      </div>
      <button onClick={generate} disabled={generating} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-3)", fontSize: 11, cursor: "pointer" }}>
        <RefreshCw size={10} strokeWidth={1.5} style={{ animation: generating ? "spin 1s linear infinite" : "none" }} />
        {generating ? "Generating…" : "Generate"}
      </button>
    </div>
  );
}

export default function BirthdayLettersInner({ familyId }: { familyId: string }) {
  const { selectedChild } = useChildContext();
  const childId = selectedChild?.childId || selectedChild?._id;
  const [family, setFamily] = useState<Family | null>(null);
  const [letters, setLetters] = useState<BirthdayLetter[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const birthdayArgs = childId ? { familyId, childId } : { familyId };
    const [fRes, lRes] = await Promise.all([
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId } }) }).then(r => r.json()),
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:listBirthdayLetters", args: birthdayArgs }) }).then(r => r.json()),
    ]);
    setFamily(fRes.value ?? null);
    setLetters(lRes.value ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [familyId, childId]);

  const childFirst = family?.childName.split(" ")[0] ?? "them";
  const dob = family?.childDob ?? "";

  // Calculate completed years
  const completedYears: number[] = [];
  if (dob) {
    const born = new Date(dob + "T00:00:00");
    const now = new Date();
    let y = 1;
    while (true) {
      const birthday = new Date(born.getFullYear() + y, born.getMonth(), born.getDate());
      if (birthday > now) break;
      completedYears.push(y);
      y++;
      if (y > 25) break;
    }
  }

  const lettersMap = new Map(letters.map(l => [l.year, l]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 44, height: 44, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Gift size={18} color="var(--gold)" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>Birthday Letters</h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, lineHeight: 1.5 }}>
            One letter per year of {childFirst}'s life. Sealed until they're 18.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2].map(i => <div key={i} className="card" style={{ padding: 24, opacity: 0.25, height: 80 }} />)}
        </div>
      ) : completedYears.length === 0 ? (
        <div className="card" style={{ padding: 56, textAlign: "center" }}>
          <Gift size={28} color="var(--text-3)" strokeWidth={1} style={{ margin: "0 auto 16px" }} />
          <p className="font-display" style={{ fontStyle: "italic", fontSize: 20, color: "var(--text-2)", marginBottom: 8 }}>
            The first letter arrives on {childFirst}'s first birthday.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7 }}>Our Fable will assemble it from the year's vault contributions, milestones, and world snapshots — you add your note, then seal it.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {completedYears.map(year => {
            const letter = lettersMap.get(year);
            return letter ? (
              <LetterCard key={year} letter={letter} familyId={familyId} childFirst={childFirst} dob={dob} onRefresh={load} />
            ) : (
              <PlaceholderCard key={year} year={year} childFirst={childFirst} dob={dob} familyId={familyId} onGenerated={load} />
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
