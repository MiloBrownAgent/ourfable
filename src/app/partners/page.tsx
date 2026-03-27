import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner with Us | Our Fable",
  description: "We partner with businesses that share our commitment to family, legacy, and meaningful connection.",
};

export default function PartnersPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "80px 24px",
    }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <span style={{
          fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700,
          color: "var(--green)", letterSpacing: "0.12em",
        }}>
          Our Fable
        </span>
      </Link>

      <div style={{
        width: "100%", maxWidth: 560, textAlign: "center",
      }}>
        <h1 style={{
          fontFamily: "var(--font-playfair)", fontSize: 32, fontWeight: 700,
          color: "var(--text)", marginBottom: 16,
        }}>
          Partner with us.
        </h1>

        <p style={{
          fontSize: 16, color: "var(--text-2)", lineHeight: 1.75, marginBottom: 24,
        }}>
          Our Fable is a platform built around one idea: the people who love a child should be able to leave something behind for them. Letters, voice, photos, video — sealed until they&apos;re ready.
        </p>

        <p style={{
          fontSize: 16, color: "var(--text-2)", lineHeight: 1.75, marginBottom: 24,
        }}>
          We&apos;re open to partnering with businesses that share our commitment to family, legacy, and meaningful connection — whether that&apos;s in estate planning, life insurance, family wellness, parenting, or gifting.
        </p>

        <p style={{
          fontSize: 16, color: "var(--text-2)", lineHeight: 1.75, marginBottom: 40,
        }}>
          If that sounds like your organization, we&apos;d love to hear from you.
        </p>

        <a
          href="mailto:hello@ourfable.ai?subject=Partnership%20Inquiry"
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            padding: "14px 32px", borderRadius: 100,
            background: "var(--green)", color: "#fff",
            fontSize: 15, fontWeight: 600, textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          Reach out → hello@ourfable.ai
        </a>

        <p style={{
          fontSize: 13, color: "var(--text-4)", marginTop: 16,
        }}>
          We respond to every inquiry personally.
        </p>
      </div>

      <Link href="/" style={{
        marginTop: 48, fontSize: 14, color: "var(--text-3)",
        textDecoration: "none",
      }}>
        ← Back to ourfable.ai
      </Link>
    </div>
  );
}
