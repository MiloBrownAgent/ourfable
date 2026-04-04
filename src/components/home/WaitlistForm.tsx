"use client";
import { useState, useEffect } from "react";
import { trackLead, generateEventId } from "../../lib/analytics";
import { captureUtmParams, getUtmParams } from "../../lib/utm";

interface WaitlistFormProps {
  compact?: boolean;
}

export function WaitlistForm({ compact = false }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    captureUtmParams();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const utms = getUtmParams();
      const eid = generateEventId();
      const res = await fetch("/api/ourfable/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "homepage", eventId: eid, ...utms }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      trackLead(eid);
    } catch (_err) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ padding: compact ? "20px 24px" : "28px 32px", background: "var(--green-light)", border: "1.5px solid var(--green-border)", borderRadius: 16, textAlign: "center", animation: "fadeIn 0.4s ease both" }}>
        <p style={{ fontSize: 20, marginBottom: 6 }}>Founding families</p>
        <p style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, fontSize: compact ? 16 : 18, color: "var(--green)", marginBottom: 6 }}>
          You&apos;re on the list.
        </p>
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 0 }}>
          We&apos;ll reach out to founding families first. If another family comes to mind later, you can always send them to ourfable.ai.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
        <label htmlFor="waitlist-email" className="sr-only">Email address</label>
        <input id="waitlist-email" type="email" required placeholder="Your email address" aria-label="Email address" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: compact ? "12px 16px" : "15px 18px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 15, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <button type="submit" disabled={loading} className="btn-primary"
          style={{ width: "100%", padding: compact ? "12px 22px" : "15px 26px", fontSize: 15, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Saving…" : "Reserve your spot"}
        </button>
      </div>
      {error && <p style={{ marginTop: 8, fontSize: 13, color: "#c0392b" }}>{error}</p>}
    </form>
  );
}
