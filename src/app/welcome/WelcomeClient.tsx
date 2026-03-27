"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

interface WelcomeData {
  childName: string;
  familyId: string;
  email?: string;
}

export default function WelcomeClient() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session_id");
  const bypass = params.get("bypass") === "true";
  const directFamilyId = params.get("familyId");

  const [data, setData] = useState<WelcomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      // Bypass mode: skip Stripe, use default test data
      if (bypass) {
        setData({ childName: "your child", familyId: "demo" });
        setLoading(false);
        return;
      }

      // Direct familyId mode: gift redemption (no Stripe session)
      if (directFamilyId) {
        router.replace(`/${directFamilyId}/onboarding`);
        return;
      }

      if (!sessionId) {
        setError("No session found.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/stripe/session?session_id=${sessionId}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
          // Redirect to onboarding flow if we have a familyId
          if (d.familyId) {
            router.replace(`/${d.familyId}/onboarding`);
            return;
          }
        } else {
          // Fall back to generic success if session lookup fails
          setData({ childName: "your child", familyId: "" });
        }
      } catch {
        setData({ childName: "your child", familyId: "" });
      }
      setLoading(false);
    }
    load();
  }, [sessionId, bypass]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>Setting up your vault…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 16 }}>{error}</p>
          <Link href="/login" style={{ color: "var(--green)", fontSize: 14, textDecoration: "none" }}>Go to login →</Link>
        </div>
      </div>
    );
  }

  const childFirst = (data?.childName ?? "your child").split(" ")[0];
  const vaultPath = data?.familyId ? `/${data.familyId}` : "/login";

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "40px 24px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        {/* Our Fable wordmark */}
        <p style={{
          fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 300,
          color: "var(--green)", letterSpacing: "0.12em", marginBottom: 40,
        }}>
          Our Fable
        </p>

        {/* Gold checkmark */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "var(--green-light)", border: "1px solid var(--gold-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 32px",
        }}>
          <Check size={28} color="var(--gold)" strokeWidth={2} />
        </div>

        <h1 style={{
          fontFamily: "var(--font-playfair)", fontSize: 32, fontWeight: 300,
          color: "var(--text)", letterSpacing: "0.03em", marginBottom: 12, lineHeight: 1.3,
        }}>
          Welcome, {childFirst}&apos;s family.
        </h1>

        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 40 }}>
          Your Vault is ready. Every memory, milestone, and letter — waiting for you.
        </p>

        <div className="divider-gold" style={{ width: 40, margin: "0 auto 40px" }} />

        {data?.familyId ? (
          <a
            href={vaultPath}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--gold)", color: "#0D0F0B",
              padding: "14px 28px", borderRadius: 8,
              fontWeight: 600, fontSize: 14, textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            Open your Vault <ArrowRight size={15} strokeWidth={2} />
          </a>
        ) : (
          <Link
            href="/login"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--gold)", color: "#0D0F0B",
              padding: "14px 28px", borderRadius: 8,
              fontWeight: 600, fontSize: 14, textDecoration: "none",
            }}
          >
            Sign in to your Vault <ArrowRight size={15} strokeWidth={2} />
          </Link>
        )}

        <p style={{ marginTop: 20, fontSize: 12, color: "var(--text-3)" }}>
          Check your email for login details.
        </p>
      </div>
    </div>
  );
}
