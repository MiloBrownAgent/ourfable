"use client";
import { use, useEffect, useState } from "react";
import { Send, ChevronDown, ChevronUp, Check, Users, User, Loader2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useChildContext } from "@/components/ChildContext";

interface CircleMember {
  _id: string;
  name: string;
  relationship: string;
  email?: string;
}

interface Outgoing {
  _id: string;
  subject: string;
  body: string;
  sentToAll: boolean;
  sentToMemberIds?: string[];
  sentAt: number;
  sentByName: string;
  recipientCount?: number;
  mediaType?: string;
  mediaUrls?: string[];
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function OutgoingCard({ item }: { item: Outgoing }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "20px 24px", display: "flex", gap: 14, alignItems: "flex-start", textAlign: "left" }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Send size={15} color="var(--sage)" strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 400, color: "var(--text)", marginBottom: 4, lineHeight: 1.3 }}>
            {item.subject}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>
            {formatDate(item.sentAt)} · {item.sentToAll ? "Everyone in the circle" : `${item.recipientCount ?? item.sentToMemberIds?.length ?? "?"} people`}
          </p>
        </div>
        <div style={{ flexShrink: 0, marginTop: 4, color: "var(--text-3)", transition: "transform 200ms", transform: expanded ? "rotate(180deg)" : "none" }}>
          <ChevronDown size={16} strokeWidth={1.5} />
        </div>
      </button>
      {expanded && (
        <div style={{ padding: "0 24px 24px", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 16, fontWeight: 300, lineHeight: 1.9, color: "var(--text-2)", paddingTop: 20, whiteSpace: "pre-wrap" }}>
            {item.body}
          </p>
        </div>
      )}
    </div>
  );
}

function UpgradePrompt({ childName }: { childName: string }) {
  return (
    <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Sparkles size={22} color="var(--sage)" strokeWidth={1.5} />
      </div>
      <h2 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
        Dispatches
      </h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.65, color: "var(--text-2)", maxWidth: 380, margin: "0 auto 8px" }}>
        Send photos, milestones, and updates from {childName} directly to your circle — beautiful emails they&apos;ll keep forever.
      </p>
      <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7, maxWidth: 380, margin: "0 auto 28px" }}>
        Dispatches are available on <strong style={{ color: "var(--sage)" }}>Our Fable+</strong>.
      </p>
      <Link
        href="/signup"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--sage)", color: "#fff", border: "none",
          borderRadius: 10, padding: "13px 28px", fontSize: 14, fontWeight: 600,
          textDecoration: "none", transition: "opacity 200ms",
        }}
      >
        Upgrade to Our Fable+ <ArrowRight size={15} strokeWidth={2} />
      </Link>
      <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 16 }}>
        $99/yr (founding rate) · Includes voice messages, unlimited circle, 25GB storage
      </p>
    </div>
  );
}

export default function OutgoingsPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);

  const { children: childList, selectedChild } = useChildContext();
  const hasMultipleChildren = childList.length >= 2;

  // "family update" = send to ALL circle members across all children
  const [dispatchTarget, setDispatchTarget] = useState<string>("selected"); // childId or "family"

  const [circle, setCircle] = useState<CircleMember[]>([]);
  const [outgoings, setOutgoings] = useState<Outgoing[]>([]);
  const [childName, setChildName] = useState("them");
  const [parentNames, setParentNames] = useState("");
  const [planType, setPlanType] = useState<string | null>(null);
  const [loadingCircle, setLoadingCircle] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Compose state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sentToAll, setSentToAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ count: number; total: number } | null>(null);
  const [sendError, setSendError] = useState("");

  const isPlus = planType === "plus";

  const loadData = async () => {
    const [circleRes, outgoingsRes, familyRes, accountRes] = await Promise.all([
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:listCircle", args: { familyId } }) }).then(r => r.json()),
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:listOutgoings", args: { familyId } }) }).then(r => r.json()),
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId } }) }).then(r => r.json()),
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:getOurFableFamilyById", args: { familyId } }) }).then(r => r.json()),
    ]);
    setCircle(circleRes.value ?? []);
    setOutgoings(outgoingsRes.value ?? []);
    setChildName((familyRes.value?.childName ?? "them").split(" ")[0]);
    setParentNames(familyRes.value?.parentNames ?? "");
    setPlanType(accountRes.value?.planType ?? "standard");
    setLoadingCircle(false);
    setLoadingHistory(false);
    setLoadingPlan(false);
  };

  // Default dispatch target to selected child
  useEffect(() => {
    if (selectedChild && dispatchTarget === "selected") {
      setDispatchTarget(selectedChild._id);
    }
  }, [selectedChild]);

  useEffect(() => { loadData(); }, [familyId]);

  const toggleMember = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const withEmail = circle.filter(m => m.email);
  const recipientCount = sentToAll ? withEmail.length : Array.from(selectedIds).filter(id => circle.find(m => m._id === id && m.email)).length;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    if (!sentToAll && selectedIds.size === 0) { setSendError("Select at least one recipient."); return; }
    setSending(true);
    setSendError("");
    try {
      // Save to Convex first
      const memberIds = sentToAll ? undefined : Array.from(selectedIds);
      await fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "ourfable:createOutgoing",
          args: { familyId, subject, body, sentToAll, sentToMemberIds: memberIds, sentByName: parentNames || "Your family", recipientCount },
          type: "mutation",
        }),
      });

      // Send emails
      const res = await fetch(`/api/ourfable/send-outgoing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, subject, messageBody: body, sentToAll, memberIds, sentByName: parentNames || "Your family" }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Send failed");

      setSent({ count: data.sent, total: data.total });
      setSubject("");
      setBody("");
      setSelectedIds(new Set());
      setSentToAll(true);
      await loadData();
    } catch (e) {
      setSendError(String(e));
    } finally {
      setSending(false);
    }
  };

  if (loadingPlan) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
        <Loader2 size={20} strokeWidth={1.5} color="var(--text-3)" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 44, height: 44, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Send size={18} color="var(--sage)" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
            Updates from {childName}
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, lineHeight: 1.5 }}>
            Send photos, videos, letters, or moments to your circle — straight from {childName}.
          </p>
        </div>
      </div>

      {/* Gate: show upgrade prompt for standard plan */}
      {!isPlus ? (
        <UpgradePrompt childName={childName} />
      ) : (
        <>
          {/* Sent confirmation */}
          {sent && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.25)", borderRadius: 12 }}>
              <Check size={16} color="var(--sage)" strokeWidth={2.5} />
              <p style={{ fontSize: 14, color: "var(--text-2)" }}>
                Sent to <strong>{sent.count}</strong> of {sent.total} circle members.
              </p>
              <button onClick={() => setSent(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 12 }}>Dismiss</button>
            </div>
          )}

          {/* Compose card */}
          <div className="card" style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: 22 }}>
            <div>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 20, fontWeight: 400, color: "var(--text)", marginBottom: 4 }}>
                New update
              </p>
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                {withEmail.length > 0 ? `${withEmail.length} circle member${withEmail.length !== 1 ? "s" : ""} have email addresses` : "No circle members with email addresses yet"}
              </p>
            </div>

            {/* Child selector — only shown when 2+ children */}
            {hasMultipleChildren && (
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                  Sending for
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {childList.map((child) => {
                    const first = child.childName.split(" ")[0];
                    const isActive = dispatchTarget === child._id;
                    return (
                      <button
                        key={child._id}
                        onClick={() => setDispatchTarget(child._id)}
                        style={{
                          padding: "8px 16px", borderRadius: 9, fontSize: 13, cursor: "pointer",
                          background: isActive ? "var(--sage-dim)" : "var(--surface)",
                          border: `1px solid ${isActive ? "rgba(107,143,111,0.3)" : "var(--border)"}`,
                          color: isActive ? "var(--sage)" : "var(--text-3)",
                          fontWeight: isActive ? 500 : 400,
                          fontFamily: "var(--font-body)",
                          transition: "all 160ms",
                        }}
                      >
                        {first}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setDispatchTarget("family")}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 9, fontSize: 13, cursor: "pointer",
                      background: dispatchTarget === "family" ? "var(--sage-dim)" : "var(--surface)",
                      border: `1px solid ${dispatchTarget === "family" ? "rgba(107,143,111,0.3)" : "var(--border)"}`,
                      color: dispatchTarget === "family" ? "var(--sage)" : "var(--text-3)",
                      fontWeight: dispatchTarget === "family" ? 500 : 400,
                      fontFamily: "var(--font-body)",
                      transition: "all 160ms",
                    }}
                  >
                    <Users size={12} strokeWidth={1.5} />
                    Family update (everyone)
                  </button>
                </div>
                {dispatchTarget === "family" && (
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8, fontStyle: "italic" }}>
                    Will send to all circle members across all children (deduplicated by email).
                  </p>
                )}
              </div>
            )}

            {/* Subject */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                Subject
              </label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={`Something from ${childName}…`}
                className="input"
                style={{ fontFamily: "var(--font-cormorant)", fontSize: 17 }}
              />
            </div>

            {/* Body */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                Message
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={7}
                placeholder={`Share what's happening with ${childName} — a milestone, a moment, something worth keeping…`}
                className="input"
                style={{ resize: "vertical", fontFamily: "var(--font-cormorant)", fontSize: 16, lineHeight: 1.85 }}
              />
            </div>

            {/* Recipients */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>
                Recipients
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <button
                  onClick={() => setSentToAll(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, fontSize: 13, cursor: "pointer", transition: "all 160ms",
                    background: sentToAll ? "var(--sage-dim)" : "var(--surface)",
                    border: `1px solid ${sentToAll ? "rgba(107,143,111,0.3)" : "var(--border)"}`,
                    color: sentToAll ? "var(--sage)" : "var(--text-3)",
                    fontWeight: sentToAll ? 500 : 400,
                  }}
                >
                  <Users size={13} strokeWidth={1.5} />
                  Everyone ({withEmail.length})
                </button>
                <button
                  onClick={() => setSentToAll(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, fontSize: 13, cursor: "pointer", transition: "all 160ms",
                    background: !sentToAll ? "var(--sage-dim)" : "var(--surface)",
                    border: `1px solid ${!sentToAll ? "rgba(107,143,111,0.3)" : "var(--border)"}`,
                    color: !sentToAll ? "var(--sage)" : "var(--text-3)",
                    fontWeight: !sentToAll ? 500 : 400,
                  }}
                >
                  <User size={13} strokeWidth={1.5} />
                  Select people
                </button>
              </div>

              {!sentToAll && !loadingCircle && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {withEmail.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>No circle members with email addresses.</p>
                  ) : withEmail.map(m => {
                    const selected = selectedIds.has(m._id);
                    return (
                      <button
                        key={m._id}
                        onClick={() => toggleMember(m._id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", transition: "all 140ms",
                          background: selected ? "var(--sage-dim)" : "var(--surface)",
                          border: `1px solid ${selected ? "rgba(107,143,111,0.3)" : "var(--border)"}`,
                          color: selected ? "var(--sage)" : "var(--text-2)",
                        }}
                      >
                        {selected && <Check size={11} strokeWidth={2.5} />}
                        {m.name}
                        <span style={{ fontSize: 10, color: selected ? "rgba(107,143,111,0.6)" : "var(--text-3)" }}>· {m.relationship}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {sendError && (
              <p style={{ fontSize: 13, color: "#E07070" }}>{sendError}</p>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim() || withEmail.length === 0}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 24px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: (sending || !subject.trim() || !body.trim()) ? "default" : "pointer",
                background: "var(--sage)", border: "none", color: "#fff",
                opacity: (sending || !subject.trim() || !body.trim()) ? 0.5 : 1,
                transition: "opacity 160ms",
              }}
            >
              {sending ? (
                <><Loader2 size={15} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} /> Sending…</>
              ) : (
                <><Send size={15} strokeWidth={2} /> Send to {sentToAll ? `everyone (${withEmail.length})` : `${recipientCount} ${recipientCount === 1 ? "person" : "people"}`}</>
              )}
            </button>

            {withEmail.length === 0 && !loadingCircle && (
              <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>
                Add email addresses to your circle members first.
              </p>
            )}
          </div>
        </>
      )}

      {/* Past dispatches — visible to all plans */}
      {!loadingHistory && outgoings.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--sage)", marginBottom: 12 }}>
            Past updates · {outgoings.length}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {outgoings.map(item => (
              <OutgoingCard key={item._id} item={item} />
            ))}
          </div>
        </div>
      )}

      {!loadingHistory && outgoings.length === 0 && isPlus && (
        <div className="card" style={{ padding: "40px 28px", textAlign: "center" }}>
          <p className="font-display" style={{ fontStyle: "italic", fontSize: 18, color: "var(--text-3)", lineHeight: 1.6 }}>
            No updates sent yet.<br />Your first one stays forever.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
