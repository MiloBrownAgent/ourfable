"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Lock, Mail, Users } from "lucide-react";
import { captureUtmParams, getUtmParams } from "@/lib/utm";
import { generateEventId, trackLead } from "@/lib/analytics";

export default function WarmConversionClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    captureUtmParams();
  }, []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || loading) return;
    setLoading(true);
    setError("");
    try {
      const eventId = generateEventId();
      const utms = getUtmParams();
      const res = await fetch("/api/ourfable/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          source: "warm-conversion",
          eventId,
          ...utms,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      trackLead(eventId);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
            <Check size={34} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 34, lineHeight: 1.15, color: "var(--text)", margin: "0 0 16px" }}>
            You&apos;re on the list.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-2)", margin: "0 0 12px" }}>
            We&apos;ll reach out when your family&apos;s vault is ready and keep your founding rate reserved.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--text-3)", margin: "0 0 28px" }}>
            This is the same kind of private, compounding record you&apos;ve already seen firsthand — now for the people you love most.
          </p>
          <Link href="/" style={{ color: "var(--green)", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>← Back to ourfable.ai</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px 96px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48, gap: 16, flexWrap: "wrap" }}>
          <Link href="/" style={{ textDecoration: "none", color: "var(--green)", fontFamily: "var(--font-playfair)", fontWeight: 700, fontSize: 24 }}>
            Our Fable
          </Link>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/gift" style={{ textDecoration: "none", color: "var(--text-2)", fontSize: 14 }}>Gift</Link>
            <Link href="/reserve" style={{ textDecoration: "none", color: "var(--green)", fontSize: 14, fontWeight: 600 }}>Parent flow</Link>
          </div>
        </div>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)", gap: 32, alignItems: "start" }}>
          <div>
            <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)" }}>
              For circle members, grandparents, and warm referrals
            </p>
            <h1 style={{ margin: "0 0 20px", fontFamily: "var(--font-playfair)", fontSize: "clamp(2.6rem, 5vw, 4.4rem)", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
              You&apos;ve already seen what this becomes.
            </h1>
            <p style={{ margin: "0 0 16px", fontSize: 18, lineHeight: 1.85, color: "var(--text-2)", maxWidth: 640 }}>
              If receiving prompts, updates, and little pieces of a child&apos;s story made you wish you had the same kind of place for your own family, this is where to begin.
            </p>
            <p style={{ margin: "0 0 28px", fontSize: 16, lineHeight: 1.8, color: "var(--text-3)", maxWidth: 640 }}>
              Our Fable is a private family vault where the people who matter most leave letters, voice notes, photos, and videos for a child&apos;s future — sealed until the right moment years from now.
            </p>

            <div style={{ display: "grid", gap: 18, marginBottom: 32 }}>
              {[
                {
                  icon: Users,
                  title: "It starts with your circle",
                  body: "Invite the few people whose voices would matter most years from now. Once they begin replying, the vault starts compounding.",
                },
                {
                  icon: Mail,
                  title: "The work happens quietly",
                  body: "Monthly prompts help grandparents, aunts, uncles, and family friends contribute without you having to chase them.",
                },
                {
                  icon: Lock,
                  title: "Private, lasting, and family-first",
                  body: "No social feed. No public posting. Just a calm private place your child will one day open.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 14, alignItems: "start" }}>
                  <Icon size={18} color="var(--green)" strokeWidth={2} style={{ marginTop: 5 }} />
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{title}</p>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: "var(--text-3)" }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 18, padding: 28, boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)" }}>
              Reserve your family&apos;s spot
            </p>
            <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-playfair)", fontSize: 30, lineHeight: 1.15, color: "var(--text)" }}>
              Start the same kind of vault for your child.
            </h2>
            <p style={{ margin: "0 0 18px", fontSize: 14, lineHeight: 1.75, color: "var(--text-3)" }}>
              Reserve now, keep your founding price, and we&apos;ll invite you in as onboarding opens.
            </p>
            <div style={{ padding: "14px 16px", background: "var(--bg-2)", borderRadius: 12, border: "1px solid var(--border)", marginBottom: 20 }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)" }}>Founders pricing</p>
              <p style={{ margin: "0 0 4px", fontSize: 14, lineHeight: 1.6, color: "var(--text)" }}>Our Fable: <strong>$12/mo or $99/yr</strong></p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--text)" }}>Our Fable+: <strong>$19/mo or $149/yr</strong></p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <div>
                <label htmlFor="warm-email" style={{ display: "block", marginBottom: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)" }}>
                  Your email
                </label>
                <input
                  id="warm-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ width: "100%", padding: "13px 14px", borderRadius: 10, border: `1.5px solid ${error ? "#E07070" : "var(--border)"}`, fontSize: 15, boxSizing: "border-box" }}
                />
              </div>
              {error ? <p style={{ margin: 0, fontSize: 13, color: "#E07070" }}>{error}</p> : null}
              <button type="submit" disabled={!emailValid || loading} style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", gap: 8, width: "100%", background: "var(--green)", color: "#fff", border: "none", borderRadius: 12, padding: "15px 20px", fontSize: 15, fontWeight: 600, cursor: !emailValid || loading ? "not-allowed" : "pointer", opacity: !emailValid || loading ? 0.6 : 1 }}>
                {loading ? "Reserving…" : <>Reserve your spot <ArrowRight size={16} strokeWidth={2.4} /></>}
              </button>
            </form>
            <p style={{ margin: "14px 0 0", fontSize: 12, lineHeight: 1.7, color: "var(--text-3)" }}>
              Free to reserve · No card required today · Private by design
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
