import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CONVEX_URL } from "@/lib/convex";


interface Gift {
  giftCode: string;
  purchaserName: string;
  gifterName?: string;
  message?: string;
  gifterMessage?: string;
  recipientName?: string;
  redeemedAt?: number;
  status?: string;
  planType?: string;
  billingPeriod?: string;
}

export default async function RedeemPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: "ourfable:getGift", args: { giftCode: code.toUpperCase() }, format: "json" }),
    cache: "no-store",
  });
  const data = await res.json();
  const gift: Gift | null = data.value ?? null;

  // Resolve fields (new schema uses gifterName/gifterMessage, old uses purchaserName/message)
  const fromName = gift?.gifterName || gift?.purchaserName || "Someone special";
  const personalMessage = gift?.gifterMessage || gift?.message;
  const planType = gift?.planType ?? "standard";
  const planLabel = planType === "plus" ? "Our Fable+" : "Our Fable";

  // Determine gift status
  const isRedeemed = !!(gift?.redeemedAt || gift?.status === "redeemed");
  const isExpired = gift?.status === "expired";
  const isPending = gift?.status === "pending"; // paid via Stripe but not yet marked
  const isValid = gift && !isRedeemed && !isExpired;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ height: 64, display: "flex", alignItems: "center", padding: "0 40px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", letterSpacing: "-0.01em" }}>Our Fable</span>
        </Link>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>

          {!gift ? (
            /* Invalid code */
            <div>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <span style={{ fontSize: 24 }}>🔍</span>
              </div>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Gift not found.</p>
              <p style={{ fontSize: 15, color: "var(--text-3)", marginBottom: 28, lineHeight: 1.7 }}>That code doesn&apos;t match any gift in our system. Check the code and try again, or contact hello@ourfable.ai.</p>
              <Link href="/" style={{ color: "var(--green)", fontSize: 14 }}>← Back to Our Fable</Link>
            </div>

          ) : isExpired ? (
            /* Expired */
            <div>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <span style={{ fontSize: 24 }}>⏰</span>
              </div>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>This gift code has expired.</p>
              <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7 }}>If you think this is an error, email hello@ourfable.ai.</p>
            </div>

          ) : isRedeemed ? (
            /* Already redeemed */
            <div>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <span style={{ fontSize: 24 }}>🔒</span>
              </div>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>This gift has already been redeemed.</p>
              <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7 }}>If you think this is an error, email hello@ourfable.ai.</p>
            </div>

          ) : isPending ? (
            /* Payment pending */
            <div>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green-light)", border: "2px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <span style={{ fontSize: 24 }}>⏳</span>
              </div>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Your gift is being processed.</p>
              <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7 }}>Payment is still processing. Please check back in a few minutes. If this continues, contact hello@ourfable.ai.</p>
            </div>

          ) : isValid ? (
            /* Valid gift — show it */
            <div>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--green-light)", border: "2px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
                <span style={{ fontSize: 32 }}>🌿</span>
              </div>

              <p style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", marginBottom: 14 }}>
                A gift from {fromName}
              </p>

              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.025em", color: "var(--text)", marginBottom: 24 }}>
                You&apos;ve received Our Fable from {fromName}.
              </h1>

              {personalMessage && (
                <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 22px", marginBottom: 28, textAlign: "left" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>From {fromName}</p>
                  <p style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 16, color: "var(--text-2)", lineHeight: 1.7, margin: 0 }}>&ldquo;{personalMessage}&rdquo;</p>
                </div>
              )}

              {/* Plan details */}
              <div style={{ background: "var(--green-light)", border: "1px solid var(--green-border)", borderRadius: 12, padding: "16px 20px", marginBottom: 28, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--green)" }}>
                    {planLabel} · 1 year included
                  </p>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6, paddingLeft: 16 }}>
                  {planType === "plus"
                    ? "Full vault, monthly prompts, dispatches, voice messages, unlimited circle members, 25GB storage"
                    : "Full vault, monthly prompts, up to 10 circle members, 5GB storage"}
                </p>
              </div>

              <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.8, marginBottom: 36, maxWidth: 420, margin: "0 auto 36px" }}>
                Our Fable interviews the people in your child&apos;s life every month and holds every answer until your child is ready. This is their library of love — and it starts the day you do.
              </p>

              <Link
                href={`/signup?gift=${code.toUpperCase()}&plan=${planType}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: "var(--green)", color: "#fff", textDecoration: "none",
                  borderRadius: 12, padding: "16px 36px",
                  fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em"
                }}
              >
                Get started <ArrowRight size={18} strokeWidth={2.5} />
              </Link>

              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 16 }}>No payment required — your gift covers the first year.</p>
            </div>

          ) : null}
        </div>
      </div>
    </div>
  );
}
