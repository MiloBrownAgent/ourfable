"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Loader2 } from "lucide-react";

interface CircleMember {
  _id: string;
  name: string;
  relationship: string;
}

interface Child {
  _id: string;
  childId: string;
  childName: string;
}

async function convexFetch(path: string, args: Record<string, unknown>) {
  const res = await fetch("/api/ourfable/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) return null;
  const d = await res.json();
  return d.value ?? null;
}

// ── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            height: 3,
            flex: 1,
            borderRadius: 2,
            background: i < step ? "var(--green)" : i === step ? "var(--gold)" : "var(--border)",
            transition: "background 300ms ease",
          }}
        />
      ))}
    </div>
  );
}

// ── Shared input style ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  fontSize: 15,
  border: "1.5px solid var(--border)",
  borderRadius: 10,
  background: "var(--bg)",
  color: "var(--text)",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%",
  padding: "14px 24px", fontSize: 15, fontWeight: 600,
  background: "var(--green)", color: "#fff",
  border: "none", borderRadius: 100, cursor: "pointer",
  fontFamily: "var(--font-body)", letterSpacing: "-0.01em",
  transition: "opacity 160ms",
};

// ── Step 1: Basic info ───────────────────────────────────────────────────────

function Step1({
  onNext,
}: {
  onNext: (name: string, dob: string) => void;
}) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) { setError("Please enter a name"); return; }
    if (!dob) { setError("Please enter a date of birth"); return; }
    setError("");
    onNext(name.trim(), dob);
  };

  return (
    <div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--sage)", marginBottom: 8 }}>
        Step 1 of 3
      </p>
      <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--green)", marginBottom: 8, letterSpacing: "0.01em" }}>
        Add a child to your family
      </h1>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 32 }}>
        Every child deserves their own fable.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 28 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
            Child&apos;s full name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Soren Thomas Sweeney"
            style={inputStyle}
            autoFocus
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
            Date of birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {error && <p style={{ fontSize: 13, color: "#c0392b", marginBottom: 16 }}>{error}</p>}

      <button onClick={handleSubmit} style={btnPrimary}>
        Continue →
      </button>
    </div>
  );
}

// ── Step 2: Circle copy ──────────────────────────────────────────────────────

function Step2({
  familyId,
  existingChild,
  onNext,
  onBack,
}: {
  familyId: string;
  existingChild: Child | null;
  onNext: (copyCircle: boolean, memberIds: string[]) => void;
  onBack: () => void;
}) {
  const [copyCircle, setCopyCircle] = useState(true);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!existingChild) { setLoading(false); return; }
    convexFetch("ourfable:listOurFableCircleMembers", { familyId })
      .then((list: CircleMember[]) => {
        const ms: CircleMember[] = Array.isArray(list) ? list : [];
        setMembers(ms);
        setSelectedIds(new Set(ms.map((m) => m._id)));
      })
      .finally(() => setLoading(false));
  }, [familyId, existingChild]);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleNext = () => {
    onNext(copyCircle && existingChild !== null, Array.from(selectedIds));
  };

  return (
    <div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--sage)", marginBottom: 8 }}>
        Step 2 of 3
      </p>
      <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--green)", marginBottom: 8, letterSpacing: "0.01em" }}>
        Set up their circle
      </h1>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 32 }}>
        Who will be part of this child&apos;s inner circle?
      </p>

      {existingChild ? (
        <>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-2)", marginBottom: 16, lineHeight: 1.65 }}>
            Would you like to copy circle members from{" "}
            <strong style={{ color: "var(--green)" }}>{existingChild.childName.split(" ")[0]}</strong>?
          </p>

          {/* Toggle */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Yes, copy members", val: true },
              { label: "No, start fresh", val: false },
            ].map(({ label, val }) => (
              <button
                key={String(val)}
                onClick={() => setCopyCircle(val)}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  background: copyCircle === val ? "var(--green-light)" : "var(--surface)",
                  border: `1.5px solid ${copyCircle === val ? "var(--green)" : "var(--border)"}`,
                  color: copyCircle === val ? "var(--green)" : "var(--text-3)",
                  fontWeight: copyCircle === val ? 600 : 400,
                  transition: "all 160ms",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {copyCircle && !loading && members.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>
                Select members to copy
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {members.map((m) => {
                  const checked = selectedIds.has(m._id);
                  return (
                    <label
                      key={m._id}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: `1px solid ${checked ? "var(--green-border)" : "var(--border)"}`,
                        background: checked ? "var(--green-light)" : "var(--surface)",
                        cursor: "pointer",
                        transition: "all 140ms",
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: `1.5px solid ${checked ? "var(--green)" : "var(--border)"}`,
                        background: checked ? "var(--green)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 140ms",
                      }}>
                        {checked && <Check size={11} color="#fff" strokeWidth={3} />}
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(m._id)}
                        style={{ display: "none" }}
                      />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{m.name}</p>
                        <p style={{ fontSize: 11, color: "var(--text-3)" }}>{m.relationship}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {copyCircle && !loading && members.length === 0 && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginBottom: 28 }}>
              No circle members yet on {existingChild.childName.split(" ")[0]}&apos;s profile to copy.
            </p>
          )}
        </>
      ) : (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginBottom: 28, lineHeight: 1.65 }}>
          You can add circle members after creating this child&apos;s profile.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={handleNext} style={btnPrimary}>
          Continue →
        </button>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-3)", fontFamily: "var(--font-body)", textDecoration: "underline", padding: "8px 0" }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Pricing ──────────────────────────────────────────────────────────

function Step3({
  childName,
  isFirstAddon,
  onSubmit,
  onBack,
  submitting,
  error,
}: {
  childName: string;
  isFirstAddon: boolean;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  error: string;
}) {
  const firstName = childName.split(" ")[0];

  return (
    <div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--sage)", marginBottom: 8 }}>
        Step 3 of 3
      </p>
      <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--green)", marginBottom: 8, letterSpacing: "0.01em" }}>
        Adding {firstName}
      </h1>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 32 }}>
        Review and confirm.
      </p>

      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "24px",
        marginBottom: 28,
      }}>
        {isFirstAddon ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>Included with your Our Fable+ plan</span>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)", lineHeight: 1.65 }}>
              Your first additional child is included with Our Fable+ — no extra charge.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 22, fontWeight: 700, color: "var(--green)", marginBottom: 4 }}>
              $7<span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-3)" }}>/month</span>
              <span style={{ margin: "0 12px", fontSize: 16, color: "var(--border)" }}>or</span>
              $59<span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-3)" }}>/year</span>
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", lineHeight: 1.65 }}>
              Per additional child, billed to your existing subscription.
            </p>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "0.5px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
              {["Vault & sealed memories", "The Day They Were Born", "All circle features"].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
                  <Check size={12} color="var(--green)" />
                  {f}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {error && <p style={{ fontSize: 13, color: "#c0392b", marginBottom: 16 }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={onSubmit} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>
          {submitting ? (
            <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Adding {firstName}…</>
          ) : (
            `Add ${firstName}`
          )}
        </button>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-3)", fontFamily: "var(--font-body)", textDecoration: "underline", padding: "8px 0" }}
        >
          ← Back
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AddChildPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState("");
  const [childDob, setChildDob] = useState("");
  const [copyCircle, setCopyCircle] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [existingChild, setExistingChild] = useState<Child | null>(null);
  const [planType, setPlanType] = useState<string>("standard");
  const [existingChildrenCount, setExistingChildrenCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    Promise.all([
      convexFetch("ourfable:listChildren", { familyId }),
      convexFetch("ourfable:getOurFableFamilyByIdSafe", { familyId }),
    ]).then(([kids, account]) => {
      const list = Array.isArray(kids) ? kids : [];
      setExistingChildrenCount(list.length);
      if (list.length > 0) setExistingChild(list[0] as Child);
      setPlanType((account as { planType?: string })?.planType ?? "standard");
    });
  }, [familyId]);

  const isPlus = planType === "plus";
  const isFirstAddon = isPlus && existingChildrenCount === 1;

  const handleStep1 = (name: string, dob: string) => {
    setChildName(name);
    setChildDob(dob);
    setStep(1);
  };

  const handleStep2 = (copy: boolean, ids: string[]) => {
    setCopyCircle(copy);
    setMemberIds(ids);
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/stripe/add-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName,
          childDob,
          billingPeriod: "annual",
          copyCircleFrom: copyCircle && existingChild ? existingChild.childId : undefined,
          selectedMemberIds: copyCircle ? memberIds : [],
          successUrl: `${window.location.origin}/${familyId}?child_added=true`,
          cancelUrl: `${window.location.origin}/${familyId}/add-child?cancelled=true`,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to add child");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      router.push(`/${familyId}?child_added=true`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 16 }}>
      {/* Back link */}
      {step === 0 && (
        <a
          href={`/${familyId}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "var(--text-3)",
            textDecoration: "none", marginBottom: 28,
          }}
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
          Back to dashboard
        </a>
      )}

      <StepIndicator step={step} total={3} />

      {step === 0 && <Step1 onNext={handleStep1} />}

      {step === 1 && (
        <Step2
          familyId={familyId}
          existingChild={existingChild}
          onNext={handleStep2}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && (
        <Step3
          childName={childName}
          isFirstAddon={isFirstAddon}
          onSubmit={handleSubmit}
          onBack={() => setStep(1)}
          submitting={submitting}
          error={submitError}
        />
      )}
    </div>
  );
}
