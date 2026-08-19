import React from "react";
import Reveal from "./Reveal";

const BASELINE = [
  { name: "read_schema" },
  { name: "execute_sql" },
  { name: "read_schema" },
  { name: "execute_sql" },
  { name: "synthesize" },
  { name: "write_report" },
  { name: "" },
];

const CANDIDATE = [
  { name: "read_schema", loop: false },
  { name: "execute_sql", loop: false },
  { name: "execute_sql", loop: true },
  { name: "execute_sql", loop: true },
  { name: "sql_error", loop: true },
  { name: "execute_sql", loop: true },
  { name: "write_report", loop: false },
];

function TraceRow({ idx, name, loop, empty }: { idx: number; name: string; loop?: boolean; empty?: boolean }) {
  if (empty) {
    return <div className="flex items-center py-[9px] rounded-r-lg" aria-hidden="true" />;
  }
  return (
    <div
      className={`flex items-center gap-3 py-[9px] rounded-r-lg ${
        loop ? "-ml-3 pl-3 border-l-2 border-[#E5484D] bg-[#FDF2F2]/60" : ""
      }`}
    >
      <span className="w-6 text-right font-mono text-[11px] text-[#A1A1AA]">{String(idx).padStart(2, "0")}</span>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: loop ? "#E5484D" : "#0FA47F" }} />
      <span className={`font-mono text-[13px] tracking-tight ${loop ? "text-[#E5484D]" : "text-[#18181B]"}`}>
        {name}
      </span>
      {loop && <span className="ml-auto text-[10px] font-medium uppercase tracking-widest text-[#E5484D]">loop</span>}
    </div>
  );
}

export default function ProblemSolution() {
  return (
    <section id="problem-section" className="py-28 bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
        {/* Section Header — left rail */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA] block mb-4">The problem</span>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-[#18181B] leading-tight">
            Agents fail silently. Tests can&apos;t see it.
          </h2>
          <p className="mt-4 text-base text-[#52525B] leading-relaxed font-normal">
            Assertions pass because the agent returned an answer. But the <span className="font-medium text-[#18181B]">trajectory</span> it took — the tools, the loops, the token spend — drifts underneath.
          </p>
        </div>
        </Reveal>

        <Reveal delay={140}>
        {/* Before / after trace — equal-height aligned columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#E4E4E7] items-stretch">

          {/* Baseline */}
          <div className="flex flex-col md:pr-12">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#18181B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0FA47F]" />
                Baseline
              </span>
              <span className="text-[11px] text-[#A1A1AA]">6 steps</span>
            </div>
            <div className="pt-2 flex-1">
              {BASELINE.map((step, i) => (
                <TraceRow key={i} idx={i + 1} name={step.name} empty={!step.name} />
              ))}
            </div>
            <div className="mt-3 pt-5 flex items-end justify-between">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-[#A1A1AA] mb-1">Tokens</div>
                <div className="text-2xl font-semibold text-[#18181B] tracking-tight tabular-nums">1,204</div>
              </div>
              <div className="text-sm font-semibold text-[#0FA47F] tabular-nums">−62.5% cost</div>
            </div>
          </div>

          {/* Candidate */}
          <div className="flex flex-col md:pl-12">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#18181B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
                Candidate
              </span>
              <span className="text-[11px] font-semibold text-[#E5484D]">loop ×3</span>
            </div>
            <div className="pt-2 flex-1">
              {CANDIDATE.map((step, i) => (
                <TraceRow key={i} idx={i + 1} name={step.name} loop={step.loop} />
              ))}
            </div>
            <div className="mt-3 pt-5 flex items-end justify-between">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-[#A1A1AA] mb-1">Tokens</div>
                <div className="text-2xl font-semibold text-[#18181B] tracking-tight tabular-nums">2,986</div>
              </div>
              <div className="text-sm font-semibold text-[#E5484D] tabular-nums">+148% cost</div>
            </div>
          </div>

        </div>

        {/* The fix — continues the same left rail as the header */}
        <div className="max-w-2xl mt-14">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA] block mb-3">The fix</span>
          <h3 className="text-2xl font-semibold text-[#18181B] mb-3 leading-snug">
            Catch it in CI, before it ships.
          </h3>
          <p className="text-sm text-[#52525B] leading-relaxed font-normal mb-8">
            AgentDiff diffs this run against the golden baseline as a DAG — and turns the drift into a hard gate failure in the PR. The loop, the wasted tokens, the cost spike: explicit, and blocking.
          </p>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-[#A1A1AA] mb-2">Baseline</div>
              <div className="text-xl font-semibold text-[#18181B] tracking-tight">PASS</div>
              <div className="text-[11px] text-[#0FA47F] mt-1">6 steps · −62.5%</div>
            </div>
            <div className="h-10 w-px bg-[#E4E4E7]"></div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-[#A1A1AA] mb-2">Regression</div>
              <div className="text-xl font-semibold text-[#E5484D] tracking-tight">FAIL</div>
              <div className="text-[11px] text-[#E5484D] mt-1">loop ×3 · +148%</div>
            </div>
          </div>
        </div>
        </Reveal>

      </div>
    </section>
  );
}