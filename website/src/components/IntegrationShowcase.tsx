"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Copy, Check, ExternalLink } from "lucide-react";
import { OpenAI, Langfuse, LangSmith, LangGraph, CrewAI } from "@lobehub/icons";
import OpenTelemetry from "./OpenTelemetry";
import Reveal from "./Reveal";
import CodeBlock from "./CodeBlock";

const ADAPTER_BADGES = [
  { name: "LangGraph", icon: LangGraph, desc: "State Checkpoint DAGs" },
  { name: "OpenAI Agents", icon: OpenAI, desc: "Run Trees & Function Calls" },
  { name: "CrewAI", icon: CrewAI, desc: "Multi-Agent Delegation" },
  { name: "OpenTelemetry", icon: OpenTelemetry, desc: "Standard GenAI Spans" },
  { name: "Langfuse", icon: Langfuse, desc: "Trace Ingestion JSON" },
  { name: "LangSmith", icon: LangSmith, desc: "Run Trees & Tool Spans" },
];

const CODE_TABS = [
  {
    id: "pytest",
    label: "pytest_test.py",
    lang: "python",
    code: `import pytest
from agentdiff import load_trace, compare
from agentdiff.testing import assert_no_regressions

def test_agent_refactor_efficiency():
    # load_trace() auto-detects: langgraph, openai_agents, crewai, otel, langfuse, langsmith
    baseline  = load_trace("tests/traces/golden_baseline.json")
    candidate = load_trace("tests/traces/candidate_run.json")

    # Run sub-10ms DAG graph alignment
    report = compare(baseline, candidate)

    # Expressive assertion - fails test with full CLI diagnostic diff
    assert_no_regressions(
        report,
        max_divergence=0.25,        # TDI threshold [0.0 - 1.0]
        max_cost_increase_pct=5.0,  # Max allowable cost delta
        allow_loops=False           # Strict loop prohibition
    )`,
  },
  {
    id: "cli",
    label: "agentdiff_cli.sh",
    lang: "bash",
    code: `# Install CLI & SDK via pip or uv
pip install agent-trajectory-diff

# Record a golden baseline trace once
agentdiff record my_agent_module:run --output baseline.json

# Diff candidate against baseline with tree explanation
agentdiff baseline.json candidate.json --explain --tree

# Exit code 1 regression gate for CI
agentdiff baseline.json candidate.json --fail-on-regression --max-divergence 0.25`,
  },
  {
    id: "config",
    label: "agentdiff.toml",
    lang: "toml",
    code: `# Commit regression thresholds once in your repository root
[adapter]
name = "auto"   # auto, langgraph, openai_agents, crewai, otel, langfuse, langsmith

[assertions]
max_divergence = 0.25
max_cost_increase_pct = 5.0
allow_loops = false
max_wasted_effort = 0.10
max_recovery_step_ratio = 1.5`,
  },
];

export default function IntegrationShowcase() {
  const [activeTab, setActiveTab] = useState("pytest");
  const activeSnippet = CODE_TABS.find((t) => t.id === activeTab) || CODE_TABS[0];

  return (
    <section id="integration-section" className="py-20 lg:py-28 bg-transparent font-sans border-t border-(--border)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          {/* Section Header */}
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-4">
              Universal Ecosystem Ingestion
            </span>
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-(--fg) leading-tight">
              Bring your own telemetry. We normalize the rest.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
              AgentDiff connects to your existing agent stack with zero SDK locks. Ingest trace trees directly from any major runtime or exporter into normalized DAGs.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          {/* Ecosystem Grid Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
            {ADAPTER_BADGES.map((b) => {
              const Icon = b.icon;
              return (
                <Link
                  key={b.name}
                  href="/adapters"
                  className="p-4 rounded-2xl bg-(--surface) border border-(--border) hover:border-(--border-strong) hover:bg-(--surface-2) transition-all flex flex-col items-start justify-between min-h-[5.5rem] group"
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon size={20} className="text-(--fg)" />
                    <ArrowRight className="w-3.5 h-3.5 text-(--faint) group-hover:text-(--fg) group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="mt-3">
                    <span className="block text-xs font-semibold text-(--fg)">{b.name}</span>
                    <span className="block text-[10px] font-mono text-(--faint)">{b.desc}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={140}>
          {/* Developer Integration Code Blocks */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-(--border) pb-2">
              {CODE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-(--surface-2) font-semibold text-(--fg) border border-(--border)"
                      : "text-(--muted) hover:text-(--fg)"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <CodeBlock
              language={activeSnippet.lang}
              filename={activeSnippet.label}
              code={activeSnippet.code}
            />
          </div>

          {/* Direct Portal Link */}
          <div className="mt-8 flex items-center justify-between flex-wrap gap-4 pt-2">
            <p className="text-xs font-mono text-(--faint)">
              All adapters operate client-side in under 1.8ms with zero network requests.
            </p>
            <Link
              href="/adapters"
              className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-(--fg) hover:text-emerald-400 transition-colors"
            >
              <span>Explore All 6 Adapters &amp; Custom Protocol Docs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}