"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, FileCode2, Terminal } from "lucide-react";
import { OpenAI, Langfuse, LangSmith, LangGraph, CrewAI } from "@lobehub/icons";
import OpenTelemetry from "@/components/OpenTelemetry";
import Reveal from "@/components/Reveal";
import CodeBlock from "@/components/CodeBlock";
import AnimatedTelemetryHub from "@/components/AnimatedTelemetryHub";



const ECOSYSTEMS = [
  {
    id: "langgraph",
    name: "LangGraph",
    tag: "Native Direct",
    icon: LangGraph,
    badge: "Direct State Ingestion",
    highlight: "Zero OTel exporter overhead",
    desc: "Ingests native LangGraph checkpoint state dumps and node graphs. Automatically maps branch checkpoints and tool node executions into a linear causal DAG.",
    format: "LangGraph State Snapshots",
    cliCommand: "agentdiff baseline.json cand.json --adapter langgraph",
    pythonSnippet: `from agentdiff import load_trace\ntrace = load_trace("checkpoint.json", adapter="langgraph")`,
  },
  {
    id: "openai",
    name: "OpenAI Agents SDK",
    tag: "Built-In",
    icon: OpenAI,
    badge: "Run Tree Parsing",
    highlight: "Validated against official SDK outputs",
    desc: "Direct support for OpenAI's official Agents SDK telemetry format. Ingests function-calling tool payloads, streaming steps, and token count structures seamlessly.",
    format: "OpenAI Agents SDK Run Dump",
    cliCommand: "agentdiff baseline.json cand.json --adapter openai_agents",
    pythonSnippet: `from agentdiff import load_trace\ntrace = load_trace("run_tree.json", adapter="openai_agents")`,
  },
  {
    id: "crewai",
    name: "CrewAI",
    tag: "Multi-Agent",
    icon: CrewAI,
    badge: "Crew Output Dump",
    highlight: "Inter-agent task delegation tracking",
    desc: "Ingests CrewOutput dumps from multi-agent crew kickoffs. Maps sequential agent delegations, task outputs, and tool usage into standardized steps.",
    format: "CrewOutput Dumps",
    cliCommand: "agentdiff crew_v1.json crew_v2.json --adapter crewai",
    pythonSnippet: `from agentdiff import load_trace\ntrace = load_trace("crew_output.json", adapter="crewai")`,
  },
  {
    id: "otel",
    name: "OpenTelemetry / OpenInference",
    tag: "Industry Standard",
    icon: OpenTelemetry,
    badge: "OTel Semantic Conventions",
    highlight: "LlamaIndex, Phoenix, Traceloop",
    desc: "Compatible with any agent runtime instrumented via OpenTelemetry OpenInference standard spans. Ingests span parent-child relationships and transforms them into execution DAGs.",
    format: "OTel Span JSON / OTLP",
    cliCommand: "agentdiff otel_base.json otel_cand.json --adapter openinference",
    pythonSnippet: `from agentdiff import load_trace\ntrace = load_trace("spans.json", adapter="openinference")`,
  },
  {
    id: "langfuse",
    name: "Langfuse",
    tag: "Observability",
    icon: Langfuse,
    badge: "SDK Trace Export",
    highlight: "Snake_case normalization & latency maps",
    desc: "Ingest trace dumps directly from the Langfuse SDK or API. Normalizes observations, scores, and nested generation steps into strict deterministic nodes.",
    format: "Langfuse Trace Dumps",
    cliCommand: "agentdiff langfuse_base.json langfuse_cand.json --adapter langfuse",
    pythonSnippet: `from agentdiff import load_trace\ntrace = load_trace("langfuse.json", adapter="langfuse")`,
  },
  {
    id: "langsmith",
    name: "LangSmith",
    tag: "Observability",
    icon: LangSmith,
    badge: "Run Tree Sync",
    highlight: "Hierarchical run tree reconstruction",
    desc: "Converts hierarchical run trees exported from the LangSmith platform into standardized AgentTrace schema ready for regression evaluation in CI.",
    format: "LangSmith Run Trees",
    cliCommand: "agentdiff smith_base.json smith_cand.json --adapter langsmith",
    pythonSnippet: `from agentdiff import load_trace\ntrace = load_trace("smith_run.json", adapter="langsmith")`,
  },
  {
    id: "generic",
    name: "Generic JSON (Canonical)",
    tag: "Native Schema",
    icon: null,
    badge: "Reference Format",
    highlight: "Produced via agentdiff record",
    desc: "AgentDiff's versioned canonical format. When using custom internal runtimes or Python SDK instrumentation, emit this format for instant, zero-conversion diffing.",
    format: "Canonical AgentTrace JSON (v1.0)",
    cliCommand: "agentdiff record -- my_agent_script.py",
    pythonSnippet: `from agentdiff import load_trace\ntrace = load_trace("trace.json") # auto-detected`,
  },
];

export default function AdaptersClient() {
  const [selectedId, setSelectedId] = useState("langgraph");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeEcosystem = ECOSYSTEMS.find((e) => e.id === selectedId) || ECOSYSTEMS[0];
  const ActiveIcon = activeEcosystem.icon;

  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="w-full font-sans divide-y divide-(--border)">
      {/* 1. MARKETING HERO */}
      <section className="relative overflow-hidden pt-20 pb-20 sm:pt-24 sm:pb-28 bg-transparent w-full">
        {/* Subtle top spotlight glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[300px] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-500/15 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="max-w-4xl">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-4 font-medium">
                Universal Telemetry Adapters
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.08]">
                Bring your own telemetry. <span className="text-emerald-500/90 dark:text-emerald-400">Zero code rewrites.</span>
              </h1>
              <p className="mt-6 text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed max-w-3xl font-normal">
                No proprietary SDK wrappers or runtime monkey-patching. Built-in adapters ingest raw JSON traces from LangGraph, CrewAI, OpenAI Agents, OpenTelemetry, Langfuse, and LangSmith in under 2ms.
              </p>

              {/* High-Impact Proof Points */}
              <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-(--muted)">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-(--fg) font-semibold">Zero SDK Lock-In</span>
                </span>
                <span className="text-(--border) select-none">•</span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Automatic Schema Fingerprinting</span>
                </span>
                <span className="text-(--border) select-none">•</span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Sub-2ms Ingestion Latency</span>
                </span>
              </div>
            </div>
          </Reveal>

          {/* Universal Telemetry Hub Visual */}
          <Reveal delay={120}>
            <div className="mt-12 sm:mt-16">
              <AnimatedTelemetryHub />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION STRIP (HIGH-HIERARCHY MARKETING PILLARS) */}
      <section className="py-24 sm:py-32 w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mb-16 sm:mb-20">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
                Architecture Guarantees
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
                Zero ingestion friction. <span className="text-emerald-500/90 dark:text-emerald-400">100% deterministic parity.</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
                AgentDiff eliminates telemetry lock-in. Regardless of how your agents execute or which framework you swap to next quarter, your CI quality gates remain rock-solid.
              </p>
            </div>
          </Reveal>

          {/* 3 Value Pillars: High-Converting Open Layout */}
          <Reveal delay={100}>
            <div className="border-t border-(--border)">
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
                
                {/* Pillar 1 */}
                <div className="py-10 lg:py-12 lg:pr-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                      01 · Zero Rewrites
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Keep Your Existing Telemetry Stack
                  </h3>
                  <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                    No proprietary SDK wrappers, monkey-patching, or invasive decorators. Feed your existing raw telemetry dumps directly into CI without changing a single line of agent code.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs text-(--muted)">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--border-strong)" />
                    <span>Zero runtime latency overhead</span>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="py-10 lg:py-12 lg:px-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-(--fg) font-semibold">
                      02 · Schema Discovery
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Automatic Format Sniffing
                  </h3>
                  <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                    AgentDiff inspects incoming JSON structures, identifies unique telemetry fingerprint keys, and auto-selects the appropriate parser with sub-2ms execution latency.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs text-(--muted)">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--border-strong)" />
                    <span>Sub-2ms automatic schema resolution</span>
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="py-10 lg:py-12 lg:pl-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                      03 · Parity Guarantee
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Mathematical Metric Parity
                  </h3>
                  <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                    Every trace resolves into the exact same canonical DAG contract. Trajectory Divergence (TDI), Wasted Effort, Loop Detection, and Recovery Ratios calculate with 100% mathematical parity.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs text-(--muted)">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--border-strong)" />
                    <span>Zero floating point or platform drift</span>
                  </div>
                </div>

              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. SUPPORTED FRAMEWORKS SHOWCASE */}
      <section className="py-24 sm:py-32 w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mb-16 sm:mb-20">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
                Supported Ecosystems
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
                Battle-tested on production trace formats.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
                Each built-in adapter is continuously verified with regression test suites against live framework dumps, ensuring schema fidelity across new framework releases.
              </p>
            </div>
          </Reveal>

          {/* Master-Detail Interactive Showcase */}
          <Reveal delay={100}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* Left Column: Quick-Select Ecosystem List (5 cols) */}
              <div className="w-full lg:col-span-5 flex flex-col gap-2">
                {ECOSYSTEMS.map((eco) => {
                  const isSelected = eco.id === selectedId;
                  const EcoIcon = eco.icon;
                  return (
                    <button
                      key={eco.id}
                      onClick={() => setSelectedId(eco.id)}
                      className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between gap-4 cursor-pointer ${
                        isSelected
                          ? "bg-(--surface-2) border border-(--border-strong) shadow-2xs"
                          : "hover:bg-(--surface-2)/40 text-(--muted) border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-(--surface) border border-(--border) flex items-center justify-center shrink-0 text-(--fg)">
                          {EcoIcon ? (
                            <EcoIcon size={20} />
                          ) : (
                            <Terminal size={19} />
                          )}
                        </div>
                        <div className="truncate">
                          <div
                            className={`text-sm sm:text-base font-semibold truncate ${
                              isSelected ? "text-(--fg)" : "text-(--muted)"
                            }`}
                          >
                            {eco.name}
                          </div>
                          <div className="text-xs text-(--faint) truncate font-normal mt-0.5">
                            {eco.format}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 border ${
                          isSelected
                            ? "bg-(--surface) text-emerald-500 border-emerald-500/20 font-semibold"
                            : "border-(--border) text-(--faint)"
                        }`}
                      >
                        {eco.tag}
                      </span>
                    </button>
                  );
                })}

                {/* Custom Adapter Direct CTA */}
                <div className="p-4 sm:p-5 rounded-2xl bg-(--surface-2)/30 border border-dashed border-(--border) flex items-center justify-between gap-4 mt-2">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-(--surface) border border-(--border) flex items-center justify-center text-(--muted) shrink-0">
                      <FileCode2 size={19} />
                    </div>
                    <div className="truncate">
                      <div className="text-sm sm:text-base font-semibold text-(--fg) truncate">Custom Runtime</div>
                      <div className="text-xs text-(--muted) truncate font-normal mt-0.5">~50 LOC Plugin Protocol</div>
                    </div>
                  </div>
                  <Link
                    href="/docs/custom-adapters"
                    className="px-4 py-2 rounded-lg bg-(--surface) border border-(--border) hover:border-(--border-strong) text-xs font-semibold text-(--fg) inline-flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <span>Build</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Dynamic Deep-Dive Stage (7 cols) */}
              <div className="w-full lg:col-span-7 rounded-2xl bg-(--surface) border border-(--border) p-6 sm:p-8 flex flex-col justify-between shadow-2xs">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 pb-5 border-b border-(--border)">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-(--surface-2) border border-(--border) flex items-center justify-center text-(--fg) shrink-0">
                        {ActiveIcon ? (
                          <ActiveIcon size={24} />
                        ) : (
                          <Terminal size={22} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-(--fg) tracking-tight">
                          {activeEcosystem.name}
                        </h3>
                        <div className="text-xs text-(--muted) mt-0.5">
                          Ingestion format: {activeEcosystem.format}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {activeEcosystem.badge}
                    </span>
                  </div>

                  {/* Highlight & Description */}
                  <div className="space-y-2">
                    <div className="text-base font-semibold text-(--fg)">
                      {activeEcosystem.highlight}
                    </div>
                    <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                      {activeEcosystem.desc}
                    </p>
                  </div>

                  {/* Code Examples */}
                  <div className="space-y-5 pt-1">
                    {/* CLI Command */}
                    <div>
                      <div className="text-xs text-(--faint) uppercase tracking-wider font-semibold mb-2 flex items-center justify-between">
                        <span>CLI Diff Command</span>
                        <button
                          onClick={() => copyCommand(activeEcosystem.cliCommand, `cli-${activeEcosystem.id}`)}
                          className="flex items-center gap-1.5 text-xs text-(--muted) hover:text-(--fg) transition-colors cursor-pointer"
                        >
                          {copiedId === `cli-${activeEcosystem.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3.5 sm:p-4 rounded-xl bg-(--code-bg) border border-(--border) font-mono text-xs text-(--fg) overflow-x-auto">
                        <code>{activeEcosystem.cliCommand}</code>
                      </div>
                    </div>

                    {/* Python Snippet */}
                    <div>
                      <div className="text-xs text-(--faint) uppercase tracking-wider font-semibold mb-2">
                        Python SDK Usage
                      </div>
                      <div className="p-3.5 sm:p-4 rounded-xl bg-(--code-bg) border border-(--border) font-mono text-xs text-(--muted) overflow-x-auto leading-relaxed">
                        <pre className="text-(--fg)">{activeEcosystem.pythonSnippet}</pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Guarantee Note */}
                <div className="pt-6 mt-6 border-t border-(--border) flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-(--muted)">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Sub-2ms Execution Latency</span>
                  </span>
                  <span className="text-(--fg) font-medium">100% Deterministic DAG Parity</span>
                </div>
              </div>

            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. EXTENSIBILITY PROTOCOL (DEVELOPER ARCHITECTURE) */}
      <section className="py-24 sm:py-32 w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mb-16 sm:mb-20">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
                Developer Protocol &amp; Extensibility
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
                Build a custom adapter <span className="text-emerald-500/90 dark:text-emerald-400">in ~50 lines of Python.</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
                Running an in-house agent framework or proprietary telemetry pipeline? AgentDiff&apos;s modular plugin architecture lets you normalize custom execution schemas into canonical DAGs with a single Python class.
              </p>
            </div>
          </Reveal>

          {/* 3-Stage Extensibility Pipeline */}
          <Reveal delay={100}>
            <div className="border-t border-(--border)">
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
                
                {/* Stage 1: Subclass BaseAdapter */}
                <div className="py-10 lg:py-12 lg:pr-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                      Stage 1 · Mapping
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Subclass BaseAdapter
                  </h3>
                  <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                    Implement the mandatory <code className="text-xs font-mono text-(--fg) bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">from_dict()</code> classmethod to map proprietary telemetry keys into standardized <code className="text-xs font-mono text-(--fg) bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">TraceStep</code> nodes.
                  </p>
                  <div className="text-xs text-(--faint) pt-1">
                    Single mandatory abstractmethod
                  </div>
                </div>

                {/* Stage 2: Format Sniffer */}
                <div className="py-10 lg:py-12 lg:px-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-(--fg) font-semibold">
                      Stage 2 · Sniffing
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Declare Format Sniffer
                  </h3>
                  <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                    Add an optional <code className="text-xs font-mono text-(--fg) bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">detect(data) -&gt; bool</code> fingerprint to let the CLI and SDK automatically resolve your format without explicit flags.
                  </p>
                  <div className="text-xs text-(--faint) pt-1">
                    Zero-config format discovery
                  </div>
                </div>

                {/* Stage 3: Python Entry-Points */}
                <div className="py-10 lg:py-12 lg:pl-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold">
                      Stage 3 · Discovery
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Zero-Fork Registration
                  </h3>
                  <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                    Register your package under the <code className="text-xs font-mono text-(--fg) bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">agentdiff.adapters</code> entry-point. Discovered lazily by CLI runners with no core fork required.
                  </p>
                  <div className="text-xs text-(--faint) pt-1">
                    Published as standalone PyPI packages
                  </div>
                </div>

              </div>
            </div>
          </Reveal>

          {/* Split Spec / Code Block */}
          <Reveal delay={120}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start mt-16 pt-16 border-t border-(--border)">
              
              {/* Left: Plugin Architecture Notes */}
              <div className="lg:col-span-5 space-y-5">
                <span className="text-xs uppercase tracking-wider text-(--faint) font-semibold block">
                  Production Plugin Blueprint
                </span>
                <h3 className="text-2xl font-bold text-(--fg) tracking-tight">
                  Clean separation between raw traces and graph comparison.
                </h3>
                <p className="text-base text-(--muted) leading-relaxed">
                  The comparison engine never needs to know whether an event originated from an HTTP span, JSON log, or database dump. Your adapter handles schema normalization once, and all 5 regression metrics run automatically.
                </p>

                <div className="p-4 rounded-xl bg-(--surface-2)/60 border border-(--border) space-y-2">
                  <div className="text-xs font-bold text-(--fg)">
                    Entry-Point Declaration in pyproject.toml:
                  </div>
                  <div className="font-mono text-xs text-(--muted) space-y-1">
                    <div className="text-(--faint)">[project.entry-points.&quot;agentdiff.adapters&quot;]</div>
                    <div className="text-emerald-500 font-semibold">acme_agent = &quot;acme.telemetry:AcmeAdapter&quot;</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-(--muted)">
                  <span className="flex items-center gap-2 font-medium text-(--fg)">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Sub-2ms Ingestion Time</span>
                  </span>
                  <span>•</span>
                  <span>Zero Memory Copies</span>
                </div>
              </div>

              {/* Right: Python Custom Adapter Implementation */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl border border-(--border) bg-(--surface) overflow-hidden shadow-2xs">
                  <CodeBlock
                    language="python"
                    filename="custom_adapter.py"
                    code={`from agentdiff.adapters.base import BaseAdapter
from agentdiff.models.trace import AgentTrace, TraceStep

class AcmeAgentAdapter(BaseAdapter):
    """Normalizes Acme internal agent execution telemetry into canonical DAGs."""
    
    @classmethod
    def detect(cls, data: dict) -> bool:
        """Auto-sniffs Acme JSON dumps by signature keys."""
        return "acme_run_id" in data and "execution_spans" in data

    @classmethod
    def from_dict(cls, data: dict) -> AgentTrace:
        """Transforms arbitrary internal spans into immutable TraceSteps."""
        steps = []
        for idx, span in enumerate(data.get("execution_spans", [])):
            steps.append(
                TraceStep(
                    step_id=span["span_id"],
                    parent_id=span.get("parent_span_id"),
                    step_index=idx,
                    step_type=span.get("type", "tool"),
                    name=span["operation_name"],
                    input_payload=span.get("inputs", {}),
                    output_payload=span.get("outputs", {}),
                    latency_ms=span.get("duration_ms", 0.0),
                )
            )
        return AgentTrace(steps=steps)`}
                  />
                </div>
              </div>

            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-24 sm:py-36 w-full bg-transparent text-center border-t border-(--border) relative overflow-hidden">
        {/* Top-Right Emerald Flare */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/15 dark:bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
        
        {/* Center ambient wash */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[300px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="max-w-3xl mx-auto space-y-6">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block font-medium">
                Start In Minutes
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.08]">
                Ready to diff your telemetry <span className="text-emerald-500/90 dark:text-emerald-400">with zero rewrites?</span>
              </h2>
              <p className="text-base sm:text-lg text-(--muted) max-w-xl mx-auto font-normal leading-relaxed">
                Pass existing LangGraph, CrewAI, OpenAI, or OTel traces directly into CI. Block regressions before merge.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm font-semibold">
                <Link
                  href="/quickstart"
                  className="px-8 py-3.5 rounded-full bg-(--fg) text-(--bg) hover:opacity-90 transition-opacity shadow-sm"
                >
                  Get Started with Quickstart →
                </Link>
                <Link
                  href="/docs/custom-adapters"
                  className="px-8 py-3.5 rounded-full border border-(--border) text-(--fg) hover:bg-(--surface-2) transition-colors"
                >
                  Read Adapter Protocol Docs
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
