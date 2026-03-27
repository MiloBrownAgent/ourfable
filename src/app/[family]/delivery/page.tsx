"use client";

import { use, useEffect, useState } from "react";
import {
  Gift, Calendar, Send, Mail, Video, BookOpen, Loader2, Check,
  Clock, Plus, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Milestone {
  _id: string;
  milestoneName: string;
  milestoneDate: number;
  deliveryStatus: string;
  notificationsSent: string[];
  deliveredAt?: number;
}

interface DeliveryMilestone {
  _id: string;
  familyId: string;
  contributorId: string;
  milestoneAge: number;
  deliveryDate?: string;
  deliveryFormat: string;
  backupContactName?: string;
  backupContactEmail?: string;
  isActive: boolean;
  createdAt: number;
}

interface VaultStats {
  letters: number;
  photos: number;
  voiceMemos: number;
  videos: number;
  contributors: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COMMON_AGES = [13, 16, 18, 21, 25, 30];

const FORMAT_OPTIONS = [
  { id: "email", label: "Email", description: "Delivered to their inbox on the day", icon: Mail },
  { id: "video", label: "Video Link", description: "A private link to your recorded messages", icon: Video },
  { id: "letter", label: "Printed Letter", description: "A physical letter mailed to their address", icon: BookOpen },
];

const AGE_LABELS: Record<number, string> = {
  13: "13 — A teenager",
  16: "16 — Getting a driver's license",
  18: "18 — Heading into the world",
  21: "21 — Fully grown",
  25: "25 — Finding their path",
  30: "30 — Settled into life",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatDeliveryDate(isoDate?: string): string {
  if (!isoDate) return "Date TBD";
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function computeDeliveryDate(childDob: string, age: number): string {
  const dob = new Date(childDob + "T00:00:00");
  const d = new Date(dob);
  d.setFullYear(dob.getFullYear() + age);
  return d.toISOString().slice(0, 10);
}

function yearsUntil(isoDate?: string): string {
  if (!isoDate) return "";
  const target = new Date(isoDate + "T00:00:00");
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "Now";
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  if (years === 0) return "This year";
  return `${years} year${years !== 1 ? "s" : ""} from now`;
}

function daysUntil(ts: number): number {
  return Math.ceil((ts - Date.now()) / 86400000);
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

// ── MilestoneCard ─────────────────────────────────────────────────────────────

function MilestoneCard({ milestone, onDelete }: { milestone: DeliveryMilestone; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fmt = FORMAT_OPTIONS.find(f => f.id === milestone.deliveryFormat);
  const Icon = fmt?.icon ?? Mail;

  const handleDelete = async () => {
    if (!confirm("Remove this delivery preference?")) return;
    setDeleting(true);
    await convexMutate("ourfable:deleteDeliveryMilestone", { milestoneId: milestone._id });
    setDeleting(false);
    onDelete();
  };

  return (
    <div className="card" style={{ overflow: "hidden", borderLeft: "3px solid var(--sage)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 24px" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: "var(--sage-dim)",
          border: "1px solid var(--sage-border)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ fontFamily: "var(--font-cormorant)", fontSize: 20, fontWeight: 500, color: "var(--sage)", lineHeight: 1 }}>
            {milestone.milestoneAge}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 17, fontWeight: 400, color: "var(--text)", marginBottom: 4 }}>
            {AGE_LABELS[milestone.milestoneAge] ?? `Age ${milestone.milestoneAge}`}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="chip chip-sage" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon size={11} strokeWidth={1.5} />
              {fmt?.label ?? milestone.deliveryFormat}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
              {formatDeliveryDate(milestone.deliveryDate)} · {yearsUntil(milestone.deliveryDate)}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setExpanded(v => !v)} className="btn-ghost" style={{ padding: "6px 8px" }}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button onClick={handleDelete} disabled={deleting} className="btn-ghost" style={{ padding: "6px 8px", color: "var(--text-4)" }}>
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 24px 20px", borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <p className="label" style={{ marginBottom: 4 }}>Delivery Format</p>
            <p style={{ fontSize: 14, color: "var(--text-2)" }}>{fmt?.description ?? milestone.deliveryFormat}</p>
          </div>
          {(milestone.backupContactName || milestone.backupContactEmail) && (
            <div>
              <p className="label" style={{ marginBottom: 4 }}>Backup Contact</p>
              <p style={{ fontSize: 14, color: "var(--text-2)" }}>
                {milestone.backupContactName}{milestone.backupContactName && milestone.backupContactEmail && " · "}
                {milestone.backupContactEmail && <span style={{ color: "var(--text-3)" }}>{milestone.backupContactEmail}</span>}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AddMilestoneForm ──────────────────────────────────────────────────────────

function AddMilestoneForm({ familyId, childDob, existingAges, onDone }: {
  familyId: string; childDob: string; existingAges: Set<number>; onDone: () => void;
}) {
  const [selectedAges, setSelectedAges] = useState<Set<number>>(new Set());
  const [customAge, setCustomAge] = useState("");
  const [format, setFormat] = useState("email");
  const [backupName, setBackupName] = useState("");
  const [backupEmail, setBackupEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const toggleAge = (age: number) => {
    setSelectedAges(prev => {
      const next = new Set(prev);
      if (next.has(age)) next.delete(age); else next.add(age);
      return next;
    });
  };

  const allAges = (): number[] => {
    const ages = Array.from(selectedAges);
    const custom = parseInt(customAge, 10);
    if (!isNaN(custom) && custom > 0 && custom <= 99) ages.push(custom);
    return [...new Set(ages)].sort((a, b) => a - b);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ages = allAges();
    if (ages.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(ages.map(age => convexMutate("ourfable:setDeliveryMilestone", {
        familyId,
        contributorId: "family",
        milestoneAge: age,
        deliveryFormat: format,
        deliveryDate: computeDeliveryDate(childDob, age),
        backupContactName: backupName.trim() || undefined,
        backupContactEmail: backupEmail.trim() || undefined,
      })));
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20, padding: "24px", background: "var(--bg-2)", borderRadius: 14, border: "1px solid var(--border)" }}>
      {/* Age selection */}
      <div>
        <p className="label" style={{ marginBottom: 12 }}>Target ages for delivery</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {COMMON_AGES.filter(a => !existingAges.has(a)).map(age => (
            <button
              key={age}
              type="button"
              onClick={() => toggleAge(age)}
              style={{
                padding: "8px 16px", borderRadius: 100, fontSize: 13, cursor: "pointer",
                border: `1.5px solid ${selectedAges.has(age) ? "var(--sage)" : "var(--border)"}`,
                background: selectedAges.has(age) ? "var(--sage-dim)" : "var(--card)",
                color: selectedAges.has(age) ? "var(--sage)" : "var(--text-3)",
                fontWeight: selectedAges.has(age) ? 600 : 400,
                fontFamily: "inherit", transition: "all 160ms",
              }}
            >
              {age}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustom(v => !v)}
            style={{
              padding: "8px 16px", borderRadius: 100, fontSize: 13, cursor: "pointer",
              border: "1.5px solid var(--border)", background: "var(--card)",
              color: "var(--text-3)", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <Plus size={12} /> Custom
          </button>
        </div>
        {showCustom && (
          <input
            type="number" min={1} max={99} value={customAge}
            onChange={e => setCustomAge(e.target.value)}
            placeholder="Custom age (e.g. 40)"
            className="input" style={{ marginTop: 10, maxWidth: 200 }}
          />
        )}
      </div>

      {/* Format */}
      <div>
        <p className="label" style={{ marginBottom: 12 }}>Delivery format</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FORMAT_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <label
                key={opt.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px",
                  borderRadius: 10, border: `1.5px solid ${format === opt.id ? "var(--sage)" : "var(--border)"}`,
                  background: format === opt.id ? "var(--sage-dim)" : "var(--card)",
                  cursor: "pointer", transition: "all 160ms",
                }}
              >
                <input type="radio" name="format" value={opt.id} checked={format === opt.id} onChange={() => setFormat(opt.id)} style={{ marginTop: 2, accentColor: "var(--sage)" }} />
                <Icon size={16} color={format === opt.id ? "var(--sage)" : "var(--text-3)"} strokeWidth={1.5} style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>{opt.label}</p>
                  <p style={{ fontSize: 12, color: "var(--text-3)" }}>{opt.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Backup contact */}
      <div>
        <p className="label" style={{ marginBottom: 8 }}>Backup contact <span style={{ fontSize: 10, fontWeight: 400, textTransform: "none", color: "var(--text-4)" }}>(optional)</span></p>
        <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 10 }}>
          If you&apos;re not around when it&apos;s time to deliver, who should make sure it reaches them?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input type="text" value={backupName} onChange={e => setBackupName(e.target.value)} placeholder="Name" className="input" />
          <input type="email" value={backupEmail} onChange={e => setBackupEmail(e.target.value)} placeholder="Email address" className="input" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="submit"
          disabled={saving || allAges().length === 0}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 22px", fontSize: 14, fontWeight: 600,
            background: allAges().length === 0 ? "var(--border)" : "var(--sage)",
            color: allAges().length === 0 ? "var(--text-3)" : "#fff",
            border: "none", borderRadius: 10, cursor: allAges().length === 0 ? "default" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {saving ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : "Save delivery preferences"}
        </button>
        <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DeliveryPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);

  // Vault delivery state (from old delivery page)
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [childEmail, setChildEmail] = useState("");
  const [delivering, setDelivering] = useState<string | null>(null);
  const [delivered, setDelivered] = useState<string | null>(null);
  const [childName, setChildName] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);

  // Delivery preferences state (from old milestones page)
  const [deliveryPrefs, setDeliveryPrefs] = useState<DeliveryMilestone[]>([]);
  const [childDob, setChildDob] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [ms, family, facData, entries, letters, prefs] = await Promise.all([
        convexFetch("ourfable:listOurFableDeliveryMilestones", { familyId }),
        convexFetch("ourfable:getOurFableFamilyById", { familyId }),
        convexFetch("ourfable:getOurFableFacilitators", { familyId }),
        convexFetch("ourfable:listOurFableVaultEntries", { familyId }),
        convexFetch("ourfable:listOurFableLetters", { familyId }),
        convexFetch("ourfable:getDeliveryMilestones", { familyId }),
      ]);

      setMilestones((ms as Milestone[]) ?? []);

      if (family) {
        const f = family as { childName: string; childDob: string };
        setChildName(f.childName.split(" ")[0]);
        setChildDob(f.childDob ?? "");
      }

      if (facData) {
        setChildEmail((facData as { childEmail?: string }).childEmail ?? "");
      }

      const allEntries = (entries as Array<{ type: string; authorName: string }>) ?? [];
      const allLetters = (letters as Array<unknown>) ?? [];
      const contributors = new Set(allEntries.map(e => e.authorName));
      setStats({
        letters: allLetters.length,
        photos: allEntries.filter(e => e.type === "photo").length,
        voiceMemos: allEntries.filter(e => e.type === "voice").length,
        videos: allEntries.filter(e => e.type === "video").length,
        contributors: Array.from(contributors),
      });

      setDeliveryPrefs((prefs as DeliveryMilestone[]) ?? []);
      setLoading(false);
    }
    load();
  }, [familyId]);

  const existingAges = new Set(deliveryPrefs.map(p => p.milestoneAge));

  async function handleDeliver(milestoneId: string) {
    if (!childEmail.trim()) return;
    setDelivering(milestoneId);
    const res = await fetch("/api/ourfable/deliver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyId, milestoneId, childEmail: childEmail.trim() }),
    });
    if (res.ok) setDelivered(milestoneId);
    setDelivering(null);
  }

  async function saveChildEmail() {
    if (!childEmail.trim()) return;
    setSavingEmail(true);
    await convexMutate("ourfable:updateOurFableFacilitators", { familyId, childEmail: childEmail.trim() });
    setSavingEmail(false);
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-3)" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Gift size={20} color="var(--green)" strokeWidth={1.5} />
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
            Vault Delivery
          </h1>
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.65, color: "var(--text-3)" }}>
          Set up when and how {childName}&apos;s vault reaches them — and who to trust if you&apos;re not around.
        </p>
      </div>

      {/* ── SECTION 1: Child email + vault stats ── */}
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)" }}>
          Delivery email
        </p>

        {/* Vault stats */}
        {stats && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: 12 }}>
              What&apos;s in the vault
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div><span style={{ fontSize: 22, fontWeight: 600, color: "var(--green)", fontFamily: "var(--font-cormorant)" }}>{stats.letters}</span> <span style={{ fontSize: 12, color: "var(--text-3)" }}>letters</span></div>
              <div><span style={{ fontSize: 22, fontWeight: 600, color: "var(--green)", fontFamily: "var(--font-cormorant)" }}>{stats.photos}</span> <span style={{ fontSize: 12, color: "var(--text-3)" }}>photos</span></div>
              <div><span style={{ fontSize: 22, fontWeight: 600, color: "var(--green)", fontFamily: "var(--font-cormorant)" }}>{stats.voiceMemos}</span> <span style={{ fontSize: 12, color: "var(--text-3)" }}>voice memos</span></div>
              <div><span style={{ fontSize: 22, fontWeight: 600, color: "var(--green)", fontFamily: "var(--font-cormorant)" }}>{stats.videos}</span> <span style={{ fontSize: 12, color: "var(--text-3)" }}>videos</span></div>
            </div>
            {stats.contributors.length > 0 && (
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10 }}>
                From: {stats.contributors.join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Child email input */}
        <div className="card" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Mail size={14} color="var(--green)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
              {childName}&apos;s delivery email address
            </span>
          </div>
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
              onClick={saveChildEmail}
              disabled={!childEmail.trim() || savingEmail}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px",
                fontSize: 13, fontWeight: 600, border: "none", borderRadius: 10, cursor: "pointer",
                background: emailSaved ? "var(--sage)" : "var(--green)", color: "#fff", fontFamily: "inherit",
                opacity: !childEmail.trim() ? 0.5 : 1,
              }}
            >
              {emailSaved ? <><Check size={13} /> Saved</> : savingEmail ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : "Save"}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
            This is where {childName}&apos;s vault delivery email will be sent when the time comes.
          </p>
        </div>

        {/* Delivery milestone triggers */}
        {milestones.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)" }}>
              Delivery milestones
            </p>
            {milestones.sort((a, b) => a.milestoneDate - b.milestoneDate).map(m => {
              const days = daysUntil(m.milestoneDate);
              const isReady = days <= 0;
              const isDelivered = m.deliveryStatus === "delivered" || delivered === m._id;
              return (
                <div key={m._id} style={{
                  background: "var(--card)", border: `1px solid ${isDelivered ? "var(--green-border)" : "var(--border)"}`,
                  borderRadius: 12, padding: "18px 20px", opacity: isDelivered ? 0.7 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isDelivered ? <Check size={15} color="var(--green)" /> : isReady ? <Gift size={15} color="var(--green)" /> : <Clock size={15} color="var(--text-3)" />}
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-cormorant)" }}>
                        {m.milestoneName.charAt(0).toUpperCase() + m.milestoneName.slice(1)}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                      color: isDelivered ? "var(--green)" : isReady ? "var(--gold)" : "var(--text-3)",
                    }}>
                      {isDelivered ? "Delivered" : isReady ? "Ready" : `${days} days away`}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: isReady && !isDelivered ? 14 : 0 }}>
                    <Calendar size={12} color="var(--text-3)" />
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{formatDate(m.milestoneDate)}</span>
                  </div>
                  {isReady && !isDelivered && (
                    <button
                      onClick={() => handleDeliver(m._id)}
                      disabled={!childEmail.trim() || delivering === m._id}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "9px 18px", fontSize: 13, fontWeight: 600,
                        background: "var(--green)", color: "#fff", border: "none",
                        borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                        opacity: !childEmail.trim() ? 0.5 : 1,
                      }}
                    >
                      {delivering === m._id ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={13} />}
                      {delivering === m._id ? "Delivering…" : "Deliver now"}
                    </button>
                  )}
                  {isDelivered && m.deliveredAt && (
                    <p style={{ fontSize: 12, color: "var(--green)", marginTop: 6 }}>Delivered on {formatDate(m.deliveredAt)}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ borderTop: "1px solid var(--border)" }} />

      {/* ── SECTION 2: Delivery format preferences ── */}
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>
              Delivery preferences
            </p>
            <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
              Choose target ages and how you want the vault delivered at each milestone.
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 16px", fontSize: 13, fontWeight: 500,
                border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer",
                background: "var(--card)", color: "var(--text-2)", fontFamily: "inherit",
              }}
            >
              <Plus size={14} /> Add milestone
            </button>
          )}
        </div>

        {showAddForm && childDob && (
          <AddMilestoneForm
            familyId={familyId}
            childDob={childDob}
            existingAges={existingAges}
            onDone={async () => {
              setShowAddForm(false);
              const prefs = await convexFetch("ourfable:getDeliveryMilestones", { familyId });
              setDeliveryPrefs((prefs as DeliveryMilestone[]) ?? []);
            }}
          />
        )}

        {deliveryPrefs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {deliveryPrefs
              .sort((a, b) => a.milestoneAge - b.milestoneAge)
              .map(pref => (
                <MilestoneCard
                  key={pref._id}
                  milestone={pref}
                  onDelete={async () => {
                    const prefs = await convexFetch("ourfable:getDeliveryMilestones", { familyId });
                    setDeliveryPrefs((prefs as DeliveryMilestone[]) ?? []);
                  }}
                />
              ))
            }
          </div>
        ) : !showAddForm && (
          <div style={{ textAlign: "center", padding: "32px 20px", background: "var(--bg-2)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <Gift size={28} strokeWidth={1} color="var(--text-4)" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 4 }}>No delivery preferences set yet.</p>
            <p style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.6 }}>
              Choose milestone ages (13, 18, 21…) and how you want the vault delivered when {childName} reaches them.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 18px", fontSize: 13, fontWeight: 500,
                border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer",
                background: "var(--card)", color: "var(--text-2)", fontFamily: "inherit",
              }}
            >
              <Plus size={13} /> Set up delivery milestones
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
