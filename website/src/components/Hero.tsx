"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import TerminalWindow from "./TerminalWindow";
import Reveal from "./Reveal";
import CopyCommand from "./CopyCommand";
import AdapterLogos from "./AdapterLogos";

export default function Hero() {
  return (
    <section
      id="hero-section"
      className="relative overflow-hidden min-h-[calc(100svh-4rem)] flex flex-col justify-center py-12 sm:py-16 lg:py-20 font-sans border-b border-(--border)"
    >
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center min-w-0">
        <Reveal animate>
          {/* Eyebrow Tag */}
          <div className="mb-6 md:mb-8">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint)">
              Deterministic Trajectory Regression Engine
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[2.25rem] sm:text-6xl xl:text-7xl font-semibold tracking-[-0.035em] text-(--fg) leading-[1.08] sm:leading-[1.04] mx-auto max-w-4xl">
            Static assertions can&apos;t test AI agents.
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-(--muted) leading-relaxed my-6 md:my-8 font-sans font-normal">
            AgentDiff diffs every agent run against a baseline as a DAG — blocking silent trajectory drift, tool loops, and cost surges in CI/CD before merge.
          </p>

          {/* Dual Action CTAs + Install Pill */}
          <div className="flex flex-col items-center gap-5 mt-8">
            <div className="flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/quickstart"
                className="px-7 py-3.5 rounded-full bg-(--fg) text-(--bg) text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                <span>Get Started in 5 Min</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/features"
                className="px-6 py-3.5 rounded-full border border-(--border) text-(--fg) text-sm font-medium hover:bg-(--surface-2) transition-colors"
              >
                How It Works
              </Link>
            </div>

            {/* Direct Copy Command Pill */}
            <div id="install-section" className="scroll-mt-24 pt-2">
              <CopyCommand />
            </div>
          </div>

          {/* Scannable Micro-Specs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs font-mono text-(--faint)">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-(--fg) font-semibold">Zero LLM calls</span>
            </span>
            <span className="text-(--border-strong)">•</span>
            <span className="text-(--muted)">&lt;10ms execution</span>
            <span className="text-(--border-strong)">•</span>
            <span className="text-(--muted)">Air-gapped &amp; local-first</span>
          </div>
        </Reveal>

        <Reveal animate delay={140}>
          {/* Adapter logos */}
          <div className="mt-12 md:mt-16 hidden md:block">
            <AdapterLogos />
          </div>

          {/* Product terminal visual */}
          <div className="mt-10 md:mt-12 flex flex-col items-center">
            <div className="w-full max-w-2xl">
              <TerminalWindow />
            </div>
            <p className="mt-5 text-[11px] font-mono text-(--faint)">
              Deterministic CLI diffing · Exit Code 0 (PASS) / 1 (FAIL)
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}