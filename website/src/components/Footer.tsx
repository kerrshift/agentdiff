import React from "react";

export default function Footer() {
  return (
    <footer id="footer-section" className="border-t border-[#1E2028]/60 bg-transparent py-12 text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-500">
        <div>
          <div className="text-zinc-200 font-semibold mb-1 tracking-wider text-sm">
            agent<span className="text-indigo-400">diff</span>
          </div>
          <div>© {new Date().getFullYear()} AgentDiff. MIT License.</div>
        </div>

        <div className="flex items-center gap-6 font-medium text-[11px]">
          <a href="/docs" className="text-zinc-500 hover:text-zinc-300 transition-colors duration-150">Docs</a>
          <a href="https://github.com/lostmartian/agentdiff" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors duration-150">GitHub</a>
          <a href="https://pypi.org/project/agentdiff" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors duration-150">PyPI</a>
          <span className="text-zinc-700">Trajectory regression engine for AI agents</span>
        </div>
      </div>
    </footer>
  );
}
