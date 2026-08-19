import React from "react";
import { ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";

function CodePanel({ lines, tab }: { lines: string[]; tab: string }) {
  return (
    <div className="bg-[#0A0B0C] border border-[#2A2D33] rounded-xl overflow-hidden font-mono">
      <div className="flex items-center gap-2 px-4 h-9 border-b border-[#1E2126] bg-[#0D0E10]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#2A2D33]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#2A2D33]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#2A2D33]" />
        <span className="ml-2 text-[10px] text-[#6B7480]">{tab}</span>
      </div>
      <div className="px-4 py-4 sm:px-5 text-[11px] sm:text-[12.5px] leading-[1.8] whitespace-pre text-[#C9CDD3] overflow-x-auto no-scrollbar">
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.startsWith("$ ") ? "text-[#E8EAED]" :
              l.startsWith("Finding:") || l.startsWith("Culprit:") || l.startsWith("pr_comment.md") ? "text-[#8B93A0]" :
              ""
            }
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

const CARDS = [
  {
    num: "01",
    label: "Explain",
    title: "Know why it diverged - and what to fix",
    body: "Raw metrics tell you something changed. AgentDiff tells you why, and points at the single step most responsible.",
    tab: "agentdiff --explain --tree",
    lines: [
      "$ agentdiff base.json cand.json --explain --tree",
      "",
      "Finding: step \"search_database\" was added 2x in the candidate.",
      "Finding: a tool-calling loop repeats 3x.",
      "Culprit: step \"search_database\" (loop entry) - fix this first.",
    ],
  },
  {
    num: "02",
    label: "Rotation",
    title: "Baselines that advance deliberately",
    body: "A hard gate is useless if baselines silently chase every change. Rotation lets baselines move only when it's safe.",
    tab: "agentdiff --baseline-rotation staged",
    lines: [
      "$ agentdiff cand.json --baseline prod.json \\",
      "    --baseline-rotation staged --max-drift 0.05",
      "",
      "# baseline advances only when drift stays under 5%,",
      "# so regressions can't slip through by re-baselining.",
    ],
  },
  {
    num: "03",
    label: "pytest",
    title: "Gate your test suite with one flag",
    body: "Each test records its run and is compared against a committed baseline on teardown - failing the test on regression.",
    tab: "pytest --agentdiff",
    lines: [
      "def test_returns_orders(agentdiff_trace):",
      "    agentdiff_trace.record(run())",
      "    assert ...",
      "",
      "$ pytest --agentdiff",
      "# fails on trajectory drift, loops, or cost spikes",
    ],
  },
  {
    num: "04",
    label: "PR comments",
    title: "The report shows up in the pull request",
    body: "Paste-ready markdown, posted straight to the PR - status, metrics, divergence tree, and culprit - right where reviewers look.",
    tab: "agentdiff --format pr --pr 42",
    lines: [
      "$ agentdiff base.json cand.json \\",
      "    --format pr --pr 42",
      "",
      "pr_comment.md  >  #42",
      "# Status: FAIL | culprit: search_database | +148% cost",
    ],
  },
];

export default function ActionSection() {
  return (
    <section id="action-section" className="py-20 lg:py-28 bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
        <div className="max-w-3xl mb-12 lg:mb-16">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA] block mb-4">
            Beyond the metrics
          </span>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-[#18181B] leading-tight">
            Not just what changed. Why it changed - and what to do about it.
          </h2>
          <p className="mt-4 text-base text-[#52525B] leading-relaxed font-normal max-w-2xl">
            A regression tool is only as good as the action it drives. AgentDiff turns divergence into an explanation, a culprit, and a gate that ships with every change.
          </p>
        </div>
        </Reveal>

        <div className="flex flex-col gap-16 lg:gap-20">
          {CARDS.map((card) => (
            <Reveal key={card.num}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-6 items-center">
                <div className="max-w-md">
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="font-medium text-sm text-[#A1A1AA] tracking-tight">{card.num}</span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#A1A1AA]">
                      {card.label}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-[#18181B] mb-3 leading-snug tracking-[-0.01em]">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[#52525B] leading-relaxed font-normal">
                    {card.body}
                  </p>
                </div>
                <CodePanel tab={card.tab} lines={card.lines} />
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
        <div className="mt-20 flex flex-wrap items-center justify-between gap-4">
          <span className="text-[11px] text-[#A1A1AA] font-medium">
            Everything here is a real flag you can run today.
          </span>
          <a
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#18181B] hover:text-[#52525B] transition-colors duration-150"
          >
            See the full CLI
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
        </Reveal>

      </div>
    </section>
  );
}