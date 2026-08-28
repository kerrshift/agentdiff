"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, FileCode2, Terminal } from "lucide-react";
import { OpenAI, Langfuse, LangSmith, LangGraph, CrewAI } from "@lobehub/icons";
import OpenTelemetry from "@/components/OpenTelemetry";
import Reveal from "@/components/Reveal";
import CodeBlock from "@/components/CodeBlock";
import AnimatedTelemetryHub from "@/components/AnimatedTelemetryHub";

/* =========================================================================
   CUSTOM VECTOR ASSET: 50-Line Adapter Protocol Visual
   ========================================================================= */
function CustomProtocolAsset() {
  return (
    <div className="w-full my-8 overflow-x-auto no-scrollbar py-2">
      <svg viewBox="0 0 880 170" className="w-full h-auto min-w-[760px] font-mono select-none" role="img">
        <defs>
          <marker id="proto-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 2 L 7 5 L 0 8 z" fill="var(--border-strong)" />
          </marker>
        </defs>

        {/* Step 1: Subclass BaseAdapter */}
        <g>
          <rect x="20" y="20" width="250" height="130" rx="12" fill="var(--surface-2)" stroke="var(--border)" />
          <text x="35" y="46" fill="var(--fg)" fontSize="10" fontWeight="700" letterSpacing="0.08em">1. SUBCLASS BASEADAPTER</text>
          <rect x="35" y="58" width="220" height="42" rx="6" fill="var(--bg)" stroke="var(--border)" />
          <text x="45" y="78" fill="var(--fg)" fontSize="11">class MyTracer(BaseAdapter):</text>
          <text x="45" y="92" fill="var(--muted)" fontSize="10">&nbsp;&nbsp;def from_dict(cls, data): ...</text>
          <text x="35" y="124" fill="var(--faint)" fontSize="10">Single mandatory abstractmethod</text>
          <text x="35" y="138" fill="var(--faint)" fontSize="9">Maps proprietary fields to AgentTrace</text>
        </g>

        <line x1="270" y1="85" x2="320" y2="85" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#proto-arr)" />

        {/* Step 2: Auto-Detection Sniffer */}
        <g>
          <rect x="325" y="20" width="250" height="130" rx="12" fill="var(--surface-2)" stroke="var(--border)" />
          <text x="340" y="46" fill="var(--fg)" fontSize="10" fontWeight="700" letterSpacing="0.08em">2. OPT-IN FORMAT SNIFFER</text>
          <rect x="340" y="58" width="220" height="42" rx="6" fill="var(--bg)" stroke="var(--border)" />
          <text x="350" y="78" fill="var(--fg)" fontSize="11">@classmethod</text>
          <text x="350" y="92" fill="var(--fg)" fontSize="11">def detect(cls, data) -&gt; bool: ...</text>
          <text x="340" y="124" fill="var(--muted)" fontSize="10">Enables automatic format discovery</text>
          <text x="340" y="138" fill="var(--faint)" fontSize="9">Sniffs distinct keys &amp; schemas</text>
        </g>

        <line x1="575" y1="85" x2="625" y2="85" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#proto-arr)" />

        {/* Step 3: Zero-Config Entrypoint Discovery */}
        <g>
          <rect x="630" y="20" width="230" height="130" rx="12" fill="var(--surface-2)" stroke="var(--border)" />
          <text x="645" y="46" fill="var(--fg)" fontSize="10" fontWeight="700" letterSpacing="0.08em">3. PYTHON ENTRY-POINTS</text>
          <rect x="645" y="58" width="200" height="42" rx="6" fill="var(--bg)" stroke="var(--border)" />
          <text x="655" y="78" fill="var(--fg)" fontSize="10">[project.entry-points]</text>
          <text x="655" y="92" fill="var(--fg)" fontSize="10">&quot;agentdiff.adapters&quot;</text>
          <text x="645" y="124" fill="var(--fg)" fontSize="10" fontWeight="600">Discovered Lazily</text>
          <text x="645" y="138" fill="var(--faint)" fontSize="9">No core codebase fork needed</text>
        </g>
      </svg>
    </div>
  );
}

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
    <div className="w-full font-sans pb-32">
      {/* 1. MARKETING HERO */}
      <section className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-5xl">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-4">
              Universal Ecosystem Adapters
            </span>
            <h1
              className="font-semibold tracking-[-0.035em] text-(--fg) leading-[1.04]"
              style={{ fontSize: "var(--text-display)" }}
            >
              Bring your own telemetry. We normalize the rest.
            </h1>
            <p
              className="mt-6 text-base sm:text-lg text-(--muted) leading-relaxed max-w-4xl font-normal"
              style={{ lineHeight: "var(--leading-subtitle)" }}
            >
              No need to re-instrument your agent or swap out your logging stack. Seven built-in adapters parse traces from LangGraph, CrewAI, OpenAI Agents, OpenTelemetry, and observability platforms into canonical execution graphs in under 2ms.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-mono">
              <span className="text-(--fg) font-semibold">Zero instrumentation lock-in</span>
              <span className="text-(--border-strong)">•</span>
              <span className="text-(--muted)">Automatic format sniffing</span>
              <span className="text-(--border-strong)">•</span>
              <span className="text-(--muted)">~50 LOC extensible protocol</span>
            </div>
          </div>
        </Reveal>

        {/* Universal Telemetry Hub Visual */}
        <Reveal delay={120}>
          <AnimatedTelemetryHub />
        </Reveal>
      </section>

      {/* 2. VALUE PROPOSITION STRIP (HIGH-HIERARCHY MARKETING PILLARS) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-2">
              Architecture Guarantees
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              Zero Ingestion Friction, 100% Deterministic Diffing
            </h2>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Pillar 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-(--fg) px-2 py-0.5 rounded bg-(--surface-2) border border-(--border)">
                  01
                </span>
                <h3 className="font-semibold text-base text-(--fg)">
                  Zero Rewrites Required
                </h3>
              </div>
              <p className="text-sm text-(--muted) leading-relaxed">
                You do not need to install proprietary SDK wrappers or modify your agent&apos;s runtime logic. Feed existing raw JSON dumps directly into the CLI or Python library.
              </p>
              <div className="text-xs font-mono text-(--faint)">
                No runtime decorator overhead
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-(--fg) px-2 py-0.5 rounded bg-(--surface-2) border border-(--border)">
                  02
                </span>
                <h3 className="font-semibold text-base text-(--fg)">
                  Format Auto-Sniffing
                </h3>
              </div>
              <p className="text-sm text-(--muted) leading-relaxed">
                AgentDiff sniffs the JSON structure, identifies unique telemetry fingerprint keys, and picks the right adapter automatically with &lt;1.8ms execution latency.
              </p>
              <div className="text-xs font-mono text-(--faint)">
                &lt;1.8ms automatic resolution
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-(--fg) px-2 py-0.5 rounded bg-(--surface-2) border border-(--border)">
                  03
                </span>
                <h3 className="font-semibold text-base text-(--fg)">
                  Identical CI Guarantees
                </h3>
              </div>
              <p className="text-sm text-(--muted) leading-relaxed">
                Whether your traces originate from LangGraph, CrewAI, or raw OTel spans, all 5 mathematical metrics (TDI, WEI, Loops, RSR) run against the same canonical DAG.
              </p>
              <div className="text-xs font-mono text-(--faint)">
                100% metric mathematical parity
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 3. SUPPORTED FRAMEWORKS SHOWCASE (SPLIT-DECK BENTO SHOWCASE) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-3">
              Supported Ecosystems
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              Built-in Telemetry Adapters
            </h2>
            <p className="mt-3 text-sm sm:text-base text-(--muted) leading-relaxed">
              Maintained with contract tests against real-world trace fixtures to guarantee schema fidelity across framework upgrades.
            </p>
          </div>
        </Reveal>

        {/* Master-Detail Interactive Showcase */}
        <Reveal delay={100}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Quick-Select Ecosystem List (Full-width on mobile, 5 cols on desktop) */}
            <div className="w-full lg:col-span-5 flex flex-col gap-2">
              {ECOSYSTEMS.map((eco) => {
                const isSelected = eco.id === selectedId;
                const EcoIcon = eco.icon;
                return (
                  <button
                    key={eco.id}
                    onClick={() => {
                      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                        setSelectedId(eco.id);
                      }
                    }}
                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between gap-4 pointer-events-none lg:pointer-events-auto lg:cursor-pointer ${
                      isSelected
                        ? "lg:bg-(--surface-2) lg:shadow-xs"
                        : "lg:hover:bg-(--surface-2)/40 text-(--muted)"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-(--fg)">
                        {EcoIcon ? (
                          <EcoIcon size={20} />
                        ) : (
                          <Terminal size={18} />
                        )}
                      </div>
                      <div className="truncate">
                        <div
                          className={`text-sm font-semibold truncate text-(--fg) lg:${
                            isSelected ? "text-(--fg)" : "text-(--muted)"
                          }`}
                        >
                          {eco.name}
                        </div>
                        <div className="text-[11px] font-mono text-(--faint) truncate">
                          {eco.format}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full shrink-0 border ${
                        isSelected
                          ? "bg-(--surface) text-(--fg) border-(--border)"
                          : "border-transparent text-(--faint)"
                      }`}
                    >
                      {eco.tag}
                    </span>
                  </button>
                );
              })}

              {/* Custom Adapter Direct CTA */}
              <div className="p-4 rounded-2xl bg-(--surface-2)/20 border border-dashed border-(--border) flex items-center justify-between gap-4 mt-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-(--surface) border border-(--border) flex items-center justify-center text-(--muted) shrink-0">
                    <FileCode2 size={17} />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-semibold text-(--fg) truncate">Custom Runtime</div>
                    <div className="text-[11px] font-mono text-(--faint) truncate">~50 LOC Plugin API</div>
                  </div>
                </div>
                <Link
                  href="/docs/custom-adapters"
                  className="px-3 py-1.5 rounded-lg bg-(--surface) border border-(--border) hover:border-(--border-strong) text-xs font-mono font-medium text-(--fg) inline-flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <span>Build</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Column: Dynamic Deep-Dive Stage (Hidden on mobile, visible on lg screens) */}
            <div className="hidden lg:flex lg:col-span-7 rounded-3xl bg-(--surface) border border-(--border) p-6 sm:p-8 flex-col justify-between shadow-xs">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-(--surface-2) border border-(--border) flex items-center justify-center text-(--fg) shrink-0">
                      {ActiveIcon ? (
                        <ActiveIcon size={24} />
                      ) : (
                        <Terminal size={22} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-(--fg) tracking-tight">
                        {activeEcosystem.name}
                      </h3>
                      <div className="text-xs font-mono text-(--faint)">
                        Source: {activeEcosystem.format}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-(--surface-2) text-(--fg) border border-(--border)">
                    {activeEcosystem.badge}
                  </span>
                </div>

                {/* Highlight & Description */}
                <div className="space-y-2">
                  <div className="text-sm font-mono font-semibold text-(--fg)">
                    {activeEcosystem.highlight}
                  </div>
                  <p className="text-sm text-(--muted) leading-relaxed">
                    {activeEcosystem.desc}
                  </p>
                </div>

                {/* Code Examples */}
                <div className="space-y-4 pt-2">
                  {/* CLI Command */}
                  <div>
                    <div className="text-[11px] font-mono text-(--faint) uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>CLI Command</span>
                      <button
                        onClick={() => copyCommand(activeEcosystem.cliCommand, `cli-${activeEcosystem.id}`)}
                        className="flex items-center gap-1 text-(--muted) hover:text-(--fg) transition-colors cursor-pointer"
                      >
                        {copiedId === `cli-${activeEcosystem.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[10px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-(--code-bg) border border-(--border) font-mono text-xs text-(--fg) overflow-x-auto">
                      <code>{activeEcosystem.cliCommand}</code>
                    </div>
                  </div>

                  {/* Python Snippet */}
                  <div>
                    <div className="text-[11px] font-mono text-(--faint) uppercase tracking-wider mb-1.5">
                      Python SDK Invocation
                    </div>
                    <div className="p-3 rounded-xl bg-(--code-bg) border border-(--border) font-mono text-xs text-(--muted) overflow-x-auto leading-relaxed">
                      <pre className="text-(--fg)">{activeEcosystem.pythonSnippet}</pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Guarantee Note */}
              <div className="pt-6 mt-6 border-t border-(--border) flex items-center justify-between text-xs text-(--faint) font-mono">
                <span>⚡ &lt;1.8ms Execution Latency</span>
                <span>Deterministic Canonical DAG Output</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 4. EXTENSIBILITY PROTOCOL (TECHNICAL SPECIFICATION) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-(--border)">
        <Reveal>
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-3">
              Developer Protocol & Extensibility
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              Writing a Custom Adapter in ~50 Lines
            </h2>
            <p className="mt-3 text-sm sm:text-base text-(--muted) leading-relaxed">
              AgentDiff uses a plugin architecture. Implementing an adapter requires only one class method to map your schema into canonical trace steps:
            </p>
          </div>
        </Reveal>

        {/* Custom Protocol Visual */}
        <Reveal delay={100}>
          <CustomProtocolAsset />
        </Reveal>

        <Reveal delay={120}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
            <div className="lg:col-span-6 space-y-4 text-sm text-(--muted) leading-relaxed">
              <p>
                Any Python class inheriting from <code className="font-mono text-xs text-(--fg)">BaseAdapter</code> can participate in auto-detection by declaring a <code className="font-mono text-xs text-(--fg)">detect(data) -&gt; bool</code> method.
              </p>
              <div className="p-4 rounded-xl bg-(--code-bg) border border-(--border) font-mono text-xs space-y-2">
                <div className="text-(--fg) font-semibold">1. Standard Entry-Point Registration</div>
                <div className="text-(--faint)"># In your package pyproject.toml:</div>
                <div className="text-(--muted)">
                  [project.entry-points.&quot;agentdiff.adapters&quot;]<br />
                  my_tracer = &quot;my_package.adapter:MyAdapter&quot;
                </div>
              </div>
              <p>
                Once registered via entry-points or <code className="font-mono text-xs text-(--fg)">register_adapter()</code>, the CLI and Python SDK automatically discover the new adapter with zero modifications to core AgentDiff.
              </p>
            </div>

            <div className="lg:col-span-6">
              <CodeBlock
                language="python"
                filename="custom_adapter.py"
                code={`from agentdiff.adapters.base import BaseAdapter
from agentdiff.models.trace import AgentTrace, TraceStep

class AcmeAgentAdapter(BaseAdapter):
    """Normalizes Acme internal agent execution logs."""
    
    @classmethod
    def detect(cls, data: dict) -> bool:
        return "acme_run_id" in data and "execution_spans" in data

    @classmethod
    def from_dict(cls, data: dict) -> AgentTrace:
        steps = []
        for idx, span in enumerate(data.get("execution_spans", [])):
            steps.append(
                TraceStep(
                    step_id=span["id"],
                    parent_id=span.get("parent_id"),
                    step_index=idx,
                    step_type=span.get("kind", "tool"),
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
        </Reveal>
      </section>

      {/* 5. CTA SECTION */}
      <section className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg) mb-3">
            Start Diffing Your Agent Telemetry Today
          </h2>
          <p className="text-base text-(--muted) max-w-lg mx-auto mb-8 font-normal">
            No telemetry changes needed. Pass your existing JSON traces and run your first regression check in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
            <Link
              href="/quickstart"
              className="px-8 py-3.5 rounded-full bg-(--fg) text-(--bg) hover:opacity-90 transition-opacity"
            >
              Get Started with Quickstart →
            </Link>
            <Link
              href="/compare"
              className="px-8 py-3.5 rounded-full border border-(--border) text-(--fg) hover:bg-(--surface-2) transition-colors"
            >
              Try Interactive Web Comparator
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
