"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Terminal, Copy, PlugZap, ShieldCheck, Zap, Layers, RefreshCw, Cpu } from "lucide-react";
import { OpenAI, Langfuse, LangSmith, LangGraph, CrewAI } from "@lobehub/icons";
import OpenTelemetry from "./OpenTelemetry";
import Reveal from "./Reveal";

const ADAPTERS = [
  {
    id: "langgraph",
    name: "LangGraph",
    icon: LangGraph,
    badge: "State Checkpoint DAGs",
    tagline: "StateGraph & Cyclical Subgraphs",
    command: "agentdiff golden.json pr_run.json --adapter langgraph",
    codeDiff: `# Ingest native LangGraph Checkpoints with zero instrumentation
from agentdiff import load_trace, compare

baseline  = load_trace("runs/langgraph_golden.json")
candidate = load_trace("runs/langgraph_pr.json")

# Compare execution paths across cycles & tool nodes
report = compare(baseline, candidate)
assert report.stagnant_loops == 0`,
  },
  {
    id: "crewai",
    name: "CrewAI",
    icon: CrewAI,
    badge: "Multi-Agent Handoffs",
    tagline: "Delegation & Agent Hierarchy",
    command: "agentdiff crew_base.json crew_pr.json --adapter crewai",
    codeDiff: `# Track multi-agent thought delegation chains
from agentdiff import load_trace, compare

baseline  = load_trace("runs/crew_base.json")
candidate = load_trace("runs/crew_candidate.json")

# Catch agent-to-agent task bouncing and loop stagnation
report = compare(baseline, candidate)
assert report.tdi <= 0.20, "Agent delegation hierarchy drifted"`,
  },
  {
    id: "openai",
    name: "OpenAI Agents",
    icon: OpenAI,
    badge: "Tool Call Arrays",
    tagline: "Function Calls & Turns",
    command: "agentdiff openai_base.json openai_pr.json --adapter openai",
    codeDiff: `# Turn raw chat completion tool_calls into verifiable DAGs
from agentdiff import load_trace, compare

baseline  = load_trace("runs/openai_golden.json")
candidate = load_trace("runs/openai_candidate.json")

# Evaluate prompt turn drift and token budget increases
report = compare(baseline, candidate)
print(f"Token Delta: {report.token_delta_pct:+.1f}%")`,
  },
  {
    id: "otel",
    name: "OpenTelemetry",
    icon: OpenTelemetry,
    badge: "Industry Standard",
    tagline: "GenAI Semantic Spans",
    command: "agentdiff spans_prod.json spans_pr.json --adapter otel",
    codeDiff: `# Direct ingestion from OpenInference and standard OTel spans
from agentdiff import load_trace, compare

baseline  = load_trace("telemetry/otel_base.json")
candidate = load_trace("telemetry/otel_pr.json")

# No proprietary collector proxies required
report = compare(baseline, candidate)
report.render_terminal_table()`,
  },
  {
    id: "langfuse",
    name: "Langfuse",
    icon: Langfuse,
    badge: "Production Traces",
    tagline: "Production to CI Test Fixture",
    command: "agentdiff lf_prod.json lf_pr.json --adapter langfuse",
    codeDiff: `# Convert production trace dumps directly into CI regression baselines
from agentdiff import load_trace, compare

baseline  = load_trace("dumps/langfuse_prod.json")
candidate = load_trace("dumps/langfuse_pr.json")

report = compare(baseline, candidate)
assert report.passed, "Regressed against committed production baseline"`,
  },
  {
    id: "langsmith",
    name: "LangSmith",
    icon: LangSmith,
    badge: "Run Tree Hierarchy",
    tagline: "Nested Runnable Chains",
    command: "agentdiff ls_base.json ls_pr.json --adapter langsmith",
    codeDiff: `# Ingest complex Runnable hierarchies in sub-5ms CI gates
from agentdiff import load_trace, compare

baseline  = load_trace("runs/langsmith_base.json")
candidate = load_trace("runs/langsmith_pr.json")

report = compare(baseline, candidate)
assert report.token_delta_pct <= 10.0`,
  },
];

export default function IntegrationShowcase() {
  const [activeAdapterId, setActiveAdapterId] = useState("langgraph");
  const [copiedCmd, setCopiedCmd] = useState(false);

  const activeAdapter = ADAPTERS.find((a) => a.id === activeAdapterId) || ADAPTERS[0];
  const ActiveIcon = activeAdapter.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeAdapter.command);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <section id="integration-section" className="py-24 sm:py-32 bg-transparent font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal>
          <div className="max-w-4xl mb-16 sm:mb-20">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-4">
              Universal Ecosystem Ingestion
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
              Works with your existing agent stack. <span className="text-emerald-500/90 dark:text-emerald-400">Zero code rewrite</span>.
            </h2>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed font-normal max-w-3xl">
              You shouldn’t have to re-architect your codebase to protect your agents. AgentDiff connects directly to your existing telemetry formats and framework runtimes.
            </p>
          </div>
        </Reveal>

        {/* Dynamic Studio Split Layout */}
        <Reveal delay={100}>
          <div className="border border-(--border) rounded-2xl bg-(--surface) overflow-hidden shadow-sm">
            
            {/* Top Interactive Framework Bar */}
            <div className="p-4 sm:p-6 border-b border-(--border) bg-(--surface-2)/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {ADAPTERS.map((item) => {
                const Icon = item.icon;
                const isSelected = item.id === activeAdapterId;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveAdapterId(item.id)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-2.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-(--bg) text-(--fg) border-(--border-strong) font-semibold shadow-2xs"
                        : "bg-transparent text-(--muted) border-transparent hover:border-(--border) hover:text-(--fg)"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Split Content: Left Engine Spec / Right Live Code & Terminal */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
              
              {/* Left Column: Framework Value Breakdown */}
              <div className="lg:col-span-5 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-(--surface-2) border border-(--border) flex items-center justify-center text-(--fg)">
                      <ActiveIcon size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-(--fg) tracking-tight">
                        {activeAdapter.name}
                      </h3>
                      <span className="text-xs text-(--faint) uppercase tracking-wider font-medium">
                        {activeAdapter.badge}
                      </span>
                    </div>
                  </div>

                  <div className="text-base font-semibold text-(--fg) pt-2">
                    {activeAdapter.tagline}
                  </div>

                  <p className="text-xs sm:text-sm text-(--muted) leading-relaxed">
                    Ingest native JSON trace dumps from {activeAdapter.name} directly into AgentDiff&apos;s deterministic regression engine. Sub-5ms parsing speed, zero telemetry lock-in, and full DAG verification.
                  </p>

                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center gap-2 text-(--muted)">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Zero custom SDK or decorator changes</span>
                    </div>
                    <div className="flex items-center gap-2 text-(--muted)">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Deterministic sub-5ms graph alignment</span>
                    </div>
                    <div className="flex items-center gap-2 text-(--muted)">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Runs locally and in GitHub Actions</span>
                    </div>
                  </div>
                </div>

                {/* One-click CLI command */}
                <div className="pt-6 border-t border-(--border) space-y-2">
                  <span className="text-xs uppercase tracking-wider text-(--faint) block font-medium">
                    Instant CLI Diff Command
                  </span>
                  <div className="p-3 rounded-xl bg-(--bg) border border-(--border) flex items-center justify-between gap-3 font-mono text-xs text-(--fg)">
                    <div className="flex items-center gap-2 overflow-x-auto truncate">
                      <Terminal className="w-3.5 h-3.5 text-(--faint) shrink-0" />
                      <span className="truncate">{activeAdapter.command}</span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="p-1 rounded hover:bg-(--surface-2) text-(--muted) hover:text-(--fg) shrink-0 transition-colors"
                      title="Copy command"
                    >
                      {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: High-contrast Code Inspection Window */}
              <div className="lg:col-span-7 p-6 sm:p-8 bg-(--bg) flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-(--border) text-xs">
                    <span className="text-xs text-(--muted) font-medium">
                      test_{activeAdapter.id}_regression.py
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold uppercase">
                      Pure Python SDK
                    </span>
                  </div>

                  <pre className="font-mono text-xs text-(--fg)/90 leading-[1.7] overflow-x-auto p-2">
                    {activeAdapter.codeDiff}
                  </pre>
                </div>

                <div className="mt-8 pt-4 border-t border-(--border) flex items-center justify-between text-xs text-(--muted)">
                  <span>Auto-detects format from JSON payload</span>
                  <Link
                    href="/adapters"
                    className="font-semibold text-(--fg) hover:underline inline-flex items-center gap-1"
                  >
                    <span>View all adapters</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </Reveal>

      </div>
    </section>
  );
}