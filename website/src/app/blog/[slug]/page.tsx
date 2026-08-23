import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DocContent from "../../docs/DocContent";
import BlogGradient from "../../../components/BlogGradient";
import BlogToc from "../../../components/BlogToc";
import ScrollToTop from "../../../components/ScrollToTop";
import { getAllPosts, getPost, formatDate, getHeadings } from "../../../lib/blog";

const SITE_URL = "https://agentdiff.lostmartian.in";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  const keywords = post.keywords ? post.keywords.split(",").map((s) => s.trim()) : [];
  const ogImage = `${SITE_URL}/blog/${post.slug}/opengraph-image`;
  return {
    title: post.title,
    description: post.description,
    keywords: keywords.length ? keywords : undefined,
    authors: [{ name: "AgentDiff", url: SITE_URL }],
    creator: "AgentDiff",
    publisher: "AgentDiff",
    alternates: { canonical: `/blog/${post.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${post.title} | AgentDiff Blog`,
      description: post.description,
      url,
      siteName: "AgentDiff",
      type: "article",
      publishedTime: post.date,
      authors: ["AgentDiff"],
      tags: keywords,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | AgentDiff Blog`,
      description: post.description,
      images: [ogImage],
      creator: "@agentdiff",
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const headings = getHeadings(post.content);
  const url = `${SITE_URL}/blog/${post.slug}`;

  const wordCount = post.content.split(/\s+/).filter(Boolean).length;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.date,
        url,
        image: `${url}/opengraph-image`,
        author: { "@type": "Organization", name: "AgentDiff", url: SITE_URL },
        publisher: {
          "@type": "Organization",
          name: "AgentDiff",
          url: SITE_URL,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.svg` },
        },
        keywords: post.keywords || undefined,
        wordCount,
        timeRequired: `PT${post.readingTime}M`,
        articleSection: post.type,
        isPartOf: { "@type": "Blog", name: "AgentDiff Blog", url: `${SITE_URL}/blog` },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <ScrollToTop />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-24">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-[13px] text-(--muted) hover:text-(--fg) transition-colors mb-10">
          ← Blog
        </Link>
        {/* Hero — centered, like landing */}
        <header className="w-full max-w-3xl mx-auto text-center mb-10 px-4 sm:px-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-(--border) bg-(--surface) text-xs font-medium tracking-wide capitalize">
            <span className={`w-2 h-2 rounded-full ${post.type === "engineering" ? "bg-(--accent)" : post.type === "guide" ? "bg-blue-500" : "bg-amber-500"}`} />
            {post.type}
          </div>
          <h1 className="mt-6 font-bold tracking-tight leading-[1.1] break-words" style={{ fontSize: "var(--text-title)" }}>
            {post.title}
          </h1>
          <p className="mt-6 text-(--muted) break-words" style={{ fontSize: "var(--text-subtitle)", lineHeight: "var(--leading-subtitle)" }}>
            {post.description}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-(--muted)">
            <time className="font-medium">{formatDate(post.date)}</time>
            <span className="text-(--faint)">·</span>
            <span>{post.readingTime} min read</span>
          </div>
        </header>

        <BlogGradient seed={post.slug} className="w-full max-w-3xl mx-auto h-[320px] md:h-[420px] rounded-2xl border border-(--border) mb-14" />

        {/* Content with left section nav */}
        <div className="flex gap-12 w-full max-w-5xl mx-auto items-start">
          <aside className="hidden lg:block w-56 shrink-0 sticky top-24 self-start">
            <p className="text-xs font-mono font-semibold uppercase text-(--faint) mb-4" style={{ letterSpacing: "0.2em" }}>
              On this page
            </p>
            <BlogToc headings={headings} />
          </aside>

          <div className="flex-1 min-w-0 max-w-3xl mx-auto lg:mx-0">
            <DocContent content={post.content} />
            <footer className="mt-16 pt-8 border-t border-(--border)">
              <Link href="/blog" className="text-sm text-(--muted) hover:text-(--fg) transition-colors">
                ← More posts
              </Link>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
