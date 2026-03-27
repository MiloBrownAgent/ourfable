import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

export interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  publishDate: string;
  author: string;
  readTime: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  relatedSlugs: string[];
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  content: string;
}

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

function ensureContentDir() {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }
}

export function getAllPosts(): BlogPost[] {
  ensureContentDir();

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const stats = readingTime(content);

    return {
      title: data.title ?? "",
      slug: data.slug ?? slug,
      excerpt: data.excerpt ?? "",
      publishDate: data.publishDate ?? "",
      author: data.author ?? "Dave Sweeney",
      readTime: data.readTime ?? stats.text,
      primaryKeyword: data.primaryKeyword ?? "",
      secondaryKeywords: data.secondaryKeywords ?? [],
      relatedSlugs: data.relatedSlugs ?? [],
      metaTitle: data.metaTitle ?? `${data.title} | OurFable`,
      metaDescription: data.metaDescription ?? data.excerpt ?? "",
      ogImage: data.ogImage ?? "",
      content,
    } as BlogPost;
  });

  // Sort newest first
  return posts.sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | null {
  ensureContentDir();

  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  return {
    title: data.title ?? "",
    slug: data.slug ?? slug,
    excerpt: data.excerpt ?? "",
    publishDate: data.publishDate ?? "",
    author: data.author ?? "Dave Sweeney",
    readTime: data.readTime ?? stats.text,
    primaryKeyword: data.primaryKeyword ?? "",
    secondaryKeywords: data.secondaryKeywords ?? [],
    relatedSlugs: data.relatedSlugs ?? [],
    metaTitle: data.metaTitle ?? `${data.title} | OurFable`,
    metaDescription: data.metaDescription ?? data.excerpt ?? "",
    ogImage: data.ogImage ?? "",
    content,
  };
}

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const all = getAllPosts();

  // First try explicitly listed related slugs
  const explicit = post.relatedSlugs
    .map((s) => all.find((p) => p.slug === s))
    .filter(Boolean) as BlogPost[];

  if (explicit.length >= limit) return explicit.slice(0, limit);

  // Fill remaining with other posts (excluding self)
  const others = all.filter(
    (p) =>
      p.slug !== post.slug &&
      !post.relatedSlugs.includes(p.slug)
  );

  return [...explicit, ...others].slice(0, limit);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
