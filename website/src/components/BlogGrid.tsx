"use client";

import Link from "next/link";
import { useState } from "react";
import BlogGradient from "./BlogGradient";

interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  type: string;
  description: string;
  readingTime: number;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

const FILTERS = ["All", "Product", "Engineering", "Guides"] as const;

function TypeBadge({ type }: { type: string }) {
  return <span className="text-sm font-semibold tracking-widest uppercase text-(--muted)">{type}</span>;
}

export default function BlogGrid({ posts }: { posts: BlogPostMeta[] }) {
  const [active, setActive] = useState<string>("All");
  const filtered = active === "All" ? posts : posts.filter((p) => p.type.toLowerCase() === active.toLowerCase() || (active === "Guides" && p.type === "guide"));

  return (
    <>
      <div className="flex items-center gap-8 mb-10 border-b border-(--border) pb-0 overflow-visible">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`pb-4 -mb-px text-[15px] transition-colors border-b-2 ${active === f ? "font-semibold text-(--fg) border-(--fg)" : "text-(--muted) border-transparent hover:text-(--fg)"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col">
            <BlogGradient seed={post.slug} className="aspect-square rounded-lg border border-(--border)" />
            <h2 className="mt-4 text-[17px] font-semibold tracking-tight leading-snug line-clamp-2">
              {post.title}
              <span className="inline-block ml-1.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">→</span>
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <time className="font-medium text-(--muted)">{formatDate(post.date)}</time>
              <span className="text-(--faint)">·</span>
              <TypeBadge type={post.type} />
              <span className="text-(--faint)">·</span>
              <span className="text-(--faint)">{post.readingTime} min read</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center">
            {active === "Guides" ? (
              <>
                <p className="text-base font-semibold text-(--fg)">Guides are coming soon</p>
                <p className="mt-2 text-sm text-(--muted) max-w-md mx-auto">Hands-on walkthroughs for gating agents in CI — from setup to baseline rotation. Stay tuned.</p>
              </>
            ) : active === "Product" ? (
              <>
                <p className="text-base font-semibold text-(--fg)">Product updates are brewing</p>
                <p className="mt-2 text-sm text-(--muted) max-w-md mx-auto">
                  v1 is landing soon. Meanwhile,{" "}
                  <a href="https://github.com/lostmartian/agentdiff/releases" target="_blank" rel="noopener noreferrer" className="underline decoration-(--border) underline-offset-4 hover:decoration-(--fg) text-(--fg) transition-colors">
                    watch releases on GitHub
                  </a>
                  .
                </p>
              </>
            ) : (
              <p className="text-sm text-(--muted)">No posts in {active}.</p>
            )}
            <button onClick={() => setActive("All")} className="mt-6 text-sm font-medium text-(--fg) underline decoration-(--border) underline-offset-4 hover:decoration-(--fg) transition-colors">
              View all posts →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
