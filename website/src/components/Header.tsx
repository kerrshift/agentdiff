"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Github } from "@lobehub/icons";
import LogoMark from "./LogoMark";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/quickstart", label: "Quickstart" },
  { href: "/features", label: "Features" },
  { href: "/adapters", label: "Adapters" },
  { href: "/action", label: "GitHub Action" },
  { href: "/compare", label: "Compare" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
];

export default function Header({ version = "0.2.1" }: { version?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock page scroll while the mobile overlay is open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Find active page for mobile breadcrumb display
  const currentItem = NAV_ITEMS.find((item) => isActive(item.href));

  const mobileDrawer = mounted && open
    ? createPortal(
        <div
          className="fixed inset-0 lg:hidden flex justify-end"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
        >
          {/* Dimmed Backdrop Overlay (Click to close) */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in Drawer Panel from Right (Menu Options Only) */}
          <div className="relative w-72 max-w-[80vw] h-full bg-(--surface) border-l border-(--border) shadow-2xl flex flex-col justify-between p-6 z-10 overflow-y-auto">
            {/* Header: Title & Close Button */}
            <div className="flex items-center justify-between pb-4 border-b border-(--border)">
              <span className="text-xs uppercase tracking-wider font-semibold text-(--muted)">
                Navigation
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-(--muted) hover:text-(--fg) hover:bg-(--surface-2) rounded-lg transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Options */}
            <nav className="flex flex-col gap-1 py-4 my-auto">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
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

            {/* Bottom Utilities */}
            <div className="pt-4 border-t border-(--border) flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-xs text-(--muted) font-medium">Theme</span>
              </div>
              <a
                href="https://github.com/lostmartian/agentdiff"
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
    <>
      <header className="sticky top-0 z-40 font-sans border-b border-(--border) bg-(--bg)/85 backdrop-blur-md transition-colors">
        {/* Full-width container perfectly aligned with content max-w-6xl */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            {/* Branding + Mobile Current Page Breadcrumb */}
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
              {currentItem && (
                <div className="flex items-center gap-1.5 lg:hidden text-xs font-semibold text-(--muted)">
                  <span className="text-(--border-strong)">/</span>
                  <span className="text-(--fg) font-bold">{currentItem.label}</span>
                </div>
              )}
            </div>

            {/* Center/Right cluster: page navigation links */}
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

            {/* Right Action Utilities: Theme + GitHub */}
            <div className="hidden lg:flex items-center gap-2">
              <ThemeToggle />
              <a
                href="https://github.com/lostmartian/agentdiff"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-(--muted) border border-(--border) bg-(--surface) hover:text-(--fg) hover:border-(--border-strong) transition-colors duration-150 shadow-2xs"
                aria-label="GitHub"
              >
                <Github size={15} />
              </a>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen((o) => !o)}
              className="lg:hidden p-2 -mr-1 text-(--fg) hover:bg-(--surface-2) rounded-xl transition-colors duration-150 cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>
      {mobileDrawer}
    </>
  );
}
