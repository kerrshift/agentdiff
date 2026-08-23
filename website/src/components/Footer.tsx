import React from "react";
import Link from "next/link";
import LogoMark from "./LogoMark";

export default function Footer({ version = "0.2.1" }: { version?: string }) {
  return (
    <footer id="footer-section" className="border-t border-(--border) bg-transparent pt-16 pb-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top: brand + links */}
        <div className="flex flex-col lg:flex-row justify-between gap-12">
          {/* Brand */}
          <div className="max-w-xs flex flex-col items-start lg:items-start">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-(--fg) text-(--bg)">
                <LogoMark size={16} />
              </span>
              <span className="font-semibold text-(--fg) tracking-tight text-lg">agentdiff</span>
            </div>
            <p className="text-sm text-(--muted) leading-relaxed mt-3 max-w-[16rem]">
              Trajectory regression engine for AI agents.
            </p>
            <div className="flex items-center gap-2 mt-5 text-[11px] text-(--faint)">
              <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" />
              v{version} · MIT · local-first
            </div>
          </div>

          {/* Link columns */}
          <div className="flex justify-between gap-8 sm:gap-12 lg:gap-24 w-full lg:w-auto">
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-(--faint) mb-1">Product</span>
              <Link href="/#workspace-section" className="text-sm text-(--muted) hover:text-(--fg) transition-colors duration-150 font-medium">Workspace</Link>
              <Link href="/#features-section" className="text-sm text-(--muted) hover:text-(--fg) transition-colors duration-150 font-medium">Features</Link>
              <Link href="/#action-section" className="text-sm text-(--muted) hover:text-(--fg) transition-colors duration-150 font-medium">Action</Link>
              <Link href="/#integration-section" className="text-sm text-(--muted) hover:text-(--fg) transition-colors duration-150 font-medium">Integration</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-(--faint) mb-1">Resources</span>
              <Link href="/docs" className="text-sm text-(--muted) hover:text-(--fg) transition-colors duration-150 font-medium">Docs</Link>
              <Link href="/blog" className="text-sm text-(--muted) hover:text-(--fg) transition-colors duration-150 font-medium">Blog</Link>
              <a href="https://github.com/lostmartian/agentdiff/tree/main/cookbooks" target="_blank" rel="noopener noreferrer" className="text-sm text-(--muted) hover:text-(--fg) transition-colors duration-150 font-medium">Cookbooks</a>
              <a href="https://github.com/lostmartian/agentdiff" target="_blank" rel="noopener noreferrer" className="text-sm text-(--muted) hover:text-(--fg) transition-colors duration-150 font-medium">GitHub</a>
              <a href="https://pypi.org/project/agent-trajectory-diff" target="_blank" rel="noopener noreferrer" className="text-sm text-(--muted) hover:text-(--fg) transition-colors duration-150 font-medium">PyPI</a>
            </div>
          </div>
        </div>

        {/* Bottom bar - whitespace separated, no extra rule */}
        <div className="mt-10 lg:mt-14 flex flex-col sm:flex-row items-center justify-between gap-3 text-(--faint)">
          <span className="text-xs">© {new Date().getFullYear()} AgentDiff</span>
          <span className="text-[11px]">Python SDK · CLI · GitHub Actions</span>
        </div>

      </div>
    </footer>
  );
}