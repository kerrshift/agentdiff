import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocContent from "../DocContent";
import {
  getAllDocs,
  getDoc,
  getDocDescription,
  withResolvedLinks,
} from "../../../lib/docs";

const SITE_URL = "https://agentdiff.lostmartian.in";

/**
 * One real, statically prerendered route per guide — each with its own
 * title, description, canonical URL, and Open Graph/Twitter metadata, so
 * every page of the docs is individually crawlable and rankable.
 */

export function generateStaticParams(): { slug: string }[] {
  return getAllDocs().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) return {};

  const description = getDocDescription(doc.content);
  const url = `${SITE_URL}/docs/${doc.slug}`;

  return {
    title: doc.title,
    description,
    alternates: {
      canonical: `/docs/${doc.slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${doc.title} | AgentDiff Docs`,
      description,
      url,
      siteName: "AgentDiff",
      type: "article",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: `AgentDiff documentation - ${doc.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${doc.title} | AgentDiff Docs`,
      description,
      images: ["/og.png"],
    },
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();

  const description = getDocDescription(doc.content);
  const url = `${SITE_URL}/docs/${doc.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: doc.title,
        description,
        url,
        articleSection: doc.category,
        publisher: { "@id": `${SITE_URL}/#organization` },
        isPartOf: { name: "AgentDiff Documentation", url: `${SITE_URL}/docs` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Docs", item: `${SITE_URL}/docs` },
          { "@type": "ListItem", position: 3, name: doc.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DocContent content={withResolvedLinks(doc.content)} />
    </>
  );
}
