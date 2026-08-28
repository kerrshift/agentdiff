import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

const FEATURES = [
  {
    num: "01",
    label: "Divergence",
    stat: "0.42",
    statLabel: "TDI",
    title: "Trajectory divergence",
    body: "Structural execution difference via graph alignment. Catches model upgrades that silently fork the agent onto a divergent tool path.",
    example: (
      <div className="font-mono text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-(--faint) w-16 text-[11px]">baseline</span>
          <span className="w-4 h-4 rounded bg-emerald-400" />
          <span className="w-4 h-4 rounded bg-emerald-400" />
          <span className="w-4 h-4 rounded bg-emerald-400" />
          <span className="w-4 h-4 rounded bg-emerald-400" />
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-(--faint) w-16 text-[11px]">candidate</span>
          <span className="w-4 h-4 rounded bg-emerald-400" />
          <span className="w-4 h-4 rounded bg-emerald-400" />
          <span className="w-4 h-4 rounded bg-emerald-400" />
          <span className="w-4 h-4 rounded bg-rose-500 ring-2 ring-rose-500/20" />
        </div>
        <div className="text-(--faint) text-[11px] mt-2">diverged at step 4</div>
      </div>
    ),
    formula: "TDI = 1 − 2·|LCS(A,B)| / (|A|+|B|)",
  },
  {
    num: "02",
    label: "Wasted effort",
    stat: "0.22",
    statLabel: "WEI",
    title: "Wasted effort index",
    body: "The share of steps spent on failures, retries, and abandoned work — the tokens you pay for and get nothing back from.",
    example: (
      <div>
        <div className="h-2 w-full rounded-full bg-(--border) overflow-hidden flex">
          <span className="bg-emerald-400" style={{ width: "78%" }} />
          <span className="bg-rose-500" style={{ width: "22%" }} />
        </div>
        <div className="mt-2.5 font-mono text-[11px] flex items-center justify-between">
          <span className="text-(--faint)">6 of 7 steps wasted</span>
          <span className="text-rose-500 font-semibold">0.22</span>
        </div>
      </div>
    ),
    formula: "WEI = failed·retry·abandoned / total",
  },
  {
    num: "03",
    label: "Loops",
    stat: "×3",
    statLabel: "loop",
    title: "Loop detection",
    body: "Flags cyclical tool calling — the same endpoint, same params, no state progress. The classic agent failure that burns through your budget.",
    example: (
      <div className="flex items-center gap-4 font-mono text-[12px]">
        <div className="flex flex-col items-center">
          <span className="rounded-md border border-rose-500/30 bg-rose-500/5 px-2 py-1 text-rose-500 font-semibold">
            execute_sql
          </span>
          <span className="text-(--faint) text-[11px] py-1">↻ retry</span>
          <span className="rounded-md border border-rose-500/30 bg-rose-500/5 px-2 py-1 text-rose-500 font-semibold">
            sql_error
          </span>
        </div>
        <div className="text-(--faint) text-[11px] max-w-[120px] leading-snug">
          same endpoint, same params — no state progress
        </div>
      </div>
    ),
    formula: "loops = repeating (tool → result) sequences",
  },
  {
    num: "04",
    label: "Resource deltas",
    stat: "+148%",
    statLabel: "cost",
    title: "Cost, tokens & latency",
    body: "The candidate's cost, token, and latency deltas against baseline — the price of a refactor that quietly calls more tools or burns more tokens.",
    example: (
      <div className="font-mono text-[11px]">
        <div className="flex items-center gap-3">
          <span className="text-(--faint) w-16">baseline</span>
          <div className="flex-1 h-2.5 rounded-full bg-(--border) overflow-hidden">
            <div className="h-full bg-emerald-400 w-[40%]" />
          </div>
          <span className="text-(--fg) w-16 text-right">$0.012</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-(--faint) w-16">candidate</span>
          <div className="flex-1 h-2.5 rounded-full bg-(--border) overflow-hidden">
            <div className="h-full bg-rose-500 w-[95%]" />
          </div>
          <span className="text-rose-500 w-16 text-right font-semibold">$0.030</span>
        </div>
      </div>
    ),
    formula: "Δcost = (candidate − baseline) / baseline × 100",
  },
  {
    num: "05",
    label: "Recovery",
    stat: "2.0×",
    statLabel: "RSR",
    title: "Recovery step ratio",
    body: "How many steps a run spends getting back on track after errors, versus the baseline. Catches agents that fail cheaply but limp back expensively.",
    example: (
      <div className="font-mono text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-(--faint) w-16 text-[11px]">baseline</span>
          <span className="w-4 h-4 rounded bg-rose-500/60" />
          <span className="w-4 h-4 rounded bg-emerald-400" />
          <span className="text-(--faint) text-[11px] ml-2">1 step back</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-(--faint) w-16 text-[11px]">candidate</span>
          <span className="w-4 h-4 rounded bg-rose-500" />
          <span className="w-4 h-4 rounded bg-emerald-400/40" />
          <span className="w-4 h-4 rounded bg-emerald-400/40" />
          <span className="w-4 h-4 rounded bg-emerald-400" />
          <span className="text-rose-500 text-[11px] ml-2 font-semibold">3 steps back</span>
        </div>
        <div className="text-(--faint) text-[11px] mt-2">recovery got 3× more expensive</div>
      </div>
    ),
    formula: "RSR = recovery(candidate) / recovery(baseline)",
  },
];

export default function FeaturesGrid() {
  return (
    <section id="features-section" className="py-20 lg:py-28 bg-transparent font-sans border-t border-(--border)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
          {/* Section Header */}
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-4">
              Regression Metrics
            </span>
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-(--fg) leading-tight">
              Five metrics that explain how the agent really ran.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
              Every trace reduces to deterministic mathematical indices. Evaluated in under 10ms with zero LLM judge latency.
            </p>
          </div>
        </Reveal>

        <Reveal delay={140}>
          {/* Engine spec sheet */}
          <div className="border border-(--border) rounded-2xl bg-(--surface) shadow-[0_1px_2px_rgba(0,0,0,0.04)] divide-y divide-(--border) overflow-hidden">
            {FEATURES.map((f) => (
              <div
                key={f.num}
                className="grid grid-cols-1 lg:grid-cols-[minmax(0,6.5rem)_minmax(0,8.5rem)_minmax(0,1fr)_minmax(0,24rem)] gap-x-10 gap-y-5 px-5 sm:px-6 py-6 lg:py-7 items-center hover:bg-(--surface-2)/40 transition-colors"
              >
                {/* Index + label */}
                <div className="flex lg:flex-col items-baseline lg:items-start justify-between gap-1">
                  <span className="font-mono text-xs text-(--faint)">{f.num}</span>
                  <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-(--faint)">
                    {f.label}
                  </span>
                </div>

                {/* Hero stat */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-[-0.02em] text-rose-500">
                    {f.stat}
                  </span>
                  <span className="text-xs font-mono uppercase tracking-wider text-rose-500">
                    {f.statLabel}
                  </span>
                </div>

                {/* Title + body */}
                <div>
                  <h3 className="text-lg font-semibold text-(--fg) mb-2 leading-snug tracking-[-0.01em]">
                    {f.title}
                  </h3>
                  <p className="text-sm text-(--muted) leading-relaxed font-normal max-w-prose">
                    {f.body}
                  </p>
                </div>

                {/* Visualization + formula */}
                <div>
                  <div className="border border-(--border) rounded-xl bg-(--surface-2) p-3.5">
                    {f.example}
                  </div>
                  <div className="font-mono text-[11px] text-(--faint) leading-relaxed pt-3">
                    {f.formula}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Deep Specification Link Portal */}
          <div className="mt-8 flex items-center justify-between flex-wrap gap-4 pt-2">
            <p className="text-xs font-mono text-(--faint)">
              All metrics computed deterministically via DAG subgraph alignment &amp; LCS.
            </p>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-(--fg) hover:text-emerald-400 transition-colors"
            >
              <span>Explore Engine Architecture &amp; Math Proofs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Reveal>

      </div>
    </section>
  );
}