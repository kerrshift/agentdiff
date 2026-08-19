"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Reveal from "./Reveal";

const FAILED = `## AgentDiff - Trajectory Regression Check

**Status:** ⛔ **FAILED**

| Gate | Value | Threshold |
| :--- | :--- | :--- |
| TDI | \`0.1429\` | ≤ \`0.3\` |
| Loops | \`1\` | ≤ \`0\` |
| Cost delta | \`+54.21%\` | ≤ \`10.0%\` |

### Root cause

> **Culprit:** \`get_user_database_stats\` \`[loop]\` - entered a loop repeating 'get_user_database_stats' (2 times).

### Divergence tree

\`\`\`text
baseline [3 steps] vs candidate [4 steps]
     1 ~ gemini_tool_decision   (changed)
     2 + get_user_database_stats   (added - absent in baseline)
     3 · get_user_database_stats
     4 ~ gemini_synthesis   (changed)
\`\`\`

### Loops detected
- Loop #1: repeated ['get_user_database_stats'] \`2\` times (stagnant state)`;

const PASSED = `## AgentDiff - Trajectory Regression Check

**Status:** ✅ **PASSED**

| Gate | Value | Threshold |
| :--- | :--- | :--- |
| TDI | \`0.0000\` | ≤ \`0.3\` |
| Loops | \`0\` | ≤ \`0\` |
| Cost delta | \`+12.77%\` | ≤ \`100.0%\` |

### Root cause

> **Culprit:** \`gemini_synthesis\` \`[divergence]\` - the candidate changed this step's behavior.

### Divergence tree

\`\`\`text
baseline [3 steps] vs candidate [3 steps]
     1 · gemini_tool_decision
     2 · get_user_database_stats
     3 ~ gemini_synthesis   (changed)
\`\`\``;

const PRS = [
  {
    id: "blocked",
    pr: "#2 · fix/prompt-regression",
    label: "A real run that regressed",
    status: "⛔ BLOCKED",
    color: "text-[#E5484D]",
    dot: "bg-[#E5484D]",
    comment: FAILED,
    note: "The live Gemini agent looped get_user_database_stats twice. AgentDiff blocked the job and posted this comment.",
  },
  {
    id: "pass",
    pr: "#3 · feat/pr-comment",
    label: "A clean run that passed",
    status: "✅ PASSED",
    color: "text-[#0FA47F]",
    dot: "bg-[#0FA47F]",
    comment: PASSED,
    note: "A normal run matches the baseline. AgentDiff auto-posted the report onto the PR that triggered it.",
  },
] as const;

export default function PRCommentShowcase() {
  const [active, setActive] = useState<"blocked" | "pass">("blocked");
  const current = PRS.find((p) => p.id === active)!;

  return (
    <section id="ci-in-action-section" className="py-24 bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA] block mb-4">
              In CI, for real
            </span>
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-[#18181B] leading-tight">
              The report shows up on the pull request.
            </h2>
            <p className="mt-4 text-base text-[#52525B] leading-relaxed font-normal">
              These are genuine AgentDiff comments, posted automatically onto
              live pull requests of a real Gemini agent by the{" "}
              <code className="text-[#18181B] font-mono text-sm">agentdiff-check</code>{" "}
              GitHub Action. No manual PR number - it posts to the PR that
              triggered the run.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {PRS.map((p) => {
              const activeBtn = active === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border transition-colors duration-150 ${
                    activeBtn
                      ? "border-[#18181B] bg-[#18181B] text-white"
                      : "border-[#E4E4E7] bg-white text-[#52525B] hover:border-[#18181B] hover:text-[#18181B]"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                  {p.pr}
                </button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* PR comment card */}
            <div className="lg:col-span-3 bg-white border border-[#E4E4E7] rounded-xl overflow-hidden shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_12px_32px_-16px_rgba(0,0,0,0.1)]">
              <div className="border-b border-[#E4E4E7] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#E4E4E7] flex items-center justify-center text-[10px] font-bold text-[#52525B]">
                    AD
                  </span>
                  <div className="text-left leading-tight">
                    <span className="block text-xs font-semibold text-[#18181B]">AgentDiff bot</span>
                    <span className="block text-[11px] text-[#A1A1AA]">
                      commented on {current.pr}
                    </span>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#18181B]/5 ${current.color}`}>
                  {current.status}
                </span>
              </div>

              <div className="relative">
                {/* Height anchor: always the tallest comment, invisible */}
                <div className="invisible">
                  <div className="markdown-content markdown-compact px-6 py-5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{FAILED}</ReactMarkdown>
                  </div>
                </div>
                {/* Layers: each renders from the top; inactive one keeps no space */}
                {PRS.map((p) => (
                  <div
                    key={p.id}
                    className={`markdown-content markdown-compact px-6 py-5 absolute inset-x-0 top-0 ${
                      active === p.id ? "" : "invisible"
                    }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.comment}</ReactMarkdown>
                  </div>
                ))}
              </div>
            </div>

            {/* Annotation rail */}
            <div className="lg:col-span-2 flex flex-col justify-center gap-4">
              <p className="text-sm text-[#52525B] leading-relaxed">{current.note}</p>
              <ul className="text-sm text-[#52525B] leading-relaxed space-y-2.5">
                <li className="flex gap-2.5">
                  <span className="text-[#0FA47F] mt-0.5">✓</span>
                  <span>
                    <strong className="text-[#18181B] font-semibold">Status</strong> and the gate
                    table - TDI, loops, and cost against your thresholds.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-[#0FA47F] mt-0.5">✓</span>
                  <span>
                    <strong className="text-[#18181B] font-semibold">Root cause</strong> - the
                    culprit step and why it changed.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-[#0FA47F] mt-0.5">✓</span>
                  <span>
                    <strong className="text-[#18181B] font-semibold">Collapsed divergence tree</strong>{" "}
                    - matched steps folded into <code className="font-mono text-xs">· · · N · · ·</code>,
                    only divergent steps shown.
                  </span>
                </li>
              </ul>
              <a
                href="https://github.com/lostmartian/agentdiff-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#18181B] hover:text-[#52525B] transition-colors duration-150 mt-2"
              >
                See the full repo →  agentdiff-demo
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}