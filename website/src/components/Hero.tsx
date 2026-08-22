"use client";

import React from "react";
import TerminalWindow from "./TerminalWindow";
import Reveal from "./Reveal";
import CopyCommand from "./CopyCommand";
import AdapterLogos from "./AdapterLogos";

export default function Hero() {
  return (
    <section
      id="hero-section"
      className="relative overflow-hidden min-h-[calc(100svh-4rem)] flex flex-col justify-center py-12 sm:py-16 lg:py-24 font-sans border-b border-(--border)"
    >
<div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center min-w-0">

        <Reveal animate>
        {/* Eyebrow */}
        <div className="mb-6 md:mb-8">
          <span className="text-xs font-medium uppercase tracking-[0.12em] sm:tracking-[0.18em] text-(--faint)">
            Trajectory regression testing for AI agents
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-[2.125rem] sm:text-6xl xl:text-7xl font-semibold tracking-[-0.035em] text-(--fg) leading-[1.08] sm:leading-[1.04] mx-auto max-w-4xl">
          Static assertions can&apos;t test AI agents.
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-(--muted) leading-relaxed my-6 md:my-8 font-sans font-normal">
          AgentDiff diffs every agent run against a baseline as a DAG - and blocks drift, tool loops, cost spikes, and slow recovery right in CI/CD.
        </p>
        </Reveal>

        <Reveal animate delay={140}>
        {/* CTA + install - one action cluster */}
        <div id="install-section" className="flex flex-col items-center gap-4 scroll-mt-24">
          <CopyCommand />
        </div>

        {/* Adapter logos - easily integrable, generic + adapter-ready */}
        <div className="mt-10 md:mt-14 hidden md:block">
          <AdapterLogos />
        </div>

        {/* Product terminal - the hero's focal visual */}
        <div className="mt-10 md:mt-14 flex flex-col items-center">
          <div className="w-full max-w-2xl">
            <TerminalWindow />
          </div>
          <p className="mt-5 text-[11px] font-mono text-(--faint)">
            Baseline vs candidate · gated on drift, loops & cost
          </p>
        </div>
        </Reveal>

      </div>
    </section>
  );
}