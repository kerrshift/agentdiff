import React from "react";
import LogoMark from "./LogoMark";

export default function Footer({ version = "0.2.0" }: { version?: string }) {
  return (
    <footer id="footer-section" className="border-t border-[#E4E4E7] bg-transparent pt-16 pb-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top: brand + links */}
        <div className="flex flex-col lg:flex-row justify-between gap-12">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-[#18181B] text-white">
                <LogoMark size={16} />
              </span>
              <span className="font-semibold text-[#18181B] tracking-tight text-lg">agentdiff</span>
            </div>
            <p className="text-sm text-[#52525B] leading-relaxed mt-3 max-w-[16rem]">
              Trajectory regression engine for AI agents.
            </p>
            <div className="flex items-center gap-2 mt-5 font-mono text-[11px] text-[#A1A1AA]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0FA47F]" />
              v{version} · MIT · local-first
            </div>
          </div>

          {/* Link columns */}
          <div className="flex gap-16 lg:gap-24">
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#A1A1AA] mb-1">Product</span>
              <a href="#workspace-section" className="text-sm text-[#52525B] hover:text-[#18181B] transition-colors duration-150 font-medium">Workspace</a>
              <a href="#features-section" className="text-sm text-[#52525B] hover:text-[#18181B] transition-colors duration-150 font-medium">Features</a>
              <a href="#action-section" className="text-sm text-[#52525B] hover:text-[#18181B] transition-colors duration-150 font-medium">Action</a>
              <a href="#integration-section" className="text-sm text-[#52525B] hover:text-[#18181B] transition-colors duration-150 font-medium">Integration</a>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#A1A1AA] mb-1">Resources</span>
              <a href="/docs" className="text-sm text-[#52525B] hover:text-[#18181B] transition-colors duration-150 font-medium">Docs</a>
              <a href="https://github.com/lostmartian/agentdiff/tree/main/cookbooks" target="_blank" rel="noopener noreferrer" className="text-sm text-[#52525B] hover:text-[#18181B] transition-colors duration-150 font-medium">Cookbooks</a>
              <a href="https://github.com/lostmartian/agentdiff" target="_blank" rel="noopener noreferrer" className="text-sm text-[#52525B] hover:text-[#18181B] transition-colors duration-150 font-medium">GitHub</a>
              <a href="https://pypi.org/project/agent-trajectory-diff" target="_blank" rel="noopener noreferrer" className="text-sm text-[#52525B] hover:text-[#18181B] transition-colors duration-150 font-medium">PyPI</a>
            </div>
          </div>
        </div>

        {/* Bottom bar — whitespace separated, no extra rule */}
        <div className="mt-14 flex flex-col md:flex-row items-center justify-between gap-3 text-[#A1A1AA]">
          <span className="text-xs">© {new Date().getFullYear()} AgentDiff</span>
          <span className="text-[11px] font-mono">Python SDK · CLI · GitHub Actions</span>
        </div>

      </div>
    </footer>
  );
}