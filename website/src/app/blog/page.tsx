import type { Metadata } from "next";
import { getAllPosts } from "../../lib/blog";
import BlogGrid from "../../components/BlogGrid";

export const metadata: Metadata = {
  title: "Blog",
  description: "Product news, engineering deep dives, and guides on agent reliability — from the AgentDiff team.",
  keywords: ["AI agents", "LLM evaluation", "Goodhart's Law", "trajectory testing", "AgentDiff", "agent reliability"],
  authors: [{ name: "AgentDiff", url: "https://agentdiff.lostmartian.in" }],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog | AgentDiff",
    description: "Product news, engineering deep dives, and guides on agent reliability.",
    url: "https://agentdiff.lostmartian.in/blog",
    siteName: "AgentDiff",
    type: "website",
    images: [{ url: "https://agentdiff.lostmartian.in/blog/opengraph-image", width: 1200, height: 630, alt: "AgentDiff Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | AgentDiff",
    description: "Product news, engineering deep dives, and guides on agent reliability.",
    images: ["https://agentdiff.lostmartian.in/blog/opengraph-image"],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-24">
      <header className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-(--border) bg-(--surface) text-xs font-medium tracking-wide">
          <span className="w-2 h-2 rounded-full bg-(--accent)" />
          Blog
        </div>
        <h1 className="mt-6 font-bold tracking-tight leading-[1.05] text-(--fg)" style={{ fontSize: "var(--text-display)" }}>
          Notes on building trustworthy agents.
        </h1>
        <p className="mt-6 text-(--muted) mx-auto max-w-2xl" style={{ fontSize: "var(--text-subtitle)", lineHeight: "var(--leading-subtitle)" }}>
          Product news, engineering deep dives, and guides on agent reliability.
        </p>
      </header>

      <BlogGrid posts={posts} />
    </div>
  );
}
