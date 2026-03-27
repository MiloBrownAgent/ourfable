import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 440 }}>
        {/* Wordmark */}
        <p
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--green)",
            letterSpacing: "-0.01em",
            marginBottom: 48,
          }}
        >
          Our Fable
        </p>

        {/* Decorative leaf */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--green-light)",
            border: "1px solid var(--green-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 32px",
            fontSize: 24,
          }}
        >
          🍃
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(2rem, 5vw, 2.75rem)",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          Page not found
        </h1>

        {/* Copy */}
        <p
          style={{
            fontSize: 16,
            color: "var(--text-3)",
            lineHeight: 1.7,
            marginBottom: 40,
          }}
        >
          This page doesn&apos;t exist — but your family&apos;s story does.
        </p>

        {/* CTA */}
        <Link
          href="/"
          className="btn-primary"
          style={{
            display: "inline-block",
            padding: "14px 32px",
            fontSize: 15,
            textDecoration: "none",
            borderRadius: 100,
          }}
        >
          Go home
        </Link>

        {/* Secondary */}
        <p style={{ marginTop: 20 }}>
          <Link
            href="/login"
            style={{
              color: "var(--green)",
              fontSize: 14,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
