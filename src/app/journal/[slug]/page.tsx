import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { getAllPosts, getPostBySlug, getRelatedPosts, formatDate } from "@/lib/blog";
import { TocDesktop, TocMobile } from "./TocScrollspy";
import { ShareButtons } from "./ShareButtons";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical: `https://ourfable.ai/journal/${slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url: `https://ourfable.ai/journal/${slug}`,
      title: post.metaTitle,
      description: post.metaDescription,
      publishedTime: post.publishDate,
      authors: [post.author],
      ...(post.ogImage ? { images: [{ url: post.ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
    },
  };
}

function extractToc(content: string) {
  const lines = content.split("\n");
  const items: { id: string; text: string; level: number }[] = [];
  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+)/);
    if (m) {
      const level = m[1].length;
      const text = m[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      items.push({ id, text, level });
    }
  }
  return items;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = getRelatedPosts(post);
  const toc = extractToc(post.content);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Our Fable",
      url: "https://ourfable.ai",
    },
    datePublished: post.publishDate,
    url: `https://ourfable.ai/journal/${slug}`,
    ...(post.ogImage ? { image: post.ogImage } : {}),
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Header */}
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
        <Link href="/journal" style={{
          fontSize: 14,
          color: "var(--text-3)",
          textDecoration: "none",
        }}>
          ← All posts
        </Link>
      </header>

      {/* Page layout: centered article + sticky sidebar on desktop */}
      <div className="post-outer" style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 40px",
        display: "grid",
        gridTemplateColumns: "1fr 280px",
        gap: 64,
        alignItems: "start",
      }}>
        {/* ── Main article column ── */}
        <article style={{ maxWidth: 720, paddingTop: 56, paddingBottom: 80 }}>
          {/* Tag */}
          {post.primaryKeyword && (
            <Link href="/journal" style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--green)",
              background: "var(--green-light)",
              border: "1px solid var(--green-border)",
              borderRadius: 100,
              padding: "4px 10px",
              marginBottom: 24,
              textDecoration: "none",
            }}>
              {post.primaryKeyword}
            </Link>
          )}

          {/* H1 */}
          <h1 style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 700,
            lineHeight: 1.2,
            color: "var(--text)",
            marginBottom: 20,
            letterSpacing: "-0.02em",
          }}>
            {post.title}
          </h1>

          {/* Byline */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            color: "var(--text-4)",
            marginBottom: 40,
            flexWrap: "wrap",
          }}>
            <span style={{ fontWeight: 500, color: "var(--text-3)" }}>By {post.author}</span>
            <span style={{ color: "var(--border-dark)" }}>·</span>
            <time dateTime={post.publishDate}>{formatDate(post.publishDate)}</time>
            <span style={{ color: "var(--border-dark)" }}>·</span>
            <span>{post.readTime}</span>
          </div>

          {/* Mobile ToC */}
          {toc.length > 0 && (
            <div className="toc-mobile-wrap">
              <TocMobile toc={toc} />
            </div>
          )}

          {/* MDX content */}
          <div className="prose">
            <MDXRemote
              source={post.content}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [
                    rehypeSlug,
                    [rehypeAutolinkHeadings, { behavior: "wrap" }],
                  ],
                },
              }}
            />
          </div>

          {/* Inline CTA banner */}
          <div style={{
            margin: "48px 0",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}>
            <p style={{
              fontFamily: "var(--font-playfair)",
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.35,
            }}>
              Start writing letters to your child → OurFable
            </p>
            <Link href="/reserve" style={{
              display: "inline-block",
              background: "var(--green)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              padding: "12px 24px",
              borderRadius: 100,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}>
              Reserve your spot
            </Link>
          </div>

          {/* Share */}
          <ShareButtons title={post.title} />

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section style={{ marginTop: 60 }}>
              <h2 style={{
                fontFamily: "var(--font-playfair)",
                fontSize: 24,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 24,
                letterSpacing: "-0.01em",
              }}>
                Related reading
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {relatedPosts.map((related) => (
                  <Link key={related.slug} href={`/journal/${related.slug}`} style={{
                    display: "block",
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "20px 24px",
                    textDecoration: "none",
                  }}>
                    <h3 style={{
                      fontFamily: "var(--font-playfair)",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: 8,
                    }}>
                      {related.title}
                    </h3>
                    <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.5 }}>
                      {related.excerpt.length > 120
                        ? related.excerpt.slice(0, 120) + "…"
                        : related.excerpt}
                    </p>
                    <span style={{
                      fontSize: 13,
                      color: "var(--green)",
                      fontWeight: 600,
                      marginTop: 8,
                      display: "block",
                    }}>
                      Read more →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Bottom CTA */}
          <div style={{
            marginTop: 60,
            background: "var(--green)",
            borderRadius: 20,
            padding: "40px 36px",
            textAlign: "center",
          }}>
            <p style={{
              fontFamily: "var(--font-playfair)",
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 12,
              lineHeight: 1.3,
            }}>
              Start writing letters to your child.
            </p>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 24 }}>
              Our Fable collects them from everyone who loves your child — sealed until they&apos;re ready.
            </p>
            <Link href="/reserve" style={{
              display: "inline-block",
              background: "#fff",
              color: "var(--green)",
              fontWeight: 700,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 100,
              textDecoration: "none",
            }}>
              Start your family&apos;s vault → OurFable
            </Link>
          </div>
        </article>

        {/* ── Desktop sidebar ── */}
        {toc.length > 0 && (
          <div className="toc-desktop-wrap" style={{ paddingTop: 56 }}>
            <TocDesktop toc={toc} />
          </div>
        )}
      </div>

      <style>{`
        .prose { font-family: var(--font-inter), sans-serif; font-size: 17px; line-height: 1.75; color: var(--text-2); }
        .prose h2 { font-family: var(--font-playfair); font-size: clamp(22px, 3vw, 28px); font-weight: 700; color: var(--text); margin: 48px 0 16px; letter-spacing: -0.01em; scroll-margin-top: 80px; }
        .prose h3 { font-family: var(--font-playfair); font-size: clamp(18px, 2.5vw, 22px); font-weight: 600; color: var(--text); margin: 32px 0 12px; scroll-margin-top: 80px; }
        .prose p { margin-bottom: 20px; }
        .prose a { color: var(--green); text-decoration: underline; text-decoration-color: var(--green-border); text-underline-offset: 3px; }
        .prose a:hover { text-decoration-color: var(--green); }
        .prose ul, .prose ol { margin: 0 0 20px 24px; }
        .prose li { margin-bottom: 8px; line-height: 1.65; }
        .prose blockquote { border-left: 3px solid var(--green); padding: 4px 0 4px 20px; margin: 28px 0; color: var(--text-3); font-style: italic; }
        .prose strong { font-weight: 600; color: var(--text); }
        .prose em { font-style: italic; }
        .prose hr { border: none; border-top: 1px solid var(--border); margin: 40px 0; }
        .prose img { max-width: 100%; border-radius: 12px; margin: 24px 0; }
        .prose pre { background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; padding: 20px; overflow-x: auto; font-size: 14px; margin-bottom: 20px; }
        .prose code { font-size: 0.9em; background: var(--bg-2); padding: 2px 6px; border-radius: 4px; }
        .prose pre code { background: none; padding: 0; }

        .toc-mobile-wrap { display: none; }
        .toc-desktop-wrap { display: block; }

        @media (max-width: 860px) {
          .post-outer { grid-template-columns: 1fr !important; gap: 0 !important; }
          .toc-mobile-wrap { display: block !important; }
          .toc-desktop-wrap { display: none !important; }
        }
        @media (max-width: 640px) {
          .post-outer { padding: 0 20px !important; }
          header { padding: 0 20px !important; }
        }
      `}</style>
    </div>
  );
}
