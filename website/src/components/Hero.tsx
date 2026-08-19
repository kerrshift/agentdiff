"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import TerminalWindow from "./TerminalWindow";
import Reveal from "./Reveal";
import CopyCommand from "./CopyCommand";
import AdapterLogos from "./AdapterLogos";

export default function Hero() {
  return (
    <section
      id="hero-section"
      className="relative overflow-hidden min-h-[calc(100svh-4rem)] flex flex-col justify-center py-16 lg:py-24 font-sans border-b border-[#E4E4E7]"
    >
<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <Reveal animate>
        {/* Eyebrow */}
        <div className="mb-8">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA]">
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

        <Reveal animate delay={140}>
        {/* CTA + install — one action cluster */}
        <div className="flex flex-col items-center gap-4">
          <a
            href="#workspace-section"
            className="inline-flex items-center gap-2 bg-[#18181B] hover:bg-black text-white font-semibold text-sm py-3 px-7 rounded-lg transition-colors duration-150"
          >
            Explore the workspace
            <ArrowRight className="w-4 h-4" />
          </a>
          <CopyCommand />
        </div>

        {/* Adapter logos — easily integrable, generic + adapter-ready */}
        <div className="mt-14">
          <AdapterLogos />
        </div>

        {/* Product terminal — the hero's focal visual */}
        <div className="mt-14 flex flex-col items-center">
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