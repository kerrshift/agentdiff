"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
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
  return (
    <span className="text-xs uppercase tracking-wider font-semibold text-emerald-500">
      {type}
    </span>
  );
}

export default function BlogGrid({ posts }: { posts: BlogPostMeta[] }) {
  const [active, setActive] = useState<string>("All");
  const filtered = active === "All" ? posts : posts.filter((p) => p.type.toLowerCase() === active.toLowerCase() || (active === "Guides" && p.type === "guide"));

  return (
    <>
      {/* Sleek Segmented Capsule Filter Bar (No clumsy bottom border line) */}
      <div className="flex items-center gap-1.5 mb-12 sm:mb-16 p-1.5 rounded-full bg-(--surface) border border-(--border) w-fit max-w-full overflow-x-auto no-scrollbar shadow-2xs">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              active === f
                ? "bg-(--fg) text-(--bg) shadow-xs"
                : "text-(--muted) hover:text-(--fg) hover:bg-(--surface-2)"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Post Grid */}
      <div className="grid gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col space-y-3">
            <BlogGradient
              seed={post.slug}
              className="aspect-square rounded-lg border border-(--border) overflow-hidden shadow-2xs group-hover:border-(--border-strong) transition-colors"
            />
            
            <div className="flex items-center gap-2 text-xs text-(--muted) pt-1 font-medium">
              <TypeBadge type={post.type} />
              <span className="text-(--border)">•</span>
              <time>{formatDate(post.date)}</time>
              <span className="text-(--border)">•</span>
              <span className="text-(--faint)">{post.readingTime} min read</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight leading-snug line-clamp-2 text-(--fg)">
                {post.title}
              </h2>
              <ArrowUpRight className="w-4 h-4 shrink-0 text-(--muted) group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all mt-1" />
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center space-y-3">
            {active === "Guides" ? (
              <>
                <p className="text-base font-semibold text-(--fg)">Guides are coming soon</p>
                <p className="text-sm text-(--muted) max-w-md mx-auto leading-relaxed">
                  Hands-on walkthroughs for gating agents in CI — from setup to baseline rotation. Stay tuned.
                </p>
              </>
            ) : active === "Product" ? (
              <>
                <p className="text-base font-semibold text-(--fg)">Product updates are brewing</p>
                <p className="text-sm text-(--muted) max-w-md mx-auto leading-relaxed">
                  v1 is landing soon. Meanwhile,{" "}
                  <a
                    href="https://github.com/lostmartian/agentdiff/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-(--border) underline-offset-4 hover:decoration-(--fg) text-(--fg) transition-colors font-medium"
                  >
                    watch releases on GitHub
                  </a>
                  .
                </p>
              </>
            ) : (
              <p className="text-sm text-(--muted)">No articles in {active} yet.</p>
            )}
            <button
              onClick={() => setActive("All")}
              className="mt-4 text-sm font-medium text-(--fg) underline decoration-(--border) underline-offset-4 hover:decoration-(--fg) transition-colors cursor-pointer"
            >
              View all posts →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
