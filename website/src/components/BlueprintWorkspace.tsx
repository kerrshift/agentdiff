"use client";

import React, { useEffect, useRef, useState } from "react";
import { SCENARIOS } from "../lib/scenarios";
import { Scenario, TraceNode } from "../lib/types";
import Reveal from "./Reveal";

interface ComparisonRow {
  index: number;
  baselineNode?: TraceNode;
  candidateNode?: TraceNode;
  diffStatus: "aligned" | "pruned" | "loop" | "added";
  diffLabel: string;
}

function ScenarioDropdown({
  value,
  onChange,
}: {
  value: Scenario;
  onChange: (scenario: Scenario) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const fail = value.status === "FAIL";

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-medium text-(--fg) outline-none transition-colors focus:border-(--fg)"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${fail ? "bg-(--danger)" : "bg-(--accent)"}`} />
          <span className="truncate">{value.name}</span>
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-(--faint) transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-(--border) bg-(--surface) shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          {SCENARIOS.map((s) => {
            const active = s.code === value.code;
            const optionFail = s.status === "FAIL";
            return (
              <li key={s.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    active ? "bg-(--surface-2) text-(--fg)" : "text-(--muted) hover:bg-(--surface-2)"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${optionFail ? "bg-(--danger)" : "bg-(--accent)"}`} />
                  <span className="flex-1 truncate text-left">{s.name}</span>
                  {active && <span className="text-(--faint)">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function BlueprintWorkspace() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);

  const getComparisonRows = (): ComparisonRow[] => {
    const nodes = activeScenario.nodes;
    if (activeScenario.code === "ROUTE_OPT") {
      return [
        { index: 1, baselineNode: nodes[0], candidateNode: { ...nodes[0] }, diffStatus: "aligned", diffLabel: "aligned" },
        { index: 2, baselineNode: nodes[1], candidateNode: { ...nodes[1] }, diffStatus: "aligned", diffLabel: "aligned" },
        { index: 3, baselineNode: nodes[2], candidateNode: undefined, diffStatus: "pruned", diffLabel: "pruned" },
        { index: 4, baselineNode: nodes[3], candidateNode: undefined, diffStatus: "pruned", diffLabel: "pruned" },
        { index: 5, baselineNode: nodes[4], candidateNode: { ...nodes[4] }, diffStatus: "aligned", diffLabel: "aligned" },
        { index: 6, baselineNode: nodes[5], candidateNode: { ...nodes[5] }, diffStatus: "aligned", diffLabel: "aligned" },
      ];
    } else if (activeScenario.code === "CYCLE_LOOP") {
      return [
        { index: 1, baselineNode: nodes[0], candidateNode: { ...nodes[0] }, diffStatus: "aligned", diffLabel: "aligned" },
        { index: 2, baselineNode: nodes[1], candidateNode: { ...nodes[1] }, diffStatus: "aligned", diffLabel: "aligned" },
        { index: 3, baselineNode: undefined, candidateNode: nodes[2], diffStatus: "loop", diffLabel: "loop" },
        { index: 4, baselineNode: undefined, candidateNode: nodes[3], diffStatus: "loop", diffLabel: "loop" },
        { index: 5, baselineNode: undefined, candidateNode: nodes[4], diffStatus: "loop", diffLabel: "loop" },
        { index: 6, baselineNode: nodes[5], candidateNode: { ...nodes[5] }, diffStatus: "aligned", diffLabel: "aligned" },
      ];
    }
    return [
      { index: 1, baselineNode: nodes[0], candidateNode: { ...nodes[0] }, diffStatus: "aligned", diffLabel: "aligned" },
      { index: 2, baselineNode: nodes[1], candidateNode: { ...nodes[1] }, diffStatus: "aligned", diffLabel: "aligned" },
      { index: 3, baselineNode: nodes[2], candidateNode: { ...nodes[2] }, diffStatus: "aligned", diffLabel: "aligned" },
      { index: 4, baselineNode: undefined, candidateNode: nodes[3], diffStatus: "added", diffLabel: "added" },
      { index: 5, baselineNode: nodes[4], candidateNode: { ...nodes[4] }, diffStatus: "aligned", diffLabel: "aligned" },
    ];
  };

  const rows = getComparisonRows();
  const isFail = activeScenario.status === "FAIL";

  return (
    <section id="workspace-section" className="py-20 lg:py-32 bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
        {/* Section Header - left rail */}
        <div className="max-w-2xl mb-10 lg:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-(--faint)">Workspace</span>
            <span className="text-[11px] text-(--faint)">3 diagnostic scenarios</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-(--fg) leading-tight">
            A diff you can read.
          </h2>
          <p className="mt-4 text-base text-(--muted) leading-relaxed font-normal">
            Drop in two traces — baseline and candidate. AgentDiff aligns them step-by-step and shows you exactly where the run changed.
          </p>
        </div>
        </Reveal>

        <Reveal delay={140}>
        {/* Scenario switcher: pills on desktop, compact selector on mobile */}
        <div className="mb-9">
          <div className="hidden sm:flex gap-2">
            {SCENARIOS.map((s) => {
              const active = activeScenario.code === s.code;
              const fail = s.status === "FAIL";
              return (
                <button
                  key={s.code}
                  onClick={() => setActiveScenario(s)}
                  aria-pressed={active}
                  className={`flex shrink-0 snap-start items-center gap-2 px-3.5 py-2.5 rounded-full text-[13px] font-medium transition-colors duration-150 ${
                    active
                      ? "bg-(--fg) text-(--bg)"
                      : "bg-transparent text-(--muted) border border-(--border) hover:border-(--border-strong) hover:text-(--fg)"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${fail ? "bg-(--danger)" : "bg-(--accent)"}`} />
                  {s.name}
                </button>
              );
            })}
          </div>

          <div className="sm:hidden">
            <label id="workspace-scenario-label" className="sr-only">
              Choose a diagnostic scenario
            </label>
            <div className="flex items-center gap-3">
              <ScenarioDropdown
                value={activeScenario}
                onChange={setActiveScenario}
              />
              <span
                className={`flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest ${
                  activeScenario.status === "FAIL" ? "text-(--danger)" : "text-(--accent)"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    activeScenario.status === "FAIL" ? "bg-(--danger)" : "bg-(--accent)"
                  }`}
                />
                {activeScenario.status}
              </span>
            </div>
          </div>
        </div>

        {/* The diff - single-column trajectory, no boxes */}
        <div className="mx-auto w-full">
          {/* Frame caption */}
          <div className="flex items-center justify-between mb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-(--faint)">
            <span className="flex items-center gap-2">
              Baseline
              <span className="text-(--border-strong)">→</span>
              Candidate
            </span>
            <span className="tabular-nums">{rows.length} trace steps</span>
          </div>

          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-(--muted)">
            {activeScenario.description}
          </p>

          {/* Trajectory timeline */}
          <div>
            {rows.map((row, idx) => {
              const isLast = idx === rows.length - 1;
              const isBad = row.diffStatus === "loop" || row.diffStatus === "pruned";
              const isAdded = row.diffStatus === "added";
              const isAligned = row.diffStatus === "aligned";
              const changed = isBad || isAdded;
              return (
                <div key={row.index} className="relative flex gap-4 pb-5 last:pb-0 sm:gap-5">
                  {/* Left rail: step number + connector line */}
                  <div className="flex flex-col items-center w-5 shrink-0">
                    <span
                      className={`font-mono text-[11px] leading-4 ${
                        changed
                          ? isAdded
                            ? "text-(--accent) font-semibold"
                            : "text-(--danger) font-semibold"
                          : "text-(--faint)"
                      }`}
                    >
                      {String(row.index).padStart(2, "0")}
                    </span>
                    {!isLast && <span className="mt-1 w-px flex-1 bg-(--border)" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5 pb-1">
                    {isAligned ? (
                      /* Aligned: one quiet node */
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-(--fg)">
                          {row.baselineNode?.label}
                        </span>
                        <span className="text-[11px] text-(--faint) tabular-nums">
                          {row.baselineNode?.tokens} tok · ${row.baselineNode?.cost.toFixed(4)}
                        </span>
                      </div>
                    ) : (
                      /* Changed: baseline → candidate, softly tinted */
                      <div
                        className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 border-l-2 px-3 py-2 ${
                          isAdded ? "border-(--accent) bg-(--accent)/10" : "border-(--danger) bg-(--danger-soft)/70"
                        }`}
                      >
                        {row.baselineNode ? (
                          <span className="text-[13px] font-medium text-(--faint) line-through">
                            {row.baselineNode.label}
                          </span>
                        ) : (
                          <span className="text-[13px] text-(--faint)">—</span>
                        )}
                        <span className="text-(--faint)">→</span>
                        <span
                          className={`flex items-center gap-2 text-[13px] font-semibold ${
                            isAdded ? "text-(--accent)" : "text-(--danger)"
                          }`}
                        >
                          {row.candidateNode?.label ?? "—"}
                          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-90">
                            {row.diffLabel}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verdict - one quiet line, no box */}
          <div className="mt-8 pt-6 border-t border-(--border) flex items-center justify-center gap-3">
            <span
              className={`flex items-center gap-2 text-sm font-semibold ${
                isFail ? "text-(--danger)" : "text-(--accent)"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isFail ? "bg-(--danger)" : "bg-(--accent)"}`} />
              {isFail ? "FAIL" : "PASS"}
            </span>
            <span className="text-sm text-(--muted) font-normal">
              {isFail ? "blocks this change until fixed" : "mergeable"}
            </span>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
