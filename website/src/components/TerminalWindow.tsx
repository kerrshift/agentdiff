"use client";

import React, { useEffect, useState } from "react";

interface Line {
  t: string;
  c?: string;
}

const LINES: Line[] = [
  { t: "$ agentdiff traces/baseline.json runs/candidate_pr.json --fail-on-regression", c: "text-(--fg) font-semibold" },
  { t: "" },
  { t: "TRAJECTORY DIFF · PR #42 vs. Golden Baseline", c: "text-(--muted) font-semibold" },
  { t: "─────────────────────────────────────────────────────────────", c: "text-(--border-strong)" },
  { t: "adapter     generic · langchain / langgraph / openai", c: "text-(--faint)" },
  { t: "baseline    3 steps · routing → read_schema → execute_sql", c: "text-(--faint)" },
  { t: "candidate   6 steps · routing → read_schema → execute_sql ×3 (loop)", c: "text-(--faint)" },
  { t: "" },
  { t: "COMPUTED REGRESSION METRICS", c: "text-(--muted) font-semibold" },
  { t: "─────────────────────────────────────────────────────────────", c: "text-(--border-strong)" },
  { t: "TDI    divergence      0.428    limit ≤ 0.250    ❌ FAIL", c: "text-(--danger)" },
  { t: "LOOPS  tool loop       ×3       execute_sql      ❌ FAIL", c: "text-(--danger)" },
  { t: "ΔCOST  token delta     +148.2%  limit ≤ 10.0%    ❌ FAIL", c: "text-(--danger)" },
  { t: "RSR    recovery ratio  2.0×     limit ≤ 1.5×     ❌ FAIL", c: "text-(--danger)" },
  { t: "" },
  { t: "VERDICT: FAIL (Exit Code 1)", c: "text-(--danger) font-bold" },
  { t: "Pull request merge blocked. Report posted to review timeline.", c: "text-(--faint)" },
];

export default function TerminalWindow() {
  const [shown, setShown] = useState(1);

  useEffect(() => {
    if (shown >= LINES.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), 130);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <div className="w-full mx-auto rounded-xl overflow-hidden border border-(--border) bg-(--surface) text-left shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_12px_32px_-16px_rgba(0,0,0,0.12)]">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-4 sm:px-5 h-11 sm:h-12 border-b border-(--border) bg-(--surface-2)">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]"></span>
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]"></span>
          <span className="w-3 h-3 rounded-full bg-[#28C840]"></span>
        </div>
        <span className="hidden sm:inline text-[11px] font-mono text-(--faint)">
          agentdiff - live regression gate
        </span>
        <span className="text-[10px] font-mono text-(--danger) px-2 py-0.5 rounded-md font-bold bg-(--danger)/10 shrink-0">FAIL</span>
      </div>

      {/* Terminal body - calibrated character length to eliminate horizontal scroll on desktop */}
      <div className="p-4 sm:p-6 font-mono text-[11px] sm:text-xs md:text-[13px] leading-[1.7] tracking-tight whitespace-pre overflow-x-auto sm:overflow-x-visible text-left">
        {LINES.map((line, i) => (
          <div
            key={i}
            className={`${line.c ?? "text-(--faint)"} ${i >= shown ? "invisible" : ""}`}
          >
            {line.t || "\u00A0"}
            {i === shown - 1 && (
              <span className="inline-block w-[8px] h-[17px] align-middle bg-(--accent)/90 animate-pulse ml-1"></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}