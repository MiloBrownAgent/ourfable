"use client";

import { use, useEffect, useState } from "react";
import { Shield, Send, Loader2, Check, AlertCircle } from "lucide-react";

interface FacilitatorData {
  facilitatorName: string;
  facilitatorEmail: string;
  childName: string;
  milestoneName: string;
  milestoneDate: number;
  familyId: string;
  milestoneId: string;
}

export default function FacilitatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<FacilitatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [childEmail, setChildEmail] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/ourfable/facilitator-data?token=${token}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  async function handleTrigger() {
    if (!data) return;
    setError("");

    // Verify facilitator email
    if (verifyEmail.toLowerCase().trim() !== data.facilitatorEmail.toLowerCase().trim()) {
      setError("The email you entered doesn't match our records. Please use the email this link was sent to.");
      return;
    }

    if (!childEmail.trim()) {
      setError("Please enter the child's email address.");
      return;
    }

    setSending(true);
    const res = await fetch("/api/ourfable/deliver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        familyId: data.familyId,
        milestoneId: data.milestoneId,
        childEmail: childEmail.trim(),
      }),
    });

    if (res.ok) {
      setSent(true);
      // Mark facilitator token as used
      await fetch(`/api/ourfable/facilitator-used`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } else {
      setError("Something went wrong. Please try again.");
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-3)" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <Shield size={32} color="var(--text-3)" strokeWidth={1} style={{ marginBottom: 16 }} />
          <p style={{ fontFamily: "Georgia,serif", fontSize: 22, color: "var(--text)", marginBottom: 12 }}>
            This link has expired or is invalid.
          </p>
          <p style={{ fontSize: 14, color: "var(--text-3)" }}>
            Contact the family to request a new facilitator link.
          </p>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--green-light)", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Check size={28} color="var(--green)" />
          </div>
          <p style={{ fontFamily: "Georgia,serif", fontSize: 24, color: "var(--text)", marginBottom: 12 }}>
            Vault delivered.
          </p>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>
            {data.childName.split(" ")[0]} has been sent their vault. Thank you for being their guardian.
          </p>
        </div>
      </div>
    );
  }

  const childFirst = data.childName.split(" ")[0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: 480, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", border: "1.5px solid var(--green-border)", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Shield size={24} color="var(--green)" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            Vault Guardian
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
            You were designated as a vault guardian for {childFirst}.
          </p>
        </div>

        {/* Info card */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, padding: 20, marginBottom: 24,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: 12 }}>
            What this means
          </p>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 12 }}>
            When {childFirst} was young, their family started building a vault of letters, photos, and voice memos from the people who love them. These were sealed until a milestone birthday.
          </p>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7 }}>
            {childFirst}&apos;s <strong>{data.milestoneName}</strong> was {new Date(data.milestoneDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}, and their parent hasn&apos;t yet delivered the vault. As a guardian, you can trigger the delivery.
          </p>
        </div>

        {/* Important notice */}
        <div style={{
          background: "var(--gold-light)", border: "1px solid var(--gold-border)",
          borderRadius: 12, padding: 16, marginBottom: 24,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <AlertCircle size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
            You cannot view any sealed content. You can only trigger the delivery email to {childFirst}.
          </p>
        </div>

        {/* Verify identity */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
            Your email (to verify your identity)
          </label>
          <input
            type="email"
            value={verifyEmail}
            onChange={(e) => setVerifyEmail(e.target.value)}
            placeholder="your@email.com"
            style={{ width: "100%", padding: "10px 14px", fontSize: 14, border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)", color: "var(--text)" }}
          />
        </div>

        {/* Child email */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
            {childFirst}&apos;s email address
          </label>
          <input
            type="email"
            value={childEmail}
            onChange={(e) => setChildEmail(e.target.value)}
            placeholder={`${childFirst.toLowerCase()}@example.com`}
            style={{ width: "100%", padding: "10px 14px", fontSize: 14, border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)", color: "var(--text)" }}
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "#c0392b", marginBottom: 16 }}>{error}</p>
        )}

        <button
          onClick={handleTrigger}
          disabled={sending || !verifyEmail.trim() || !childEmail.trim()}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "14px 24px", fontSize: 15, fontWeight: 600,
            background: "var(--green)", color: "#fff",
            border: "none", borderRadius: 10, cursor: "pointer",
            fontFamily: "inherit",
            opacity: (!verifyEmail.trim() || !childEmail.trim()) ? 0.5 : 1,
          }}
        >
          {sending ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
          {sending ? "Delivering…" : "Trigger delivery"}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
