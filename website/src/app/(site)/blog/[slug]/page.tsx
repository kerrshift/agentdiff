import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DocContent from "../../../docs/DocContent";
import BlogGradient, { gradientStyle } from "../../../../components/BlogGradient";
import BlogToc from "../../../../components/BlogToc";
import ScrollToTop from "../../../../components/ScrollToTop";
import { getAllPosts, getPost, formatDate, getHeadings } from "../../../../lib/blog";

const SITE_URL = "https://agentdiff.app";

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
      // og:image auto-wired from the per-slug opengraph-image route
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | AgentDiff Blog`,
      description: post.description,
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
      <div className="w-full font-sans divide-y divide-(--border)">

        {/* Header Section with Background Gradient Banner & Overlay */}
        <section
          className="relative overflow-hidden pt-16 pb-20 sm:pt-20 sm:pb-24 w-full"
          style={gradientStyle(post.slug)}
        >
          {/* Subtle Dark Mode Deepening Overlay & Light Mode Diffusion */}
          <div className="absolute inset-0 bg-white/20 dark:bg-black/75 backdrop-blur-[1px] pointer-events-none" />

          {/* Smooth Bottom Fade Transition into Main Content */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-(--bg) pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex gap-12 lg:gap-16 w-full items-start justify-between">

              {/* Left Column: Matches exact content width below */}
              <div className="flex-1 min-w-0 max-w-3xl">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--muted) hover:text-(--fg) transition-colors mb-8"
                >
                  <span>←</span>
                  <span>All Articles</span>
                </Link>

                <header className="space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-(--surface)/90 dark:bg-(--surface)/80 backdrop-blur-md text-(--fg) border border-(--border)">
                      {post.type}
                    </span>
                    <span className="text-xs text-(--muted)">•</span>
                    <time className="text-xs text-(--muted) font-medium">
                      {formatDate(post.date)}
                    </time>
                    <span className="text-xs text-(--muted)">•</span>
                    <span className="text-xs text-(--faint)">
                      {post.readingTime} min read
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.15]">
                    {post.title}
                  </h1>

                  <p className="text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
                    {post.description}
                  </p>
                </header>
              </div>

              {/* Right Column Spacer: Matches TOC width so left column never shifts */}
              <div className="hidden lg:block w-64 shrink-0" aria-hidden="true" />

            </div>
          </div>
        </section>

        {/* Content & TOC Section */}
        <section className="py-16 sm:py-24 w-full bg-transparent">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-12 lg:gap-16 w-full items-start justify-between">

              <div className="flex-1 min-w-0 max-w-3xl">
                <DocContent content={post.content} />

                <footer className="mt-16 pt-8 border-t border-(--border) flex items-center justify-between">
                  <Link
                    href="/blog"
                    className="text-sm font-semibold text-emerald-500 hover:underline"
                  >
                    ← Back to all articles
                  </Link>
                  <Link
                    href="/quickstart"
                    className="text-sm font-semibold text-(--fg) hover:text-emerald-500 transition-colors"
                  >
                    Get Started with AgentDiff →
                  </Link>
                </footer>
              </div>

              {/* Sticky TOC Sidebar (Single clean vertical line) */}
              <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start">
                <p className="text-xs uppercase font-bold tracking-wider text-(--faint) mb-4 pl-4">
                  On this page
                </p>
                <BlogToc headings={headings} />
              </aside>

            </div>
          </div>
        </section>

      </div>
    </>
  );
}
