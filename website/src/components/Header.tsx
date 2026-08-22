"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Github } from "@lobehub/icons";
import LogoMark from "./LogoMark";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { id: "workspace-section", label: "Workspace" },
  { id: "features-section", label: "Features" },
  { id: "action-section", label: "Action" },
  { id: "integration-section", label: "Integration" },
];

// All tracked sections, including the Hero and Problem (which aren't in the nav).
// Tracking them lets the active highlight clear when the user is at the top.
const TRACKED_SECTIONS = [
  "hero-section",
  "problem-section",
  ...NAV.map((n) => n.id),
];

export default function Header({ version = "0.2.1" }: { version?: string }) {
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight * 0.4;
      let current = TRACKED_SECTIONS[0];
      for (const id of TRACKED_SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= mid) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock page scroll while the mobile overlay is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navClass = (id: string) =>
    `px-3.5 py-2 rounded-full text-[13px] font-medium transition-colors duration-150 ${
      active === id
        ? "bg-(--surface-2) text-(--fg)"
        : "text-(--muted) hover:text-(--fg) hover:bg-(--surface-2)"
    }`;

  return (
    <header className="sticky top-0 z-40 font-sans">
      {/* Normal full-width sticky bar: brand left, nav + actions right. */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between gap-2 border-b border-(--border) bg-(--bg)/85 backdrop-blur-md pl-4 pr-4 py-0 h-16">
          {/* Branding */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 group cursor-pointer shrink-0"
            aria-label="Back to top"
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
          </button>

          {/* Right cluster: nav links + actions */}
          <div className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className={navClass(n.id)}>
                {n.label}
              </a>
            ))}
            <Link
              href="/docs"
              className="px-3.5 py-2 rounded-full text-[13px] font-medium text-(--muted) hover:text-(--fg) hover:bg-(--surface-2) transition-colors duration-150"
            >
              Docs
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
            className="md:hidden p-1.5 -mr-0.5 text-(--fg) hover:bg-(--surface-2) rounded-full transition-colors duration-150"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Full-screen mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden menu-in">
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

            <nav className="flex-1 flex flex-col justify-center gap-1 mt-8">
              {NAV.map((n) => {
                const isActive = active === n.id;
                return (
                  <a
                    key={n.id}
                    href={`#${n.id}`}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center justify-between px-4 py-3.5 rounded-2xl text-2xl font-semibold tracking-tight transition-colors duration-150 ${
                      isActive
                        ? "bg-(--surface-2) text-(--fg)"
                        : "text-(--muted) hover:bg-(--surface-2) hover:text-(--fg)"
                    }`}
                  >
                    {n.label}
                    <ArrowUpRight
                      className={`w-5 h-5 transition-opacity duration-150 ${
                        isActive ? "opacity-100 text-(--fg)" : "opacity-0 group-hover:opacity-60 text-(--faint)"
                      }`}
                    />
                  </a>
                );
              })}
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
              <a
                href="https://github.com/lostmartian/agentdiff"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 text-center text-[15px] font-semibold text-(--bg) bg-(--fg) hover:opacity-90 px-4 py-3 rounded-full transition-opacity duration-150"
              >
                <Github size={16} />
                GitHub
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}