"use client";

import { use, useEffect, useState } from "react";
import { Loader2, Check, Mail, Video, BookOpen, Lock } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface VaultStats {
  totalEntries: number;
  letters: number;
  photos: number;
  voiceMemos: number;
  videos: number;
  contributors: string[];
}

interface FacData {
  childEmail?: string;
  deliveryMilestoneChoice?: string;
  deliveryFormatPref?: string;
  backupContactEmail?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FORMAT_OPTIONS = [
  { id: "email", label: "Email", description: "Delivered to their inbox when the vault opens", icon: Mail },
  { id: "letter", label: "Printed Letter", description: "A physical letter mailed to their address", icon: BookOpen },
  { id: "video", label: "Video Compilation", description: "A private video link with all their messages", icon: Video },
];

const MILESTONE_OPTIONS = [
  { id: "13", label: "13th birthday" },
  { id: "18", label: "18th birthday" },
  { id: "21", label: "21st birthday" },
  { id: "all", label: "All three" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeMilestoneDate(dob: string, age: number): Date {
  const d = new Date(dob + "T00:00:00");
  d.setFullYear(d.getFullYear() + age);
  return d;
}

function formatFull(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function timeAway(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "Now";
  const days = Math.floor(diff / 86400000);
  if (days < 365) return `${days} days away`;
  const years = Math.floor(days / 365);
  const rem = Math.floor((days % 365) / 30);
  return rem > 0 ? `${years}y ${rem}mo away` : `${years} year${years !== 1 ? "s" : ""} away`;
}

async function convexFetch(path: string, args: Record<string, unknown>) {
  const res = await fetch("/api/ourfable/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

async function convexMutate(path: string, args: Record<string, unknown>) {
  const res = await fetch("/api/ourfable/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, type: "mutation" }),
  });
  return res.ok;
}

// ── Gold Divider ──────────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
      <span style={{ fontSize: 10, color: "#C8A87A", letterSpacing: "0.3em" }}>✦</span>
      <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
    </div>
  );
}

// ── Saved indicator ───────────────────────────────────────────────────────────

function SavedPill() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--sage)", fontWeight: 600 }}>
      <Check size={11} strokeWidth={2.5} /> Saved
    </span>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", marginBottom: subtitle ? 6 : 0, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      {subtitle && <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DeliveryPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);

  const [childName, setChildName] = useState("them");
  const [childDob, setChildDob] = useState("");
  const [loading, setLoading] = useState(true);

  // Section 1 — child email
  const [childEmail, setChildEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savedEmail, setSavedEmail] = useState(false);

  // Section 3 — delivery preferences
  const [milestoneChoice, setMilestoneChoice] = useState("18");
  const [formatPref, setFormatPref] = useState("email");
  const [backupEmail, setBackupEmail] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);

  // Section 4 — vault stats
  const [stats, setStats] = useState<VaultStats | null>(null);

  useEffect(() => {
    async function load() {
      const [family, facData, entries, letters] = await Promise.all([
        convexFetch("ourfable:getFamily", { familyId }),
        convexFetch("ourfable:getOurFableFacilitators", { familyId }),
        convexFetch("ourfable:listOurFableVaultEntries", { familyId }),
        convexFetch("ourfable:listOurFableLetters", { familyId }),
      ]);

      if (family) {
        const f = family as { childName: string; childDob: string };
        setChildName(f.childName?.split(" ")[0] ?? "them");
        setChildDob(f.childDob ?? "");
      }

      if (facData) {
        const fd = facData as FacData;
        setChildEmail(fd.childEmail ?? "");
        setMilestoneChoice(fd.deliveryMilestoneChoice ?? "18");
        setFormatPref(fd.deliveryFormatPref ?? "email");
        setBackupEmail(fd.backupContactEmail ?? "");
      }

      const allEntries = (entries as Array<{ type: string; authorName: string }>) ?? [];
      const allLetters = (letters as Array<unknown>) ?? [];
      const contributors = [...new Set(allEntries.map(e => e.authorName))];
      setStats({
        totalEntries: allEntries.length + allLetters.length,
        letters: allLetters.length,
        photos: allEntries.filter(e => e.type === "photo").length,
        voiceMemos: allEntries.filter(e => e.type === "voice").length,
        videos: allEntries.filter(e => e.type === "video").length,
        contributors,
      });

      setLoading(false);
    }
    load();
  }, [familyId]);

  async function handleSaveEmail() {
    if (!childEmail.trim()) return;
    setSavingEmail(true);
    await convexMutate("ourfable:updateOurFableFacilitators", { familyId, childEmail: childEmail.trim() });
    setSavingEmail(false);
    setSavedEmail(true);
    setTimeout(() => setSavedEmail(false), 3000);
  }

  async function handleSavePrefs() {
    setSavingPrefs(true);
    await convexMutate("ourfable:updateOurFableFacilitators", {
      familyId,
      deliveryMilestoneChoice: milestoneChoice,
      deliveryFormatPref: formatPref,
      backupContactEmail: backupEmail.trim() || undefined,
    });
    setSavingPrefs(false);
    setSavedPrefs(true);
    setTimeout(() => setSavedPrefs(false), 3000);
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <Loader2 size={24} strokeWidth={1.5} color="var(--text-3)" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Compute milestone dates
  const milestoneAges = [13, 18, 21];
  const milestoneDates = childDob
    ? milestoneAges.map(age => ({ age, date: computeMilestoneDate(childDob, age) }))
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36, maxWidth: 640 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Page header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 8 }}>
          When They&apos;re Ready
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-3)", lineHeight: 1.7 }}>
          Set up how {childName}&apos;s vault reaches them — and who to trust if you&apos;re not around.
        </p>
      </div>

      {/* ── SECTION 1: Child's email ── */}
      <section>
        <SectionHeader
          title="Delivery email"
          subtitle={`We'll deliver everything here when the time comes. You can update this anytime.`}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)" }}>
            {childName}&apos;s email address
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="email"
              value={childEmail}
              onChange={e => setChildEmail(e.target.value)}
              placeholder={`${childName.toLowerCase()}@example.com`}
              className="input"
              style={{ flex: 1 }}
            />
            <button
              onClick={handleSaveEmail}
              disabled={!childEmail.trim() || savingEmail}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 20px", fontSize: 13, fontWeight: 600,
                background: "var(--green)", color: "#fff", border: "none",
                borderRadius: 10, cursor: !childEmail.trim() ? "default" : "pointer",
                opacity: !childEmail.trim() ? 0.5 : 1, fontFamily: "inherit",
                flexShrink: 0, transition: "opacity 160ms",
              }}
            >
              {savingEmail
                ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                : savedEmail ? <><Check size={13} strokeWidth={2.5} /> Saved</> : "Save"
              }
            </button>
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* ── SECTION 2: Milestone dates ── */}
      <section>
        <SectionHeader
          title="Milestone dates"
          subtitle="These are calculated from the birthday you entered. The vault opens on the date you choose."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {milestoneDates.map(({ age, date }) => {
            const past = date.getTime() < Date.now();
            return (
              <div key={age} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderRadius: 12,
                border: `1px solid ${past ? "var(--border)" : "var(--green-border)"}`,
                background: past ? "var(--surface)" : "var(--green-light)",
                opacity: past ? 0.6 : 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: past ? "var(--border)" : "#4A5E4C",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: "var(--font-playfair)", fontSize: 16, fontWeight: 700, color: past ? "var(--text-3)" : "#fff" }}>
                      {age}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                      {age === 13 ? "13th birthday" : age === 18 ? "18th birthday" : "21st birthday"}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-3)" }}>{formatFull(date)}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    display: "inline-block", padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                    background: past ? "var(--border)" : "rgba(74,94,76,0.12)",
                    color: past ? "var(--text-4)" : "var(--green)",
                  }}>
                    {past ? "Passed" : timeAway(date)}
                  </span>
                  <p style={{ fontSize: 10, color: "var(--text-4)", marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Vault opens
                  </p>
                </div>
              </div>
            );
          })}

          {!childDob && (
            <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>
              Add {childName}&apos;s date of birth in settings to see milestone dates.
            </p>
          )}
        </div>
      </section>

      <GoldDivider />

      {/* ── SECTION 3: Delivery preferences ── */}
      <section>
        <SectionHeader
          title="Delivery preferences"
          subtitle="Choose which milestones open the vault, and how it's delivered when the time comes."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Which milestone */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 12 }}>
              Which milestone opens the vault?
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MILESTONE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setMilestoneChoice(opt.id)}
                  style={{
                    padding: "9px 18px", borderRadius: 100, fontSize: 13, cursor: "pointer",
                    border: `1.5px solid ${milestoneChoice === opt.id ? "var(--green)" : "var(--border)"}`,
                    background: milestoneChoice === opt.id ? "var(--green-light)" : "var(--card)",
                    color: milestoneChoice === opt.id ? "var(--green)" : "var(--text-3)",
                    fontWeight: milestoneChoice === opt.id ? 600 : 400,
                    fontFamily: "inherit", transition: "all 160ms",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery format */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>
              Delivery format
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FORMAT_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const selected = formatPref === opt.id;
                return (
                  <button key={opt.id} onClick={() => setFormatPref(opt.id)} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                    borderRadius: 12, cursor: "pointer", textAlign: "left",
                    border: `1.5px solid ${selected ? "var(--green)" : "var(--border)"}`,
                    background: selected ? "var(--green-light)" : "var(--card)",
                    transition: "all 160ms", fontFamily: "inherit", width: "100%",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: selected ? "rgba(74,94,76,0.12)" : "var(--bg)",
                      border: `1px solid ${selected ? "var(--green-border)" : "var(--border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={16} color={selected ? "var(--green)" : "var(--text-3)"} strokeWidth={1.75} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: selected ? 600 : 500, color: selected ? "var(--green)" : "var(--text)", marginBottom: 2 }}>{opt.label}</p>
                      <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>{opt.description}</p>
                    </div>
                    {selected && (
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check size={12} strokeWidth={3} color="#fff" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backup contact */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 6 }}>
              Backup contact email
            </label>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 10, lineHeight: 1.6 }}>
              Who should we notify if {childName}&apos;s email bounces or can&apos;t be reached?
            </p>
            <input
              type="email"
              value={backupEmail}
              onChange={e => setBackupEmail(e.target.value)}
              placeholder="backup@example.com"
              className="input"
            />
          </div>

          {/* Save prefs button */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleSavePrefs}
              disabled={savingPrefs}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "11px 24px", fontSize: 14, fontWeight: 600,
                background: "var(--green)", color: "#fff", border: "none",
                borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                transition: "opacity 160ms",
              }}
            >
              {savingPrefs
                ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
                : "Save preferences"
              }
            </button>
            {savedPrefs && <SavedPill />}
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* ── SECTION 4: Vault stats ── */}
      <section>
        <SectionHeader
          title="What's in the vault"
          subtitle={`Everything sealed and waiting for ${childName}.`}
        />
        {stats ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Total */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "16px 20px",
              background: "var(--green-light)", border: "1px solid var(--green-border)", borderRadius: 12,
            }}>
              <Lock size={16} color="var(--green)" strokeWidth={1.5} />
              <div>
                <p style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--green)", lineHeight: 1 }}>
                  {stats.totalEntries}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>sealed items</p>
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "letters", count: stats.letters },
                { label: "photos", count: stats.photos },
                { label: "voice memos", count: stats.voiceMemos },
                { label: "videos", count: stats.videos },
              ].map(({ label, count }) => (
                <div key={label} style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: "var(--surface)", border: "1px solid var(--border)", textAlign: "center",
                }}>
                  <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: count > 0 ? "var(--green)" : "var(--text-4)", lineHeight: 1, marginBottom: 4 }}>
                    {count}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--text-4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Contributors */}
            {stats.contributors.length > 0 && (
              <div style={{ padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: 6 }}>
                  Contributors
                </p>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
                  {stats.contributors.join(", ")}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 14, color: "var(--text-3)", fontStyle: "italic" }}>
            Nothing in the vault yet. Circle members will add to it every month.
          </p>
        )}
      </section>
    </div>
  );
}
