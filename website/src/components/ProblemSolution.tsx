import React from "react";
import Reveal from "./Reveal";

const BASELINE = [
  { name: "read_schema" },
  { name: "execute_sql" },
  { name: "read_schema" },
  { name: "execute_sql" },
  { name: "synthesize" },
  { name: "write_report" },
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
          {/* Section Header */}
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-4">
              The Testing Dilemma
            </span>
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-(--fg) leading-tight">
              Agents fail silently. Traditional tests can&apos;t see it.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
              Static assertions pass because the LLM generated an acceptable final answer. But the underlying <span className="font-semibold text-(--fg)">execution trajectory</span> — tool selection, redundant retry loops, and token cost — silently degraded.
            </p>
          </div>
        </Reveal>

        <Reveal delay={140}>
          {/* Before / After Trajectory Diff Comparison */}
          <div className="p-8 rounded-3xl bg-(--surface-2)/30 border border-(--border)">
            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-(--border) gap-8 md:gap-0">

              {/* Baseline Path */}
              <div className="flex flex-col md:pr-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Committed Golden Baseline
                  </span>
                  <span className="text-xs font-mono text-(--faint)">6 steps</span>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[4rem] items-start">
                  {BASELINE.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-(--surface) border border-(--border) font-mono text-[12px] text-(--fg) tracking-tight shadow-2xs"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-end justify-between border-t border-(--border) pt-4">
                  <div>
                    <div className="text-[10.5px] font-mono uppercase tracking-widest text-(--faint) mb-1">
                      Token Budget
                    </div>
                    <div className="text-2xl font-semibold text-(--fg) tracking-tight tabular-nums">
                      1,204 tokens
                    </div>
                  </div>
                  <div className="text-xs font-mono font-semibold text-emerald-500 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">
                    Clean Run (PASS)
                  </div>
                </div>
              </div>

              {/* Candidate Path */}
              <div className="flex flex-col md:pl-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-rose-500">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Candidate PR Run
                  </span>
                  <span className="text-xs font-mono font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    loop ×3 detected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[4rem] items-start">
                  {CANDIDATE.map((s, i) => (
                    <span
                      key={i}
                      className={`px-2.5 py-1 rounded-lg border font-mono text-[12px] tracking-tight ${
                        s.loop
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-500 font-semibold"
                          : "bg-(--surface) border-(--border) text-(--fg)"
                      }`}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-end justify-between border-t border-(--border) pt-4">
                  <div>
                    <div className="text-[10.5px] font-mono uppercase tracking-widest text-(--faint) mb-1">
                      Token Budget
                    </div>
                    <div className="text-2xl font-semibold text-rose-500 tracking-tight tabular-nums">
                      2,986 tokens
                    </div>
                  </div>
                  <div className="text-xs font-mono font-semibold text-rose-500 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/25">
                    +148% Cost Surge (FAIL)
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Resolution Callout */}
          <div className="max-w-3xl mt-12">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-3">
              The CI/CD Gate
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold text-(--fg) mb-3 leading-snug">
              Block the regression before code merges.
            </h3>
            <p className="text-sm sm:text-base text-(--muted) leading-relaxed font-normal">
              AgentDiff aligns both execution DAGs in &lt;10ms, isolates the exact stagnant retry cycle, and halts the CI build with <code className="font-mono text-xs text-(--fg) bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">Exit Code 1</code> — keeping broken agent behavior out of production.
            </p>
          </div>
        </Reveal>

      </div>
    </section>
  );
}