"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import LogoMark from "../../components/LogoMark";
import ThemeToggle from "../../components/ThemeToggle";

export interface DocMeta {
  slug: string;
  title: string;
  category: string;
}

/**
 * Docs chrome: header, intro strip, and sidebar navigation. Real routes now
 * carry the content (`/docs/[slug]`), so the sidebar renders plain Links and
 * the active entry derives from the pathname — every page is a distinct,
 * crawlable URL.
 */
export default function DocsShell({
  docs,
  version,
  children,
}: {
  docs: DocMeta[];
  version: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Legacy inbound links of the form /docs#old-slug still land on the right
  // guide even though guides are real routes now.
  useEffect(() => {
    if (pathname !== "/docs") return;
    const hash = window.location.hash.replace("#", "");
    const target = docs.find((d) => d.slug === hash);
    if (hash && target) router.replace(`/docs/${target.slug}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close the mobile drawer after navigating to another guide.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const activeSlug =
    docs.find((d) => pathname === `/docs/${d.slug}`)?.slug ?? "";

  const categories = Array.from(new Set(docs.map((p) => p.category)));

  const renderNav = () => (
    <div className="flex flex-col gap-6">
      {categories.map((category) => (
        <div key={category} className="flex flex-col gap-1.5">
          <div className="text-xs font-mono uppercase tracking-[0.14em] text-[var(--faint)] font-semibold mb-1">
            {category}
          </div>
          <div className="flex flex-col gap-1">
            {docs
              .filter((p) => p.category === category)
              .map((p) => (
                <Link
                  key={p.slug}
                  href={`/docs/${p.slug}`}
                  className={`text-left text-sm py-1.5 px-2.5 rounded-md transition-colors duration-150 ${
                    activeSlug === p.slug
                      ? "text-[var(--fg)] font-medium bg-[var(--surface-2)]"
                      : "text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {p.title}
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-screen bg-[var(--bg)] text-[var(--fg)] font-sans flex flex-col overflow-hidden selection:bg-[var(--surface-2)] selection:text-[var(--fg)]">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col relative overflow-hidden">

        {/* Docs Header */}
        <header className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="px-5 sm:px-8 h-16 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {/* Mobile nav toggle */}
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="md:hidden p-1.5 text-[var(--muted)] hover:text-[var(--fg)] transition-colors duration-150"
                aria-label="Toggle navigation"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              <Link
                href="/"
                className="font-semibold text-[var(--fg)] tracking-tight text-base hover:opacity-80 transition-opacity duration-150 flex items-center gap-2"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--fg)] text-[var(--bg)]">
                  <LogoMark size={14} />
                </span>
                <span>agentdiff</span>
                <span className="text-[10px] font-mono font-normal text-[var(--faint)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                  Docs
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="text-xs text-[var(--faint)] font-mono">v{version}</span>
            </div>
          </div>
        </header>

        {/* Docs Intro Strip */}
        <div className="border-b border-[var(--border)] px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="text-xs text-[var(--muted)] leading-relaxed max-w-2xl">
            Trajectory regression testing for AI agents - compare execution DAGs in CI/CD and gate on drift, loops, cost, and recovery effort.
          </div>
          <Link
            href="/"
            className="text-xs text-[var(--fg)] hover:text-[var(--muted)] font-medium flex-shrink-0 hidden sm:inline"
          >
            ← Back to home
          </Link>
        </div>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
            <aside className="relative z-10 w-72 max-w-[85%] h-full bg-[var(--surface)] border-r border-[var(--border)] overflow-y-auto p-6 flex flex-col">
              {renderNav()}
            </aside>
          </div>
        )}

        {/* 2-Column Sidebar Layout - both panes scroll independently */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Left Sidebar - desktop */}
          <aside className="hidden md:flex w-56 shrink-0 border-r border-[var(--border)] overflow-y-auto p-6 flex-col gap-6 bg-[var(--surface)]">
            {renderNav()}
          </aside>

          {/* Right Main Document Pane */}
          <main className="flex-1 overflow-y-auto">
            <div className="px-5 sm:px-8 lg:px-12 py-8 sm:py-10 w-full">{children}</div>
          </main>

        </div>
      </div>
    </div>
  );
}
