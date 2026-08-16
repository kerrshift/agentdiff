"use client";

import React, { useState, useEffect, useRef } from "react";
import { Activity, Cpu, Coins, Clock } from "lucide-react";
import { SCENARIOS } from "../lib/scenarios";
import { Scenario, TraceNode } from "../lib/types";

interface ComparisonRow {
  index: number;
  baselineNode?: TraceNode;
  candidateNode?: TraceNode;
  diffStatus: "aligned" | "pruned" | "loop" | "added";
  diffLabel: string;
}

export default function BlueprintWorkspace() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Sync logs when active scenario changes
  useEffect(() => {
    setSystemLogs([]);
    let currentLogIndex = 0;

    const interval = setInterval(() => {
      if (currentLogIndex < activeScenario.logs.length) {
        const logLine = activeScenario.logs[currentLogIndex];
        if (logLine) {
          setSystemLogs(prev => [...prev, logLine]);
        }
        currentLogIndex++;
      } else {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [activeScenario]);

  // Autoscroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [systemLogs]);

  // Generate comparison rows based on active scenario code
  const getComparisonRows = (): ComparisonRow[] => {
    const nodes = activeScenario.nodes;

    if (activeScenario.code === "ROUTE_OPT") {
      return [
        { index: 1, baselineNode: nodes[0], candidateNode: { ...nodes[0] }, diffStatus: "aligned", diffLabel: "Aligned" },
        { index: 2, baselineNode: nodes[1], candidateNode: { ...nodes[1] }, diffStatus: "aligned", diffLabel: "Aligned" },
        { index: 3, baselineNode: nodes[2], candidateNode: undefined, diffStatus: "pruned", diffLabel: "Cached" },
        { index: 4, baselineNode: nodes[3], candidateNode: undefined, diffStatus: "pruned", diffLabel: "Cached" },
        { index: 5, baselineNode: nodes[4], candidateNode: { ...nodes[4], id: "c4" }, diffStatus: "aligned", diffLabel: "Aligned" },
        { index: 6, baselineNode: nodes[5], candidateNode: { ...nodes[5], id: "c5" }, diffStatus: "aligned", diffLabel: "Aligned" }
      ];
    } else if (activeScenario.code === "CYCLE_LOOP") {
      return [
        { index: 1, baselineNode: nodes[0], candidateNode: { ...nodes[0] }, diffStatus: "aligned", diffLabel: "Aligned" },
        { index: 2, baselineNode: nodes[1], candidateNode: { ...nodes[1] }, diffStatus: "aligned", diffLabel: "Aligned" },
        { index: 3, baselineNode: undefined, candidateNode: nodes[2], diffStatus: "loop", diffLabel: "Loop iter 1" },
        { index: 4, baselineNode: undefined, candidateNode: nodes[3], diffStatus: "loop", diffLabel: "Loop iter 2" },
        { index: 5, baselineNode: undefined, candidateNode: nodes[4], diffStatus: "loop", diffLabel: "Loop iter 3" },
        { index: 6, baselineNode: nodes[5], candidateNode: { ...nodes[5] }, diffStatus: "aligned", diffLabel: "Aligned" }
      ];
    } else {
      // ERR_RECOV
      return [
        { index: 1, baselineNode: nodes[0], candidateNode: { ...nodes[0] }, diffStatus: "aligned", diffLabel: "Aligned" },
        { index: 2, baselineNode: nodes[1], candidateNode: { ...nodes[1] }, diffStatus: "aligned", diffLabel: "Aligned" },
        { index: 3, baselineNode: nodes[2], candidateNode: { ...nodes[2] }, diffStatus: "aligned", diffLabel: "Aligned" },
        { index: 4, baselineNode: undefined, candidateNode: nodes[3], diffStatus: "added", diffLabel: "Fallback path" },
        { index: 5, baselineNode: nodes[4], candidateNode: { ...nodes[4] }, diffStatus: "aligned", diffLabel: "Aligned" }
      ];
    }
  };

  const rows = getComparisonRows();

  return (
    <section id="workspace-section" className="py-24 bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-[#1E2028]/60">
          <div>
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-4">Workspace preview</span>
            
            {/* Drafting Box */}
            <div className="relative p-4 my-2 inline-block">
              <div className="absolute top-0 left-[-12px] right-[-12px] h-[1px] bg-[#1E2028]/85"></div>
              <div className="absolute bottom-0 left-[-12px] right-[-12px] h-[1px] bg-[#1E2028]/85"></div>
              <div className="absolute left-0 top-[-12px] bottom-[-12px] w-[1px] bg-[#1E2028]/85"></div>
              <div className="absolute right-0 top-[-12px] bottom-[-12px] w-[1px] bg-[#1E2028]/85"></div>

              <h2 className="text-2xl font-bold tracking-tight text-zinc-150 leading-tight">
                Interactive trajectory blueprint
              </h2>
            </div>
          </div>
          <div className="mt-4 md:mt-0 max-w-md text-sm text-zinc-400 font-normal leading-relaxed">
            Select a diagnostic scenario below to inspect how AgentDiff aligns execution graphs and exposes regressions side-by-side.
          </div>
        </div>

        {/* Tab Scenario Switcher */}
        <div className="flex flex-wrap gap-2 mb-8 bg-[#090A0D]/60 border border-[#1E2028] p-1.5 rounded-xl w-fit">
          {SCENARIOS.map((s, idx) => {
            const active = activeScenario.code === s.code;
            return (
              <button
                key={idx}
                onClick={() => setActiveScenario(s)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${active
                  ? "bg-[#1E222B] text-zinc-200 shadow-sm border border-[#2A2E3D]/40"
                  : "bg-transparent text-zinc-500 hover:text-zinc-350 border border-transparent"
                  }`}
              >
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                )}
                {s.name}
              </button>
            );
          })}
        </div>

        {/* MAIN STRUCTURED CANVAS CONTAINER */}
        <div className="bg-[#0D0E11] border border-[#1E2028] rounded-2xl p-8 shadow-2xl relative overflow-hidden">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-8">

            {/* LEFT: STEP COMPARATOR WORKSPACE */}
            <div className="lg:col-span-8 space-y-4">

              {/* Header: Run Labels */}
              <div className="grid grid-cols-7 gap-4 text-xs font-semibold text-zinc-350 uppercase tracking-wider pb-3 border-b border-[#1E2028] px-4">
                <div className="col-span-3">Baseline run</div>
                <div className="col-span-1 text-center">Diff</div>
                <div className="col-span-3 text-right">Candidate run</div>
              </div>

              {/* Steps List */}
              <div className="divide-y divide-[#1E2028]/40">
                {rows.map((row) => (
                  <div
                    key={row.index}
                    className={`grid grid-cols-1 md:grid-cols-7 gap-4 items-center py-5 px-4 transition-colors duration-150 rounded-lg ${row.diffStatus === "pruned"
                      ? "bg-rose-500/[0.01]"
                      : row.diffStatus === "loop"
                        ? "bg-rose-500/[0.02]"
                        : row.diffStatus === "added"
                          ? "bg-emerald-500/[0.01]"
                          : "hover:bg-[#12141A]/50"
                      }`}
                  >

                    {/* Baseline Node */}
                    <div className="md:col-span-3">
                      {row.baselineNode ? (
                        <div className="transition-colors duration-150">
                          {/* Consolidated Metadata */}
                          <div className="text-xs text-zinc-450 font-mono mb-1">
                            Step {row.index.toString().padStart(2, '0')} · {row.baselineNode.tokens} tokens · ${row.baselineNode.cost.toFixed(4)}
                          </div>

                          {/* Tool Name */}
                          <div className={`text-sm font-semibold text-white ${row.diffStatus === "pruned" ? "line-through text-zinc-500" : ""}`}>
                            {row.baselineNode.label}
                          </div>

                          {/* Monospace Argument Pill */}
                          {row.baselineNode.args && (
                            <div className="mt-1.5 font-mono text-[11px] text-zinc-400 bg-[#16181D] border border-[#2E303E]/40 px-2 py-0.5 rounded-md inline-block max-w-full truncate">
                              {row.baselineNode.args}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-12 flex items-center text-zinc-700 text-xs font-light">
                          —
                        </div>
                      )}
                    </div>

                    {/* Diff Linker SVG Connectors */}
                    <div className="md:col-span-1 flex flex-col items-center justify-center flex-shrink-0">
                      <div className="w-12 h-16 flex items-center justify-center flex-shrink-0">
                        <svg width="48" height="64" viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="flex-shrink-0">
                          {/* Vertical Connector Path */}
                          <line x1="24" y1="0" x2="24" y2="64" stroke="#2E303E" strokeWidth="2" strokeDasharray="3 3" />

                          {row.diffStatus === "aligned" && (
                            <>
                              <line x1="0" y1="32" x2="48" y2="32" stroke="#2E303E" strokeWidth="2" />
                              <circle cx="24" cy="32" r="5" fill="#6366F1" stroke="#4F46E5" strokeWidth="2" />
                            </>
                          )}

                          {row.diffStatus === "pruned" && (
                            <>
                              <line x1="0" y1="32" x2="24" y2="32" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.6" />
                              <circle cx="24" cy="32" r="5" fill="#EF4444" stroke="#7F1D1D" strokeWidth="2" />
                            </>
                          )}

                          {row.diffStatus === "added" && (
                            <>
                              <line x1="24" y1="32" x2="48" y2="32" stroke="#10B981" strokeWidth="2" strokeOpacity="0.6" />
                              <circle cx="24" cy="32" r="5" fill="#10B981" stroke="#064E3B" strokeWidth="2" />
                            </>
                          )}

                          {row.diffStatus === "loop" && (
                            <>
                              {/* Vector-sharp circular loop arrow path */}
                              <path d="M24 22 A 10 10 0 1 1 17 39" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" fill="none" />
                              <path d="M13 37 L17 39 L18 34" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                              <circle cx="24" cy="32" r="5" fill="#EF4444" stroke="#7F1D1D" strokeWidth="2" />
                            </>
                          )}
                        </svg>
                      </div>
                      <span className={`text-[10px] font-mono font-semibold tracking-wider uppercase mt-1 ${row.diffStatus === "aligned"
                        ? "text-zinc-500"
                        : row.diffStatus === "pruned"
                          ? "text-rose-450"
                          : row.diffStatus === "loop"
                            ? "text-amber-450"
                            : "text-emerald-450"
                        }`}>
                        {row.diffLabel}
                      </span>
                    </div>

                    {/* Candidate Node */}
                    <div className="md:col-span-3 text-right">
                      {row.candidateNode ? (
                        <div className="transition-colors duration-150">
                          {/* Consolidated Metadata */}
                          <div className="text-xs text-zinc-450 font-mono mb-1">
                            Step {row.index.toString().padStart(2, '0')} · {row.candidateNode.tokens} tokens · ${row.candidateNode.cost.toFixed(4)}
                          </div>

                          {/* Tool Name */}
                          <div className="text-sm font-semibold text-white">
                            {row.candidateNode.label}
                          </div>

                          {/* Monospace Argument Pill */}
                          {row.candidateNode.args && (
                            <div className="mt-1.5 font-mono text-[11px] text-zinc-400 bg-[#16181D] border border-[#2E303E]/40 px-2 py-0.5 rounded-md inline-block max-w-full truncate text-left">
                              {row.candidateNode.args}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-12 flex items-center justify-end text-zinc-700 text-xs font-light">
                          —
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>

            </div>

            {/* RIGHT: BRIEFING, LOGS & SUMMARY STATS */}
            <div className="lg:col-span-4 space-y-8 lg:pl-4">

              {/* Run summary */}
              <div className="space-y-4">
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">Gating status</span>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold border rounded-lg ${activeScenario.status === "PASS"
                    ? "bg-[#10b981]/10 text-[#10B981] border-[#10B981]/20"
                    : "bg-[#ef4444]/10 text-[#EF4444] border-[#EF4444]/20"
                    }`}>
                    {activeScenario.status === "PASS" ? "Pass" : "Fail"}
                  </span>
                  <span className="text-xs text-zinc-400 font-light leading-relaxed">{activeScenario.description}</span>
                </div>
              </div>

              {/* Audit Log Stream */}
              <div className="pt-6 border-t border-[#1E2028]">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold mb-3">
                  <span>Evaluation logs</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-650 animate-pulse"></span>
                </div>
                <div
                  ref={logContainerRef}
                  className="h-44 text-xs text-zinc-300 overflow-y-auto no-scrollbar space-y-2 font-mono bg-[#090A0D]/80 p-4 rounded-xl border border-[#1E2028]/60"
                >
                  {systemLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-zinc-500 font-semibold">&gt;</span>
                      <span className={log && (log.includes("failed") || log.includes("Warning") || log.includes("FAIL")) ? "text-rose-400 font-semibold" : log && log.includes("[PASS]") ? "text-emerald-400 font-semibold" : ""}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* DOCKED SUMMARY FOOTER (KPIs) */}
          <div className="border-t border-[#1E2028] mt-8 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 bg-[#090A0D] -mx-8 -mb-8 p-8 rounded-b-2xl">
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-zinc-550" />
              <div>
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">Cost delta</span>
                <span className={`text-2xl font-bold tracking-tight ${activeScenario.costDelta.startsWith("-") ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                  {activeScenario.costDelta}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-zinc-550" />
              <div>
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">Latency delta</span>
                <span className="text-2xl font-bold tracking-tight text-zinc-200">{activeScenario.latencyDelta}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-zinc-550" />
              <div>
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">WEI threshold</span>
                <span className="text-2xl font-bold tracking-tight text-zinc-200">0.15 Index</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-zinc-550" />
              <div>
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">Normalization</span>
                <span className="text-xl font-bold tracking-tight text-zinc-200">OpenInference</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
