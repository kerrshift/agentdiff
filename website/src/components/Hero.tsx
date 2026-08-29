"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, DollarSign, Repeat, GitBranch } from "lucide-react";
import TerminalWindow from "./TerminalWindow";
import Reveal from "./Reveal";
import CopyCommand from "./CopyCommand";
import AdapterLogos from "./AdapterLogos";

export default function Hero() {
  return (
    <section
      id="hero-section"
      className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 font-sans border-b border-(--border)"
    >
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center min-w-0">
        <Reveal animate>
          {/* Headline with red strikethrough & subtle highlights */}
          <h1 className="text-3xl sm:text-5xl lg:text-[4.5rem] font-bold tracking-[-0.035em] text-(--fg) leading-[1.08] mx-auto max-w-5xl">
            <span className="line-through decoration-rose-500 decoration-[3px] sm:decoration-[5px] text-(--muted)">Stop</span>{" "}
            silent <span className="text-rose-500/90 dark:text-rose-400">cost spikes</span> and broken{" "}
            <span className="text-amber-500/90 dark:text-amber-400">agent loops</span> before merge.
          </h1>

          {/* Subtitle with expansive width */}
          <p className="max-w-4xl mx-auto text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed mt-5 mb-8 font-normal">
            Your agent returned the right answer, but took 5 extra steps and burned 3× the tokens. AgentDiff catches silent tool loops, cost surges, and execution drift in CI before your PR lands in production.
          </p>

          {/* CTAs + Copy Command */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/quickstart"
              className="px-7 py-3.5 rounded-full bg-(--fg) text-(--bg) text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-xs"
            >
              <span>Try in 5 Minutes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div id="install-section" className="scroll-mt-24">
              <CopyCommand />
            </div>
          </div>
        </Reveal>

        <Reveal animate delay={100}>
          {/* Adapter logos */}
          <div className="mt-12 sm:mt-14 hidden md:block">
            <AdapterLogos />
          </div>

          {/* Product terminal visual */}
          <div className="mt-8 flex flex-col items-center">
            <div className="w-full max-w-4xl">
              <TerminalWindow />
            </div>
            <p className="mt-3.5 text-[11px] font-mono text-(--faint)">
              Automated PR checks · Blocks broken runs before code merges
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}