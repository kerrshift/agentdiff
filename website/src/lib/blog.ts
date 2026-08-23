import fs from "fs";
import path from "path";

/**
 * Server-side blog loader (mirrors `docs.ts`).
 *
 * Posts live as markdown files with YAML-ish frontmatter under
 * `website/content/blog/<YYYY-MM-DD-slug>.md`. The public slug strips the
 * date prefix: `2026-08-23-introducing-agentdiff.md` → `/blog/introducing-agentdiff`.
 * Posts sort newest-first by the date in frontmatter.
 *
 * Frontmatter keys:
 *   title:       post headline (required)
 *   date:        ISO date, YYYY-MM-DD (required; drives ordering + display)
 *   type:        "engineering" | "guide" | "product" (required)
 *   description: social/meta description (required)
 */

export type BlogPostType = "engineering" | "guide" | "product";

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  type: BlogPostType;
  description: string;
  keywords: string;
  readingTime: number;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function parseFrontmatter(raw: string): {
  data: Record<string, string>;
  body: string;
} {
  const data: Record<string, string> = {};
  let body = raw;

  if (raw.startsWith("---")) {
    const end = raw.indexOf("\n---", 3);
    if (end !== -1) {
      const block = raw.slice(3, end).trim();
      body = raw.slice(end + 4).replace(/^\s*\n/, "");
      for (const line of block.split("\n")) {
        const idx = line.indexOf(":");
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        const value = line
          .slice(idx + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (key) data[key] = value;
      }
    }
  }
  return { data, body };
}

function toSlug(filenameNoExt: string): string {
  return filenameNoExt.replace(/^\d{4}-\d{2}-\d{2}-/, "").toLowerCase();
}

function isValidType(value: string): value is BlogPostType {
  return value === "engineering" || value === "guide" || value === "product";
}

/** All posts, newest first. */
export function getAllPosts(): BlogPost[] {
  const posts: BlogPost[] = [];
  if (!fs.existsSync(BLOG_DIR)) return posts;

  for (const file of fs.readdirSync(BLOG_DIR)) {
    if (!file.endsWith(".md")) continue;
    const filePath = path.join(BLOG_DIR, file);
    const { data, body } = parseFrontmatter(fs.readFileSync(filePath, "utf-8"));

    const type = data.type ?? "";
    if (!isValidType(type)) continue;

    const words = body.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.round(words / 200));
    posts.push({
      slug: toSlug(file.replace(/\.md$/, "")),
      title: data.title ?? file.replace(/\.md$/, ""),
      date: data.date ?? "",
      type,
      description: data.description ?? "",
      keywords: data.keywords ?? "",
      readingTime,
      content: body,
    });
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostMetas(): BlogPostMeta[] {
  return getAllPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    type: post.type,
    description: post.description,
    keywords: post.keywords,
    readingTime: post.readingTime,
  }));
}

export function getPost(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getHeadings(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  for (const line of markdown.split("\n")) {
    const m2 = line.match(/^##\s+(.+)$/);
    if (m2) {
      const text = m2[1].replace(/[*_`]/g, "").trim();
      items.push({ id: slugify(text), text, level: 2 });
      continue;
    }
    const m3 = line.match(/^###\s+(.+)$/);
    if (m3) {
      const text = m3[1].replace(/[*_`]/g, "").trim();
      items.push({ id: slugify(text), text, level: 3 });
    }
  }
  return items;
}
