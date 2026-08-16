"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function IntegrationShowcase() {
  const [activeCodeTab, setActiveCodeTab] = useState<"pytest" | "cli">("pytest");
  const [copiedCode, setCopiedCode] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const pytestCode = `import pytest
from agentdiff import load_trace, compare
from agentdiff.testing import assert_no_regressions

def test_agent_refactor_efficiency():
    # load_trace() auto-detects format: generic, deepeval, openinference, langfuse
    baseline  = load_trace("tests/traces/baseline.json")
    candidate = load_trace("tests/traces/candidate.json")

    # Run the DAG-LCS comparison engine
    report = compare(baseline, candidate)

    # Expressive assertions — raises AssertionError with full report on failure
    assert_no_regressions(
        report,
        max_divergence=0.25,        # TDI threshold [0.0 - 1.0]
        max_cost_increase_pct=5.0,  # Max LLM cost increase allowed
        allow_loops=False,           # Fail if tool loops detected
        max_wasted_effort=0.10,     # Max WEI (failed/retry steps ratio)
    )`;

  const cliCode = `# Install via pip or uv
$ pip install agentdiff
$ uv add agentdiff

# Compare two traces in the terminal
$ agentdiff diff baseline.json candidate.json

# CI/CD gate: exit code 1 if thresholds are breached
$ agentdiff diff baseline.json candidate.json \\
    --fail-on-regression \\
    --max-divergence 0.25 \\
    --max-cost-delta 10.0 \\
    --format markdown \\
    --output-file pr_comment.md`;

  return (
    <section id="integration-section" className="py-24 bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Spacious 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left explanation */}
          <div className="lg:col-span-4 flex flex-col justify-between py-2">
            <div>
              <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-4">Developer integration</span>
              
              {/* Drafting Box */}
              <div className="relative p-4 my-2 inline-block mb-6">
                <div className="absolute top-0 left-[-12px] right-[-12px] h-[1px] bg-[#1E2028]/85"></div>
                <div className="absolute bottom-0 left-[-12px] right-[-12px] h-[1px] bg-[#1E2028]/85"></div>
                <div className="absolute left-0 top-[-12px] bottom-[-12px] w-[1px] bg-[#1E2028]/85"></div>
                <div className="absolute right-0 top-[-12px] bottom-[-12px] w-[1px] bg-[#1E2028]/85"></div>

                <h2 className="text-2xl font-bold tracking-tight text-zinc-150">
                  Zero boilerplate DX
                </h2>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed mb-8 font-light">
                AgentDiff exposes a programmatic Python SDK tailored for testing frameworks like `pytest`, alongside a strict CLI runner for automated pipeline integration.
              </p>
            </div>

            {/* Code Snippet Info */}
            <div className="pt-6 border-t border-[#1E2028]/80">
              <div className="text-xs text-zinc-400 font-semibold mb-3 uppercase tracking-wider font-mono">Supported formats</div>
              <div className="flex flex-wrap gap-2">
                <span className="border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-xs px-3 py-1.5 rounded-lg font-mono font-medium">Generic JSON</span>
                <span className="border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-xs px-3 py-1.5 rounded-lg font-mono font-medium">DeepEval</span>
                <span className="border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-xs px-3 py-1.5 rounded-lg font-mono font-medium">OpenInference</span>
                <span className="border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-xs px-3 py-1.5 rounded-lg font-mono font-medium">Langfuse</span>
              </div>
            </div>
          </div>

          {/* Right code panel */}
          <div className="lg:col-span-8 flex flex-col bg-zinc-950/20 rounded-xl overflow-hidden shadow-md border border-zinc-900">
            
            {/* Tab Selector */}
            <div className="border-b border-zinc-900/60 px-5 py-3 flex items-center justify-between text-xs bg-zinc-950/80">
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveCodeTab("pytest")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    activeCodeTab === "pytest" ? "bg-zinc-800 text-zinc-200 shadow-sm border border-zinc-700" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  pytest_test.py
                </button>
                <button 
                  onClick={() => setActiveCodeTab("cli")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    activeCodeTab === "cli" ? "bg-zinc-800 text-zinc-200 shadow-sm border border-zinc-700" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  agentdiff_cli.sh
                </button>
              </div>

              {/* Copy Button */}
              <button 
                onClick={() => copyToClipboard(activeCodeTab === "pytest" ? pytestCode : cliCode)}
                className="p-1.5 text-zinc-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-xs font-semibold">{copiedCode ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Code Field */}
            <div className="p-6 overflow-x-auto text-xs text-zinc-400 font-mono bg-black/40 leading-relaxed h-[340px]">
              <pre>
                <code>{activeCodeTab === "pytest" ? pytestCode : cliCode}</code>
              </pre>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
