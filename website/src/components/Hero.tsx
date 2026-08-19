"use client";

import React, { useState } from "react";
import { ArrowRight, Copy, Check } from "lucide-react";
import TerminalWindow from "./TerminalWindow";
import Reveal from "./Reveal";

export default function Hero() {
  const [copied, setCopied] = useState(false);

  const installCmd = "pip install agent-trajectory-diff";

  const copyInstall = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="hero-section"
      className="relative overflow-hidden min-h-[calc(100svh-4rem)] flex flex-col justify-center py-16 lg:py-24 font-sans border-b border-[#E4E4E7]"
    >
<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <Reveal>
        {/* Eyebrow */}
        <div className="mb-8">
          <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#A1A1AA] font-medium">
            Trajectory regression testing for AI agents
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl xl:text-7xl font-semibold tracking-[-0.035em] text-[#18181B] leading-[1.04] mx-auto max-w-4xl">
          Static assertions can&apos;t test AI agents.
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#52525B] leading-relaxed my-8 font-sans font-normal">
          AgentDiff diffs every agent run against a baseline as a DAG — and blocks drift, tool loops, and cost spikes right in CI/CD.
        </p>
        </Reveal>

        <Reveal delay={140}>
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <a
            href="#workspace-section"
            className="flex items-center gap-2 bg-[#18181B] hover:bg-black text-white font-semibold text-sm py-3 px-7 rounded-lg transition-colors duration-150"
          >
            Explore the workspace
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Install — centered, no-box */}
        <div className="flex flex-col items-center gap-3 mx-auto w-fit pt-7">
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
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] font-mono text-[#A1A1AA]">
            {["Generic JSON", "OpenInference", "Langfuse", "LangSmith", "OpenAI Agents"].map((fmt, i) => (
              <React.Fragment key={fmt}>
                {i > 0 && <span className="text-[#E4E4E7]">·</span>}
                <span>{fmt}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Product terminal — the hero's focal visual */}
        <div className="mt-16 flex flex-col items-center">
          <div className="w-full max-w-2xl">
            <TerminalWindow />
          </div>
          <p className="mt-5 text-[11px] font-mono text-[#A1A1AA]">
            Baseline vs candidate · gated on drift, loops & cost
          </p>
        </div>
        </Reveal>

      </div>
    </section>
  );
}