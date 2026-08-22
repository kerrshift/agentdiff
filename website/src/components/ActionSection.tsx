"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Github } from "@lobehub/icons";
import Reveal from "./Reveal";
import LogoMark from "./LogoMark";

const STEPS = [
  {
    num: "01",
    label: "PR opens",
    title: "A model upgrade hits the repo",
    desc: "sahil opens #3 — upgrade agent model → gpt-4.1.",
  },
  {
    num: "02",
    label: "Pipeline runs",
    title: "AgentDiff compares vs baseline",
    desc: "Compare → Explain → Gate → Comment. The gate fails.",
  },
  {
    num: "03",
    label: "Comment lands",
    title: "The PR gets the verdict",
    desc: "FAIL · culprit search_database · loop ×3 · +148% cost.",
  },
  {
    num: "04",
    label: "Fix & pass",
    title: "Rotate, re-run, ship",
    desc: "Retry fixed, baseline rotated, gate turns green.",
  },
];

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "red" | "green" }) {
  const tones = {
    muted: "bg-(--surface-2) text-(--muted)",
    red: "bg-(--danger)/10 text-(--danger)",
    green: "bg-(--accent)/10 text-(--accent)",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium font-mono ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Pipeline({ progress }: { progress: number }) {
  const nodes = ["Compare", "Explain", "Gate", "Comment"];
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {nodes.map((n, i) => {
        const isGate = n === "Gate";
        let cls: string;
        let dot: string;
        let pulse = false;
        if (i < progress) {
          cls = "bg-(--accent)/10 text-(--accent)";
          dot = "bg-(--accent)";
        } else if (i === progress && isGate) {
          cls = "bg-(--danger)/10 text-(--danger)";
          dot = "bg-(--danger)";
          pulse = true;
        } else {
          cls = "bg-(--surface-2) text-(--faint)";
          dot = "bg-(--border-strong)";
        }
        return (
          <React.Fragment key={n}>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${cls}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dot} ${pulse ? "animate-pulse" : ""}`} />
              {n}
            </div>
            {i < nodes.length - 1 && <span className="text-(--border-strong)">→</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function ActionSection() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 4200);
    return () => clearInterval(id);
  }, [playing]);

  const go = (dir: number) => {
    setStep((s) => (s + dir + STEPS.length) % STEPS.length);
    setPlaying(false);
  };

  const Screens = [
    /* 01 · PR opens */
    () => (
    <div className="max-w-md mx-auto lg:max-w-xl">
      <div className="flex items-center gap-2.5 mb-4">
        <Github size={16} className="text-(--muted)" />
        <span className="text-sm font-medium text-(--fg)">agentdiff-demo</span>
        <span className="text-sm text-(--faint)">#3</span>
        <span className="text-[11px] font-semibold text-(--accent) bg-(--accent)/10 px-2 py-0.5 rounded-full">OPEN</span>
      </div>
      <h3 className="text-lg font-semibold text-(--fg) leading-snug">Upgrade agent model → gpt-4.1</h3>
      <p className="mt-1 font-mono text-xs text-(--faint)">main ← model-bump</p>
      <p className="mt-3 text-sm text-(--muted) leading-relaxed">
        Bumping the model for faster reasoning. Please check for drift.
      </p>
      <div className="mt-4 rounded-lg bg-(--surface-2) border border-(--border) px-4 py-2.5 font-mono text-[11px] leading-relaxed">
        <div className="text-(--fg)">models/agent.py</div>
        <div className="text-(--accent)">+&nbsp;model = &quot;gpt-4.1&quot;</div>
        <div className="text-(--danger)">−&nbsp;model = &quot;gpt-4o&quot;</div>
      </div>
      <div className="mt-4 rounded-xl border border-(--border) bg-(--surface) px-4 py-3 flex items-center gap-3">
        <span className="w-4 h-4 rounded-full border-2 border-(--border) border-t-(--muted) animate-spin" />
        <span className="text-sm text-(--muted)">agentdiff · comparing against baseline…</span>
      </div>
    </div>
    ),

    /* 02 · Pipeline runs */
    () => (
    <div className="max-w-md mx-auto lg:max-w-xl">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--faint) mb-3">CI · agentdiff-trajectory</p>
      <Pipeline progress={2} />
      <div className="mt-5 rounded-xl border border-(--border) bg-(--surface-2) px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-white bg-(--danger) px-2 py-0.5 rounded-full">FAIL</span>
          <span className="text-sm font-medium text-(--fg)">Trajectory regression detected</span>
        </div>
        <p className="mt-2 text-sm text-(--muted) leading-relaxed">
          Divergence on step <span className="font-mono text-(--danger) font-semibold">search_database</span> — loop repeats 3×.
        </p>
      </div>
    </div>
    ),

    /* 03 · Comment lands */
    () => (
    <div className="max-w-md mx-auto lg:max-w-xl">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-(--fg) text-(--bg) shrink-0"><LogoMark size={13} /></span>
        <div className="text-sm">
          <span className="font-semibold text-(--fg)">agentdiff</span>
          <span className="text-(--faint)">[bot] commented</span>
        </div>
      </div>
      <div className="rounded-xl border border-(--border) bg-(--surface) overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-(--border) bg-(--surface-2)">
          <span className="text-[11px] font-bold text-white bg-(--danger) px-2 py-0.5 rounded-full">FAIL</span>
          <span className="text-sm font-medium text-(--fg)">Trajectory regression detected</span>
        </div>
        <div className="px-4 py-4">
          <div className="rounded-lg bg-(--bg) border border-(--border) px-4 py-3.5 font-mono text-[11.5px] leading-relaxed">
            <div className="text-(--faint)">{`culprit: "search_database" (loop entry)`}</div>
            <div className="text-(--muted) mt-1.5">
              baseline&nbsp;&nbsp;&nbsp;<span className="text-(--accent)">search → db → return</span>
            </div>
            <div className="text-(--muted)">
              candidate&nbsp;&nbsp;<span className="text-(--danger)">search → db → search ×3</span>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
            <Chip tone="red">TDI 0.42</Chip>
            <Chip tone="red">WEI 0.22</Chip>
            <Chip tone="red">+148% cost</Chip>
          </div>
        </div>
      </div>
    </div>
    ),

    /* 04 · Fix & pass */
    () => (
    <div className="max-w-md mx-auto lg:max-w-xl">
      <div className="rounded-xl border border-(--accent)/30 bg-(--accent)/5 px-4 py-3.5 mb-4">
        <span className="text-[11px] font-bold text-(--accent) bg-(--accent)/10 px-2 py-0.5 rounded-full">PASS</span>
        <span className="text-sm text-(--muted) leading-relaxed ml-2">
          Fixed the retry, rotated the baseline — re-running.
        </span>
      </div>
      <Pipeline progress={4} />
      <p className="mt-4 text-sm text-(--accent) font-medium">
        All gates passed — ready to merge.
      </p>
    </div>
    ),
  ];

  return (
    <section id="action-section" className="pt-20 lg:pt-28 pb-14 lg:pb-16 bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
        <div className="max-w-3xl mb-12 lg:mb-16">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-(--faint) block mb-4">
            Beyond the metrics
          </span>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-(--fg) leading-tight">
            Not just what changed. Why it changed - and what to do about it.
          </h2>
          <p className="mt-4 text-base text-(--muted) leading-relaxed font-normal max-w-2xl">
            A regression tool is only as good as the action it drives. AgentDiff turns divergence into an explanation, a culprit, and a gate that ships with every change.
          </p>
        </div>
        </Reveal>

        <div className="max-w-2xl mx-auto lg:max-w-4xl">
          {/* Screen viewport */}
          <Reveal>
          <div className="rounded-2xl border border-(--border) bg-(--surface) shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between px-4 h-10 border-b border-(--border)">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF5F57]" />
                <span className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
                <span className="w-2 h-2 rounded-full bg-[#28C840]" />
              </div>
              <span className="text-[10px] font-mono text-(--faint)">agentdiff · trajectory</span>
            </div>
            <div
              key={step}
              className="fade-slide px-5 py-10 sm:px-10 sm:py-12 min-h-[340px] lg:min-h-[420px] flex items-center justify-center"
            >
              {Screens[step]()}
            </div>
          </div>
          </Reveal>

          {/* Minimal control bar */}
          <Reveal delay={100}>
          <div className="mt-5 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => go(-1)}
              className="text-(--faint) hover:text-(--fg) transition-colors duration-150"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-baseline justify-center gap-2 w-44 sm:w-56">
              <span className="font-mono text-xs text-(--faint)">0{step + 1}</span>
              <span className="text-sm font-medium text-(--fg) truncate">{STEPS[step].title}</span>
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              className="text-(--faint) hover:text-(--fg) transition-colors duration-150"
              aria-label="Next step"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          </Reveal>
        </div>

        <Reveal>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
          <span className="text-[11px] text-(--faint) font-medium">
            Everything here is a real flag you can run today.
          </span>
          <a
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-(--fg) hover:text-(--muted) transition-colors duration-150"
          >
            See the full CLI
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
        </Reveal>

      </div>
    </section>
  );
}