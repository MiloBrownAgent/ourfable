import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ code?: string; email?: string; mode?: string }>;
}

export default async function GiftSuccessPage({ searchParams }: PageProps) {
  const { code, email, mode } = await searchParams;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ height: 64, display: "flex", alignItems: "center", padding: "0 40px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", letterSpacing: "-0.01em" }}>Our Fable</span>
        </Link>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>

          {/* Check mark */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "var(--green-light)", border: "2px solid var(--green-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 28px"
          }}>
            <Check size={28} color="var(--green)" strokeWidth={2.5} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)" }}>
              Gift sent
            </span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            fontWeight: 800, lineHeight: 1.15,
            letterSpacing: "-0.025em",
            color: "var(--text)",
            marginBottom: 20
          }}>
            Your gift is on its way.
          </h1>

          {email && (
            <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75, marginBottom: 32, maxWidth: 420, margin: "0 auto 32px" }}>
              We&apos;ve sent a beautiful email to <strong style={{ color: "var(--text)" }}>{email}</strong> with everything they need to get started.{mode === "annual_sponsorship" ? " You&apos;re also sponsoring the vault each year until you cancel." : ""}
            </p>
          )}

          {!email && (
            <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75, marginBottom: 32, maxWidth: 420, margin: "0 auto 32px" }}>
              We&apos;ve sent a beautiful email to the recipient with everything they need to get started.{mode === "annual_sponsorship" ? " This gift will renew yearly until cancelled." : ""}
            </p>
          )}

          {/* Gift code display */}
          {code && (
            <div style={{
              background: "var(--bg-2, #F8F5F0)",
              border: "1.5px solid var(--border)",
              borderRadius: 16,
              padding: "28px 32px",
              display: "inline-block",
              marginBottom: 32
            }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "var(--text-3)",
                marginBottom: 10
              }}>Gift code</p>
              <p style={{
                fontFamily: "var(--font-playfair)",
                fontSize: 36, fontWeight: 800,
                color: "var(--green)", letterSpacing: "0.08em",
                margin: 0
              }}>
                {code}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10 }}>
                Share this if they need it: ourfable.ai/redeem/{code}
              </p>
            </div>
          )}

          {/* Back link */}
          <div style={{ marginTop: 8 }}>
            <Link
              href="/"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                color: "var(--text-3)", fontSize: 14, textDecoration: "none",
                transition: "color 200ms"
              }}
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Back to ourfable.ai
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
