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
    const shareSubject = encodeURIComponent("You have to see this — Our Fable");
    const shareBody = encodeURIComponent(
      `I just joined the waitlist for something called Our Fable and I think you'd love it.\n\nIt's a private vault for your child — every month it asks the people in their circle (grandparents, aunts, godparents, friends) a question, and their answers are sealed until your child is old enough to read them. Like a 13th birthday letter from their grandma, recorded when they were 3 months old.\n\nThey're only opening it to founding families right now:\nhttps://ourfable.ai\n\nThought of you immediately.`
    );
    const mailtoHref = `mailto:?subject=${shareSubject}&body=${shareBody}`;

    return (
      <div style={{ padding: compact ? "20px 24px" : "28px 32px", background: "var(--green-light)", border: "1.5px solid var(--green-border)", borderRadius: 16, textAlign: "center", animation: "fadeIn 0.4s ease both" }}>
        <p style={{ fontSize: 20, marginBottom: 6 }}>Founding families</p>
        <p style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, fontSize: compact ? 16 : 18, color: "var(--green)", marginBottom: 6 }}>
          You&apos;re on the list.
        </p>
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 20 }}>
          We&apos;ll reach out to founding families first.
        </p>
        <a
          href={mailtoHref}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 22px", borderRadius: 100,
            background: "var(--green)", color: "#ffffff",
            fontSize: 14, fontWeight: 600, textDecoration: "none",
            fontFamily: "inherit", letterSpacing: "-0.01em",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          Tell a friend who&apos;s expecting
        </a>
        <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-3)" }}>
          Opens your email — just add their address.
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
