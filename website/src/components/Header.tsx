"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    TRACKED_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const linkClass = (id: string) =>
    `text-xs font-medium transition-colors duration-150 relative after:absolute after:left-0 after:-bottom-1.5 after:h-px after:bg-[#18181B] after:origin-left after:transition-transform after:duration-200 ${
      active === id
        ? "text-[#18181B] after:scale-x-100 after:w-full"
        : "text-[#52525B] hover:text-[#18181B] after:scale-x-0 after:w-full hover:after:scale-x-100"
    }`;

  return (
    <header
      className={`sticky top-0 z-40 transition-shadow duration-300 border-b border-[#E4E4E7] bg-[#FBFBFC]/80 backdrop-blur-md ${
        scrolled ? "shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_8px_24px_-16px_rgba(0,0,0,0.18)]" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between font-sans">

        {/* Left branding */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 group cursor-pointer"
            aria-label="Back to top"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#18181B] text-white">
              <LogoMark size={14} />
            </span>
            <span className="font-semibold text-[#18181B] tracking-tight text-base group-hover:opacity-80 transition-opacity duration-150">
              agentdiff
            </span>
            <span className="text-[10px] text-[#A1A1AA] border border-[#E4E4E7] rounded px-1.5 py-0.5">
              v{version}
            </span>
          </button>
        </div>

        {/* Right nav (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className={linkClass(n.id)}>
              {n.label}
            </a>
          ))}
          <Link href="/docs" className="text-xs font-medium text-[#52525B] hover:text-[#18181B] transition-colors duration-150">
            Docs
          </Link>
          <a
            href="https://github.com/lostmartian/agentdiff"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-white bg-[#18181B] hover:bg-black px-3.5 py-1.5 rounded-lg transition-colors duration-150"
          >
            GitHub
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden p-1.5 text-[#18181B] hover:bg-[#F4F4F5] rounded-lg transition-colors duration-150"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[#E4E4E7] bg-[#FBFBFC] px-4 py-3 flex flex-col gap-1">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-[#18181B] py-2.5 px-2 rounded-lg hover:bg-[#F4F4F5] transition-colors duration-150"
            >
              {n.label}
            </a>
          ))}
          <Link
            href="/docs"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-[#18181B] py-2.5 px-2 rounded-lg hover:bg-[#F4F4F5] transition-colors duration-150"
          >
            Docs
          </Link>
          <a
            href="https://github.com/lostmartian/agentdiff"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="text-sm font-semibold text-white bg-[#18181B] hover:bg-black py-2.5 px-2 rounded-lg text-center mt-1 transition-colors duration-150"
          >
            GitHub
          </a>
        </div>
      )}
    </header>
  );
}