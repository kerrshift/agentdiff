"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Github } from "@lobehub/icons";
import LogoMark from "./LogoMark";

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
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        ? "bg-[#F4F4F5] text-[#18181B]"
        : "text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5]"
    }`;

  return (
    <header className="sticky top-0 z-40 font-sans">
      {/* Wrapper: full-width bar by default; collapses into a floating pill on desktop once scrolled. */}
      <div
        className={`mx-auto transition-all duration-300 max-w-7xl px-4 ${
          scrolled ? "md:max-w-4xl md:px-3 md:py-3.5" : ""
        }`}
      >
        {/* Full bar (mobile + desktop-top) -> floating pill (desktop scrolled) */}
        <div
          className={`flex items-center justify-between gap-2 border-b border-[#E4E4E7] bg-[#FBFBFC]/80 backdrop-blur-md pl-4 pr-4 py-0 h-16 transition-all duration-300 ${
            scrolled
              ? "md:rounded-full md:border md:border-[#E4E4E7] md:bg-white/85 md:shadow-[0_12px_36px_-16px_rgba(0,0,0,0.18)] md:pl-4 md:pr-2 md:py-2.5 md:h-auto"
              : "md:rounded-none md:shadow-none"
          }`}
        >
          {/* Branding */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 group cursor-pointer shrink-0"
            aria-label="Back to top"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#18181B] text-white">
              <LogoMark size={13} />
            </span>
            <span className="font-semibold text-[#18181B] tracking-tight text-[15px] group-hover:opacity-80 transition-opacity duration-150">
              agentdiff
            </span>
            <span className="hidden sm:inline text-[10px] text-[#A1A1AA] border border-[#E4E4E7] rounded-full px-1.5 py-0.5">
              v{version}
            </span>
          </button>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className={navClass(n.id)}>
                {n.label}
              </a>
            ))}
          </nav>

          {/* Right actions (desktop) */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <Link
              href="/docs"
              className="px-3.5 py-2 rounded-full text-[13px] font-medium text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors duration-150"
            >
              Docs
            </Link>
            <a
              href="https://github.com/lostmartian/agentdiff"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[#52525B] border border-[#E4E4E7] bg-white hover:text-[#18181B] hover:border-[#C9CDD3] transition-colors duration-150"
              aria-label="GitHub"
            >
              <Github size={17} />
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-1.5 -mr-0.5 text-[#18181B] hover:bg-[#F4F4F5] rounded-full transition-colors duration-150"
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
            className="absolute inset-0 bg-[#FBFBFC]/98 backdrop-blur-xl"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full flex flex-col px-6 pt-4 pb-8 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#18181B] text-white">
                  <LogoMark size={13} />
                </span>
                <span className="font-semibold text-[#18181B] tracking-tight text-[15px]">
                  agentdiff
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-[#18181B] hover:bg-[#F4F4F5] rounded-full transition-colors duration-150"
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
                        ? "bg-[#F4F4F5] text-[#18181B]"
                        : "text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                    }`}
                  >
                    {n.label}
                    <ArrowUpRight
                      className={`w-5 h-5 transition-opacity duration-150 ${
                        isActive ? "opacity-100 text-[#18181B]" : "opacity-0 group-hover:opacity-60 text-[#A1A1AA]"
                      }`}
                    />
                  </a>
                );
              })}
            </nav>

            <div className="flex flex-col gap-2.5">
              <Link
                href="/docs"
                onClick={() => setOpen(false)}
                className="text-center text-[15px] font-semibold text-white bg-[#18181B] hover:bg-black px-4 py-3 rounded-full transition-colors duration-150"
              >
                Docs
              </Link>
              <a
                href="https://github.com/lostmartian/agentdiff"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 text-center text-[15px] font-semibold text-white bg-[#18181B] hover:bg-black px-4 py-3 rounded-full transition-colors duration-150"
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