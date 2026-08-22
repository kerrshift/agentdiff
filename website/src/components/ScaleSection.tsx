"use client";

import React from "react";
import { Layers, Scale, Puzzle } from "lucide-react";
import Reveal from "./Reveal";

const CAPABILITIES = [
  {
    Icon: Layers,
    num: "01",
    label: "Scenario suites",
    title: "Gate every flow, not just one",
    body: "Run a whole family of baseline/candidate comparisons in one call - each flow with its own thresholds. One broken trace fails its scenario, never the suite. Fan out across threads when the suite grows.",
    code: `suite = run_scenarios([
  Scenario("checkout", base, cand),
  Scenario("refunds", base, cand,
    GateThresholds(max_divergence=0.1)),
])
assert suite.passed`,
  },
  {
    Icon: Scale,
    num: "02",
    label: "A/B benchmark mode",
    title: "Which agent runs it leaner?",
    body: "Put two agents head-to-head on the same task - even across frameworks. Deterministic efficiency scoring on steps, wasted effort, tokens, and latency; majority wins with explicit ties.",
    code: `report = run_benchmark([
  BenchmarkCase("lookup",
    agent_a=crewai_run,     # CrewAI
    agent_b=langgraph_run), # LangGraph
])
print(report.to_markdown())`,
  },
  {
    Icon: Puzzle,
    num: "03",
    label: "Bring your own format",
    title: "Proprietary tracer? Register an adapter.",
    body: "A runtime adapter registry with standard Python entry points: third-party packages can ship AgentDiff adapters that auto-detect your format - built-ins always keep priority, so nothing else reclassifies.",
    code: `@register_adapter("acme")
class AcmeAdapter(BaseAdapter):
    @classmethod
    def from_dict(cls, data): ...
    @classmethod
    def detect(cls, data): ...`,
  },
];

export default function ScaleSection() {
  return (
    <section id="scale-section" className="py-20 lg:py-24 bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
        {/* Section header - left rail */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-(--faint) block mb-4">Beyond a single diff</span>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-(--fg) leading-tight">
            Built for real agent programs.
          </h2>
          <p className="mt-4 text-base text-(--muted) leading-relaxed font-normal">
            One diff is never the whole job. Suite-level gating, cross-framework benchmarking, and first-class support for proprietary trace formats ship in the box.
          </p>
        </div>
        </Reveal>

        <Reveal delay={140}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 items-stretch">
          {CAPABILITIES.map(({ Icon, num, label, title, body, code }) => (
            <div
              key={num}
              className="flex flex-col border border-(--border) rounded-2xl bg-(--surface) p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-(--border) bg-(--surface-2) text-(--fg)">
                  <Icon size={17} strokeWidth={1.8} />
                </span>
                <span className="font-mono text-xs text-(--faint)">{num}</span>
              </div>

              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-(--faint)">
                {label}
              </span>
              <h3 className="text-lg font-semibold text-(--fg) mt-1.5 mb-2 leading-snug tracking-[-0.01em]">
                {title}
              </h3>
              <p className="text-sm text-(--muted) leading-relaxed font-normal mb-6">
                {body}
              </p>

              <div className="mt-auto">
                <pre className="border border-(--border) rounded-xl bg-(--surface-2) p-3.5 overflow-x-auto no-scrollbar font-mono text-[11px] leading-relaxed text-(--muted)">
                  {code}
                </pre>
              </div>
            </div>
          ))}
        </div>
        </Reveal>

      </div>
    </section>
  );
}
