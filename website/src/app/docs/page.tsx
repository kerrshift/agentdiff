import type { Metadata } from "next";
import DocContent from "./DocContent";
import {
  getAllDocs,
  getDocDescription,
  withResolvedLinks,
} from "../../lib/docs";

const SITE_URL = "https://agentdiff.lostmartian.in";

/**
 * `/docs` serves the first guide's full content directly (instant, no-JS
 * friendly) while the canonical URL points at its permanent route, so search
 * engines consolidate ranking on `/docs/<slug>` instead of this convenience
 * alias. Legacy inbound links of the form `/docs#old-slug` are honored
 * client-side by DocsShell.
 */

export async function generateMetadata(): Promise<Metadata> {
  const docs = getAllDocs();
  const first = docs[0];
  if (!first) return {};
  return {
    alternates: {
      canonical: `/docs/${first.slug}`,
    },
  };
}

export default function DocsIndexPage() {
  const docs = getAllDocs();
  const first = docs[0];
  return <DocContent content={withResolvedLinks(first.content)} />;
}
