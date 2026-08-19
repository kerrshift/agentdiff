"use client";

import React, { useState } from "react";
import { Copy, Check, ArrowUpRight } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Reveal from "./Reveal";

const FORMATS = ["Generic JSON", "OpenInference", "Langfuse", "LangSmith", "OpenAI Agents"];

export default function IntegrationShowcase() {
  const [activeCodeTab, setActiveCodeTab] = useState<"pytest" | "cli" | "config" | "report">("pytest");
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
    # load_trace() auto-detects format: generic, openinference, langfuse, langsmith, openai_agents
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
$ pip install agent-trajectory-diff
$ uv add agent-trajectory-diff

# Compare two traces in the terminal
$ agentdiff baseline.json candidate.json

# CI/CD gate: exit code 1 if thresholds are breached
$ agentdiff baseline.json candidate.json \\
    --fail-on-regression \\
    --max-divergence 0.25 \\
    --max-cost-delta 10.0 \\
    --format markdown \\
    --output-file pr_comment.md

# ...or run the same gate as a one-step GitHub Action
- uses: lostmartian/agentdiff/.github/actions/agentdiff-check@main
  with:
    baseline: baselines/current.json
    candidate: trace.json
    max-divergence: 0.25`;

  const configCode = `# Commit your gates once, next to your traces.
# Explicit CLI flags still win over these defaults.

[adapter]
name = "auto"   # auto, generic, langfuse, langsmith, openai_agents

[cli]
baseline = "baselines/current.json"
max_divergence = 0.3
max_loops = 0
max_cost_delta = 10.0

[assertions]
max_divergence = 0.25
allow_loops = false`;

  const reportCode = `# AgentDiff · Regression Report
> baseline: sql_agent_v1.json · candidate: sql_agent_v2.json

## Status: FAIL

| Metric           | Value    | Threshold |
|------------------|----------|-----------|
| Divergence (TDI) | 0.15     | <= 0.25   |
| Wasted Effort    | 0.57     | <= 0.15   |
| Cost Delta       | +148.2%  | <= 10.0%  |

## Loops detected
- execute_sql -> sql_error (iterations: 3, args identical)

## Recommendation
Block this change: candidate introduces a
tool loop and a 148% cost increase over baseline.`;

  const TABS = [
    { id: "pytest", name: "pytest_test.py" },
    { id: "cli", name: "agentdiff_cli.sh" },
    { id: "config", name: "agentdiff.toml" },
    { id: "report", name: "pr_comment.md" },
  ] as const;

  const activeCode =
    activeCodeTab === "pytest"
      ? pytestCode
      : activeCodeTab === "cli"
      ? cliCode
      : activeCodeTab === "config"
      ? configCode
      : reportCode;
  const activeLanguage =
    activeCodeTab === "report"
      ? "markdown"
      : activeCodeTab === "config"
      ? "ini"
      : activeCodeTab === "cli"
      ? "bash"
      : "python";

  return (
<section id="integration-section" className="py-24 border-t border-[#E4E4E7] bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
        {/* Section Header — left rail */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#A1A1AA] font-medium block mb-4">Developer integration</span>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-[#18181B] leading-tight">
            Zero boilerplate DX.
          </h2>
          <p className="mt-4 text-base text-[#52525B] leading-relaxed font-normal">
            A thin Python SDK for pytest, a strict CLI runner, and a one-step
            GitHub Action — with your gates committed once in <code className="text-[#18181B] font-mono">agentdiff.toml</code>.
          </p>
        </div>
        </Reveal>

        <Reveal delay={140}>
        {/* Formats — mono readout, left rail */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#52525B] mb-10">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#A1A1AA] font-semibold mr-3">Formats</span>
          {FORMATS.map((fmt, i) => (
            <React.Fragment key={fmt}>
              {i > 0 && <span className="text-[#E4E4E7]">·</span>}
              <span>{fmt}</span>
            </React.Fragment>
          ))}
        </div>

        {/* Code panel — clean light surface */}
        <div className="bg-white border border-[#E4E4E7] rounded-xl overflow-hidden">

          {/* Panel header */}
          <div className="border-b border-[#E4E4E7] px-5 py-0 flex items-center justify-between">
            <div className="flex items-center gap-7 -mb-px">
              {TABS.map((tab) => {
                const active = activeCodeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCodeTab(tab.id)}
                    className={`relative text-xs font-semibold py-3.5 transition-colors duration-150 ${
                      active ? "text-[#18181B]" : "text-[#A1A1AA] hover:text-[#18181B]"
                    }`}
                  >
                    {tab.name}
                    <span
                      className={`absolute left-0 bottom-0 h-0.5 bg-[#18181B] transition-all duration-200 ${
                        active ? "w-full" : "w-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => copyToClipboard(activeCode)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#A1A1AA] hover:text-[#18181B] transition-colors duration-150 py-3.5"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-[#0FA47F]" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? "Copied" : "Copy"}
            </button>
          </div>

          {/* Code field */}
          <div className="bg-[#FBFBFC] font-mono leading-relaxed">
            <div className="h-[340px] overflow-auto no-scrollbar">
              {activeCodeTab === "report" ? (
                /* Render the PR report as a real preview, not raw markdown */
                <div className="markdown-content bg-white px-6 py-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportCode}</ReactMarkdown>
                </div>
              ) : (
                <SyntaxHighlighter
                  style={oneLight}
                  language={activeLanguage}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    padding: "1.5rem",
                    fontSize: "0.8rem",
                    lineHeight: "1.7",
                  }}
                  codeTagProps={{ style: { background: "transparent", fontFamily: "inherit" } }}
                >
                  {activeCode}
                </SyntaxHighlighter>
              )}
            </div>
          </div>

        </div>

        {/* Cookbook + models — left rail, hairline top */}
        <div className="mt-10 max-w-2xl flex flex-wrap items-center justify-between gap-4">
          <a
            href="https://github.com/lostmartian/agentdiff/tree/main/cookbooks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#18181B] hover:text-[#52525B] transition-colors duration-150"
          >
            Try the live cookbooks
            <ArrowUpRight className="w-4 h-4" />
          </a>
          <span className="text-[11px] text-[#A1A1AA] font-mono">Gemini · OpenAI Agents · OTel · Langfuse · LangSmith</span>
        </div>
        </Reveal>

      </div>
    </section>
  );
}