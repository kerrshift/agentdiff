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

export default function ProblemSolution() {
  return (
    <section id="problem-section" className="py-20 lg:py-28 bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
        {/* Section Header - left rail */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-(--faint) block mb-4">The problem</span>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-(--fg) leading-tight">
            Agents fail silently. Tests can&apos;t see it.
          </h2>
          <p className="mt-4 text-base text-(--muted) leading-relaxed font-normal">
            Assertions pass because the agent returned an answer. But the <span className="font-medium text-(--fg)">trajectory</span> it took - the tools, the loops, the token spend - drifts underneath.
          </p>
        </div>
        </Reveal>

        <Reveal delay={140}>
        {/* Before / after - chips tell the drift story in one glance on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-(--border) gap-10 md:gap-0">

          {/* Baseline */}
          <div className="flex flex-col md:pr-12">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-(--accent)">
                <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" />
                Baseline
              </span>
              <span className="text-[11px] text-(--faint)">6 steps</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BASELINE.filter((s) => s.name).map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-md bg-(--surface-2) border border-(--border) font-mono text-[12px] text-(--fg) tracking-tight"
                >
                  {s.name}
                </span>
              ))}
            </div>
            <div className="mt-5 flex items-end justify-between border-t border-(--border) pt-4">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-(--faint) mb-1">Tokens</div>
                <div className="text-2xl font-semibold text-(--fg) tracking-tight tabular-nums">1,204</div>
              </div>
              <div className="text-sm font-semibold text-(--accent) tabular-nums">−62.5% cost</div>
            </div>
          </div>

          {/* Candidate - loop steps pop in red */}
          <div className="flex flex-col md:pl-12">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-(--danger)">
                <span className="w-1.5 h-1.5 rounded-full bg-(--danger)" />
                Candidate
              </span>
              <span className="text-[11px] font-semibold text-(--danger)">loop ×3</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CANDIDATE.map((s, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded-md border font-mono text-[12px] tracking-tight ${
                    s.loop
                      ? "bg-(--danger-soft) border-(--danger)/40 text-(--danger) font-semibold"
                      : "bg-(--surface-2) border-(--border) text-(--fg)"
                  }`}
                >
                  {s.name}
                </span>
              ))}
            </div>
            <div className="mt-5 flex items-end justify-between border-t border-(--border) pt-4">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-(--faint) mb-1">Tokens</div>
                <div className="text-2xl font-semibold text-(--fg) tracking-tight tabular-nums">2,986</div>
              </div>
              <div className="text-sm font-semibold text-(--danger) tabular-nums">+148% cost</div>
            </div>
          </div>

        </div>

        {/* The fix - continues the same left rail as the header */}
        <div className="max-w-2xl mt-10 md:mt-14">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-(--faint) block mb-3">The fix</span>
          <h3 className="text-2xl font-semibold text-(--fg) mb-3 leading-snug">
            Catch it in CI, before it ships.
          </h3>
          <p className="text-sm text-(--muted) leading-relaxed font-normal mb-8">
            AgentDiff diffs this run against the golden baseline as a DAG - and turns the drift into a hard gate failure in the PR. The loop, the wasted tokens, the cost spike: explicit, and blocking.
          </p>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-(--faint) mb-2">Baseline</div>
              <div className="text-xl font-semibold text-(--fg) tracking-tight">PASS</div>
              <div className="text-[11px] text-(--accent) mt-1">6 steps · −62.5%</div>
            </div>
            <div className="h-10 w-px bg-(--border)"></div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-(--faint) mb-2">Regression</div>
              <div className="text-xl font-semibold text-(--danger) tracking-tight">FAIL</div>
              <div className="text-[11px] text-(--danger) mt-1">loop ×3 · +148%</div>
            </div>
          </div>
        </div>
        </Reveal>

      </div>
    </section>
  );
}