"use client";
import { use, useEffect, useState } from "react";
import { Clock, Mail, Video, BookOpen, Plus, Trash2, Check, ChevronDown, ChevronUp } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  updatedAt: number;
}

interface Family {
  childName: string;
  childDob: string;
  familyName: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COMMON_AGES = [13, 16, 18, 21, 25, 30];

const FORMAT_OPTIONS = [
  {
    id: "email",
    label: "Email",
    description: "Delivered to their inbox on the day",
    icon: Mail,
  },
  {
    id: "video",
    label: "Video Link",
    description: "A private link to your recorded messages",
    icon: Video,
  },
  {
    id: "letter",
    label: "Printed Letter",
    description: "A physical letter mailed to their address",
    icon: BookOpen,
  },
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

function formatDeliveryDate(isoDate?: string): string {
  if (!isoDate) return "Date TBD";
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function computeDeliveryDate(childDob: string, age: number): string {
  const dob = new Date(childDob + "T00:00:00");
  const delivery = new Date(dob);
  delivery.setFullYear(dob.getFullYear() + age);
  return delivery.toISOString().slice(0, 10);
}

function yearsUntil(isoDate?: string): string {
  if (!isoDate) return "";
  const target = new Date(isoDate + "T00:00:00");
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Now";
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  if (years === 0) return "This year";
  return `${years} year${years !== 1 ? "s" : ""} from now`;
}

// ── MilestoneCard ─────────────────────────────────────────────────────────────

function MilestoneCard({
  milestone,
  onDelete,
}: {
  milestone: DeliveryMilestone;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fmt = FORMAT_OPTIONS.find((f) => f.id === milestone.deliveryFormat);
  const Icon = fmt?.icon ?? Mail;

  const handleDelete = async () => {
    if (!confirm("Remove this milestone delivery?")) return;
    setDeleting(true);
    await fetch("/api/ourfable/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "ourfable:deleteDeliveryMilestone",
        args: { milestoneId: milestone._id },
        type: "mutation",
      }),
    });
    setDeleting(false);
    onDelete();
  };

  return (
    <div
      className="card"
      style={{
        overflow: "hidden",
        borderLeft: "3px solid var(--sage)",
        transition: "box-shadow 200ms",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px 24px",
        }}
      >
        {/* Age badge */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "var(--sage-dim)",
            border: "1px solid var(--sage-border)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--sage)",
              lineHeight: 1,
            }}
          >
            {milestone.milestoneAge}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: 18,
              fontWeight: 400,
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            {AGE_LABELS[milestone.milestoneAge] ?? `Age ${milestone.milestoneAge}`}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="chip chip-sage" style={{ fontSize: 11 }}>
              <Icon size={11} strokeWidth={1.5} />
              {fmt?.label ?? milestone.deliveryFormat}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
              {formatDeliveryDate(milestone.deliveryDate)} · {yearsUntil(milestone.deliveryDate)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="btn-ghost"
            style={{ padding: "6px 8px" }}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-ghost"
            style={{ padding: "6px 8px", color: "var(--text-4)" }}
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            padding: "0 24px 22px",
            borderTop: "1px solid var(--border)",
            paddingTop: 18,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div>
            <p className="label" style={{ marginBottom: 4 }}>Delivery Format</p>
            <p style={{ fontSize: 14, color: "var(--text-2)" }}>
              {fmt?.description ?? milestone.deliveryFormat}
            </p>
          </div>
          {(milestone.backupContactName || milestone.backupContactEmail) && (
            <div>
              <p className="label" style={{ marginBottom: 4 }}>Backup Contact</p>
              <p style={{ fontSize: 14, color: "var(--text-2)" }}>
                {milestone.backupContactName && <span>{milestone.backupContactName}</span>}
                {milestone.backupContactName && milestone.backupContactEmail && " · "}
                {milestone.backupContactEmail && (
                  <span style={{ color: "var(--text-3)" }}>{milestone.backupContactEmail}</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AddMilestoneForm ──────────────────────────────────────────────────────────

function AddMilestoneForm({
  familyId,
  childDob,
  existingAges,
  onDone,
}: {
  familyId: string;
  childDob: string;
  existingAges: Set<number>;
  onDone: () => void;
}) {
  const [selectedAges, setSelectedAges] = useState<Set<number>>(new Set());
  const [customAge, setCustomAge] = useState("");
  const [format, setFormat] = useState("email");
  const [backupName, setBackupName] = useState("");
  const [backupEmail, setBackupEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const toggleAge = (age: number) => {
    setSelectedAges((prev) => {
      const next = new Set(prev);
      if (next.has(age)) next.delete(age);
      else next.add(age);
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
      await Promise.all(
        ages.map((age) =>
          fetch("/api/ourfable/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: "ourfable:setDeliveryMilestone",
              args: {
                familyId,
                contributorId: "family",
                milestoneAge: age,
                deliveryFormat: format,
                deliveryDate: computeDeliveryDate(childDob, age),
                backupContactName: backupName || undefined,
                backupContactEmail: backupEmail || undefined,
              },
              type: "mutation",
            }),
          })
        )
      );
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="card"
      style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: 28 }}
    >
      {/* Age selection */}
      <div>
        <p
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 20,
            fontWeight: 400,
            color: "var(--text)",
            marginBottom: 6,
          }}
        >
          When should they receive this?
        </p>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20, lineHeight: 1.6 }}>
          Choose the ages when your messages should arrive. You can add as many as you like.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {COMMON_AGES.map((age) => {
            const isSet = existingAges.has(age);
            const isSelected = selectedAges.has(age);
            return (
              <button
                key={age}
                type="button"
                onClick={() => !isSet && toggleAge(age)}
                disabled={isSet}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: isSelected
                    ? "var(--sage-dim)"
                    : isSet
                    ? "var(--surface)"
                    : "var(--card)",
                  border: `1.5px solid ${
                    isSelected
                      ? "var(--sage-border)"
                      : isSet
                      ? "var(--border)"
                      : "var(--border)"
                  }`,
                  cursor: isSet ? "default" : "pointer",
                  textAlign: "left",
                  transition: "all 160ms",
                  opacity: isSet ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: `1.5px solid ${
                      isSelected || isSet ? "var(--sage)" : "var(--border-dark)"
                    }`,
                    background: isSelected || isSet ? "var(--sage)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 160ms",
                  }}
                >
                  {(isSelected || isSet) && <Check size={12} color="#fff" strokeWidth={2.5} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: isSet ? "var(--text-3)" : "var(--text)", lineHeight: 1.2 }}>
                    {AGE_LABELS[age]}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                    {formatDeliveryDate(computeDeliveryDate(childDob, age))}
                    {isSet && " · Already scheduled"}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Custom age toggle */}
          <button
            type="button"
            onClick={() => setShowCustom((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              borderRadius: 12,
              background: showCustom ? "var(--gold-dim)" : "var(--card)",
              border: `1.5px solid ${showCustom ? "var(--gold-border)" : "var(--border)"}`,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 160ms",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `1.5px solid ${showCustom ? "var(--gold)" : "var(--border-dark)"}`,
                background: showCustom ? "var(--gold)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {showCustom ? (
                <Check size={12} color="#fff" strokeWidth={2.5} />
              ) : (
                <Plus size={11} color="var(--text-3)" strokeWidth={2} />
              )}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
                Custom age
              </p>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                A milestone that matters to your family
              </p>
            </div>
          </button>

          {showCustom && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 4 }}>
              <input
                type="number"
                min={1}
                max={99}
                value={customAge}
                onChange={(e) => setCustomAge(e.target.value)}
                placeholder="Age (e.g. 40)"
                className="input"
                style={{ maxWidth: 140 }}
              />
              {customAge && !isNaN(parseInt(customAge)) && (
                <p style={{ fontSize: 13, color: "var(--text-3)", whiteSpace: "nowrap" }}>
                  → {formatDeliveryDate(computeDeliveryDate(childDob, parseInt(customAge)))}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delivery format */}
      <div>
        <p
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 20,
            fontWeight: 400,
            color: "var(--text)",
            marginBottom: 6,
          }}
        >
          How should it arrive?
        </p>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.6 }}>
          Choose how the messages are delivered when the moment comes.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FORMAT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormat(opt.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: format === opt.id ? "var(--green-light)" : "var(--card)",
                  border: `1.5px solid ${
                    format === opt.id ? "var(--green-border)" : "var(--border)"
                  }`,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 160ms",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background:
                      format === opt.id ? "rgba(74,94,76,0.12)" : "var(--surface)",
                    border: `1px solid ${
                      format === opt.id ? "var(--green-border)" : "var(--border)"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    color={format === opt.id ? "var(--green)" : "var(--text-3)"}
                  />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: format === opt.id ? "var(--green)" : "var(--text)",
                    }}
                  >
                    {opt.label}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Backup contact */}
      <div>
        <p
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 20,
            fontWeight: 400,
            color: "var(--text)",
            marginBottom: 6,
          }}
        >
          A trusted backup
        </p>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.6 }}>
          Who should receive this if we can&apos;t reach your child?
          <br />
          A grandparent, aunt, or close family friend — someone who will keep it safe.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label
              className="label"
              style={{ display: "block", marginBottom: 8 }}
            >
              Their name
            </label>
            <input
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              className="input"
              placeholder="e.g. Grandma Cammie"
            />
          </div>
          <div>
            <label
              className="label"
              style={{ display: "block", marginBottom: 8 }}
            >
              Their email
            </label>
            <input
              type="email"
              value={backupEmail}
              onChange={(e) => setBackupEmail(e.target.value)}
              className="input"
              placeholder="email@example.com"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="submit"
          disabled={saving || allAges().length === 0}
          className="btn-gold"
          style={{ flex: 1, justifyContent: "center" }}
        >
          {saving
            ? "Saving…"
            : `Schedule ${allAges().length > 0 ? allAges().length : ""} milestone${allAges().length !== 1 ? "s" : ""}`}
        </button>
        <button type="button" onClick={onDone} className="btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MilestonesPage({
  params,
}: {
  params: Promise<{ family: string }>;
}) {
  const { family: familyId } = use(params);
  const [milestones, setMilestones] = useState<DeliveryMilestone[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/ourfable/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "ourfable:getDeliveryMilestones",
          args: { familyId },
        }),
      })
        .then((r) => r.json())
        .then((d) => setMilestones(d.value ?? [])),
      fetch("/api/ourfable/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId } }),
      })
        .then((r) => r.json())
        .then((d) => setFamily(d.value ?? null)),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [familyId]);

  const childFirst = family?.childName.split(" ")[0] ?? "them";
  const existingAges = new Set(milestones.map((m) => m.milestoneAge));

  const sorted = [...milestones].sort((a, b) => a.milestoneAge - b.milestoneAge);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: "var(--sage-dim)",
              border: "1px solid var(--sage-border)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Clock size={20} color="var(--sage)" strokeWidth={1.5} />
          </div>
          <div>
            <h1
              className="font-display"
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1.2,
              }}
            >
              Milestone Deliveries
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4, lineHeight: 1.5 }}>
              Schedule when {childFirst}&apos;s messages arrive — years from now,
              <br />
              right on time.
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-outline"
            style={{ fontSize: 12, padding: "9px 16px", flexShrink: 0 }}
          >
            <Plus size={13} strokeWidth={2} /> Add
          </button>
        )}
      </div>

      {/* Intro card — shown when empty */}
      {!loading && milestones.length === 0 && !showForm && (
        <div
          className="card"
          style={{
            padding: "40px 32px",
            textAlign: "center",
            background: "linear-gradient(135deg, var(--card) 0%, var(--bg-2) 100%)",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "var(--sage-dim)",
              border: "1px solid var(--sage-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Clock size={24} color="var(--sage)" strokeWidth={1.2} />
          </div>
          <p
            className="font-display"
            style={{
              fontStyle: "italic",
              fontSize: 22,
              color: "var(--text-2)",
              marginBottom: 12,
              lineHeight: 1.4,
            }}
          >
            Time is the gift.
          </p>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-3)",
              maxWidth: 380,
              margin: "0 auto 28px",
              lineHeight: 1.7,
            }}
          >
            Set a milestone and everything in {childFirst}&apos;s vault —
            the letters, voice messages, photos — will be delivered to them
            exactly when you choose.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-gold">
            <Plus size={14} strokeWidth={2} /> Schedule a milestone
          </button>
        </div>
      )}

      {/* Add form */}
      {showForm && family && (
        <AddMilestoneForm
          familyId={familyId}
          childDob={family.childDob}
          existingAges={existingAges}
          onDone={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {/* Loading state */}
      {loading && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Loading…</p>
        </div>
      )}

      {/* Milestone list */}
      {!loading && sorted.length > 0 && (
        <section>
          <div className="section-header">
            <span>Scheduled · {sorted.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sorted.map((m) => (
              <MilestoneCard
                key={m._id}
                milestone={m}
                onDelete={load}
              />
            ))}
          </div>
        </section>
      )}

      {/* Bottom note */}
      {!loading && milestones.length > 0 && (
        <p
          style={{
            fontSize: 12,
            color: "var(--text-4)",
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          Delivery dates are computed from {childFirst}&apos;s date of birth.
          <br />
          We&apos;ll reach out to confirm contact details closer to each delivery.
        </p>
      )}
    </div>
  );
}
