"use client";
import { useEffect, useState, use } from "react";
import { Pencil, Check, X } from "lucide-react";

interface MonthlySnapshot {
  _id: string;
  year: number;
  month: number;
  topHeadline?: string;
  topSong?: string;
  weatherDesc?: string;
  tempHigh?: number;
  funFact?: string;
  notes?: string;
}

function monthName(m: number): string {
  return new Date(2000, m - 1, 1).toLocaleDateString("en-US", { month: "long" });
}

function childAgeAtMonth(dob: string, year: number, month: number): string {
  const born = new Date(dob + "T00:00:00");
  const target = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00`);
  let months = (target.getFullYear() - born.getFullYear()) * 12 + (target.getMonth() - born.getMonth());
  if (target.getDate() < born.getDate()) months--;
  if (months <= 0) return "Newborn";
  const days = Math.floor((target.getTime() - new Date(born.getFullYear(), born.getMonth() + months, born.getDate()).getTime()) / 86400000);
  return days > 0 ? `${months}m ${days}d` : `${months}m`;
}

function buildMonthRange(dob: string): Array<{ year: number; month: number }> {
  const start = new Date(dob + "T00:00:00");
  const now = new Date();
  const result: Array<{ year: number; month: number }> = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= now) {
    result.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 });
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
}

interface BorndayData {
  weatherHigh?: number;
  weatherLow?: number;
  weatherDesc?: string;
  song?: string;
  songArtist?: string;
  headlines?: string[];
  funFact?: string;
  quote?: string;
  birthWeightLbs?: number;
  birthWeightOz?: number;
  birthLengthIn?: number;
}

interface Family {
  childName: string;
  childDob: string;
  familyName: string;
  borndayData?: BorndayData;
}

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "0 auto", maxWidth: 200 }}>
      <div style={{ flex: 1, height: 1, background: "var(--gold-border)" }} />
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gold)", opacity: 0.5 }} />
      <div style={{ flex: 1, height: 1, background: "var(--gold-border)" }} />
    </div>
  );
}

function BirthStatsEditor({
  familyId,
  initial,
  onSaved,
}: {
  familyId: string;
  initial: BorndayData;
  onSaved: (d: BorndayData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [lbs, setLbs] = useState(String(initial.birthWeightLbs ?? ""));
  const [oz, setOz] = useState(String(initial.birthWeightOz ?? ""));
  const [len, setLen] = useState(String(initial.birthLengthIn ?? ""));
  const [saving, setSaving] = useState(false);

  const hasData = initial.birthWeightLbs != null || initial.birthLengthIn != null;

  const save = async () => {
    setSaving(true);
    const patch: BorndayData = {
      ...initial,
      ...(lbs !== "" ? { birthWeightLbs: parseFloat(lbs) } : {}),
      ...(oz !== "" ? { birthWeightOz: parseFloat(oz) } : {}),
      ...(len !== "" ? { birthLengthIn: parseFloat(len) } : {}),
    };
    await fetch(`/api/ourfable/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:patchFamily", args: { familyId, borndayData: patch }, type: "mutation" }),
    });
    setSaving(false);
    setEditing(false);
    onSaved(patch);
  };

  if (editing) {
    return (
      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 10, color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6, fontWeight: 500 }}>lbs</label>
            <input value={lbs} onChange={e => setLbs(e.target.value)} type="number" placeholder="8" className="input" style={{ width: 68, padding: "8px 12px", fontSize: 15 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6, fontWeight: 500 }}>oz</label>
            <input value={oz} onChange={e => setOz(e.target.value)} type="number" placeholder="4" className="input" style={{ width: 68, padding: "8px 12px", fontSize: 15 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6, fontWeight: 500 }}>inches</label>
            <input value={len} onChange={e => setLen(e.target.value)} type="number" placeholder="20" className="input" style={{ width: 80, padding: "8px 12px", fontSize: 15 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", borderRadius: 8, padding: "8px 16px", fontSize: 12, color: "var(--gold)", cursor: "pointer", fontWeight: 500 }}>
            <Check size={13} strokeWidth={2.5} /> {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setEditing(false)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", fontSize: 12, color: "var(--text-3)", cursor: "pointer" }}>
            <X size={13} strokeWidth={2} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      {hasData ? (
        <div style={{ display: "flex", gap: 40, marginBottom: 16 }}>
          <div>
            <p className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "var(--text)", lineHeight: 1.2 }}>
              {initial.birthWeightLbs} lbs {initial.birthWeightOz ?? 0} oz
            </p>
            <p style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 6 }}>Weight</p>
          </div>
          <div>
            <p className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "var(--text)", lineHeight: 1.2 }}>
              {initial.birthLengthIn} in
            </p>
            <p style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 6 }}>Length</p>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 15, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 16, fontStyle: "italic" }}>
          Birth stats not yet recorded.
        </p>
      )}
      {hasData ? (
        <button
          onClick={() => setEditing(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 14px", fontSize: 11, color: "var(--text-3)", cursor: "pointer", letterSpacing: "0.04em" }}
        >
          <Pencil size={11} strokeWidth={1.5} /> Edit
        </button>
      ) : (
        <div style={{ marginTop: 8, padding: "20px 24px", background: "var(--gold-dim)", border: "1px dashed var(--gold-border)", borderRadius: 12, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cormorant, var(--font-display))", fontSize: 17, fontStyle: "italic", color: "var(--text-2)", marginBottom: 14, lineHeight: 1.5 }}>
            Record birth weight and length — a detail worth keeping forever.
          </p>
          <button
            onClick={() => setEditing(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--gold)", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
          >
            <Pencil size={14} strokeWidth={2} /> Add birth stats
          </button>
        </div>
      )}
    </div>
  );
}

export default function BornPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);
  const [family, setFamily] = useState<Family | null>(null);
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId } }),
      }).then(r => r.json()).then(d => d.value ?? null),
      fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:listSnapshots", args: { familyId } }),
      }).then(r => r.json()).then(d => d.value ?? []).catch(() => []),
    ]).then(([fam, snaps]) => {
      setFamily(fam);
      setSnapshots(snaps);
    }).finally(() => setLoading(false));
  }, [familyId]);

  if (loading) return <div style={{ padding: 60, color: "var(--text-3)", fontSize: 14 }}>Loading…</div>;
  if (!family) return <div style={{ color: "var(--text-3)", padding: 60 }}>Family not found.</div>;

  const d = family.borndayData ?? {};
  const dob = new Date(family.childDob + "T12:00:00");
  const fullDate = dob.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const weatherHigh = d.weatherHigh ?? 96;
  const weatherDesc = d.weatherDesc ?? "Sunny. The hottest day of the year. The summer solstice. The longest day.";
  const song = d.song ?? "Manchild";
  const songArtist = d.songArtist ?? "Sabrina Carpenter";
  const headlines = d.headlines ?? [
    "The summer solstice arrived — the longest, sunniest day of the year",
    "Families everywhere headed outdoors for picnics, swimming, and firefly-catching",
    "Sabrina Carpenter's \"Manchild\" was the #1 song in America",
  ];
  const quote = d.quote ?? "Every child begins the world again.";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>

      {/* === HERO: The Date === */}
      <section style={{ textAlign: "center", paddingTop: 80, paddingBottom: 80 }}>
        <p style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--sage)",
          marginBottom: 32,
        }}>
          The World, Then &amp; Now
        </p>

        <h1 className="font-display" style={{
          fontSize: "clamp(2.4rem, 7vw, 4.2rem)",
          fontWeight: 700,
          color: "var(--green)",
          lineHeight: 1.1,
          marginBottom: 32,
          letterSpacing: "-0.01em",
        }}>
          {fullDate}
        </h1>

        <GoldDivider />

        <p className="font-display" style={{
          fontSize: "clamp(3rem, 10vw, 6.5rem)",
          fontWeight: 700,
          color: "var(--gold)",
          lineHeight: 1.0,
          marginTop: 40,
          letterSpacing: "-0.02em",
        }}>
          {family.childName}
        </p>
        <p style={{
          fontSize: 12,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--text-3)",
          marginTop: 16,
        }}>
          arrived
        </p>
      </section>

      {/* === THE WEATHER — editorial prose === */}
      <section style={{ paddingTop: 64, paddingBottom: 64, borderTop: "1px solid var(--border)" }}>
        <p style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--sage)",
          marginBottom: 28,
        }}>
          The Weather
        </p>

        <p className="font-display" style={{
          fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
          fontWeight: 700,
          color: "var(--text)",
          lineHeight: 1.35,
          marginBottom: 24,
        }}>
          It was {weatherHigh}° and {weatherDesc.toLowerCase().includes("sunny") ? "sunny" : weatherDesc.split(".")[0].toLowerCase().trim()}
        </p>

        <p style={{
          fontSize: 16,
          lineHeight: 1.75,
          color: "var(--text-2)",
          maxWidth: 560,
        }}>
          {weatherDesc}
        </p>
      </section>

      {/* === THE #1 SONG === */}
      <section style={{ paddingTop: 64, paddingBottom: 64, borderTop: "1px solid var(--border)" }}>
        <p style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--sage)",
          marginBottom: 28,
        }}>
          #1 Song in America
        </p>

        <p className="font-display" style={{
          fontSize: "clamp(1.4rem, 3.5vw, 2rem)",
          fontWeight: 700,
          fontStyle: "italic",
          color: "var(--text)",
          lineHeight: 1.4,
        }}>
          The #1 song was &ldquo;{song}&rdquo;
          <br />
          <span style={{ fontStyle: "normal", fontWeight: 400, color: "var(--text-2)" }}>
            by {songArtist}
          </span>
        </p>

        <p style={{
          fontSize: 15,
          lineHeight: 1.7,
          color: "var(--text-3)",
          marginTop: 20,
          maxWidth: 480,
        }}>
          It debuted at #1 on the Billboard Hot 100 the week they arrived.
        </p>
      </section>

      {/* === TOP HEADLINE — pull quote treatment === */}
      <section style={{ paddingTop: 64, paddingBottom: 64, borderTop: "1px solid var(--border)" }}>
        <p style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--sage)",
          marginBottom: 40,
        }}>
          The World That Day
        </p>

        {/* Lead headline as pull quote */}
        {headlines.length > 0 && (
          <div style={{ padding: "40px 0", margin: "0 0 40px 0" }}>
            <div style={{ height: 2, background: "var(--gold)", marginBottom: 32, maxWidth: 80 }} />
            <p className="font-display" style={{
              fontSize: "clamp(1.3rem, 3vw, 1.8rem)",
              fontWeight: 700,
              fontStyle: "italic",
              color: "var(--text)",
              lineHeight: 1.45,
              maxWidth: 560,
            }}>
              &ldquo;{headlines[0]}&rdquo;
            </p>
            <div style={{ height: 2, background: "var(--gold)", marginTop: 32, maxWidth: 80 }} />
          </div>
        )}

        {/* Remaining headlines */}
        {headlines.length > 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingLeft: 4 }}>
            {headlines.slice(1).map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600, letterSpacing: "0.06em", flexShrink: 0 }}>
                  {String(i + 2).padStart(2, "0")}
                </span>
                <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--text-2)" }}>
                  {h}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* === BIRTH STATS === */}
      <section style={{ paddingTop: 64, paddingBottom: 64, borderTop: "1px solid var(--border)" }}>
        <p style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--sage)",
          marginBottom: 8,
        }}>
          At Birth
        </p>

        <BirthStatsEditor
          familyId={familyId}
          initial={d}
          onSaved={(updated) => setFamily(f => f ? { ...f, borndayData: updated } : f)}
        />
      </section>

      {/* === CLOSING QUOTE === */}
      <section style={{
        paddingTop: 80,
        paddingBottom: 80,
        borderTop: "1px solid var(--border)",
        textAlign: "center",
      }}>
        <div style={{ height: 2, background: "var(--gold)", width: 60, margin: "0 auto 40px" }} />

        <p className="font-display" style={{
          fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
          fontWeight: 700,
          fontStyle: "italic",
          color: "var(--green)",
          lineHeight: 1.5,
          maxWidth: 520,
          margin: "0 auto",
        }}>
          &ldquo;{quote}&rdquo;
        </p>

        <p style={{
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--text-3)",
          marginTop: 20,
        }}>
          Henry David Thoreau
        </p>

        <div style={{ height: 2, background: "var(--gold)", width: 60, margin: "40px auto 0" }} />
      </section>

      {/* === MONTHLY SNAPSHOT TIMELINE === */}
      {family.childDob && (
        <section style={{ paddingTop: 80, paddingBottom: 64, borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--sage)", marginBottom: 28 }}>
            Month by Month
          </p>
          <h2 className="font-display" style={{ fontSize: "clamp(1.4rem, 3.5vw, 2rem)", fontWeight: 700, color: "var(--text)", marginBottom: 12, letterSpacing: "-0.01em" }}>
            {family.childName.split(" ")[0]}&apos;s World
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 40, maxWidth: 480 }}>
            A snapshot of the world, month by month — the headlines, the songs, the weather outside.
          </p>

          {(() => {
            const months = buildMonthRange(family.childDob);
            const snapMap = new Map<string, MonthlySnapshot>();
            for (const s of snapshots) snapMap.set(`${s.year}-${s.month}`, s);

            return months.length > 0 ? (
              <div style={{ paddingLeft: 6 }}>
                {months.map(({ year, month }) => {
                  const snap = snapMap.get(`${year}-${month}`);
                  const hasData = snap && (snap.topHeadline || snap.topSong || snap.weatherDesc || snap.funFact);
                  const label = `${monthName(month)} ${year}`;
                  const age = childAgeAtMonth(family.childDob, year, month);

                  return (
                    <div key={`${year}-${month}`} className="snapshot-timeline-row" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 6 }}>
                        <div style={{
                          width: 12, height: 12, borderRadius: "50%",
                          background: hasData ? "var(--gold)" : "transparent",
                          border: hasData ? "2px solid var(--gold)" : "2px solid var(--border)",
                          flexShrink: 0,
                        }} />
                        <div style={{ width: 1, flex: 1, background: "var(--border)", marginTop: 8 }} />
                      </div>
                      <div className="snapshot-card" style={{
                        flex: 1, padding: 24, marginBottom: 16,
                        background: "var(--surface, #fff)", borderRadius: 12,
                        boxShadow: hasData ? "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)" : "0 1px 2px rgba(0,0,0,0.02)",
                        border: "1px solid var(--border)",
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: hasData ? 20 : 12 }}>
                          <div>
                            <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "0.02em", lineHeight: 1.2 }}>
                              {label}
                            </h3>
                            <span style={{ display: "inline-block", marginTop: 6, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--sage)" }}>
                              {age}
                            </span>
                          </div>
                        </div>
                        {hasData && snap ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {snap.topHeadline && (
                              <div className="snapshot-content-row" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <span className="snapshot-label" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--sage)", flexShrink: 0, minWidth: 68, marginTop: 3 }}>Headlines</span>
                                <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65 }}>{snap.topHeadline}</p>
                              </div>
                            )}
                            {snap.topSong && (
                              <div className="snapshot-content-row" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <span className="snapshot-label" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--sage)", flexShrink: 0, minWidth: 68, marginTop: 3 }}>No. 1 Song</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <p className="font-display" style={{ fontSize: 15, color: "var(--text-2)", fontStyle: "italic", lineHeight: 1.5 }}>{snap.topSong}</p>
                                  <a href={`https://odesli.co/?q=${encodeURIComponent(snap.topSong.replace(" — ", " "))}`} target="_blank" rel="noopener noreferrer" style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "4px 10px", borderRadius: 100,
                                    border: "0.5px solid var(--border)", background: "transparent",
                                    fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const,
                                    color: "var(--sage)", textDecoration: "none", fontFamily: "var(--font-body)",
                                    transition: "border-color 160ms, color 160ms", flexShrink: 0,
                                  }}>
                                    <Music size={10} strokeWidth={2} /> Listen
                                  </a>
                                </div>
                              </div>
                            )}
                            {(snap.weatherDesc || snap.tempHigh) && (
                              <div className="snapshot-content-row" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <span className="snapshot-label" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--sage)", flexShrink: 0, minWidth: 68, marginTop: 3 }}>Weather</span>
                                <p style={{ fontSize: 14, color: "var(--text-2)" }}>{snap.weatherDesc}{snap.tempHigh ? ` · ${snap.tempHigh}°F` : ""}</p>
                              </div>
                            )}
                            {snap.funFact && (
                              <div className="snapshot-content-row" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <span className="snapshot-label" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--sage)", flexShrink: 0, minWidth: 68, marginTop: 3 }}>Fun Fact</span>
                                <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65 }}>{snap.funFact}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="font-display" style={{ fontSize: 15, color: "var(--text-3)", fontStyle: "italic", lineHeight: 1.6 }}>
                            Snapshot not yet captured.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start", paddingBottom: 24 }}>
                  <div style={{ flexShrink: 0, paddingTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", opacity: 0.4 }} />
                  </div>
                  <p className="font-display" style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>
                    The day {family.childName.split(" ")[0]} was born.
                  </p>
                </div>
              </div>
            ) : null;
          })()}
        </section>
      )}

      {/* === FOOTER === */}
      <div style={{ textAlign: "center", paddingBottom: 80, paddingTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ width: 40, height: 1, background: "var(--gold-border)" }} />
          <span className="font-display" style={{ fontSize: 13, color: "var(--gold)", letterSpacing: "0.18em", fontWeight: 700, textTransform: "uppercase" }}>
            Our Fable
          </span>
          <div style={{ width: 40, height: 1, background: "var(--gold-border)" }} />
        </div>
      </div>

      <style>{`
        /* Mobile: snapshot timeline */
        @media (max-width: 640px) {
          .snapshot-card {
            padding: 14px 14px !important;
            margin-bottom: 8px !important;
            border-radius: 10px !important;
          }
          .snapshot-timeline-row {
            gap: 8px !important;
          }
          .snapshot-content-row {
            flex-direction: column !important;
            gap: 2px !important;
            margin-bottom: 10px !important;
          }
          .snapshot-content-row:last-child {
            margin-bottom: 0 !important;
          }
          .snapshot-label {
            min-width: unset !important;
            font-size: 8px !important;
            letter-spacing: 0.1em !important;
            margin-top: 0 !important;
          }
          .snapshot-content-row p,
          .snapshot-content-row .font-display {
            font-size: 13px !important;
            line-height: 1.5 !important;
          }
        }
      `}</style>
    </div>
  );
}
