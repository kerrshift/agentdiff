"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import Reveal from "./Reveal";

/**
 * Landing FAQ. `FAQS` is the single source of truth: the visible accordions
 * and the FAQPage JSON-LD below render from the same strings, so search
 * engines always see schema matching on-page content.
 */

const FAQS = [
  {
    q: "How is AgentDiff different from DeepEval or Ragas?",
    a: "They score what the agent said (semantic quality, via LLM judges). AgentDiff measures how the agent got there - step order, tool loops, wasted effort, recovery cost, and token/latency deltas - using deterministic graph algorithms. No LLM calls, fully deterministic.",
  },
  {
    q: "Do I need API keys to run a diff?",
    a: "No. AgentDiff is pure math over trace files you already have, with no network calls at diff time. Keys are only needed by your own agent when it produces traces.",
  },
  {
    q: "Where do trace files come from?",
    a: "Native adapters ingest LangGraph state snapshots and CrewAI kickoff output directly - no instrumentation required. OpenTelemetry/OpenInference spans, Langfuse exports, LangSmith run trees, and OpenAI Agents SDK traces are also supported, plus a generic JSON schema for anything else.",
  },
  {
    q: "Can I compare runs from different frameworks?",
    a: "Yes. Every trace normalizes to one canonical schema before comparison, so a CrewAI run can be benchmarked head-to-head against a LangGraph run of the same task.",
  },
  {
    q: "What do TDI / WEI / RSR mean in one line each?",
    a: "TDI: fraction of trajectory structure that changed (0 = identical). WEI: share of steps that were errors, retries, or abandonments. RSR: how many steps the candidate spent recovering from failures versus the baseline.",
  },
  {
    q: "Is it production-safe to gate merges on this?",
    a: "That's the point - exit codes make it a drop-in CI gate, scenario suites gate whole families of flows in one call, and the GitHub Action posts the culprit and divergence tree right onto the PR so reviewers see why a merge was blocked.",
  },
];

export default function FAQSection() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <section id="faq-section" className="py-20 lg:py-24 bg-transparent font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
          <div className="mb-10">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-(--faint) block mb-4">FAQ</span>
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-(--fg) leading-tight">
              Questions engineers actually ask.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="border border-(--border) rounded-2xl bg-(--surface) shadow-[0_1px_2px_rgba(0,0,0,0.04)] divide-y divide-(--border) overflow-hidden px-5 sm:px-8">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-1">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-4 [&::-webkit-details-marker]:hidden">
                  <span className="text-[15px] font-medium text-(--fg) leading-snug">{q}</span>
                  <ChevronDown className="w-4 h-4 shrink-0 text-(--faint) transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="text-sm text-(--muted) leading-relaxed pb-5 pr-8">{a}</p>
              </details>
            ))}
          </div>
        </Reveal>

      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
