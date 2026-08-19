"use client";

import React from "react";
import Reveal from "./Reveal";

const STATS = [
  { value: "5", label: "adapters validated against real SDK/API traces" },
  { value: "3+", label: "live providers exercised - OpenAI, Gemini, Langfuse" },
  { value: "205", label: "tests green across Python 3.10 - 3.13" },
  { value: "auto", label: "PR comments posted on real pull requests" },
];

export default function ProofBand() {
  return (
    <div className="w-full font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-[#18181B]">
                  {s.value}
                </div>
                <div className="mt-2 text-[13px] text-[#52525B] leading-snug">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#A1A1AA]">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0FA47F]" />
              Verified against live telemetry, not synthetic fixtures
            </span>
            <span className="text-[#E4E4E7] select-none">·</span>
            <span>Blocked a real tool-loop regression in CI</span>
            <span className="text-[#E4E4E7] select-none">·</span>
            <span>Published to PyPI · v0.2.2</span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}