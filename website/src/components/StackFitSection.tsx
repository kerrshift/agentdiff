import React from "react";
import Link from "next/link";
import { GitPullRequest, Radio, Sparkles, ArrowRight, Check } from "lucide-react";
import Reveal from "./Reveal";

const LAYERS = [
  {
    role: "CI/CD Gate",
    name: "AgentDiff",
    badge: "100% Deterministic",
    badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
    icon: GitPullRequest,
    iconColor: "text-emerald-500",
    desc: "Runs on every Pull Request in <10ms. Diffing candidate traces against committed golden baselines to block tool loops, cost surges, and silent drift.",
    verdict: "PASS / FAIL (Exit Code 0 / 1)",
    bestFor: "Automated regression testing before merge",
  },
  {
    role: "Production Telemetry",
    name: "Observability (OTel/Langfuse)",
    badge: "Real-Time Telemetry",
    badgeColor: "text-blue-500 bg-blue-500/10 border-blue-500/25",
    icon: Radio,
    iconColor: "text-blue-500",
    desc: "Captures live production user traffic, distributed span traces, and latency charts. Essential for monitoring what happened in the wild.",
    verdict: "Live Alerts & Dashboards",
    bestFor: "Real-time user monitoring & production debugging",
  },
  {
    role: "Offline Evals",
    name: "LLM-as-a-Judge",
    badge: "Semantic Nuance",
    badgeColor: "text-purple-500 bg-purple-500/10 border-purple-500/25",
    icon: Sparkles,
    iconColor: "text-purple-500",
    desc: "Grades natural language tone, creativity, and subjective output on offline evaluation datasets. Accepts non-deterministic scoring and API cost.",
    verdict: "Qualitative Scores (0.0 - 1.0)",
    bestFor: "Subjective response quality & tone rating",
  },
];

export default function StackFitSection() {
  return (
    <section id="stack-fit-section" className="py-20 lg:py-28 bg-transparent font-sans border-t border-(--border)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-4">
              Stack Architecture
            </span>
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-(--fg) leading-tight">
              Where AgentDiff fits in your stack.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
              AgentDiff doesn&apos;t replace observability platforms or LLM judges — it covers the critical missing layer: deterministic regression gates in CI before code merges.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {LAYERS.map((layer) => {
              const Icon = layer.icon;
              return (
                <div
                  key={layer.name}
                  className="p-7 rounded-3xl bg-(--surface-2)/30 border border-(--border) flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-(--surface) border border-(--border) flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${layer.iconColor}`} />
                      </div>
                      <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${layer.badgeColor}`}>
                        {layer.badge}
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-(--faint)">
                        {layer.role}
                      </div>
                      <h3 className="text-lg font-semibold text-(--fg) mt-1">
                        {layer.name}
                      </h3>
                    </div>

                    <p className="text-sm text-(--muted) leading-relaxed">
                      {layer.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-(--border)/60 space-y-2">
                    <div className="text-xs font-mono text-(--fg) font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-(--border-strong)" />
                      <span>{layer.verdict}</span>
                    </div>
                    <div className="text-[11px] text-(--faint)">
                      {layer.bestFor}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Direct Compare Portal Link */}
          <div className="mt-10 flex items-center justify-between flex-wrap gap-4 pt-2">
            <p className="text-xs font-mono text-(--faint)">
              Leading engineering teams combine all three layers across the software development lifecycle.
            </p>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-(--fg) hover:text-emerald-400 transition-colors"
            >
              <span>View Full Side-by-Side Capability Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
