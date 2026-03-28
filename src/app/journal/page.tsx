import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Journal | Our Fable",
  description:
    "Stories, guides, and reflections on parenthood, letters, and the memories we leave behind.",
  alternates: { canonical: "https://ourfable.ai/journal" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "https://ourfable.ai/journal",
    title: "Journal | Our Fable",
    description:
      "Stories, guides, and reflections on parenthood, letters, and the memories we leave behind.",
    images: [{ url: "https://ourfable.ai/og-image.png", width: 1200, height: 630 }],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
      {/* ── Header ── */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 40px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(253,251,247,0.97)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <Link href="/" style={{
          fontFamily: "var(--font-playfair)",
          fontSize: 22,
          fontWeight: 700,
          color: "var(--green)",
          textDecoration: "none",
          letterSpacing: "-0.01em",
        }}>
          Our Fable
        </Link>
        <Link href="/" style={{
          fontSize: 14,
          color: "var(--text-3)",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          ← Back to home
        </Link>
      </header>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "72px 40px 48px" }}>
        <p style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--green)",
          marginBottom: 16,
        }}>
          The OurFable Journal
        </p>
        <h1 style={{
          fontFamily: "var(--font-playfair)",
          fontSize: "clamp(36px, 5vw, 56px)",
          fontWeight: 700,
          lineHeight: 1.15,
          color: "var(--text)",
          marginBottom: 20,
          letterSpacing: "-0.02em",
        }}>
          Stories worth<br />
          <em style={{ fontStyle: "italic", color: "var(--green)" }}>passing down.</em>
        </h1>
        <p style={{
          fontSize: 18,
          lineHeight: 1.65,
          color: "var(--text-2)",
          maxWidth: 540,
        }}>
          Reflections on parenthood, letters, and the art of leaving something behind for the people you love most.
        </p>
      </section>

      {/* ── Posts grid ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 40px 80px" }}>
        {posts.length === 0 ? (
          <p style={{ color: "var(--text-3)", textAlign: "center", padding: "60px 0" }}>
            Posts coming soon.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {posts.map((post, i) => (
              <article key={post.slug}>
                <Link href={`/journal/${post.slug}`} style={{
                  display: "block", textDecoration: "none", color: "inherit",
                  padding: "32px 0",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                      textTransform: "uppercase", color: "var(--green)",
                    }}>
                      {post.primaryKeyword}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-4)" }}>· {post.readTime}</span>
                  </div>

                  <h2 style={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: "clamp(20px, 3vw, 26px)",
                    fontWeight: 700, lineHeight: 1.3,
                    color: "var(--text)", marginBottom: 8,
                    letterSpacing: "-0.01em",
                  }}>
                    {post.title}
                  </h2>

                  <p style={{
                    fontSize: 15, lineHeight: 1.65, color: "var(--text-3)",
                    maxWidth: 640,
                  }}>
                    {post.excerpt.length > 140
                      ? post.excerpt.slice(0, 140).trim() + "…"
                      : post.excerpt}
                  </p>
                </Link>
                {i < posts.length - 1 && (
                  <div style={{ height: 1, background: "var(--border)" }} />
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Footer CTA ── */}
      <section style={{
        borderTop: "1px solid var(--border)",
        background: "var(--green)",
        padding: "60px 40px",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "var(--font-playfair)",
          fontSize: "clamp(22px, 3vw, 32px)",
          fontWeight: 700,
          color: "#fff",
          marginBottom: 20,
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
        }}>
          Ready to start your family's vault?
        </p>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", marginBottom: 32 }}>
          Letters sealed until 13, 18, or 21. Collected from everyone who loves them.
        </p>
        <Link href="/reserve" style={{
          display: "inline-block",
          background: "#fff",
          color: "var(--green)",
          fontWeight: 700,
          fontSize: 15,
          padding: "14px 32px",
          borderRadius: 100,
          textDecoration: "none",
          letterSpacing: "0.01em",
        }}>
          Start your family's vault →
        </Link>
      </section>

      <style>{`
        .blog-card:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        @media (max-width: 640px) {
          .blog-card { border-radius: 12px; }
        }
      `}</style>
    </div>
  );
}
