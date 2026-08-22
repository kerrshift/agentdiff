import fs from "fs";
import path from "path";

/**
 * Server-side documentation loader (shared by routes, metadata, and sitemap).
 *
 * Docs live as markdown files under `website/docs/<NN-category>/<NN-Title>.md`.
 * The public slug is derived from the filename: numeric prefix stripped,
 * lowercased, spaces folded to hyphens — e.g. `02-Core Concepts/02-Divergence
 * Metrics.md` → `/docs/divergence-metrics`. Each slug becomes a real,
 * individually prerendered and indexable route.
 */

export interface DocMeta {
  slug: string;
  title: string;
  category: string;
}

export interface DocPage extends DocMeta {
  content: string;
}

const DOCS_DIR = path.join(process.cwd(), "docs");

export function cleanTitle(title: string): string {
  return title.replace(/^\d+-\s*/, "");
}

/** Same slug algorithm the docs UI has always used for #hashes. */
function toSlug(filenameNoExt: string): string {
  return filenameNoExt
    .replace(/^\d+-\s*/, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function getAllDocs(): DocPage[] {
  const docs: DocPage[] = [];

  if (!fs.existsSync(DOCS_DIR)) return docs;

  const categories = fs.readdirSync(DOCS_DIR).sort();
  for (const category of categories) {
    const catPath = path.join(DOCS_DIR, category);
    if (!fs.statSync(catPath).isDirectory()) continue;

    for (const file of fs.readdirSync(catPath).sort()) {
      if (!file.endsWith(".md")) continue;
      const filePath = path.join(catPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const titleNoExt = file.replace(/\.md$/, "");
      docs.push({
        slug: toSlug(titleNoExt),
        title: cleanTitle(titleNoExt),
        category: cleanTitle(category),
        content,
      });
    }
  }
  return docs;
}

export function getDocMetas(): DocMeta[] {
  return getAllDocs().map(({ slug, title, category }) => ({
    slug,
    title,
    category,
  }));
}

export function getDoc(slug: string): DocPage | undefined {
  return getAllDocs().find((d) => d.slug === slug);
}

export function getFirstSlug(): string {
  const docs = getAllDocs();
  return docs[0]?.slug ?? "introduction";
}

/**
 * Derives a search-engine description from the markdown body: the first
 * substantive paragraph, truncated to ~155 characters.
 */
export function getDocDescription(content: string): string {
  const lines = content.split("\n");
  let paragraph = "";
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith("#") || t.startsWith("```") || t.startsWith("|") || t.startsWith("<")) {
      if (paragraph) break;
      continue;
    }
    paragraph += (paragraph ? " " : "") + t;
    if (paragraph.length > 155) break;
  }
  paragraph = paragraph.replace(/[*_`>]/g, "").trim();
  if (paragraph.length > 157) {
    paragraph = paragraph.slice(0, 154).trimEnd() + "...";
  }
  return paragraph || "AgentDiff documentation.";
}

const SITE_URL = "https://agentdiff.lostmartian.in";

/**
 * Rewrites relative markdown links (`../03-Guides/05-Configuration.md`,
 * `04-PR Comments.md`) into real site routes so cross-references between
 * guides finally work as clickable URLs.
 */
export function withResolvedLinks(content: string): string {
  const slugs = new Set(getAllDocs().map((d) => d.slug));
  return content.replace(
    /\]\(([^)#\s]+\.md)(#[^)\s]*)?\)/g,
    (_match, target: string, hash?: string) => {
      const base = target.split("/").pop()!.replace(/\.md$/, "");
      const slug = toSlug(base);
      if (!slugs.has(slug)) return _match; // unknown target: leave untouched
      return `](/docs/${slug}${hash ?? ""})`;
    },
  );
}
