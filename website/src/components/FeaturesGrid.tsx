import React from "react";
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
          <span className="text-[#A1A1AA] w-16 text-[11px]">baseline</span>
          <span className="w-4 h-4 rounded bg-[#0FA47F]" />
          <span className="w-4 h-4 rounded bg-[#0FA47F]" />
          <span className="w-4 h-4 rounded bg-[#0FA47F]" />
          <span className="w-4 h-4 rounded bg-[#0FA47F]" />
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[#A1A1AA] w-16 text-[11px]">candidate</span>
          <span className="w-4 h-4 rounded bg-[#0FA47F]" />
          <span className="w-4 h-4 rounded bg-[#0FA47F]" />
          <span className="w-4 h-4 rounded bg-[#0FA47F]" />
          <span className="w-4 h-4 rounded bg-[#E5484D] ring-2 ring-[#E5484D]/20" />
        </div>
        <div className="text-[#A1A1AA] text-[11px] mt-2">diverged at step 4</div>
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
    body: "The share of steps spent on failures, retries, and abandoned work - the tokens you pay for and get nothing back from.",
    example: (
      <div>
        <div className="h-2 w-full rounded-full bg-[#E4E4E7] overflow-hidden flex">
          <span className="bg-[#0FA47F]" style={{ width: "78%" }} />
          <span className="bg-[#E5484D]" style={{ width: "22%" }} />
        </div>
        <div className="mt-2.5 font-mono text-[11px] flex items-center justify-between">
          <span className="text-[#A1A1AA]">6 of 7 steps wasted</span>
          <span className="text-[#E5484D] font-semibold">0.22</span>
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
    body: "Flags cyclical tool calling - the same endpoint, same params, no state progress. The classic agent failure that burns through your budget.",
    example: (
      <div className="flex items-center gap-4 font-mono text-[12px]">
        <div className="flex flex-col items-center">
          <span className="rounded-md border border-[#E5484D]/30 bg-[#E5484D]/5 px-2 py-1 text-[#E5484D]">
            execute_sql
          </span>
          <span className="text-[#A1A1AA] text-[11px] py-1">↻ retry</span>
          <span className="rounded-md border border-[#E5484D]/30 bg-[#E5484D]/5 px-2 py-1 text-[#E5484D]">
            sql_error
          </span>
        </div>
        <div className="text-[#A1A1AA] text-[11px] max-w-[120px] leading-snug">
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
    body: "The candidate's cost, token, and latency deltas against baseline - the price of a refactor that quietly calls more tools or burns more tokens.",
    example: (
      <div className="font-mono text-[11px]">
        <div className="flex items-center gap-3">
          <span className="text-[#A1A1AA] w-16">baseline</span>
          <div className="flex-1 h-2.5 rounded-full bg-[#E4E4E7] overflow-hidden">
            <div className="h-full bg-[#0FA47F] w-[40%]" />
          </div>
          <span className="text-[#18181B] w-16 text-right">$0.012</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[#A1A1AA] w-16">candidate</span>
          <div className="flex-1 h-2.5 rounded-full bg-[#E4E4E7] overflow-hidden">
            <div className="h-full bg-[#E5484D] w-[95%]" />
          </div>
          <span className="text-[#E5484D] w-16 text-right font-semibold">$0.030</span>
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
          <span className="text-[#A1A1AA] w-16 text-[11px]">baseline</span>
          <span className="w-4 h-4 rounded bg-[#E5484D]/60" />
          <span className="w-4 h-4 rounded bg-[#0FA47F]" />
          <span className="text-[#A1A1AA] text-[11px] ml-2">1 step back</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[#A1A1AA] w-16 text-[11px]">candidate</span>
          <span className="w-4 h-4 rounded bg-[#E5484D]" />
          <span className="w-4 h-4 rounded bg-[#0FA47F]/40" />
          <span className="w-4 h-4 rounded bg-[#0FA47F]/40" />
          <span className="w-4 h-4 rounded bg-[#0FA47F]" />
          <span className="text-[#E5484D] text-[11px] ml-2 font-semibold">3 steps back</span>
        </div>
        <div className="text-[#A1A1AA] text-[11px] mt-2">recovery got 3× more expensive</div>
      </div>
    ),
    formula: "RSR = recovery(candidate) / recovery(baseline)",
  },
];

export default function FeaturesGrid() {
  return (
    <section id="features-section" className="py-20 lg:py-24 bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
        {/* Section Header - left rail */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA] block mb-4">Capabilities</span>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-[#18181B] leading-tight">
            Five metrics that explain how the agent really ran.
          </h2>
          <p className="mt-4 text-base text-[#52525B] leading-relaxed font-normal">
            Every trace reduces to a few computed indices. Exposed as a JSON report, they become hard gates in CI - no more guessing whether a run drifted.
          </p>
        </div>
        </Reveal>

        <Reveal delay={140}>
        {/* Engine spec grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch">
          {FEATURES.map((f) => (
            <div
              key={f.num}
              className="flex flex-col border border-[#E4E4E7] rounded-2xl bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              {/* Index + label header */}
              <div className="flex items-baseline justify-between mb-5">
                <span className="font-mono text-xs text-[#A1A1AA]">{f.num}</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#A1A1AA]">
                  {f.label}
                </span>
              </div>

              {/* Hero stat - immediate scannability */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-semibold tracking-[-0.02em] text-[#E5484D]">
                  {f.stat}
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-[#E5484D]">
                  {f.statLabel}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-[#18181B] mb-2 leading-snug tracking-[-0.01em]">
                {f.title}
              </h3>

              {/* Body - flexes; absorbs differing prose length */}
              <p className="text-sm text-[#52525B] leading-relaxed font-normal flex-1 mb-6">
                {f.body}
              </p>

              {/* Visualization + formula - pinned to bottom */}
              <div className="mt-auto">
                <div className="border border-[#E4E4E7] rounded-xl bg-[#FAFAFA] p-3.5">
                  {f.example}
                </div>
                <div className="font-mono text-[11px] text-[#A1A1AA] leading-relaxed pt-3">
                  {f.formula}
                </div>
              </div>
            </div>
          ))}
        </div>
        </Reveal>

      </div>
    </section>
  );
}