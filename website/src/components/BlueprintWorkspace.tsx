"use client";

import React, { useState, useEffect, useRef } from "react";
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

function NodeCell({ node, index, pruned }: { node?: TraceNode; index: number; pruned?: boolean }) {
  if (!node) {
    return <div className="h-9 flex items-center text-[#E4E4E7] font-mono text-xs">—</div>;
  }
  return (
    <div>
      <div className="text-[11px] text-[#A1A1AA] font-mono mb-0.5">
        Step {String(index).padStart(2, "0")} · {node.tokens} tok · ${node.cost.toFixed(4)}
      </div>
      <div className={`text-sm font-medium ${pruned ? "line-through text-[#A1A1AA]" : "text-[#18181B]"}`}>
        {node.label}
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<ComparisonRow["diffStatus"], string> = {
  aligned: "text-[#A1A1AA]",
  pruned: "text-[#C2262B]",
  loop: "text-[#C2262B]",
  added: "text-[#0B8C6C]",
};

export default function BlueprintWorkspace() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSystemLogs([]);
    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < activeScenario.logs.length) {
        const logLine = activeScenario.logs[currentLogIndex];
        if (logLine) setSystemLogs((prev) => [...prev, logLine]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
      }
    }, 140);
    return () => clearInterval(interval);
  }, [activeScenario]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [systemLogs]);

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
    <section id="workspace-section" className="py-24 border-t border-[#E4E4E7] bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
        {/* Section Header — left rail */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#A1A1AA] font-medium block mb-4">Workspace</span>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-[#18181B] leading-tight">
            A diff you can read.
          </h2>
          <p className="mt-4 text-base text-[#52525B] leading-relaxed font-normal">
            Pick a diagnostic scenario. AgentDiff aligns the baseline and candidate runs step-by-step and flags exactly where they diverge.
          </p>
        </div>
        </Reveal>

        <Reveal delay={140}>
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 sm:p-8">

        {/* Scenario switcher — ink underline tabs */}
        <div className="flex flex-wrap gap-7 mb-10 border-b border-[#E4E4E7] -mb-px">
          {SCENARIOS.map((s) => {
            const active = activeScenario.code === s.code;
            return (
              <button
                key={s.code}
                onClick={() => setActiveScenario(s)}
                className={`relative text-sm font-semibold py-3 transition-colors duration-150 ${
                  active ? "text-[#18181B]" : "text-[#A1A1AA] hover:text-[#18181B]"
                }`}
              >
                {s.name}
                <span
                  className={`absolute left-0 bottom-0 h-0.5 bg-[#18181B] transition-all duration-200 ${
                    active ? "w-full" : "w-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Comparison + side panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* LEFT: comparison */}
          <div className="lg:col-span-8">
            {/* Column labels */}
            <div className="grid grid-cols-12 gap-4 pb-3 mb-1 text-[10px] font-mono uppercase tracking-[0.14em] text-[#A1A1AA]">
              <div className="col-span-5">Baseline</div>
              <div className="col-span-2 text-center">Diff</div>
              <div className="col-span-5 text-right">Candidate</div>
            </div>

            <div className="divide-y divide-[#E4E4E7]">
              {rows.map((row) => {
                const isLoop = row.diffStatus === "loop";
                const isPruned = row.diffStatus === "pruned";
                return (
                  <div
                    key={row.index}
                    className={`grid grid-cols-12 gap-4 items-center py-4 ${
                      isLoop || isPruned ? "border-l-2 border-[#E5484D] -ml-2 pl-2" : ""
                    }`}
                  >
                    <div className="col-span-5">
                      <NodeCell node={row.baselineNode} index={row.index} pruned={isPruned} />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <span className={`text-[10px] font-mono uppercase tracking-widest ${STATUS_STYLE[row.diffStatus]}`}>
                        {row.diffLabel}
                      </span>
                    </div>
                    <div className="col-span-5 text-right">
                      <NodeCell node={row.candidateNode} index={row.index} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: gating + logs */}
          <div className="lg:col-span-4 space-y-10">
            {/* Gating status */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#A1A1AA] mb-3 block">Gating status</span>
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded ${
                    isFail ? "bg-[#FDF2F2] text-[#C2262B]" : "bg-[#F2FBF7] text-[#0B8C6C]"
                  }`}
                >
                  {isFail ? "FAIL" : "PASS"}
                </span>
                <span className="text-sm text-[#52525B] font-normal leading-relaxed">{activeScenario.description}</span>
              </div>

              {/* Computed indices — the four core metrics */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 mt-6 pt-5">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#A1A1AA] font-mono mb-1">TDI · divergence</div>
                  <div className="font-mono text-xl font-semibold text-[#18181B]">{activeScenario.tdi}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#A1A1AA] font-mono mb-1">WEI · wasted effort</div>
                  <div className="font-mono text-xl font-semibold text-[#18181B]">{activeScenario.wei}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#A1A1AA] font-mono mb-1">Δ cost</div>
                  <div className={`font-mono text-xl font-semibold ${activeScenario.costDelta.startsWith("-") ? "text-[#0B8C6C]" : "text-[#C2262B]"}`}>
                    {activeScenario.costDelta}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#A1A1AA] font-mono mb-1">Δ latency</div>
                  <div className="font-mono text-xl font-semibold text-[#18181B]">{activeScenario.latencyDelta}</div>
                </div>
              </div>

              {/* Verdict */}
              <div className="mt-6 pt-4 flex items-center gap-3">
                <span className={`font-mono text-sm font-semibold ${isFail ? "text-[#C2262B]" : "text-[#0B8C6C]"}`}>
                  Verdict {isFail ? "FAIL" : "PASS"}
                </span>
                <span className="font-mono text-[11px] text-[#A1A1AA]">
                  {isFail ? "· blocks this change" : "· mergeable"}
                </span>
              </div>
            </div>

            {/* Evaluation logs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#A1A1AA]">Evaluation logs</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#18181B] animate-pulse"></span>
              </div>
              <div
                ref={logContainerRef}
                className="h-52 text-xs text-[#52525B] overflow-y-auto no-scrollbar space-y-2 font-mono bg-[#FBFBFC] border border-[#E4E4E7] rounded-lg p-4"
              >
                {systemLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-[#A1A1AA] font-semibold">&gt;</span>
                    <span
                      className={
                        log.includes("failed") || log.includes("Warning") || log.includes("FAIL")
                          ? "text-[#E5484D] font-semibold"
                          : log.includes("[PASS]")
                          ? "text-[#0FA47F] font-semibold"
                          : ""
                      }
                    >
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        </div>
        </Reveal>
      </div>
    </section>
  );
}