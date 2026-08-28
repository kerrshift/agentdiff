"use client";

import React, { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowRight, ExternalLink, GitPullRequest, ShieldCheck, ShieldAlert, Check } from "lucide-react";
import Reveal from "./Reveal";

const FAILED = `## AgentDiff - Trajectory Regression Check

**Status:** ⛔ **FAILED** (Exit Code 1)

| Gate | Value | Threshold | Verdict |
| :--- | :--- | :--- | :--- |
| TDI Divergence | \`0.4285\` | ≤ \`0.25\` | ❌ BREACH |
| Stagnant Loops | \`1\` | ≤ \`0\` | ❌ BREACH |
| Cost Delta | \`+148.2%\` | ≤ \`10.0%\` | ❌ BREACH |

### Root cause

> **Culprit:** \`search_database\` \`[loop]\` — entered a cyclical tool execution loop repeating 3 times without state progress.

### Divergence tree

\`\`\`text
baseline [6 steps] vs candidate [7 steps]
     1 · read_schema
     2 · execute_sql
     3 + search_database   (loop repetition 1)
     4 + search_database   (loop repetition 2)
     5 + search_database   (loop repetition 3)
     6 · synthesize
     7 · write_report
\`\`\`

### Governance Check
- \`agentdiff.toml\` matches origin/main. Thresholds unmodified.`;

const PASSED = `## AgentDiff - Trajectory Regression Check

**Status:** ✅ **PASSED** (Exit Code 0)

| Gate | Value | Threshold | Verdict |
| :--- | :--- | :--- | :--- |
| TDI Divergence | \`0.0000\` | ≤ \`0.25\` | ✅ PASS |
| Stagnant Loops | \`0\` | ≤ \`0\` | ✅ PASS |
| Cost Delta | \`+2.1%\` | ≤ \`10.0%\` | ✅ PASS |

### Root cause

> **Verdict:** Execution trajectory fully aligned with committed baseline. No loops or anomalies detected.

### Divergence tree

\`\`\`text
baseline [6 steps] vs candidate [6 steps]
     1 · read_schema
     2 · execute_sql
     3 · read_schema
     4 · execute_sql
     5 · synthesize
     6 · write_report
\`\`\`

### Governance Check
- \`agentdiff.toml\` verified against origin/main.`;

const PRS = [
  {
    id: "blocked",
    pr: "PR #2 · fix/prompt-regression",
    label: "Regressed Run",
    badge: "⛔ BLOCKED",
    statusText: "Merge Blocked (Exit Code 1)",
    color: "text-rose-500",
    dot: "bg-rose-500",
    comment: FAILED,
    note: "The candidate PR introduced a cyclical tool loop on search_database. AgentDiff halts the CI pipeline with Exit Code 1 and posts this complete diagnostic comment.",
  },
  {
    id: "pass",
    pr: "PR #3 · feat/order-flow",
    label: "Clean Run",
    badge: "✅ PASSED",
    statusText: "Clean Run (Exit Code 0)",
    color: "text-emerald-500",
    dot: "bg-emerald-400",
    comment: PASSED,
    note: "The candidate PR execution graph matches the committed baseline within accepted tolerances. Green checkmark is posted automatically to GitHub.",
  },
] as const;

export default function PRCommentShowcase() {
  const [active, setActive] = useState<"blocked" | "pass">("blocked");
  const current = PRS.find((p) => p.id === active)!;

  return (
    <section id="ci-in-action-section" className="py-20 lg:py-28 bg-transparent font-sans border-t border-(--border)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-4">
              Automated CI/CD Feedback
            </span>
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-(--fg) leading-tight">
              The report lands directly on your Pull Request.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
              Zero dashboard hunting. The <code className="text-(--fg) font-mono text-xs bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">agentdiff-check</code> GitHub Action evaluates the candidate run, blocks the merge on violations, and posts full root-cause diagnostics to the PR review timeline.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          {/* PR Scenario Switcher */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {PRS.map((p) => {
              const activeBtn = active === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  className={`inline-flex items-center gap-2 text-xs font-mono font-semibold px-4 py-2.5 rounded-xl border transition-colors duration-150 ${
                    activeBtn
                      ? "border-(--fg) bg-(--fg) text-(--bg)"
                      : "border-(--border) bg-(--surface) text-(--muted) hover:border-(--fg) hover:text-(--fg)"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                  <span>{p.pr}</span>
                  <span className="opacity-75">({p.label})</span>
                </button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-12 gap-10 items-start">
            {/* PR Comment Card (7 cols) */}
            <div className="lg:col-span-7 min-w-0 bg-(--surface) border border-(--border) rounded-2xl overflow-hidden shadow-xs">
              <div className="border-b border-(--border) px-5 py-3.5 flex items-center justify-between bg-(--surface-2)/60">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-(--fg) text-(--bg) flex items-center justify-center text-xs font-mono font-bold">
                    AD
                  </span>
                  <div className="text-left leading-tight">
                    <span className="block text-xs font-semibold text-(--fg)">AgentDiff bot</span>
                    <span className="block text-[11px] font-mono text-(--faint)">
                      automated review on {current.pr.split("·")[0]}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-(--surface) border border-(--border) ${current.color}`}>
                  {current.badge}
                </span>
              </div>

              <div className="p-6 overflow-x-auto text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{current.comment}</ReactMarkdown>
              </div>
            </div>

            {/* Annotation & Action Rail (5 cols) */}
            <div className="lg:col-span-5 min-w-0 space-y-6">
              <div className="p-7 rounded-3xl bg-(--surface-2)/30 border border-(--border) space-y-4">
                <h3 className="text-lg font-semibold text-(--fg)">
                  Deterministic PR Gate Architecture
                </h3>
                <p className="text-sm text-(--muted) leading-relaxed">
                  {current.note}
                </p>
                <div className="space-y-3 pt-2 text-xs font-mono text-(--muted)">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>100% Reproducible Verdict</strong> — Exit code 0 or 1.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Isolates Culprit Step</strong> — Exact failing node named.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Goodhart Guard</strong> — Flags loosened thresholds.</span>
                  </div>
                </div>
              </div>

              {/* Action Portal Links */}
              <div className="flex flex-col gap-3 pt-2">
                <Link
                  href="/action"
                  className="inline-flex items-center justify-between p-4 rounded-2xl border border-(--border) bg-(--surface) hover:bg-(--surface-2) transition-colors group"
                >
                  <div>
                    <div className="text-xs font-mono uppercase text-(--faint)">GitHub Action Specs</div>
                    <div className="text-sm font-semibold text-(--fg)">View Full YAML &amp; Inputs Table</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-(--muted) group-hover:text-(--fg) group-hover:translate-x-0.5 transition-all" />
                </Link>

                <a
                  href="https://github.com/lostmartian/agentdiff-demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between p-4 rounded-2xl border border-(--border) bg-(--surface) hover:bg-(--surface-2) transition-colors group"
                >
                  <div>
                    <div className="text-xs font-mono uppercase text-(--faint)">Demo Repository</div>
                    <div className="text-sm font-semibold text-(--fg)">Inspect Real PR Comment on GitHub</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-(--muted) group-hover:text-(--fg) transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}