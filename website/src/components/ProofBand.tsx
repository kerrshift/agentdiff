"use client";

import React from "react";
import Reveal from "./Reveal";

const STATS = [
  { value: "7", label: "built-in adapters - incl. native LangGraph & CrewAI ingestion" },
  { value: "5+", label: "live frameworks exercised - OpenAI, Gemini, LangGraph, CrewAI, Langfuse" },
  { value: "300", label: "tests green across Python 3.10 - 3.13" },
  { value: "auto", label: "PR comments posted on real pull requests" },
];

export default function ProofBand() {
  return (
    <div className="w-full font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-16 lg:pb-20">
        <Reveal>
          {/* Context label */}
          <div className="flex justify-center mb-10">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-(--faint)">
              Trusted in production
            </span>
          </div>

          {/* Proof card */}
          <div className="rounded-2xl border border-(--border) bg-(--surface) shadow-[0_1px_2px_rgba(0,0,0,0.04)] px-6 py-8 sm:px-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
              {STATS.map((s) => (
                <div key={s.label} className="px-6 py-7 lg:py-2 text-center">
                  <div className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-(--fg)">
                    {s.value}
                  </div>
                  <div className="mt-2 text-[13px] text-(--muted) leading-snug">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Verification footer */}
            <div className="mt-8 pt-6 border-t border-(--border) flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-(--faint)">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" />
                Verified against live telemetry, not synthetic fixtures
              </span>
              <span className="text-(--border) select-none">·</span>
              <span>Blocked real tool-loop &amp; recovery regressions in CI</span>
              <span className="text-(--border) select-none">·</span>
              <span>On PyPI · MIT · zero telemetry</span>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}