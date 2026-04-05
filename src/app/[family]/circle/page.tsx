"use client";
import { useState, useEffect, use } from "react";
import { Users, Copy, Check, ExternalLink, MapPin, Plus, X, Mail, Loader2, Sparkles, ArrowRight, ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useChildContext } from "@/components/ChildContext";
import { useVaultKey } from "@/lib/vault-key-context";
import { generateInviteKeyRaw, wrapInviteKey, unwrapInviteKey, exportKey } from "@/lib/vault-encryption";

// All mutations routed through the auth proxy at /api/ourfable/data

interface CircleMember {
  _id: string; name: string; relationship: string; relationshipKey: string;
  email?: string; phone?: string; city?: string;
  inviteToken: string; shareToken: string; hasAccepted: boolean;
  contributionCount?: number; lastActiveAt?: number;
  encryptedInviteKey?: string;
  serverEncryptedInviteKey?: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, padding: "5px 10px", fontSize: 11, color: copied ? "var(--sage)" : "var(--text-3)", cursor: "pointer", transition: "color 200ms", flexShrink: 0, minHeight: 44, minWidth: 44 }}
    >
      {copied ? <Check size={11} strokeWidth={2.5} aria-hidden="true" /> : <Copy size={11} strokeWidth={1.5} aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

type FrequencyOption = "Monthly" | "Quarterly" | "Paused";
const FREQUENCY_OPTIONS: FrequencyOption[] = ["Monthly", "Quarterly", "Paused"];

function FrequencySelector({
  memberId,
  familyId,
  childId,
}: {
  memberId: string;
  familyId: string;
  childId?: string;
}) {
  const [frequency, setFrequency] = useState<FrequencyOption>("Monthly");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  // Load saved frequency on mount
  useEffect(() => {
    fetch("/api/ourfable/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "ourfable:getCircleMemberFrequency",
        args: { familyId, memberId, ...(childId ? { childId } : {}) },
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.value?.frequency && FREQUENCY_OPTIONS.includes(d.value.frequency)) {
          setFrequency(d.value.frequency as FrequencyOption);
        }
      })
      .catch(() => {});
  }, [familyId, memberId, childId]);

  const handleSelect = async (val: FrequencyOption) => {
    setFrequency(val);
    setOpen(false);
    setSaving(true);
    await fetch("/api/ourfable/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "ourfable:setCircleMemberFrequency",
        args: { familyId, memberId, frequency: val, ...(childId ? { childId } : {}) },
        type: "mutation",
      }),
    }).catch(() => {});
    setSaving(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((s) => !s)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 11, fontFamily: "var(--font-body)",
          color: saving ? "var(--text-4)" : "var(--text-3)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 7, padding: "4px 10px",
          cursor: "pointer", transition: "border-color 160ms",
        }}
      >
        Prompt frequency: <strong style={{ color: "var(--text-2)" }}>{frequency}</strong>
        <ChevronDown size={10} strokeWidth={2} style={{ transition: "transform 160ms", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 8, boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
          zIndex: 50, overflow: "hidden", minWidth: 130,
        }}>
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "9px 14px",
                fontSize: 12, fontFamily: "var(--font-body)",
                background: frequency === opt ? "var(--green-light)" : "transparent",
                border: "none", cursor: "pointer",
                color: frequency === opt ? "var(--green)" : "var(--text-2)",
                fontWeight: frequency === opt ? 600 : 400,
                borderBottom: opt !== "Paused" ? "0.5px solid var(--border)" : "none",
                transition: "background 120ms",
              }}
            >
              {opt}
              {frequency === opt && <Check size={11} strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HeadsUpNudge({ text, memberName, sent }: { text: string; memberName: string; sent: boolean }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(!sent);

  return (
    <div style={{
      background: "var(--gold-dim)",
      border: "1px solid var(--gold-border)",
      borderRadius: 12,
      overflow: "hidden",
      transition: "all 200ms ease",
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--gold)",
          fontFamily: "var(--font-body)",
        }}
      >
        <MessageCircle size={14} strokeWidth={1.5} />
        <span style={{ flex: 1, textAlign: "left" }}>Give {memberName} a heads up first</span>
        <ChevronDown size={14} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms" }} />
      </button>

      {expanded && (
        <div style={{ padding: "0 14px 14px" }}>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8, lineHeight: 1.5 }}>
            People are more likely to open the invite email if they hear from you first. Send them a quick text:
          </p>

          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 12,
            fontSize: 13,
            color: "var(--text-2)",
            lineHeight: 1.6,
            fontFamily: "var(--font-body)",
            marginBottom: 10,
          }}>
            {text}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 100,
                border: `1px solid ${copied ? "var(--green-border)" : "var(--border)"}`,
                background: copied ? "var(--green-light)" : "transparent",
                fontSize: 11, fontWeight: 500,
                color: copied ? "var(--green)" : "var(--text-3)",
                cursor: "pointer", fontFamily: "var(--font-body)",
                transition: "all 150ms",
              }}
            >
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy message</>}
            </button>

            <a
              href={`sms:?&body=${encodeURIComponent(text)}`}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 100,
                border: "1px solid var(--border)",
                background: "transparent",
                fontSize: 11, fontWeight: 500,
                color: "var(--text-3)",
                cursor: "pointer", fontFamily: "var(--font-body)",
                textDecoration: "none",
                transition: "all 150ms",
              }}
            >
              <MessageCircle size={12} /> Send via text
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, familyId, activeChildId }: { member: CircleMember; familyId: string; activeChildId?: string }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const { familyKey } = useVaultKey();
  const [inviteKeyFragment, setInviteKeyFragment] = useState<string | null>(null);

  async function persistInviteKeyBackup(rawB64: string) {
    try {
      await fetch("/api/ourfable/store-invite-key-backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member._id, rawKey: rawB64, encryptedInviteKey: member.encryptedInviteKey }),
      });
    } catch (err) {
      console.error("[circle] Failed to store invite key backup for", member.name, err);
    }
  }

  // Unwrap the invite key to build the full invite URL with fragment
  useEffect(() => {
    if (!familyKey || !member.encryptedInviteKey) return;
    (async () => {
      try {
        const inviteKey = await unwrapInviteKey(member.encryptedInviteKey!, familyKey);
        const rawB64 = await exportKey(inviteKey);
        setInviteKeyFragment(rawB64);
        if (!member.serverEncryptedInviteKey) {
          void persistInviteKeyBackup(rawB64);
        }
      } catch (err) {
        console.error("[circle] Failed to unwrap invite key for", member.name, err);
      }
    })();
  }, [familyKey, member.encryptedInviteKey, member.name, member.serverEncryptedInviteKey]);

  const inviteUrl = inviteKeyFragment
    ? `${origin}/join/${member.inviteToken}#key=${encodeURIComponent(inviteKeyFragment)}`
    : `${origin}/join/${member.inviteToken}`;
  const shareUrl = `${origin}/${familyId}/share/${member.shareToken}`;
  const initials = member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendErr, setSendErr] = useState("");

  const sendEmail = async () => {
    setSending(true); setSendErr("");
    try {
      const res = await fetch("/api/ourfable/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member._id, familyId, inviteUrl }),
      });
      const d = await res.json();
      if (res.ok) setSent(true); else setSendErr(d.error ?? "Failed");
    } catch { setSendErr("Network error"); }
    finally { setSending(false); }
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sage)" }}>{initials}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 400, color: "var(--text)", marginBottom: 4 }}>{member.name}</p>
          <span className="chip chip-gold" style={{ fontSize: 10 }}>{member.relationship}</span>
        </div>
        {member.hasAccepted && <span className="chip chip-sage" style={{ fontSize: 10, flexShrink: 0 }}>Active</span>}
      </div>

      {member.city && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 11, color: "var(--text-3)" }}>
          <MapPin size={11} strokeWidth={1.5} aria-hidden="true" /> {member.city}
        </div>
      )}

      {member.contributionCount != null && member.contributionCount > 0 && (
        <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 12 }}>
          {member.contributionCount} contribution{member.contributionCount !== 1 ? "s" : ""}
        </p>
      )}

      {/* Prompt frequency selector (per member, per child) */}
      <div style={{ marginBottom: 12 }}>
        <FrequencySelector memberId={member._id} familyId={familyId} childId={activeChildId} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Invite link", url: inviteUrl },
          { label: "Share link", url: shareUrl },
        ].map(({ label, url }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 11, color: "var(--text-2)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</p>
            </div>
            <CopyBtn text={url} />
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-3)", padding: 4, opacity: 0.6, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}><ExternalLink size={13} strokeWidth={1.5} aria-hidden="true" /></a>
          </div>
        ))}

        {/* Give them a heads up — always visible when member has email */}
        {member.email && (() => {
          const firstName = member.name.split(" ")[0];
          const headsUpText = `Hey ${firstName}! I set up something called Our Fable for the kids — it's going to send you a question every now and then and save your answers in a vault for them to read someday. You'll get an email from "Our Fable" soon. Just open it and hit the big button. It takes 2 minutes. ❤️`;
          return (
            <HeadsUpNudge text={headsUpText} memberName={firstName} sent={sent} />
          );
        })()}

        {member.email && (
          sent ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--sage)", padding: "8px 4px" }}>
              <Check size={13} strokeWidth={2.5} /> Invite sent to {member.email}
            </div>
          ) : (
            <>
              <button
                onClick={sendEmail} disabled={sending}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", borderRadius: 10, padding: "10px 16px", fontSize: 12, color: "var(--gold)", cursor: "pointer", transition: "opacity 200ms", minHeight: 44 }}
              >
                {sending ? <><Loader2 size={13} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} /> Sending…</> : <><Mail size={13} strokeWidth={1.5} aria-hidden="true" /> Email invite to {member.email}</>}
              </button>
              {sendErr && <p style={{ fontSize: 11, color: "#E07070" }}>{sendErr}</p>}
            </>
          )
        )}
      </div>
    </div>
  );
}

const REL_OPTIONS = [
  { label: "Mother", key: "mother" }, { label: "Father", key: "father" },
  { label: "Stepmother", key: "stepmother" }, { label: "Stepfather", key: "stepfather" },
  { label: "Grandmother", key: "grandmother" }, { label: "Grandfather", key: "grandfather" },
  { label: "Aunt", key: "aunt" }, { label: "Uncle", key: "uncle" },
  { label: "Godparent", key: "godparent" }, { label: "Cousin", key: "cousin" },
  { label: "Family friend", key: "family_friend" },
  { label: "Father's best friend", key: "fathers_best_friend" },
  { label: "Mother's best friend", key: "mothers_best_friend" },
  { label: "Other", key: "other" },
];

function AddModal({ familyId, onClose, onAdded }: { familyId: string; onClose: () => void; onAdded: () => void }) {
  const { familyKey } = useVaultKey();
  const [name, setName] = useState(""); const [rel, setRel] = useState(REL_OPTIONS[0].label);
  const [email, setEmail] = useState(""); const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false); const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErr("Name required"); return; }
    if (!email.trim()) { setErr("Email required"); return; }
    setSaving(true); setErr("");
    try {
      const relObj = REL_OPTIONS.find(r => r.label === rel);
      const res = await fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:addCircleMember", args: { familyId, name: name.trim(), relationship: rel, relationshipKey: relObj?.key ?? "other", email: email.trim(), ...(city.trim() ? { city: city.trim() } : {}) }, type: "mutation" }),
      });
      const d = await res.json();
      if (d.value) {
        // Generate and store invite encryption key if family key is available
        if (familyKey) {
          try {
            const rawKey = generateInviteKeyRaw();
            const wrappedJson = await wrapInviteKey(rawKey, familyKey);
            await fetch(`/api/ourfable/data`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                path: "ourfable:setMemberInviteKey",
                args: { memberId: d.value, encryptedInviteKey: wrappedJson },
                type: "mutation",
              }),
            });
            await fetch("/api/ourfable/store-invite-key-backup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ memberId: d.value, rawKey, encryptedInviteKey: wrappedJson }),
            });
          } catch (keyErr) {
            console.error("[circle] Failed to generate invite key:", keyErr);
            // Non-fatal — member was created, just without E2E encryption
          }
        }
        onAdded(); onClose();
      } else setErr("Something went wrong");
    } catch { setErr("Network error"); } finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} onClick={onClose} onKeyDown={e => { if (e.key === "Escape") onClose(); }}>
      <div className="card" role="dialog" aria-modal="true" aria-label="Add person to circle" style={{ width: "100%", maxWidth: 420, padding: 28, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>Add to circle</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4 }}><X size={16} strokeWidth={1.5} aria-hidden="true" /></button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Name *", value: name, set: setName, placeholder: "e.g. Aunt Lisa", type: "text", id: "circle-name" },
            { label: "Email *", value: email, set: setEmail, placeholder: "required for invites", type: "email", id: "circle-email" },
            { label: "City (optional)", value: city, set: setCity, placeholder: "e.g. Greensboro, NC", type: "text", id: "circle-city" },
          ].map(f => (
            <div key={f.label}>
              <label htmlFor={f.id} style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>{f.label}</label>
              <input id={f.id} type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="input" />
            </div>
          ))}
          <div>
            <label htmlFor="circle-relationship" style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>Relationship *</label>
            <select id="circle-relationship" value={rel} onChange={e => setRel(e.target.value)} className="input">
              {REL_OPTIONS.map(r => <option key={r.key} value={r.label}>{r.label}</option>)}
            </select>
          </div>
          {err && <p style={{ fontSize: 12, color: "#E07070" }}>{err}</p>}
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-outline" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-gold" style={{ flex: 1, justifyContent: "center" }}>
              {saving ? "Adding…" : "Add person"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STANDARD_MEMBER_LIMIT = 10;

export default function CirclePage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);
  const { selectedChild } = useChildContext();
  const activeChildId = selectedChild?.childId || selectedChild?._id;

  const [members, setMembers] = useState<CircleMember[]>([]);
  const [childName, setChildName] = useState<string>("");
  const [planType, setPlanType] = useState<string>("standard");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const isPlus = planType === "plus";
  const atLimit = !isPlus && members.length >= STANDARD_MEMBER_LIMIT;

  const load = () => {
    fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId } }) })
      .then(r => r.json()).then(d => setChildName((d.value?.childName ?? "").split(" ")[0]));
    fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:getOurFableFamilyByIdSafe", args: { familyId } }) })
      .then(r => r.json()).then(d => setPlanType(d.value?.planType ?? "standard")).catch(() => {});
    return fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:listCircle", args: { familyId }, format: "json" }) })
      .then(r => r.json()).then(d => setMembers(d.value ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [familyId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {showAdd && <AddModal familyId={familyId} onClose={() => setShowAdd(false)} onAdded={load} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={18} color="var(--sage)" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
              {childName ? `${childName}'s Circle` : "Inner Circle"}
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
              {members.length > 0 ? `${members.length} people who love ${childName || "them"}` : `The people who love ${childName || "them"}`}
            </p>
          </div>
        </div>
        {atLimit ? (
          <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, padding: "8px 14px", borderRadius: 8, background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.25)", color: "var(--sage)", textDecoration: "none", fontWeight: 500 }}>
            <Sparkles size={12} strokeWidth={2} /> Upgrade for more
          </Link>
        ) : (
          <button onClick={() => setShowAdd(true)} className="btn-outline" style={{ fontSize: 12, padding: "9px 16px" }}>
            <Plus size={13} strokeWidth={2} aria-hidden="true" /> Add
          </button>
        )}
      </div>

      {/* Circle member count / limit */}
      {!loading && !isPlus && members.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: atLimit ? "rgba(224,112,112,0.06)" : "var(--surface)", border: `1px solid ${atLimit ? "rgba(224,112,112,0.2)" : "var(--border)"}`, borderRadius: 10 }}>
          <Users size={13} strokeWidth={1.5} color={atLimit ? "#E07070" : "var(--text-3)"} />
          <p style={{ fontSize: 12, color: atLimit ? "#E07070" : "var(--text-3)" }}>
            {members.length} of {STANDARD_MEMBER_LIMIT} circle members
            {atLimit && (
              <span style={{ marginLeft: 8 }}>
                · <Link href="/signup" style={{ color: "var(--sage)", textDecoration: "underline", fontWeight: 500 }}>Upgrade to Our Fable+</Link> for unlimited
              </span>
            )}
          </p>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="card" style={{ padding: 24, opacity: 0.3, height: 120 }} />)}
        </div>
      ) : members.length === 0 ? (
        <div className="card" style={{ padding: 64, textAlign: "center" }}>
          <Users size={28} color="var(--text-3)" strokeWidth={1} aria-hidden="true" style={{ margin: "0 auto 16px" }} />
          <p className="font-display" style={{ fontStyle: "italic", fontSize: 20, color: "var(--text-2)", marginBottom: 8 }}>
            No one in the circle yet.
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.65, color: "var(--text-3)", marginBottom: 24 }}>You haven&apos;t added anyone yet. Add grandparents, aunts, uncles, godparents — the people whose voices matter.</p>
          <button onClick={() => setShowAdd(true)} className="btn-gold" style={{ margin: "0 auto", display: "flex" }}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" /> Add first person
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {members.map(m => <MemberCard key={m._id} member={m} familyId={familyId} activeChildId={activeChildId} />)}
        </div>
      )}

      {members.length > 0 && (
        <div className="card" style={{ padding: "16px 20px" }}>
          <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--text-2)" }}>Invite link</strong> — gives them a portal to write letters and share memories for your child.<br />
            <strong style={{ color: "var(--text-2)" }}>Share link</strong> — gives them a private, read-only window into your child&apos;s world. Updates daily.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
