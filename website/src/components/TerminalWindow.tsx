"use client";

import React, { useEffect, useState } from "react";

interface Line {
  t: string;
  c?: string;
}

const LINES: Line[] = [
  { t: "$ agentdiff baseline.json candidate.json \\", c: "text-[#E8EAED]" },
  { t: "    --fail-on-regression --max-divergence 0.25", c: "text-[#E8EAED]" },
  { t: "" },
  { t: "trajectory diff", c: "text-[#7D8794] font-semibold" },
  { t: "────────────────────────────────", c: "text-[#23262B]" },
  { t: "adapter        generic (auto)", c: "text-[#A1A1AA]" },
  { t: "baseline       6 steps · 1,204 tokens", c: "text-[#A1A1AA]" },
  { t: "candidate      9 steps · 2,986 tokens", c: "text-[#A1A1AA]" },
  { t: "" },
  { t: "metrics", c: "text-[#7D8794] font-semibold" },
  { t: "────────────────────────────────", c: "text-[#23262B]" },
  { t: "TDI    divergence      0.42     limit 0.25      FAIL", c: "text-[#C9CDD3]" },
  { t: "WEI    wasted effort   0.22     limit 0.10      FAIL", c: "text-[#C9CDD3]" },
  { t: "LOOPS  tool loop       ×3       execute_sql     FAIL", c: "text-[#C9CDD3]" },
  { t: "ΔCOST  cost            +148%    limit +5%       FAIL", c: "text-[#C9CDD3]" },
  { t: "" },
  { t: "verdict  FAIL", c: "text-[#E5484D] font-bold" },
  { t: "exit code 1 · blocking main@2c4d91", c: "text-[#6B7480]" },
];

export default function TerminalWindow() {
  const [shown, setShown] = useState(1);

  useEffect(() => {
    if (shown >= LINES.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), 130);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <div className="w-full max-w-3xl rounded-xl overflow-hidden border border-[#2A2D33] bg-[#0A0B0C] text-left shadow-[0_1px_0_0_rgba(0,0,0,0.1),0_12px_32px_-16px_rgba(0,0,0,0.35)]">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-5 h-12 border-b border-[#1E2126] bg-[#0D0E10]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#2A2D33]"></span>
          <span className="w-3 h-3 rounded-full bg-[#2A2D33]"></span>
          <span className="w-3 h-3 rounded-full bg-[#2A2D33]"></span>
        </div>
        <span className="text-[11px] font-mono text-[#6B7480]">agentdiff — main</span>
        <span className="text-[10px] font-mono text-[#E5484D] px-2 py-0.5 rounded-md font-bold bg-[#E5484D]/10">FAIL</span>
      </div>

      {/* Terminal body — all lines occupy space; later ones hidden so height never changes */}
      <div className="px-6 py-6 font-mono text-sm leading-[1.7] tracking-tight whitespace-pre text-left">
        {LINES.map((line, i) => (
          <div
            key={i}
            className={`${line.c ?? "text-[#A1A1AA]"} ${i >= shown ? "invisible" : ""}`}
          >
            {line.t || "\u00A0"}
            {i === shown - 1 && (
              <span className="inline-block w-[8px] h-[17px] align-middle bg-[#4ADE80]/90 animate-pulse ml-1"></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}