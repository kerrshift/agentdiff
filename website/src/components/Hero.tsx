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
      className="relative overflow-hidden min-h-[calc(100svh-4rem)] flex flex-col justify-center py-12 sm:py-16 lg:py-24 font-sans border-b border-[#E4E4E7]"
    >
<div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center min-w-0">

        {/* Product Hunt - featured trust marker above the pitch */}
        <Reveal animate>
        <div className="flex justify-center mb-6 md:mb-8">
          <a
            href="https://www.producthunt.com/products/agentdiff-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-agentdiff-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              alt="AgentDiff - Trajectory regression testing for AI agents | Product Hunt"
              width="250"
              height="54"
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1226602&theme=orange&t=1787248084110"
              className="h-9 sm:h-12 w-auto"
            />
          </a>
        </div>
        </Reveal>

        <Reveal animate>
        {/* Eyebrow */}
        <div className="mb-6 md:mb-8">
          <span className="text-xs font-medium uppercase tracking-[0.12em] sm:tracking-[0.18em] text-[#A1A1AA]">
            Trajectory regression testing for AI agents
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-[2.125rem] sm:text-6xl xl:text-7xl font-semibold tracking-[-0.035em] text-[#18181B] leading-[1.08] sm:leading-[1.04] mx-auto max-w-4xl">
          Static assertions can&apos;t test AI agents.
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#52525B] leading-relaxed my-6 md:my-8 font-sans font-normal">
          AgentDiff diffs every agent run against a baseline as a DAG - and blocks drift, tool loops, and cost spikes right in CI/CD.
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
          <p className="mt-5 text-[11px] font-mono text-[#A1A1AA]">
            Baseline vs candidate · gated on drift, loops & cost
          </p>
        </div>
        </Reveal>

      </div>
    </section>
  );
}