"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Github } from "@lobehub/icons";
import LogoMark from "./LogoMark";
import ThemeToggle from "./ThemeToggle";

export default function Header({ version = "0.2.1" }: { version?: string }) {
  const [open, setOpen] = useState(false);

  // Lock page scroll while the mobile overlay is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkClass =
    "px-3.5 py-2 rounded-full text-[13px] font-medium text-(--muted) hover:text-(--fg) hover:bg-(--surface-2) transition-colors duration-150";

  return (
    <header className="sticky top-0 z-40 font-sans border-b border-(--border) bg-(--bg)/85 backdrop-blur-md">
      {/* Full-width container perfectly aligned with site grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 h-16">
          {/* Branding */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer shrink-0"
            aria-label="AgentDiff home"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-(--fg) text-(--bg)">
              <LogoMark size={13} />
            </span>
            <span className="font-semibold text-(--fg) tracking-tight text-[15px] group-hover:opacity-80 transition-opacity duration-150">
              agentdiff
            </span>
            <span className="hidden sm:inline text-[10px] text-(--faint) border border-(--border) rounded-full px-1.5 py-0.5">
              v{version}
            </span>
          </Link>

          {/* Right cluster: page links + actions */}
          <div className="hidden lg:flex items-center gap-1">
            <Link href="/quickstart" className={linkClass}>
              Quickstart
            </Link>
            <Link href="/features" className={linkClass}>
              Features
            </Link>
            <Link href="/adapters" className={linkClass}>
              Adapters
            </Link>
            <Link href="/action" className={linkClass}>
              GitHub Action
            </Link>
            <Link href="/compare" className={linkClass}>
              Compare
            </Link>
            <Link href="/docs" className={linkClass}>
              Docs
            </Link>
            <Link href="/blog" className={linkClass}>
              Blog
            </Link>
            <a
              href="https://github.com/lostmartian/agentdiff"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-(--muted) border border-(--border) bg-(--surface) hover:text-(--fg) hover:border-(--border-strong) transition-colors duration-150 ml-1"
              aria-label="GitHub"
            >
              <Github size={17} />
            </a>
            <ThemeToggle />
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden p-1.5 -mr-0.5 text-(--fg) hover:bg-(--surface-2) rounded-full transition-colors duration-150"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Full-screen mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden menu-in">
          <div
            className="absolute inset-0 bg-(--bg)/98 backdrop-blur-xl"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full flex flex-col px-6 pt-4 pb-8 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-(--fg) text-(--bg)">
                  <LogoMark size={13} />
                </span>
                <span className="font-semibold text-(--fg) tracking-tight text-[15px]">
                  agentdiff
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-(--fg) hover:bg-(--surface-2) rounded-full transition-colors duration-150"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 flex flex-col justify-center gap-1 my-6">
              {[
                { href: "/quickstart", label: "Quickstart" },
                { href: "/features", label: "Features" },
                { href: "/adapters", label: "Adapters" },
                { href: "/action", label: "GitHub Action" },
                { href: "/compare", label: "Compare" },
                { href: "/docs", label: "Docs" },
                { href: "/blog", label: "Blog" },
                {
                  href: "https://github.com/lostmartian/agentdiff",
                  label: "GitHub",
                },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center justify-between px-4 py-2.5 rounded-2xl text-xl font-semibold tracking-tight text-(--muted) hover:bg-(--surface-2) hover:text-(--fg) transition-colors duration-150"
                >
                  {item.label}
                  <span className="text-(--faint) opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    ↗
                  </span>
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2.5">
              <ThemeToggle className="shrink-0" />
              <Link
                href="/docs"
                onClick={() => setOpen(false)}
                className="flex-1 text-center text-[15px] font-semibold text-(--bg) bg-(--fg) hover:opacity-90 px-4 py-3 rounded-full transition-opacity duration-150"
              >
                Docs
              </Link>
              <Link
                href="/quickstart"
                onClick={() => setOpen(false)}
                className="flex-1 text-center text-[15px] font-semibold text-(--fg) border border-(--border) hover:bg-(--surface-2) px-4 py-3 rounded-full transition-colors duration-150"
              >
                Quickstart
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
