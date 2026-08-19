"use client";

import React, { useState } from "react";
import { ArrowRight, Copy, Check } from "lucide-react";
import Reveal from "./Reveal";

export default function ClosingCTA() {
  const [copied, setCopied] = useState(false);
  const installCmd = "pip install agent-trajectory-diff";

  const copyInstall = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="get-started-section" className="py-24 border-t border-[#E4E4E7] bg-transparent font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#A1A1AA] font-medium">Get started</span>
          <h2 className="text-3xl lg:text-5xl font-semibold tracking-[-0.03em] text-[#18181B] leading-tight mt-4">
            Run it in your pipeline.
          </h2>
          <p className="max-w-2xl mx-auto text-base text-[#52525B] leading-relaxed mt-4 font-normal">
            Compare any two agent runs, gate on divergence, loops, and cost — and never ship a silent regression again.
          </p>

          <div className="flex flex-col items-center gap-4 mt-10">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-mono text-[#18181B] whitespace-nowrap">
                <span className="text-[#A1A1AA] select-none">$ </span>
                {installCmd}
              </span>
              <button
                onClick={copyInstall}
                className="p-1 text-[#A1A1AA] hover:text-[#18181B] transition-colors duration-150 flex-shrink-0"
                aria-label="Copy install command"
              >
                {copied ? <Check className="w-4 h-4 text-[#0FA47F]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#workspace-section"
                className="flex items-center gap-2 bg-[#18181B] hover:bg-black text-white font-semibold text-sm py-3 px-7 rounded-lg transition-colors duration-150"
              >
                Run a comparison
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/docs"
                className="flex items-center gap-1.5 text-sm font-medium text-[#18181B] hover:text-[#52525B] py-3 transition-colors duration-150"
              >
                Read the docs
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Trust strip — local-first + license, where it reassures before install */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-mono text-[#A1A1AA]">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0FA47F]" />
                Runs 100% locally
              </span>
              <span className="text-[#E4E4E7] select-none">·</span>
              <span>No trace data leaves your machine</span>
              <span className="text-[#E4E4E7] select-none">·</span>
              <span>Open source under MIT</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}