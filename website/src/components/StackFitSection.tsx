"use client";

import React from "react";
import Link from "next/link";
import { GitPullRequest, Radio, Sparkles, ArrowRight, Check, ShieldCheck, Gauge, Layers, X, Lock } from "lucide-react";
import Reveal from "./Reveal";

const STACK_LAYERS = [
  {
    stage: "Pre-Merge Gate (CI/CD)",
    tool: "AgentDiff",
    badge: "100% Deterministic",
    tagline: "The missing unit test for execution trajectories.",
    description: "Evaluates PR candidate runs against committed golden baselines in under 5ms. Blocks infinite loops, prompt drift, and token surges before code reaches production.",
    metricLabel: "Execution Speed",
    metricValue: "< 5ms",
    verdict: "Exit Code 0 / 1 (Hard Block)",
    isHero: true,
  },
  {
    stage: "Offline Evaluation",
    tool: "LLM-as-a-Judge",
    badge: "Semantic Scoring",
    tagline: "Subjective quality and tone grading.",
    description: "Evaluates nuances like politeness, formatting, and hallucination on offline test suites. High latency, non-deterministic scores, and API costs make it unsuited as a hard CI gate.",
    metricLabel: "Execution Speed",
    metricValue: "15s - 60s",
    verdict: "Probabilistic Score (0.0 - 1.0)",
    isHero: false,
  },
  {
    stage: "Post-Deploy Monitoring",
    tool: "Observability (OTel / Langfuse)",
    badge: "Live Telemetry",
    tagline: "Production user traffic and debugging.",
    description: "Captures live production spans, distributed traces, and latency charts. Vital for debugging what happened after an outage, but cannot prevent broken PRs from deploying.",
    metricLabel: "Execution Speed",
    metricValue: "Post-Hoc",
    verdict: "Alerts & Dashboards",
    isHero: false,
  },
];

export default function StackFitSection() {
  return (
    <section id="stack-fit-section" className="py-24 sm:py-32 bg-transparent font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal>
          <div className="max-w-4xl mb-16 sm:mb-20">
            <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-4 font-medium">
              Stack Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
              Where AgentDiff fits <span className="text-emerald-500/90 dark:text-emerald-400">in your stack</span>.
            </h2>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed font-normal max-w-3xl">
              AgentDiff doesn’t replace observability platforms or LLM judges. It completes your modern AI stack by filling the critical missing layer: <strong>instant, deterministic regression gates in CI.</strong>
            </p>
          </div>
        </Reveal>

        {/* 3-Column Modern Architectural Grid */}
        <Reveal delay={100}>
          <div className="border border-(--border) rounded-2xl bg-(--surface) overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
              {STACK_LAYERS.map((layer) => (
                <div
                  key={layer.tool}
                  className={`p-8 sm:p-10 flex flex-col justify-between space-y-8 ${
                    layer.isHero ? "bg-(--surface-2)/40 relative" : "bg-(--surface)"
                  }`}
                >
                  {/* Top: Stage + Badge + Tool Name */}
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-(--faint) font-medium">
                        {layer.stage}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                        layer.isHero
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold"
                          : "bg-(--surface) text-(--muted) border-(--border)"
                      }`}>
                        {layer.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-(--fg) tracking-tight">
                        {layer.tool}
                      </h3>
                      <div className="text-sm font-medium text-(--fg) mt-1">
                        {layer.tagline}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-(--muted) leading-relaxed">
                      {layer.description}
                    </p>
                  </div>

                  {/* Bottom: Technical Metric Spec */}
                  <div className="pt-6 border-t border-(--border) space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-(--muted)">{layer.metricLabel}</span>
                      <span className="font-mono font-bold text-(--fg)">{layer.metricValue}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-(--muted)">Enforcement</span>
                      <span className="font-semibold text-(--fg)">{layer.verdict}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Bottom Lifecycle Summary Note */}
        <Reveal delay={140}>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 px-2 text-xs text-(--muted)">
            <span>Leading engineering teams run AgentDiff in CI, LLM Judges offline, and OTel in production.</span>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 font-semibold text-(--fg) hover:underline"
            >
              <span>Explore Architecture Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
