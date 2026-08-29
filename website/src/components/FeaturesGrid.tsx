"use client";

import React from "react";
import Link from "next/link";
import Reveal from "./Reveal";
import { ArrowRight } from "lucide-react";

const CAPABILITIES = [
  {
    num: "01",
    tag: "BUDGET PROTECTION",
    title: "Token & Cost Surge Gating",
    headline: "Never let a prompt refactor double your LLM bill.",
    body: "Enforce strict safety budgets (e.g. max +10% token overhead). If a new prompt variant or model version burns more tokens than your baseline, AgentDiff fails the PR immediately.",
    stat: "+148%",
    statDesc: "Average blocked cost spike",
  },
  {
    num: "02",
    tag: "STAGNATION PREVENTION",
    title: "Infinite Tool Loop Interception",
    headline: "Kill repetitive polling cycles before they reach production.",
    body: "Isolates cyclical execution loops where an agent calls the same endpoint with identical parameters without state progress — stopping runaway recursive loops before merge.",
    stat: "0 Loops",
    statDesc: "Zero-tolerance CI threshold",
  },
  {
    num: "03",
    tag: "RELIABILITY ASSURANCE",
    title: "Silent Model Fork Detection",
    headline: "Know the exact step where a new model diverged.",
    body: "When you upgrade from GPT-4o to o3 or Gemini, AgentDiff mathematically aligns both execution graphs to verify whether the agent followed your golden path or hallucinated an unverified detour.",
    stat: "100%",
    statDesc: "Deterministic graph alignment",
  },
  {
    num: "04",
    tag: "ENGINEERING VELOCITY",
    title: "Sub-10ms Automated CI Runs",
    headline: "Evaluations without third-party judge latency or API fees.",
    body: "Unlike LLM-as-a-judge evaluators that cost $0.05 per test and take 15 seconds, AgentDiff runs air-gapped on raw AST graphs in single-digit milliseconds.",
    stat: "< 5ms",
    statDesc: "Fast enough for pre-commit hooks",
  },
];

export default function FeaturesGrid() {
  return (
    <section id="features-section" className="py-24 sm:py-32 bg-transparent font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal>
          <div className="max-w-4xl mb-16 sm:mb-20">
            <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-4 font-medium">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
              Built for engineering teams shipping <span className="text-emerald-500/90 dark:text-emerald-400">agentic AI to production</span>.
            </h2>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed font-normal max-w-3xl">
              Deterministic gates designed to protect four things: your monthly token budget, user latency, graph consistency, and engineering confidence.
            </p>
          </div>
        </Reveal>

        {/* 4 Clean Architectural Spec Pillars */}
        <Reveal delay={100}>
          <div className="border-t border-(--border)">
            <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Item 01 (Top Left) */}
              <div className="py-10 md:py-12 md:pr-10 space-y-6 flex flex-col justify-between border-b border-(--border) md:border-r">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-(--fg)">
                      {CAPABILITIES[0].num}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-(--fg) bg-(--surface-2) border border-(--border) rounded-full px-3 py-1">
                      {CAPABILITIES[0].tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                      {CAPABILITIES[0].title}
                    </h3>
                    <div className="text-sm font-medium text-(--muted) mt-1">
                      {CAPABILITIES[0].headline}
                    </div>
                  </div>

                  <p className="text-sm text-(--muted) leading-relaxed">
                    {CAPABILITIES[0].body}
                  </p>
                </div>

                <div className="pt-4 border-t border-(--border)/60 flex items-baseline justify-between">
                  <span className="text-xs text-(--muted)">{CAPABILITIES[0].statDesc}</span>
                  <span className="text-lg font-mono font-bold text-(--fg)">{CAPABILITIES[0].stat}</span>
                </div>
              </div>

              {/* Item 02 (Top Right) */}
              <div className="py-10 md:py-12 md:pl-10 space-y-6 flex flex-col justify-between border-b border-(--border)">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-(--fg)">
                      {CAPABILITIES[1].num}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-(--fg) bg-(--surface-2) border border-(--border) rounded-full px-3 py-1">
                      {CAPABILITIES[1].tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                      {CAPABILITIES[1].title}
                    </h3>
                    <div className="text-sm font-medium text-(--muted) mt-1">
                      {CAPABILITIES[1].headline}
                    </div>
                  </div>

                  <p className="text-sm text-(--muted) leading-relaxed">
                    {CAPABILITIES[1].body}
                  </p>
                </div>

                <div className="pt-4 border-t border-(--border)/60 flex items-baseline justify-between">
                  <span className="text-xs text-(--muted)">{CAPABILITIES[1].statDesc}</span>
                  <span className="text-lg font-mono font-bold text-(--fg)">{CAPABILITIES[1].stat}</span>
                </div>
              </div>

              {/* Item 03 (Bottom Left) */}
              <div className="py-10 md:py-12 md:pr-10 space-y-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-(--border)">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-(--fg)">
                      {CAPABILITIES[2].num}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-(--fg) bg-(--surface-2) border border-(--border) rounded-full px-3 py-1">
                      {CAPABILITIES[2].tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                      {CAPABILITIES[2].title}
                    </h3>
                    <div className="text-sm font-medium text-(--muted) mt-1">
                      {CAPABILITIES[2].headline}
                    </div>
                  </div>

                  <p className="text-sm text-(--muted) leading-relaxed">
                    {CAPABILITIES[2].body}
                  </p>
                </div>

                <div className="pt-4 border-t border-(--border)/60 flex items-baseline justify-between">
                  <span className="text-xs text-(--muted)">{CAPABILITIES[2].statDesc}</span>
                  <span className="text-lg font-mono font-bold text-(--fg)">{CAPABILITIES[2].stat}</span>
                </div>
              </div>

              {/* Item 04 (Bottom Right) */}
              <div className="py-10 md:py-12 md:pl-10 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-(--fg)">
                      {CAPABILITIES[3].num}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-(--fg) bg-(--surface-2) border border-(--border) rounded-full px-3 py-1">
                      {CAPABILITIES[3].tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                      {CAPABILITIES[3].title}
                    </h3>
                    <div className="text-sm font-medium text-(--muted) mt-1">
                      {CAPABILITIES[3].headline}
                    </div>
                  </div>

                  <p className="text-sm text-(--muted) leading-relaxed">
                    {CAPABILITIES[3].body}
                  </p>
                </div>

                <div className="pt-4 border-t border-(--border)/60 flex items-baseline justify-between">
                  <span className="text-xs text-(--muted)">{CAPABILITIES[3].statDesc}</span>
                  <span className="text-lg font-mono font-bold text-(--fg)">{CAPABILITIES[3].stat}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Technical Proofs Link */}
          <div className="mt-12 pt-8 border-t border-(--border) flex flex-wrap items-center justify-between gap-4 text-xs">
            <span className="text-(--muted)">
              Want the full mathematical formulas and graph alignment proofs?
            </span>
            <Link
              href="/features"
              className="text-(--fg) font-semibold hover:underline inline-flex items-center gap-1.5"
            >
              <span>Explore Engine Specifications &amp; Math</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Reveal>

      </div>
    </section>
  );
}