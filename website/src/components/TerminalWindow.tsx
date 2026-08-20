"use client";

import React, { useEffect, useState } from "react";

interface Line {
  t: string;
  c?: string;
}

const LINES: Line[] = [
  { t: "$ agentdiff traces/gemini_baseline.json run.json \\", c: "text-[#18181B]" },
  { t: "    --fail-on-regression --adapter generic", c: "text-[#18181B]" },
  { t: "" },
  { t: "trajectory diff  ·  live gemini-3.6-flash run", c: "text-[#52525B] font-semibold" },
  { t: "────────────────────────────────", c: "text-[#D4D4D8]" },
  { t: "adapter        generic", c: "text-[#A1A1AA]" },
  { t: "baseline       3 steps · routing → tool → answer", c: "text-[#A1A1AA]" },
  { t: "candidate      4 steps · get_user_database_stats ×2", c: "text-[#A1A1AA]" },
  { t: "" },
  { t: "metrics", c: "text-[#52525B] font-semibold" },
  { t: "────────────────────────────────", c: "text-[#D4D4D8]" },
  { t: "TDI    divergence      0.143    limit 0.3    FAIL", c: "text-[#52525B]" },
  { t: "LOOPS  tool loop       ×2       get_user_database_stats   FAIL", c: "text-[#52525B]" },
  { t: "ΔCOST  cost            +51.7%   limit +10%   FAIL", c: "text-[#52525B]" },
  { t: "" },
  { t: "verdict  FAIL", c: "text-[#E5484D] font-bold" },
  { t: "exit code 1 · gate blocked the pull request", c: "text-[#A1A1AA]" },
];

export default function TerminalWindow() {
  const [shown, setShown] = useState(1);

  useEffect(() => {
    if (shown >= LINES.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), 130);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <div className="w-full max-w-3xl rounded-xl overflow-hidden border border-[#E4E4E7] bg-white text-left shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_12px_32px_-16px_rgba(0,0,0,0.12)]">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-4 sm:px-5 h-11 sm:h-12 border-b border-[#E4E4E7] bg-[#F4F4F5]">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]"></span>
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]"></span>
          <span className="w-3 h-3 rounded-full bg-[#28C840]"></span>
        </div>
        <span className="hidden sm:inline text-[11px] font-mono text-[#A1A1AA]">
          agentdiff - live gemini-3.6-flash gate
        </span>
        <span className="text-[10px] font-mono text-[#E5484D] px-2 py-0.5 rounded-md font-bold bg-[#E5484D]/10 shrink-0">FAIL</span>
      </div>

      {/* Terminal body - all lines occupy space; later ones hidden so height never changes */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 font-mono text-[11px] sm:text-sm leading-[1.7] tracking-tight whitespace-pre overflow-x-auto no-scrollbar text-left">
        {LINES.map((line, i) => (
          <div
            key={i}
            className={`${line.c ?? "text-[#A1A1AA]"} ${i >= shown ? "invisible" : ""}`}
          >
            {line.t || "\u00A0"}
            {i === shown - 1 && (
              <span className="inline-block w-[8px] h-[17px] align-middle bg-[#0FA47F]/90 animate-pulse ml-1"></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}