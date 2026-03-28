"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";

interface ReferralData {
  code: string;
  referrerName: string;
  childName: string;
  status: string;
}

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralData | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/ourfable/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "ourfable:getReferralByCode", args: { code: code.toUpperCase() } }),
        });
        const json = await res.json();
        if (!json.value) {
          setInvalid(true);
        } else if (json.value.status === "redeemed") {
          setRedeemed(true);
          setData(json.value);
        } else {
          setData(json.value);
        }
      } catch {
        setInvalid(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--green)", opacity: 0.3,
            animation: `dot-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes dot-pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:.9;transform:scale(1)}}`}</style>
    </div>
  );

  if (invalid) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 400, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--surface)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700, color: "var(--green)" }}>OF</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
          Invalid invite code
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-3)", lineHeight: 1.7 }}>
          This invite code doesn&apos;t exist or has expired.
        </p>
        <Link href="/" style={{ display: "inline-block", marginTop: 24, padding: "12px 28px", borderRadius: 100, background: "var(--green)", color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
          Visit ourfable.ai →
        </Link>
      </div>
    </div>
  );

  if (redeemed) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 400, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--surface)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700, color: "var(--green)" }}>OF</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
          This spot has been claimed
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-3)", lineHeight: 1.7 }}>
          This invite has already been used. You can still reserve your own spot at founding member pricing.
        </p>
        <Link href="/reserve" style={{ display: "inline-block", marginTop: 24, padding: "12px 28px", borderRadius: 100, background: "var(--green)", color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
          Reserve your spot →
        </Link>
      </div>
    </div>
  );

  if (!data) return null;

  const referrerFirst = data.referrerName.split("&")[0]?.trim().split(" ")[0] ?? data.referrerName;
  const childFirst = data.childName.split(" ")[0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "0 20px 80px" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* Wordmark */}
      <div style={{ paddingTop: 48, textAlign: "center", animation: "fadeIn 0.4s ease both" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", letterSpacing: "-0.01em" }}>
            Our Fable
          </span>
        </Link>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", paddingTop: 48 }}>
        {/* Badge */}
        <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease both" }}>
          <span style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 100,
            background: "var(--green-light)", border: "1px solid var(--green-border)",
            fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--green)",
          }}>
            Founding member invite
          </span>
        </div>

        {/* Hero */}
        <div style={{ textAlign: "center", marginTop: 32, animation: "fadeUp 0.5s ease 0.05s both" }}>
          <h1 style={{
            fontFamily: "var(--font-playfair)", fontSize: "clamp(28px, 6vw, 42px)",
            fontWeight: 700, lineHeight: 1.2, color: "var(--text)",
            letterSpacing: "-0.02em", marginBottom: 20,
          }}>
            {referrerFirst} saved a spot for you.
          </h1>
          <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.75, maxWidth: 440, margin: "0 auto" }}>
            {referrerFirst} started building a memory vault for {childFirst} — and reserved a founding member spot for someone they care about. That&apos;s you.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", margin: "40px 0", animation: "fadeIn 0.3s ease 0.15s both" }} />

        {/* What you get */}
        <div style={{ animation: "fadeUp 0.5s ease 0.1s both" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)", marginBottom: 20 }}>
            What founding members get
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              "Founding member pricing — locked for life",
              "A private vault for your child — sealed until they're ready",
              "Monthly prompts sent to grandparents, family, friends",
              "Every letter, photo, voice memo, video — preserved forever",
              "World Snapshots — one page per month of their life",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--green-light)", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
                </div>
                <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 48, animation: "fadeUp 0.5s ease 0.2s both" }}>
          <Link
            href={`/reserve?ref=${code.toUpperCase()}`}
            style={{
              display: "inline-block", padding: "16px 36px", borderRadius: 100,
              background: "var(--green)", color: "#fff",
              fontSize: 16, fontWeight: 600, textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            Claim your founding spot →
          </Link>
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-3)" }}>
            Free to reserve · No card required
          </p>
          <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-4)" }}>
            Invite code: {code.toUpperCase()}
          </p>
        </div>

        {/* Quote */}
        <div style={{
          marginTop: 56, padding: "28px 32px", borderRadius: 16,
          background: "var(--surface)", border: "1px solid var(--border)",
          animation: "fadeUp 0.5s ease 0.25s both",
        }}>
          <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 17, color: "var(--text)", lineHeight: 1.7, marginBottom: 16 }}>
            &ldquo;The people who love your child won&apos;t always be here. Their words will be.&rdquo;
          </p>
          <p style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em" }}>
            Our Fable · ourfable.ai
          </p>
        </div>
      </div>
    </div>
  );
}
