"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, BookOpen } from "lucide-react";
import { Github } from "@lobehub/icons";
import LogoMark from "../../components/LogoMark";
import ThemeToggle from "../../components/ThemeToggle";

export interface DocMeta {
  slug: string;
  title: string;
  category: string;
}

const NAV_ITEMS = [
  { href: "/quickstart", label: "Quickstart" },
  { href: "/features", label: "Features" },
  { href: "/adapters", label: "Adapters" },
  { href: "/action", label: "GitHub Action" },
  { href: "/compare", label: "Compare" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
];

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
  const [mounted, setMounted] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [docsSidebarOpen, setDocsSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    setDocsSidebarOpen(false);
    setNavDrawerOpen(false);
  }, [pathname]);

  const activeSlug =
    docs.find((d) => pathname === `/docs/${d.slug}`)?.slug ?? "";

  const activeDoc = docs.find((d) => d.slug === activeSlug);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const categories = Array.from(new Set(docs.map((p) => p.category)));

  const renderDocNav = () => (
    <div className="flex flex-col gap-7">
      {categories.map((category) => (
        <div key={category} className="flex flex-col gap-2">
          <div className="text-[11px] uppercase tracking-[0.16em] text-(--faint) font-bold px-2 flex items-center justify-between">
            <span>{category}</span>
            <span className="text-[10px] font-mono text-(--muted) bg-(--surface-2) px-1.5 py-0.2 rounded">
              {docs.filter((p) => p.category === category).length}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {docs
              .filter((p) => p.category === category)
              .map((p) => {
                const isActiveDoc = activeSlug === p.slug;
                return (
                  <Link
                    key={p.slug}
                    href={`/docs/${p.slug}`}
                    className={`group text-left text-xs sm:text-[13px] py-2 px-3 rounded-xl transition-all duration-150 flex items-center justify-between ${
                      isActiveDoc
                        ? "text-emerald-500 font-semibold bg-(--surface-2) shadow-2xs"
                        : "text-(--muted) hover:text-(--fg) hover:bg-(--surface-2)/60"
                    }`}
                  >
                    <span className="truncate">{p.title}</span>
                    {isActiveDoc && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );

  // Global Mobile Navigation Slide-Over Drawer
  const mobileNavDrawer = mounted && navDrawerOpen
    ? createPortal(
        <div
          className="fixed inset-0 lg:hidden flex justify-end"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setNavDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-(--surface) border-l border-(--border) shadow-2xl flex flex-col justify-between p-6 z-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-(--border)">
              <span className="text-xs uppercase tracking-wider font-semibold text-(--muted)">
                Navigation
              </span>
              <button
                onClick={() => setNavDrawerOpen(false)}
                className="p-1.5 text-(--muted) hover:text-(--fg) hover:bg-(--surface-2) rounded-lg transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 py-4 my-auto">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setNavDrawerOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-base font-semibold transition-all ${
                      active
                        ? "bg-(--surface-2) text-emerald-500 font-bold"
                        : "text-(--muted) hover:bg-(--surface-2)/60 hover:text-(--fg)"
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-(--border) flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-xs text-(--muted) font-medium">Theme</span>
              </div>
              <a
                href="https://github.com/kerrshift/agentdiff"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-(--border) bg-(--surface) text-xs font-semibold text-(--fg) hover:bg-(--surface-2) transition-colors"
              >
                <Github size={14} />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="h-screen bg-(--bg) text-(--fg) font-sans flex flex-col overflow-hidden selection:bg-(--surface-2) selection:text-(--fg)">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col relative overflow-hidden border-x border-(--border)">

        {/* 1. Global Synchronized Header */}
        <header className="border-b border-(--border) bg-(--bg)/85 backdrop-blur-md sticky top-0 z-40 transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            
            {/* Branding + Mobile Breadcrumb */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 group cursor-pointer"
                aria-label="AgentDiff home"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-zinc-950 text-white border border-zinc-800 shadow-2xs group-hover:scale-105 transition-transform duration-150">
                  <LogoMark size={13} />
                </span>
                <span className="font-bold text-(--fg) tracking-tight text-[15px] group-hover:opacity-85 transition-opacity duration-150">
                  agent<span className="text-emerald-500">diff</span>
                </span>
                <span className="hidden sm:inline text-[10px] font-mono text-(--muted) border border-(--border) rounded-full px-2 py-0.5 bg-(--surface-2)/40">
                  v{version}
                </span>
              </Link>

              {/* Mobile Active Page Indicator */}
              <div className="flex items-center gap-1.5 lg:hidden text-xs font-semibold text-(--muted)">
                <span className="text-(--border-strong)">/</span>
                <span className="text-(--fg) font-bold truncate max-w-[140px]">
                  {activeDoc ? activeDoc.title : "Docs"}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                      active
                        ? "text-(--fg) bg-(--surface-2) shadow-2xs"
                        : "text-(--muted) hover:text-(--fg) hover:bg-(--surface-2)/50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Utilities + Mobile Menu Toggle */}
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2">
                <ThemeToggle />
                <a
                  href="https://github.com/kerrshift/agentdiff"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-(--muted) border border-(--border) bg-(--surface) hover:text-(--fg) hover:border-(--border-strong) transition-colors duration-150 shadow-2xs"
                  aria-label="GitHub"
                >
                  <Github size={15} />
                </a>
              </div>

              {/* Mobile Docs Topics Toggle */}
              <button
                onClick={() => setDocsSidebarOpen((v) => !v)}
                className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-(--border) bg-(--surface) text-xs font-semibold text-(--fg) hover:bg-(--surface-2) transition-colors cursor-pointer"
                aria-label="Toggle Documentation Topics"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                <span>Topics</span>
              </button>

              {/* Mobile Global Navigation Toggle */}
              <button
                onClick={() => setNavDrawerOpen((o) => !o)}
                className="lg:hidden p-2 -mr-1 text-(--fg) hover:bg-(--surface-2) rounded-xl transition-colors duration-150 cursor-pointer"
                aria-label="Toggle menu"
                aria-expanded={navDrawerOpen}
              >
                {navDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </header>

        {/* 2-Column Sidebar Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Subtle top ambient glow inside docs content */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent blur-3xl pointer-events-none -z-0" />

          {/* Left Sidebar - Desktop */}
          <aside className="hidden md:flex w-72 shrink-0 border-r border-(--border) overflow-y-auto p-6 flex-col gap-6 bg-(--surface)/30 relative z-10">
            {renderDocNav()}
          </aside>

          {/* Mobile Documentation Topics Drawer */}
          {docsSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setDocsSidebarOpen(false)} />
              <aside className="relative z-10 w-72 max-w-[85%] h-full bg-(--surface) border-r border-(--border) overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-(--border)">
                    <span className="text-xs uppercase tracking-wider font-semibold text-(--muted)">
                      Documentation Topics
                    </span>
                    <button
                      onClick={() => setDocsSidebarOpen(false)}
                      className="p-1.5 text-(--muted) hover:text-(--fg) hover:bg-(--surface-2) rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {renderDocNav()}
                </div>
              </aside>
            </div>
          )}

          {/* Right Main Document Pane */}
          <main className="flex-1 overflow-y-auto relative z-10">
            <div className="max-w-4xl px-6 sm:px-10 lg:px-16 py-10 sm:py-14 w-full">
              {/* Document Breadcrumb Bar */}
              {activeDoc && (
                <div className="flex items-center gap-2 text-xs text-(--muted) mb-6 font-medium">
                  <Link href="/docs" className="hover:text-(--fg) transition-colors">Docs</Link>
                  <span className="text-(--border)">/</span>
                  <span className="text-(--faint)">{activeDoc.category}</span>
                  <span className="text-(--border)">/</span>
                  <span className="text-emerald-500 font-semibold">{activeDoc.title}</span>
                </div>
              )}
              {children}
            </div>
          </main>

        </div>
      </div>
      {mobileNavDrawer}
    </div>
  );
}
