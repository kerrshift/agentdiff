"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Terminal } from "lucide-react";
import { Github } from "@lobehub/icons";
import Reveal from "./Reveal";

const PIP_COMMAND = "pip install agent-trajectory-diff";
const GITHUB_ACTION_SNIPPET = `- name: Run AgentDiff Gate
  uses: agentdiff/action@v1
  with:
    baseline: tests/golden_baseline.json
    max-divergence: 0.25`;

export default function ClosingCTA() {
  const [copiedPip, setCopiedPip] = useState(false);

  const handleCopyPip = () => {
    navigator.clipboard.writeText(PIP_COMMAND);
    setCopiedPip(true);
    setTimeout(() => setCopiedPip(false), 2000);
  };

  return (
    <section id="get-started-section" className="py-24 sm:py-36 bg-transparent font-sans relative overflow-hidden">
      
      {/* Background Radial Glow in the top-right corner (Rich & Distinct) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 dark:bg-emerald-400/25 rounded-full blur-[100px] pointer-events-none -mr-24 -mt-24" />
      
      {/* Ambient center radial wash */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[400px] bg-gradient-to-b from-emerald-500/10 via-(--fg)/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Bold Value Proposition & Action Buttons */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block font-medium">
                Ready to Deploy
              </span>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.08]">
                Stop agent regressions before they merge.
              </h2>

              <p className="text-base sm:text-lg text-(--muted) leading-relaxed font-normal max-w-xl">
                Install in seconds. Compare candidate executions against golden baselines, block infinite tool loops, and protect your token budget on every PR.
              </p>

              {/* Primary CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/quickstart"
                  className="px-8 py-3.5 rounded-full bg-(--fg) text-(--bg) text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-sm"
                >
                  <span>Read Quickstart Guide</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="https://github.com/agentdiff/agentdiff"
                  target="_blank"
                  rel="noreferrer"
                  className="px-7 py-3.5 rounded-full border border-(--border) bg-(--surface) text-(--fg) text-sm font-semibold hover:border-(--border-strong) hover:bg-(--surface-2) transition-all inline-flex items-center gap-2"
                >
                  <Github size={18} />
                  <span>Star on GitHub</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-(--muted)">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>MIT Licensed</span>
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero Cloud Dependencies</span>
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sub-5ms Graph Alignment</span>
                </span>
              </div>
            </div>

            {/* Right Column: Terminal Install & Action YAML */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* 1. Pip Install Terminal Box */}
              <div className="rounded-2xl border border-(--border) bg-(--bg) overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 bg-(--surface-2)/60 border-b border-(--border) flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-(--border)" />
                    <span className="w-2.5 h-2.5 rounded-full bg-(--border)" />
                    <span className="w-2.5 h-2.5 rounded-full bg-(--border)" />
                    <span className="ml-2 text-xs font-medium text-(--muted)">bash</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold">PyPI Release</span>
                </div>

                <div className="p-4 flex items-center justify-between gap-3 font-mono text-xs text-(--fg)">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-(--faint) select-none">$</span>
                    <span className="truncate">{PIP_COMMAND}</span>
                  </div>
                  <button
                    onClick={handleCopyPip}
                    className="p-1.5 rounded-md hover:bg-(--surface-2) text-(--muted) hover:text-(--fg) shrink-0 transition-colors cursor-pointer"
                    title="Copy install command"
                  >
                    {copiedPip ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 2. GitHub Actions YAML Box */}
              <div className="rounded-2xl border border-(--border) bg-(--bg) overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 bg-(--surface-2)/60 border-b border-(--border) flex items-center justify-between">
                  <span className="text-xs text-(--muted) font-medium">.github/workflows/ci.yml</span>
                  <span className="text-[11px] text-(--muted) font-mono">CI Gate</span>
                </div>
                <pre className="p-4 font-mono text-[11px] text-(--fg)/85 leading-[1.6] overflow-x-auto">
                  {GITHUB_ACTION_SNIPPET}
                </pre>
              </div>

            </div>

          </div>
        </Reveal>
      </div>
    </section>
  );
}
