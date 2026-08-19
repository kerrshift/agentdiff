import React from "react";
import Reveal from "./Reveal";

const FEATURES = [
  {
    num: "01",
    label: "Divergence",
    title: "Trajectory divergence",
    body: "Structural execution difference via graph alignment. Catches model upgrades that silently fork the agent onto a divergent tool path.",
    example: (
      <div className="font-mono text-[12.5px]">
        <div className="flex items-center gap-2.5 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0FA47F]" />
          <span className="text-[#A1A1AA] w-16">baseline</span>
          <span className="text-[#18181B]">0.05</span>
          <span className="ml-auto text-[#A1A1AA] text-[11px]">identical</span>
        </div>
        <div className="flex items-center gap-2.5 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
          <span className="text-[#A1A1AA] w-16">candidate</span>
          <span className="text-[#E5484D]">0.42</span>
          <span className="ml-auto text-[#E5484D] text-[11px]">divergent</span>
        </div>
      </div>
    ),
    formula: "TDI = 1 − 2·|LCS(A,B)| / (|A|+|B|)",
  },
  {
    num: "02",
    label: "Wasted effort",
    title: "Wasted effort index",
    body: "The share of steps spent on failures, retries, and abandoned work - the tokens you pay for and get nothing back from.",
    example: (
      <div className="w-full">
        <div className="h-1.5 w-full rounded-full bg-[#E4E4E7] overflow-hidden flex">
          <span className="bg-[#0FA47F]" style={{ width: "78%" }} />
          <span className="bg-[#E5484D]" style={{ width: "22%" }} />
        </div>
        <div className="mt-2.5 font-mono text-[12.5px] flex items-center justify-between">
          <span className="text-[#A1A1AA]">6 of 7 steps wasted</span>
          <span className="text-[#E5484D]">0.22</span>
        </div>
      </div>
    ),
    formula: "WEI = failed·retry·abandoned / total",
  },
  {
    num: "03",
    label: "Loops",
    title: "Loop detection",
    body: "Flags cyclical tool calling - the same endpoint, same params, no state progress. The classic agent failure that burns through your budget.",
    example: (
      <div className="font-mono text-[12.5px] text-[#E5484D] leading-relaxed">
        <div>execute_sql</div>
        <div className="text-[#A1A1AA]">↓</div>
        <div>sql_error</div>
        <div className="text-[#A1A1AA]">↓</div>
        <div>
          execute_sql <span className="font-semibold">×3</span>
        </div>
      </div>
    ),
    formula: "loops = repeating (tool → result) sequences",
  },
  {
    num: "04",
    label: "Resource deltas",
    title: "Cost, tokens & latency",
    body: "The candidate's cost, token, and latency deltas against baseline - the price of a refactor that quietly calls more tools or burns more tokens.",
    example: (
      <div className="font-mono text-[12.5px]">
        <div className="flex items-center gap-2.5 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0FA47F]" />
          <span className="text-[#A1A1AA] w-16">baseline</span>
          <span className="text-[#18181B]">$0.012</span>
          <span className="ml-auto text-[#A1A1AA] text-[11px]">1,204 tok</span>
        </div>
        <div className="flex items-center gap-2.5 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
          <span className="text-[#A1A1AA] w-16">candidate</span>
          <span className="text-[#E5484D]">$0.030</span>
          <span className="ml-auto text-[#E5484D] text-[11px]">+148%</span>
        </div>
      </div>
    ),
    formula: "Δcost = (candidate − baseline) / baseline × 100",
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
            Four metrics that explain how the agent really ran.
          </h2>
          <p className="mt-4 text-base text-[#52525B] leading-relaxed font-normal">
            Every trace reduces to a few computed indices. Exposed as a JSON report, they become hard gates in CI - no more guessing whether a run drifted.
          </p>
        </div>
        </Reveal>

        <Reveal delay={140}>
        {/* Engine spec grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 md:gap-y-14 items-stretch">
          {FEATURES.map((f) => (
            <div key={f.num} className="flex flex-col">
              {/* Index header */}
              <div className="flex items-baseline justify-between mb-6">
                <span className="font-medium text-sm text-[#A1A1AA] tracking-tight">
                  {f.num}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#A1A1AA]">
                  {f.label}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-[#18181B] mb-3 leading-snug tracking-[-0.01em]">
                {f.title}
              </h3>

              {/* Body - flexes; absorbs differing prose length */}
              <p className="text-sm text-[#52525B] leading-relaxed font-normal flex-1 mb-6">
                {f.body}
              </p>

              {/* Example + formula - pinned to bottom */}
              <div className="mt-auto pt-4">
                <div className="mb-3">{f.example}</div>
                <div className="font-mono text-xs text-[#18181B] leading-relaxed pt-3">
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