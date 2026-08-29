"use client";

import React from "react";
import Link from "next/link";
import Reveal from "./Reveal";
import { ArrowRight, Check } from "lucide-react";

const PIPELINE_STAGES = [
  {
    num: "01",
    label: "Local CLI",
    title: "Record Golden Baseline",
    summary: "One command snapshots the graph.",
    description: "Run your agent on a verified test dataset. AgentDiff records its execution graph, tool call sequences, and token budget into a committed JSON file in your repository.",
    code: "$ agentdiff record tests/golden.json",
  },
  {
    num: "02",
    label: "CI Pipeline",
    title: "Align & Diff on Every PR",
    summary: "Sub-10ms graph comparison.",
    description: "When an engineer refactors a prompt or upgrades a model, AgentDiff aligns the candidate execution against the baseline in GitHub Actions without calling any paid LLM judges.",
    code: "$ agentdiff golden.json pr.json",
  },
  {
    num: "03",
    label: "Merge Gate",
    title: "Block Regressions with Exit Code 1",
    summary: "Zero broken agents in production.",
    description: "If the PR agent enters an infinite retry loop, drifts off its path, or surges token cost, the build halts immediately and an automated root-cause comment is posted to the PR.",
    code: "Exit Code 1 · 3× loop on execute_sql",
  },
];

export default function BlueprintWorkspace() {
  return (
    <section id="workflow-section" className="py-24 sm:py-32 bg-transparent font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal>
          <div className="max-w-4xl mb-16 sm:mb-20">
            <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-4 font-medium">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
              From git commit to <span className="text-emerald-500/90 dark:text-emerald-400">merge gate</span>.
            </h2>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed font-normal max-w-3xl">
              No complex dashboards or cloud databases. AgentDiff operates as a pure, deterministic regression engine directly in your terminal and CI/CD pipeline.
            </p>
          </div>
        </Reveal>

        {/* Continuous Horizontal Pipeline Architecture (Zero Boxed Cards) */}
        <Reveal delay={100}>
          <div className="relative border-t border-(--border)">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
              
              {PIPELINE_STAGES.map((stage) => (
                <div
                  key={stage.num}
                  className="py-10 lg:py-12 lg:px-8 first:lg:pl-0 last:lg:pr-0 space-y-6 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Stage Number & Label */}
                    <div className="flex items-center justify-between">
                      <span className="text-3xl lg:text-4xl font-bold tracking-tight text-(--fg)">
                        {stage.num}
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-(--faint) border border-(--border) rounded-full px-2.5 py-0.5 font-medium">
                        {stage.label}
                      </span>
                    </div>

                    {/* Headline */}
                    <div>
                      <h3 className="text-lg font-bold text-(--fg) tracking-tight">
                        {stage.title}
                      </h3>
                      <div className="text-xs text-(--muted) mt-1 font-medium">
                        {stage.summary}
                      </div>
                    </div>

                    {/* Body Text */}
                    <p className="text-sm text-(--muted) leading-relaxed font-normal">
                      {stage.description}
                    </p>
                  </div>

                  {/* Minimal Code Pill */}
                  <div className="pt-4 border-t border-(--border)/60">
                    <div className="font-mono text-xs text-(--fg) bg-(--surface-2)/50 px-3.5 py-2.5 rounded-xl border border-(--border)/60 flex items-center justify-between">
                      <span className="truncate">{stage.code}</span>
                      <span className="text-(--faint) text-[10px]">●</span>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* Bottom Link Rail */}
          <div className="mt-12 pt-8 border-t border-(--border) flex flex-wrap items-center justify-between gap-4 text-xs">
            <span className="text-(--muted)">
              Native adapters for LangGraph, OpenAI Agents, CrewAI, and OpenTelemetry.
            </span>
            <Link
              href="/quickstart"
              className="text-(--fg) font-semibold hover:underline inline-flex items-center gap-1.5"
            >
              <span>Get started in 5 minutes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
