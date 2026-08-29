import React from "react";
import Reveal from "./Reveal";
import { CheckCircle2, XCircle } from "lucide-react";

const BASELINE = [
  { name: "authenticate" },
  { name: "fetch_customer_data" },
  { name: "generate_summary" },
  { name: "send_report" },
];

const CANDIDATE = [
  { name: "authenticate", loop: false },
  { name: "fetch_customer_data", loop: false },
  { name: "fetch_customer_data", loop: true, tag: "loop 1" },
  { name: "fetch_customer_data", loop: true, tag: "loop 2" },
  { name: "fetch_customer_data", loop: true, tag: "loop 3" },
  { name: "generate_summary", loop: false },
  { name: "send_report", loop: false },
];

export default function ProblemSolution() {
  return (
    <section id="problem-section" className="py-24 sm:py-32 bg-transparent font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
          {/* Section Header */}
          <div className="max-w-4xl mb-16 sm:mb-20">
            <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-4 font-medium">
              The Testing Dilemma
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
              Your unit tests are{" "}
              <span className="line-through decoration-[#16a34a] dark:decoration-[#4ade80] decoration-[3px] sm:decoration-[4px] text-[#16a34a] dark:text-[#4ade80]">
                green
              </span>
              .
              <br className="hidden sm:inline" />
              Your agent is <span className="text-rose-500/90 dark:text-rose-400">silently burning money</span>.
            </h2>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed font-normal max-w-3xl">
              Traditional assertions only check if the final output string matched. They are blind to execution drift — missing recursive tool loops, unverified prompt detours, and 3× cost surges before code merges.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          {/* Razor-sharp side-by-side visual comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Card 1: What Unit Tests See */}
            <div className="p-6 sm:p-8 rounded-2xl bg-(--surface) border border-(--border) flex flex-col justify-between space-y-6 shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-(--border)">
                  <span className="text-xs font-medium text-(--fg) flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Standard Assertion (test_agent.py)
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold font-mono">
                    Passed in 0.42s
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-(--surface-2)/60 border border-(--border) font-mono text-xs text-(--muted) space-y-2">
                  <div className="text-(--faint)"># Pytest assertion checks final string output</div>
                  <div className="text-(--fg)">response = customer_agent.run(&quot;account 402&quot;)</div>
                  <div className="text-emerald-500 font-semibold">
                    assert &quot;Total Balance: $4,200&quot; in response.text
                  </div>
                </div>

                <div className="text-xs text-(--muted) leading-relaxed">
                  The final sentence contained the expected balance, so your CI pipeline turned green and approved the merge.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-(--surface-2)/30 border border-(--border) text-xs flex items-center justify-between">
                <span className="text-(--faint)">Assertion Result:</span>
                <span className="text-emerald-500 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  1 passed, 0 warnings
                </span>
              </div>
            </div>

            {/* Card 2: What AgentDiff Sees */}
            <div className="p-6 sm:p-8 rounded-2xl bg-(--surface) border border-(--border) flex flex-col justify-between space-y-6 shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-(--border)">
                  <span className="text-xs font-medium text-(--fg) flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    AgentDiff Trajectory Gate
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold font-mono">
                    Exit Code 1 · Blocked
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-(--surface-2)/60 border border-(--border) font-mono text-xs text-(--muted) space-y-1.5">
                  <div className="text-(--faint)"># Graph alignment detected 3 redundant retry cycles</div>
                  <div className="text-(--fg)">01 authenticate <span className="text-(--faint)">· 42ms</span></div>
                  <div className="text-(--fg)">02 fetch_customer_data <span className="text-(--faint)">· 180ms</span></div>
                  <div className="text-rose-500 font-semibold bg-rose-500/10 px-2 py-0.5 rounded -mx-1">
                    ↻ loop detected: fetch_customer_data ×3 (+148% tokens)
                  </div>
                  <div className="text-(--fg)">03 generate_summary <span className="text-(--faint)">· 520ms</span></div>
                </div>

                <div className="text-xs text-(--muted) leading-relaxed">
                  AgentDiff caught the hidden 3× loop in 5ms, halting the PR before the cost spike reached production.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-(--surface-2)/30 border border-(--border) text-xs flex items-center justify-between">
                <span className="text-(--faint)">Gate Verdict:</span>
                <span className="text-rose-500 font-semibold">
                  Blocked (TDI 0.428 · Limit 0.250)
                </span>
              </div>
            </div>

          </div>

          {/* Value Pitch */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-2xl border border-(--border) bg-(--surface) shadow-2xs space-y-2">
              <div className="text-xs uppercase tracking-wider text-(--faint) font-medium">
                01 · The Problem
              </div>
              <h3 className="text-base font-semibold text-(--fg)">
                Final output looks fine
              </h3>
              <p className="text-xs text-(--muted) leading-relaxed">
                The agent still delivered the expected summary, so standard assertion tests pass easily in CI.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-(--border) bg-(--surface) shadow-2xs space-y-2">
              <div className="text-xs uppercase tracking-wider text-(--faint) font-medium">
                02 · The Hidden Bug
              </div>
              <h3 className="text-base font-semibold text-(--fg)">
                3× redundant API calls
              </h3>
              <p className="text-xs text-(--muted) leading-relaxed">
                Behind the scenes, a prompt tweak caused the agent to loop 3 times over the customer database.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-(--border) bg-(--surface) shadow-2xs space-y-2">
              <div className="text-xs uppercase tracking-wider text-emerald-500 font-medium">
                03 · The AgentDiff Gate
              </div>
              <h3 className="text-base font-semibold text-(--fg)">
                Instant merge block
              </h3>
              <p className="text-xs text-(--muted) leading-relaxed">
                AgentDiff detects the step surge in milliseconds and fails the PR before it ever costs you real money.
              </p>
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}