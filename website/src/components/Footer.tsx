"use client";

import React from "react";
import Link from "next/link";
import LogoMark from "./LogoMark";

export default function Footer({ version = "0.5.0" }: { version?: string }) {
  return (
    <footer id="footer-section" className="border-t border-(--border) bg-transparent font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        
        {/* Main Grid: Brand statement + Categorized Link Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 pb-16 border-b border-(--border)">
          
          {/* Brand Info & Core Purpose (Col 1-6) */}
          <div className="md:col-span-6 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950 text-white border border-zinc-800 shadow-2xs group-hover:opacity-90 transition-opacity">
                <LogoMark size={16} />
              </span>
              <span className="font-bold text-(--fg) tracking-tight text-lg">
                agent<span className="text-emerald-500">diff</span>
              </span>
            </Link>

            <p className="text-sm text-(--muted) leading-relaxed max-w-sm font-normal">
              Deterministic regression gate for AI agents. Diff execution graphs, catch silent tool loops, and prevent cost surges before merge.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--surface-2) border border-(--border) text-(--fg) font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>v{version}</span>
              </span>
              <span className="text-(--muted)">·</span>
              <span className="text-(--muted)">MIT Licensed</span>
              <span className="text-(--muted)">·</span>
              <span className="text-(--muted)">Zero Telemetry</span>
            </div>
          </div>

          {/* Nav Links Column 1: Product Pages (Col 7-9) */}
          <div className="md:col-span-3 space-y-4">
            <span className="text-xs uppercase tracking-[0.14em] text-(--faint) block font-semibold">
              Product
            </span>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/quickstart" className="text-(--muted) hover:text-(--fg) transition-colors">
                  Quickstart
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-(--muted) hover:text-(--fg) transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/adapters" className="text-(--muted) hover:text-(--fg) transition-colors">
                  Adapters
                </Link>
              </li>
              <li>
                <Link href="/action" className="text-(--muted) hover:text-(--fg) transition-colors">
                  GitHub Action
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-(--muted) hover:text-(--fg) transition-colors">
                  Compare
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Links Column 2: Documentation & Repos (Col 10-12) */}
          <div className="md:col-span-3 space-y-4">
            <span className="text-xs uppercase tracking-[0.14em] text-(--faint) block font-semibold">
              Resources
            </span>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/docs" className="text-(--muted) hover:text-(--fg) transition-colors">
                  Docs
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-(--muted) hover:text-(--fg) transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/agentdiff/agentdiff"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--muted) hover:text-(--fg) transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://pypi.org/project/agent-trajectory-diff"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--muted) hover:text-(--fg) transition-colors"
                >
                  PyPI Package
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-Bar: Copyright & Terminal Install */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-(--muted)">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} AgentDiff</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-(--faint)">
              <span>pip install agent-trajectory-diff</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}