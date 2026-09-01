import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "../../../lib/blog";
import BlogGrid from "../../../components/BlogGrid";

export const metadata: Metadata = {
  title: "Blog",
  description: "Product news, engineering deep dives, and guides on agent reliability — from the AgentDiff team.",
  keywords: ["AI agents", "LLM evaluation", "Goodhart's Law", "trajectory testing", "AgentDiff", "agent reliability"],
  authors: [{ name: "AgentDiff", url: "https://agentdiff.app" }],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog | AgentDiff",
    description: "Product news, engineering deep dives, and guides on agent reliability.",
    url: "https://agentdiff.app/blog",
    siteName: "AgentDiff",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | AgentDiff",
    description: "Product news, engineering deep dives, and guides on agent reliability.",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="w-full font-sans divide-y divide-(--border)">
      
      {/* 1. BLOG HERO HEADER */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-24 sm:pb-20 bg-transparent w-full">
        {/* Top radial ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[280px] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-500/15 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-4 font-medium">
              Engineering Journal
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.08]">
              Notes on building <span className="text-emerald-500/90 dark:text-emerald-400">trustworthy</span> AI agents.
            </h1>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed max-w-2xl font-normal">
              Product updates, architectural deep-dives, and technical essays on trajectory testing and agent reliability.
            </p>
          </div>
        </div>
      </section>

      {/* 2. BLOG CONTENT FEED */}
      <section className="py-16 sm:py-24 w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <BlogGrid posts={posts} />
        </div>
      </section>

      {/* 3. CLOSING CTA BANNER */}
      <section className="py-24 sm:py-36 w-full bg-transparent text-center border-t border-(--border) relative overflow-hidden">
        {/* Top-Right Emerald Flare */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/15 dark:bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
        
        {/* Center ambient wash */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[300px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto space-y-6">
            <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block font-medium">
              Join the Movement
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.08]">
              Never ship a silent agent <span className="text-emerald-500/90 dark:text-emerald-400">regression again.</span>
            </h2>
            <p className="text-base sm:text-lg text-(--muted) max-w-xl mx-auto font-normal leading-relaxed">
              Start gating agent trajectory regressions in CI today with zero SDK lock-in and deterministic contract test suites.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm font-semibold">
              <Link
                href="/quickstart"
                className="px-8 py-3.5 rounded-full bg-(--fg) text-(--bg) hover:opacity-90 transition-opacity shadow-sm"
              >
                Get Started with Quickstart →
              </Link>
              <Link
                href="/docs"
                className="px-8 py-3.5 rounded-full border border-(--border) text-(--fg) hover:bg-(--surface-2) transition-colors"
              >
                Explore Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
