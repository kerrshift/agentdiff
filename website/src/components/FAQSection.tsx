"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Minus, ArrowRight, Sparkles } from "lucide-react";
import Reveal from "./Reveal";

const FAQS = [
  {
    q: "How does AgentDiff differ from LLM judges (DeepEval, Ragas, LangSmith)?",
    a: "LLM judges score semantic nuance (e.g. 'Is this response polite?') via expensive, non-deterministic model calls that take 15–60 seconds. AgentDiff evaluates the structural execution DAG (tool sequence order, retry loops, wasted token deltas) in sub-5ms using pure graph algorithms. It gives you an instant, deterministic Exit Code 0 or 1 for your CI/CD pipeline.",
  },
  {
    q: "Do I need an API key or an external server to run a diff?",
    a: "No. AgentDiff is a zero-telemetry Python package (`pip install agent-trajectory-diff`). It executes 100% locally in your shell or CI runner with zero outbound network calls, zero API keys, and zero cloud dependencies.",
  },
  {
    q: "How do I create and manage golden baselines?",
    a: "Run `agentdiff record my_agent:run --output tests/golden_baseline.json` once on your known-good production agent. Commit the JSON baseline directly to your Git repository alongside your tests. When a developer creates a PR, your CI runs `agentdiff tests/golden_baseline.json pr_run.json` to verify no regressions occurred.",
  },
  {
    q: "What frameworks and telemetry formats are supported out of the box?",
    a: "AgentDiff includes native zero-instrumentation ingestion for LangGraph StateGraphs, CrewAI task delegation hierarchies, raw OpenAI tool_calls, OpenTelemetry / OpenInference GenAI semantic spans, Langfuse trace exports, and LangSmith run trees.",
  },
  {
    q: "What happens when an agent legitimately improves its execution path?",
    a: "If an agent finds a more optimal path (e.g. 2 steps instead of 4, saving tokens), AgentDiff detects a negative token delta and zero error loops. You simply run `agentdiff record` or update your committed baseline file to bless the new optimized trajectory.",
  },
  {
    q: "How does the GitHub Actions PR gate work?",
    a: "Our official GitHub Action runs your test suite, checks candidate trajectories against baseline tolerances in <5ms, and posts a structured diagnostic comment directly to the Pull Request. If regression tolerances are breached, it exits with Code 1 and blocks merging.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

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
    <section id="faq-section" className="py-24 sm:py-32 bg-transparent font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal>
          <div className="max-w-4xl mb-16 sm:mb-20">
            <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-4 font-medium">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
              Everything you <span className="text-emerald-500/90 dark:text-emerald-400">need to know</span>.
            </h2>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed font-normal max-w-3xl">
              Deterministic agent regression testing demystified. If you have any other questions, our engineering docs and GitHub discussions are always open.
            </p>
          </div>
        </Reveal>

        {/* Minimal High-Contrast FAQ Accordion */}
        <Reveal delay={100}>
          <div className="border-t border-(--border) divide-y divide-(--border)">
            {FAQS.map((faq, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div key={idx} className="py-6 sm:py-8 transition-colors">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-start justify-between gap-6 text-left group cursor-pointer"
                  >
                    <span className="text-lg sm:text-xl font-bold text-(--fg) tracking-tight group-hover:text-(--muted) transition-colors leading-snug">
                      {faq.q}
                    </span>

                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all mt-0.5 ${
                      isOpen
                        ? "bg-(--surface-2) border-(--border-strong) text-(--fg)"
                        : "bg-(--surface) border-(--border) text-(--muted) group-hover:border-(--border-strong) group-hover:text-(--fg)"
                    }`}>
                      {isOpen ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pt-4 sm:pt-5 pr-12 text-sm sm:text-base text-(--muted) leading-relaxed font-normal max-w-4xl animate-in fade-in-50 duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Bottom Support Link */}
        <Reveal delay={140}>
          <div className="mt-12 pt-8 border-t border-(--border) flex flex-wrap items-center justify-between gap-4 text-xs text-(--muted)">
            <span>Have a unique custom framework or telemetry format?</span>
            <Link
              href="https://github.com/agentdiff/agentdiff/discussions"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-(--fg) hover:underline"
            >
              <span>Ask in GitHub Discussions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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
