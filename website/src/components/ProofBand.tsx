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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-16 lg:pb-20">
        <Reveal>
          {/* Context label */}
          <div className="flex justify-center mb-10">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA]">
              Trusted in production
            </span>
          </div>

          {/* Proof card */}
          <div className="rounded-2xl border border-[#E4E4E7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] px-6 py-8 sm:px-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E4E4E7]">
              {STATS.map((s) => (
                <div key={s.label} className="px-6 py-7 lg:py-2 text-center">
                  <div className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-[#18181B]">
                    {s.value}
                  </div>
                  <div className="mt-2 text-[13px] text-[#52525B] leading-snug">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Verification footer */}
            <div className="mt-8 pt-6 border-t border-[#E4E4E7] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-[#A1A1AA]">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0FA47F]" />
                Verified against live telemetry, not synthetic fixtures
              </span>
              <span className="text-[#E4E4E7] select-none">·</span>
              <span>Blocked a real tool-loop regression in CI</span>
              <span className="text-[#E4E4E7] select-none">·</span>
              <span>Published to PyPI · v0.2.2</span>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}