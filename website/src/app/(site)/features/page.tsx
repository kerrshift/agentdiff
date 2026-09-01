import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import CodeBlock from "@/components/CodeBlock";
import FeaturesEngineHeroAsset from "@/components/FeaturesEngineHeroAsset";

const SITE_URL = "https://agentdiff.app";

export const metadata: Metadata = {
  title: "Under the Hood — The AgentDiff Engine Specification",
  description:
    "A deep technical breakdown of the AgentDiff engine: Topological DAG alignment, exact metric formulas, stagnant loop detection algorithms, config-as-code, and deterministic explanation trees.",
  keywords: [
    "DAG alignment algorithm",
    "trajectory drift metric",
    "agent loop detection",
    "recovery step ratio",
    "AgentDiff engine specification",
  ],
  authors: [{ name: "AgentDiff", url: SITE_URL }],
  creator: "AgentDiff",
  publisher: "AgentDiff",
  alternates: { canonical: "/features" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Under the Hood | AgentDiff Engine Specification",
    description: "Deep technical dive into topological DAG diffing, cycle detection, and metric mathematics.",
    url: `${SITE_URL}/features`,
    siteName: "AgentDiff",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Under the Hood | AgentDiff Engine Specification",
    description: "Deep technical dive into topological DAG diffing, cycle detection, and metric mathematics.",
  },
};

/* =========================================================================
   CUSTOM VECTOR ASSET 1: Ingestion & Equivalence Signature Hasher
   ========================================================================= */
function IngestionSignatureAsset() {
  return (
    <div className="w-full my-8 overflow-x-auto no-scrollbar py-2">
      <svg viewBox="0 0 880 200" className="w-full h-auto min-w-[760px] font-mono select-none" role="img">
        <defs>
          <linearGradient id="sig-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
          <marker id="sig-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 2 L 7 5 L 0 8 z" fill="var(--border-strong)" />
          </marker>
        </defs>

        {/* Input Raw Telemetry Box */}
        <g>
          <rect x="20" y="25" width="220" height="150" rx="12" fill="var(--surface-2)" stroke="var(--border)" />
          <text x="35" y="48" fill="var(--faint)" fontSize="10" fontWeight="600" letterSpacing="0.08em">RAW TELEMETRY TRACE</text>
          <text x="35" y="75" fill="var(--fg)" fontSize="11">step_type: &quot;tool&quot;</text>
          <text x="35" y="95" fill="var(--fg)" fontSize="11">name: &quot;vector_query&quot;</text>
          <text x="35" y="115" fill="var(--muted)" fontSize="11">timestamp: 1740723821</text>
          <text x="35" y="135" fill="var(--muted)" fontSize="11">uuid: &quot;4a89-ef12...&quot;</text>
          <text x="35" y="155" fill="var(--muted)" fontSize="11">payload: &#123; query: ... &#125;</text>
        </g>

        {/* Connector 1 */}
        <line x1="240" y1="100" x2="290" y2="100" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#sig-arrow)" />

        {/* Middle: Masking & Key Extraction Filter */}
        <g>
          <rect x="295" y="35" width="230" height="130" rx="12" fill="var(--surface-2)" stroke="var(--border)" />
          <text x="310" y="58" fill="var(--accent)" fontSize="10" fontWeight="700" letterSpacing="0.08em">SEMANTIC MASKING</text>
          <text x="310" y="85" fill="var(--danger)" fontSize="11">− Drop UUIDs &amp; Timestamps</text>
          <text x="310" y="105" fill="var(--accent)" fontSize="11">+ Sort Input Keys</text>
          <text x="310" y="125" fill="var(--fg)" fontSize="11">→ key_tuple: (&quot;query&quot;, &quot;top_k&quot;)</text>
          <text x="310" y="145" fill="var(--faint)" fontSize="10">regex filter via agentdiff.toml</text>
        </g>

        {/* Connector 2 */}
        <line x1="525" y1="100" x2="575" y2="100" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#sig-arrow)" />

        {/* Output: Canonical Signature Hash */}
        <g>
          <rect x="580" y="25" width="280" height="150" rx="12" fill="url(#sig-grad)" stroke="var(--accent)" strokeWidth="1.5" />
          <text x="600" y="48" fill="var(--accent)" fontSize="10" fontWeight="700" letterSpacing="0.08em">EQUIVALENCE SIGNATURE</text>
          <rect x="600" y="62" width="240" height="42" rx="8" fill="var(--bg)" stroke="var(--border)" />
          <text x="612" y="80" fill="var(--fg)" fontSize="11" fontWeight="600">(&quot;tool&quot;, &quot;vector_query&quot;,</text>
          <text x="612" y="96" fill="var(--accent)" fontSize="11" fontWeight="600">&nbsp;(&quot;query&quot;, &quot;top_k&quot;))</text>
          <text x="600" y="125" fill="var(--muted)" fontSize="11">Deterministic graph token</text>
          <text x="600" y="145" fill="var(--faint)" fontSize="10">Ready for Topological LCS</text>
        </g>
      </svg>
    </div>
  );
}

/* =========================================================================
   CUSTOM VECTOR ASSET 2: Dynamic 2D LCS Matrix Alignment Diagram
   ========================================================================= */
function TopologicalMatrixAsset() {
  return (
    <div className="w-full my-8 overflow-x-auto no-scrollbar py-2">
      <svg viewBox="0 0 880 240" className="w-full h-auto min-w-[760px] font-mono select-none" role="img">
        <defs>
          <marker id="matrix-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 2 L 7 5 L 0 8 z" fill="var(--danger)" />
          </marker>
        </defs>

        {/* Matrix Grid Canvas */}
        <g>
          {/* Header Row (Candidate Steps) */}
          <text x="180" y="22" fill="var(--faint)" fontSize="10" fontWeight="600" letterSpacing="0.1em">CANDIDATE SEQUENCE →</text>
          <text x="290" y="38" textAnchor="middle" fill="var(--fg)" fontSize="11">planner</text>
          <text x="390" y="38" textAnchor="middle" fill="var(--fg)" fontSize="11">search</text>
          <text x="490" y="38" textAnchor="middle" fill="var(--fg)" fontSize="11">sql_gen</text>
          <text x="590" y="38" textAnchor="middle" fill="var(--danger)" fontSize="11">retry_1</text>
          <text x="690" y="38" textAnchor="middle" fill="var(--danger)" fontSize="11">retry_2</text>
          <text x="790" y="38" textAnchor="middle" fill="var(--fg)" fontSize="11">execute</text>

          {/* Baseline Column */}
          <text x="30" y="70" fill="var(--faint)" fontSize="10" fontWeight="600" letterSpacing="0.1em">BASELINE ↓</text>
          <text x="130" y="85" textAnchor="end" fill="var(--fg)" fontSize="11">planner</text>
          <text x="130" y="125" textAnchor="end" fill="var(--fg)" fontSize="11">search</text>
          <text x="130" y="165" textAnchor="end" fill="var(--fg)" fontSize="11">sql_gen</text>
          <text x="130" y="205" textAnchor="end" fill="var(--fg)" fontSize="11">execute</text>

          {/* Matrix Grid Lines */}
          <rect x="240" y="55" width="600" height="170" rx="10" fill="var(--surface-2)" stroke="var(--border)" />

          {/* Matched Cell 1: planner/planner */}
          <rect x="250" y="65" width="80" height="32" rx="6" fill="var(--accent)" fillOpacity="0.15" stroke="var(--accent)" />
          <text x="290" y="85" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="700">LCS = 1</text>

          {/* Matched Cell 2: search/search */}
          <rect x="350" y="105" width="80" height="32" rx="6" fill="var(--accent)" fillOpacity="0.15" stroke="var(--accent)" />
          <text x="390" y="125" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="700">LCS = 2</text>

          {/* Matched Cell 3: sql_gen/sql_gen */}
          <rect x="450" y="145" width="80" height="32" rx="6" fill="var(--accent)" fillOpacity="0.15" stroke="var(--accent)" />
          <text x="490" y="165" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="700">LCS = 3</text>

          {/* Diverged Fork Loop Path */}
          <path d="M 530 161 L 590 161 L 690 161 L 750 190" fill="none" stroke="var(--danger)" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#matrix-arrow)" />
          <rect x="555" y="130" width="170" height="24" rx="6" fill="var(--danger-soft)" stroke="var(--danger)" />
          <text x="640" y="146" textAnchor="middle" fill="var(--danger)" fontSize="10" fontWeight="700">2 UNMATCHED RETRY STEPS</text>

          {/* Matched Cell 4: execute/execute */}
          <rect x="750" y="185" width="80" height="32" rx="6" fill="var(--surface)" stroke="var(--border-strong)" />
          <text x="790" y="205" textAnchor="middle" fill="var(--fg)" fontSize="11" fontWeight="600">LCS = 4</text>
        </g>
      </svg>
    </div>
  );
}

/* =========================================================================
   CUSTOM VECTOR ASSET 3: Blame Attribution Decision Tree
   ========================================================================= */
function BlameAttributionTreeAsset() {
  return (
    <div className="w-full my-8 overflow-x-auto no-scrollbar py-2">
      <svg viewBox="0 0 880 200" className="w-full h-auto min-w-[760px] font-mono select-none" role="img">
        <defs>
          <marker id="tree-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 2 L 7 5 L 0 8 z" fill="var(--border-strong)" />
          </marker>
        </defs>

        {/* Root Diff Report Input */}
        <g>
          <rect x="20" y="70" width="150" height="60" rx="10" fill="var(--surface-2)" stroke="var(--border)" />
          <text x="95" y="96" textAnchor="middle" fill="var(--fg)" fontSize="11" fontWeight="700">DiffReport</text>
          <text x="95" y="114" textAnchor="middle" fill="var(--faint)" fontSize="10">Aligned DAG output</text>
        </g>

        {/* Tree Branches */}
        <path d="M 170 100 L 220 50 L 250 50" fill="none" stroke="var(--danger)" strokeWidth="1.5" markerEnd="url(#tree-arr)" />
        <path d="M 170 100 L 220 100 L 250 100" fill="none" stroke="var(--accent)" strokeWidth="1.5" markerEnd="url(#tree-arr)" />
        <path d="M 170 100 L 220 150 L 250 150" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#tree-arr)" />

        {/* Decision Nodes */}
        {/* Branch 1: Loops */}
        <g>
          <rect x="255" y="25" width="260" height="48" rx="8" fill="var(--danger-soft)" stroke="var(--danger)" />
          <text x="270" y="46" fill="var(--danger)" fontSize="11" fontWeight="700">1. Stagnant Loop Check (k-gram)</text>
          <text x="270" y="62" fill="var(--danger)" fontSize="10">Match: loop repeats &gt; 0 with static args</text>

          <line x1="515" y1="49" x2="565" y2="49" stroke="var(--danger)" strokeWidth="1.5" markerEnd="url(#tree-arr)" />
          <rect x="570" y="25" width="290" height="48" rx="8" fill="var(--bg)" stroke="var(--danger)" />
          <text x="585" y="46" fill="var(--danger)" fontSize="11" fontWeight="700">CULPRIT: &quot;retry_sql_query&quot;</text>
          <text x="585" y="62" fill="var(--muted)" fontSize="10">High Severity Blame Finding Emitted</text>
        </g>

        {/* Branch 2: Divergence */}
        <g>
          <rect x="255" y="76" width="260" height="48" rx="8" fill="var(--surface-2)" stroke="var(--border)" />
          <text x="270" y="97" fill="var(--fg)" fontSize="11" fontWeight="600">2. Fork Point Discovery</text>
          <text x="270" y="113" fill="var(--muted)" fontSize="10">Locates first modified causal edge</text>

          <line x1="515" y1="100" x2="565" y2="100" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#tree-arr)" />
          <rect x="570" y="76" width="290" height="48" rx="8" fill="var(--bg)" stroke="var(--border)" />
          <text x="585" y="97" fill="var(--fg)" fontSize="11" fontWeight="600">FORK: Node index 03 diverged</text>
          <text x="585" y="113" fill="var(--muted)" fontSize="10">TDI Score Calculated &amp; Attributed</text>
        </g>

        {/* Branch 3: Resource Delta */}
        <g>
          <rect x="255" y="127" width="260" height="48" rx="8" fill="var(--surface-2)" stroke="var(--border)" />
          <text x="270" y="148" fill="var(--fg)" fontSize="11" fontWeight="600">3. Resource Spike Attribution</text>
          <text x="270" y="164" fill="var(--muted)" fontSize="10">Computes USD &amp; token delta per node</text>

          <line x1="515" y1="151" x2="565" y2="151" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#tree-arr)" />
          <rect x="570" y="127" width="290" height="48" rx="8" fill="var(--bg)" stroke="var(--border)" />
          <text x="585" y="148" fill="var(--fg)" fontSize="11" fontWeight="600">COST SPIKE: +170% on Step 04</text>
          <text x="585" y="164" fill="var(--muted)" fontSize="10">Formatted for CLI Tree &amp; PR Comment</text>
        </g>
      </svg>
    </div>
  );
}

/* =========================================================================
   CUSTOM VECTOR ASSET 4: Declarative Governance CI Lifecycle
   ========================================================================= */
function DeclarativeGovernanceAsset() {
  return (
    <div className="w-full my-8 overflow-x-auto no-scrollbar py-2">
      <svg viewBox="0 0 880 180" className="w-full h-auto min-w-[760px] font-mono select-none" role="img">
        <defs>
          <marker id="gov-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 2 L 7 5 L 0 8 z" fill="var(--border-strong)" />
          </marker>
        </defs>

        {/* Step 1: Git Tracked Config */}
        <g>
          <rect x="20" y="20" width="240" height="140" rx="12" fill="var(--surface-2)" stroke="var(--border)" />
          <text x="35" y="46" fill="var(--accent)" fontSize="10" fontWeight="700" letterSpacing="0.08em">1. VERSION CONTROLLED TOML</text>
          <rect x="35" y="58" width="210" height="50" rx="6" fill="var(--bg)" stroke="var(--border)" />
          <text x="45" y="78" fill="var(--fg)" fontSize="11">max_divergence = 0.25</text>
          <text x="45" y="96" fill="var(--fg)" fontSize="11">allow_loops = false</text>
          <text x="35" y="132" fill="var(--muted)" fontSize="10">Committed in repo next to code</text>
          <text x="35" y="146" fill="var(--faint)" fontSize="9">Single source of truth</text>
        </g>

        <line x1="260" y1="90" x2="310" y2="90" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#gov-arr)" />

        {/* Step 2: PR Threshold Guardian */}
        <g>
          <rect x="315" y="20" width="250" height="140" rx="12" fill="var(--surface-2)" stroke="var(--border)" />
          <text x="330" y="46" fill="var(--danger)" fontSize="10" fontWeight="700" letterSpacing="0.08em">2. ANTI-GOODHART GUARDIAN</text>
          <text x="330" y="75" fill="var(--fg)" fontSize="11">PR Diff Analysis:</text>
          <text x="330" y="95" fill="var(--danger)" fontSize="11">⚠ TDI raised: 0.25 → 0.45</text>
          <text x="330" y="125" fill="var(--danger)" fontSize="10" fontWeight="700">Flags Loosened Rigor in PR</text>
          <text x="330" y="142" fill="var(--faint)" fontSize="9">Prevents artificial green checks</text>
        </g>

        <line x1="565" y1="90" x2="615" y2="90" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#gov-arr)" />

        {/* Step 3: Deterministic Exit Gate */}
        <g>
          <rect x="620" y="20" width="240" height="140" rx="12" fill="var(--surface-2)" stroke="var(--border)" />
          <text x="635" y="46" fill="var(--accent)" fontSize="10" fontWeight="700" letterSpacing="0.08em">3. UNIX CI GATE VERDICT</text>
          <rect x="635" y="58" width="210" height="42" rx="6" fill="var(--danger-soft)" stroke="var(--danger)" />
          <text x="645" y="76" fill="var(--danger)" fontSize="11" fontWeight="700">EXIT CODE 1 (FAIL)</text>
          <text x="645" y="90" fill="var(--danger)" fontSize="9">Threshold breached: TDI 0.40 &gt; 0.25</text>
          <text x="635" y="126" fill="var(--fg)" fontSize="10" fontWeight="600">Provenance Self-Described</text>
          <text x="635" y="142" fill="var(--faint)" fontSize="9">SHA · Baseline age · Flag options</text>
        </g>
      </svg>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="w-full font-sans divide-y divide-(--border)">
      
      {/* 1. TECHNICAL SPEC HERO */}
      <section className="relative overflow-hidden pt-20 pb-20 sm:pt-24 sm:pb-24 bg-transparent">
        {/* Subtle top spotlight glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[300px] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-500/15 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="max-w-4xl">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-4 font-medium">
                Engine Specification &amp; Architecture
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.08]">
                How the engine evaluates agent trajectories <span className="text-emerald-500/90 dark:text-emerald-400">in single-digit milliseconds</span>.
              </h1>
              <p className="mt-6 text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed max-w-3xl font-normal">
                A technical deep-dive into the deterministic graph algorithms powering AgentDiff: topological trace normalization, modified LCS alignment, k-gram loop detection, and rule-based root cause isolation in CI.
              </p>

              {/* Fast Proof Points */}
              <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-(--muted)">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-(--fg) font-semibold">Zero LLM Judge Calls</span>
                </span>
                <span className="text-(--border) select-none">•</span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Sub-5ms Execution Latency</span>
                </span>
                <span className="text-(--border) select-none">•</span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>100% Deterministic CI Block</span>
                </span>
              </div>
            </div>
          </Reveal>

          {/* Engine Spec Showcase Interactive Visual */}
          <Reveal delay={120}>
            <div className="mt-12 sm:mt-16">
              <FeaturesEngineHeroAsset />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. SECTION 01: TRACE NORMALIZATION & EQUIVALENCE SIGNATURES */}
      <section className="py-24 sm:py-32 w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mb-16 sm:mb-20">
            <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
              01 / Trace Ingestion &amp; Normalization
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
              Structural Equivalence Signatures.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
              Before comparison, raw telemetry traces from LangGraph, CrewAI, OpenAI Agents, and OpenTelemetry are normalized into strongly typed execution DAGs. Every node computes a deterministic structural signature.
            </p>
          </div>
        </Reveal>

        {/* Clean 3-Stage Pipeline: Highly Readable Editorial Typography */}
        <Reveal delay={100}>
          <div className="border-t border-(--border)">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
              
              {/* Stage 1: Raw Telemetry */}
              <div className="py-10 lg:py-12 lg:pr-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-(--faint) font-semibold">
                    Stage 1 · Ingestion
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-(--border)" />
                </div>
                <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                  Raw Telemetry Trace
                </h3>
                <p className="text-sm text-(--muted) leading-relaxed">
                  Ingests heterogeneous spans and execution logs containing variable timestamps, ephemeral UUIDs, and tool payloads.
                </p>
                <div className="pt-3 font-mono text-xs text-(--fg) space-y-1.5 bg-(--surface-2)/60 p-4 rounded-xl border border-(--border) leading-normal">
                  <div className="text-(--muted)">step_type: <span className="text-(--fg)">&quot;tool&quot;</span></div>
                  <div className="text-(--muted)">name: <span className="text-(--fg)">&quot;vector_query&quot;</span></div>
                  <div className="text-(--faint)">uuid: &quot;4a89-ef12...&quot;</div>
                </div>
              </div>

              {/* Stage 2: Masking & Key Extraction */}
              <div className="py-10 lg:py-12 lg:px-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                    Stage 2 · Masking
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                  Semantic Key Extraction
                </h3>
                <p className="text-sm text-(--muted) leading-relaxed">
                  Drops non-deterministic noise (timestamps, tokens, UUIDs) and sorts input dictionary keys to ensure deterministic ordering.
                </p>
                <div className="pt-3 font-mono text-xs space-y-1.5 bg-(--surface-2)/60 p-4 rounded-xl border border-(--border) leading-normal">
                  <div className="text-rose-500 font-medium">− Drop volatile UUIDs</div>
                  <div className="text-emerald-500 font-medium">+ Sort payload keys</div>
                  <div className="text-(--muted)">→ (&quot;query&quot;, &quot;top_k&quot;)</div>
                </div>
              </div>

              {/* Stage 3: Equivalence Token */}
              <div className="py-10 lg:py-12 lg:pl-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-(--fg) font-semibold">
                    Stage 3 · Signature
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                  Canonical Signature Token
                </h3>
                <p className="text-sm text-(--muted) leading-relaxed">
                  Generates an immutable node tuple token ready for high-speed topological longest common subsequence alignment.
                </p>
                <div className="pt-3 font-mono text-xs text-emerald-500 font-medium bg-(--surface-2)/60 p-4 rounded-xl border border-(--border) leading-normal">
                  (&quot;tool&quot;, &quot;vector_query&quot;, (&quot;query&quot;, &quot;top_k&quot;))
                </div>
              </div>

            </div>
          </div>
        </Reveal>

        {/* Split Spec / Code Block */}
        <Reveal delay={120}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start mt-16 pt-16 border-t border-(--border)">
            
            {/* Left: Spec Details */}
            <div className="lg:col-span-5 space-y-5">
              <h3 className="text-2xl font-bold text-(--fg) tracking-tight">
                Deterministic Hashing Contract
              </h3>
              <p className="text-base text-(--muted) leading-relaxed">
                When <code className="text-xs text-(--fg) font-mono bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">strict_tool_signatures = true</code> is enabled, AgentDiff performs recursive value hashing on payload contents while applying user-defined regex exclusion masks in <code className="text-xs text-(--fg) font-mono bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">agentdiff.toml</code>.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-(--muted)">
                <span className="flex items-center gap-2 font-medium text-(--fg)">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Sub-50μs Hash Latency</span>
                </span>
                <span className="text-(--border-strong)">•</span>
                <span>Zero Floating Point Drift</span>
              </div>
            </div>

            {/* Right: Normalized JSON Trace Step */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-(--border) bg-(--surface) overflow-hidden shadow-2xs">
                <CodeBlock
                  language="json"
                  filename="normalized_node.json"
                  code={`{
  "step_id": "step_89f02c",
  "parent_id": "step_14a81b",
  "step_index": 3,
  "step_type": "tool",
  "name": "search_vector_database",
  "input_payload": { "query": "customer ARR", "top_k": 5 },
  "output_payload": { "matched_chunks": 3 },
  "metrics": {
    "latency_ms": 218.4,
    "input_tokens": 420,
    "output_tokens": 180,
    "cost_usd": 0.0024
  }
}`}
                />
              </div>
            </div>

          </div>
        </Reveal>
        </div>
      </section>

      {/* 3. SECTION 02: MODIFIED TOPOLOGICAL LCS ALIGNMENT */}
      <section className="py-24 sm:py-32 w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mb-16 sm:mb-20">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
                02 / The Alignment Engine
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
                Topological Longest Common Subsequence.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
                Standard string diff algorithms fail on AI agent executions because tool calls contain causal dependencies and cyclic retries. AgentDiff aligns complex execution DAGs through a high-speed 3-phase graph engine.
              </p>
            </div>
          </Reveal>

          {/* 3-Phase Alignment Engine */}
          <Reveal delay={100}>
            <div className="border-t border-(--border)">
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
                
                {/* Phase 1 */}
                <div className="py-10 lg:py-12 lg:pr-10 space-y-4">
                  <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                    Phase 1 · DAG Sort
                  </span>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Topological Dependency Linearization
                  </h3>
                  <p className="text-sm text-(--muted) leading-relaxed font-normal">
                    Linearizes the execution graph via Kahn&apos;s algorithm while preserving strict causal dependency edges defined by parent pointers.
                  </p>
                  <div className="text-xs text-(--muted) pt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>O(V + E) Dependency Traversal</span>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="py-10 lg:py-12 lg:px-10 space-y-4">
                  <span className="text-xs uppercase tracking-wider text-(--fg) font-semibold">
                    Phase 2 · 2D Grid
                  </span>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Dynamic Programming Table
                  </h3>
                  <p className="text-sm text-(--muted) leading-relaxed font-normal">
                    Constructs an optimized dynamic programming matrix scoring exact signature matches, structural insertions, and tool modifications.
                  </p>
                  <div className="text-xs text-(--muted) pt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Sub-5ms Execution Latency</span>
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="py-10 lg:py-12 lg:pl-10 space-y-4">
                  <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold">
                    Phase 3 · Classification
                  </span>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Optimal Path Backtracking
                  </h3>
                  <p className="text-sm text-(--muted) leading-relaxed font-normal">
                    Backtracks the optimal alignment path to mark each step as Matched, Added, Removed, or Modified with sub-cent token delta tracking.
                  </p>
                  <div className="text-xs text-(--muted) pt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Root Cause Loop Pinpointing</span>
                  </div>
                </div>

              </div>
            </div>
          </Reveal>

          {/* Alignment Matrix Visual Table */}
          <Reveal delay={120}>
            <div className="mt-16 pt-16 border-t border-(--border)">
              <div className="max-w-2xl mb-8">
                <span className="text-xs uppercase tracking-wider text-(--faint) font-semibold block mb-2">
                  Live Alignment Matrix
                </span>
                <h3 className="text-2xl font-bold text-(--fg) tracking-tight">
                  Candidate vs Baseline Execution Sequence
                </h3>
                <p className="text-base text-(--muted) mt-1 leading-relaxed">
                  Step-by-step alignment path showing exact match points, syntax modifications, and stagnant loop injections.
                </p>
              </div>

              <div className="rounded-2xl border border-(--border) bg-(--surface) overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[680px]">
                    <thead>
                      <tr className="border-b border-(--border) bg-(--surface-2)/60 text-(--muted) text-left font-medium text-xs">
                        <th className="py-3.5 px-5">Index</th>
                        <th className="py-3.5 px-5">Baseline Step</th>
                        <th className="py-3.5 px-5">Candidate Step</th>
                        <th className="py-3.5 px-5">Alignment Verdict</th>
                        <th className="py-3.5 px-5">Observed Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border) text-(--muted)">
                      <tr>
                        <td className="py-4 px-5 font-mono text-xs font-semibold text-(--fg)">01</td>
                        <td className="py-4 px-5 font-mono text-xs text-(--fg)">planner:intent</td>
                        <td className="py-4 px-5 font-mono text-xs text-(--fg)">planner:intent</td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Matched
                          </span>
                        </td>
                        <td className="py-4 px-5 text-xs text-(--faint)">Identical signature</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-5 font-mono text-xs font-semibold text-(--fg)">02</td>
                        <td className="py-4 px-5 font-mono text-xs text-(--fg)">search_db(query)</td>
                        <td className="py-4 px-5 font-mono text-xs text-(--fg)">search_db(query)</td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Matched
                          </span>
                        </td>
                        <td className="py-4 px-5 text-xs text-(--faint)">Identical signature</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-5 font-mono text-xs font-semibold text-(--fg)">03</td>
                        <td className="py-4 px-5 font-mono text-xs text-(--fg)">synthesize_sql</td>
                        <td className="py-4 px-5 font-mono text-xs text-(--fg)">synthesize_sql</td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Modified
                          </span>
                        </td>
                        <td className="py-4 px-5 text-xs text-amber-500 font-mono">syntax_version: 1 → 2</td>
                      </tr>
                      <tr className="bg-rose-500/[0.04]">
                        <td className="py-4 px-5 font-mono text-xs font-bold text-rose-500">04</td>
                        <td className="py-4 px-5 text-xs text-(--faint)">— (absent in baseline)</td>
                        <td className="py-4 px-5 font-mono text-xs text-rose-500 font-semibold">retry_sql_query</td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/25">
                            Loop Injected
                          </span>
                        </td>
                        <td className="py-4 px-5 text-xs text-rose-500 font-medium">Repetition 1 (+48% tokens)</td>
                      </tr>
                      <tr className="bg-rose-500/[0.04]">
                        <td className="py-4 px-5 font-mono text-xs font-bold text-rose-500">05</td>
                        <td className="py-4 px-5 text-xs text-(--faint)">— (absent in baseline)</td>
                        <td className="py-4 px-5 font-mono text-xs text-rose-500 font-semibold">retry_sql_query</td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/25">
                            Loop Injected
                          </span>
                        </td>
                        <td className="py-4 px-5 text-xs text-rose-500 font-medium">Repetition 2 (+100% tokens)</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-5 font-mono text-xs font-semibold text-(--fg)">06</td>
                        <td className="py-4 px-5 font-mono text-xs text-(--fg)">execute_db_pool</td>
                        <td className="py-4 px-5 font-mono text-xs text-(--fg)">execute_db_pool</td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Matched
                          </span>
                        </td>
                        <td className="py-4 px-5 text-xs text-(--faint)">Fallback recovery</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. SECTION 03: THE 4 CORE REGRESSION METRICS */}
      <section className="py-24 sm:py-32 w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mb-16 sm:mb-24">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
                03 / The 4 Core Metrics
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
                Four deterministic metrics. Zero black-box judges.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
                Every verdict in AgentDiff is mathematically calculated from graph topology and execution telemetry. No subjective prompts or nondeterministic LLM evaluation latencies.
              </p>
            </div>
          </Reveal>

          {/* Open Editorial Flow */}
          <div className="divide-y divide-(--border)">
            
            {/* Metric 01: Trajectory Divergence */}
            <div className="py-16 sm:py-20">
              <Reveal>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                        Metric 01
                      </span>
                      <span className="w-1 h-1 rounded-full bg-(--border)" />
                      <span className="text-xs text-(--muted)">Sequence Divergence</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-(--fg) tracking-tight">
                      Trajectory Divergence Index
                    </h3>
                    <p className="text-base text-(--muted) leading-relaxed">
                      Measures how far the candidate execution drifted from the golden baseline sequence. Computes the ratio of common valid tool steps to total graph size.
                    </p>
                    <div className="pt-2 text-sm text-(--fg) flex items-center gap-4">
                      <span>Range: <strong className="text-emerald-500">0.0 (Identical)</strong></span>
                      <span>→</span>
                      <span><strong className="text-rose-500">1.0 (Full Divergence)</strong></span>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-5">
                    <div className="text-xs uppercase tracking-wider text-(--faint) font-semibold">
                      Sequence Alignment Preview
                    </div>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-(--muted) font-sans text-xs">Baseline:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {["auth", "search", "filter", "export"].map((s, i) => (
                            <span key={i} className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-(--muted) font-sans text-xs">Candidate:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {["auth", "search"].map((s, i) => (
                            <span key={i} className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{s}</span>
                          ))}
                          {["raw_sql", "scrape", "export"].map((s, i) => (
                            <span key={i} className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-500 border border-rose-500/25 font-semibold">{s} (drift)</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-(--faint) pt-1">
                      Calculated via Kahn&apos;s topological sort + DP longest common subsequence in &lt; 2ms.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Metric 02: Stagnant Loops */}
            <div className="py-16 sm:py-20">
              <Reveal>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold">
                        Metric 02
                      </span>
                      <span className="w-1 h-1 rounded-full bg-(--border)" />
                      <span className="text-xs text-(--muted)">Cost &amp; Loop Blocker</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-(--fg) tracking-tight">
                      Stagnant Loop Detection
                    </h3>
                    <p className="text-base text-(--muted) leading-relaxed">
                      Identifies agents trapped in infinite retry cycles with stagnant parameter signatures that fail to make state progress.
                    </p>
                    <div className="pt-2 text-sm text-(--fg)">
                      CI Gate: <strong className="text-rose-500 font-mono text-xs">allow_loops = false</strong> (Instant 0/1 Fail)
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-5">
                    <div className="text-xs uppercase tracking-wider text-(--faint) font-semibold">
                      Cycle Identification Pattern
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between font-mono text-xs text-(--fg) py-1.5">
                        <span>1. query_db(id=402, page=1)</span>
                        <span className="text-rose-500 font-sans text-xs">500 Server Error</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-xs text-rose-500 bg-rose-500/5 py-2 px-3 rounded-lg border-l-2 border-rose-500">
                        <span>↻ 2. query_db(id=402, page=1) [stagnant args]</span>
                        <span className="font-sans text-xs font-semibold">Loop Trapped</span>
                      </div>
                    </div>
                    <p className="text-xs text-(--faint) pt-1">
                      Distinguishes valid progressive pagination from non-productive retry spirals.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Metric 03: Wasted Effort */}
            <div className="py-16 sm:py-20">
              <Reveal>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                        Metric 03
                      </span>
                      <span className="w-1 h-1 rounded-full bg-(--border)" />
                      <span className="text-xs text-(--muted)">Compute Efficiency</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-(--fg) tracking-tight">
                      Wasted Effort Index
                    </h3>
                    <p className="text-base text-(--muted) leading-relaxed">
                      Calculates the exact percentage of compute time, steps, and token spend allocated to non-productive execution branches.
                    </p>
                    <div className="pt-2 text-sm text-(--fg)">
                      Efficiency Target: <strong className="text-emerald-500 font-mono text-xs">WEI &lt; 0.10</strong> (under 10% waste)
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-5">
                    <div className="text-xs uppercase tracking-wider text-(--faint) font-semibold">
                      Compute Allocation Breakdown
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 w-full rounded-full bg-(--surface-2) overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: "75%" }} />
                        <div className="bg-rose-500 h-full" style={{ width: "25%" }} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-(--fg) font-medium">75% Productive Execution (6 steps)</span>
                        <span className="text-rose-500 font-semibold">25% Wasted Retries (2 steps)</span>
                      </div>
                    </div>
                    <p className="text-xs text-(--faint) pt-1">
                      Quantifies whether prompt updates actually streamline execution or silently bloat costs.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Metric 04: Recovery Ratio */}
            <div className="py-16 sm:py-20">
              <Reveal>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                        Metric 04
                      </span>
                      <span className="w-1 h-1 rounded-full bg-(--border)" />
                      <span className="text-xs text-(--muted)">Self-Healing Resilience</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-(--fg) tracking-tight">
                      Recovery Step Ratio
                    </h3>
                    <p className="text-base text-(--muted) leading-relaxed">
                      Evaluates how quickly your agent recovers from intermediate tool errors compared to the golden baseline.
                    </p>
                    <div className="pt-2 text-sm text-(--fg)">
                      Resolution Ratio: <strong className="text-emerald-500 font-mono text-xs">1.0 (Optimal Recovery)</strong>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-5">
                    <div className="text-xs uppercase tracking-wider text-(--faint) font-semibold">
                      Error Recovery Comparison
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-(--muted) font-medium">Baseline:</span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-mono text-xs">Error</span>
                        <span className="text-(--muted)">→</span>
                        <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">1 fallback step (380ms)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-(--muted) font-medium">Candidate:</span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-mono text-xs">Error</span>
                        <span className="text-(--muted)">→</span>
                        <span className="px-2 py-0.5 rounded bg-(--surface-2) text-(--muted)">Retry 1</span>
                        <span className="text-(--muted)">→</span>
                        <span className="px-2 py-0.5 rounded bg-(--surface-2) text-(--muted)">Retry 2</span>
                        <span className="text-(--muted)">→</span>
                        <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">3 steps (1,420ms)</span>
                      </div>
                    </div>
                    <p className="text-xs text-(--faint) pt-1">
                      Ensures prompt refactors don&apos;t quietly degrade error-handling resilience.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

          </div>
        </div>
      </section>

      {/* 5. SECTION 04: DETERMINISTIC ROOT CAUSE EXPLANATIONS */}
      <section className="py-24 sm:py-32 w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mb-16 sm:mb-20">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
                04 / Root Cause Synthesis
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
                Know the exact culprit step in plain English.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
                When a merge gate fails, developers shouldn&apos;t spend hours parsing massive JSON telemetry traces. AgentDiff runs a deterministic rules cascade that isolates the culpable tool step and failure mechanism automatically.
              </p>
            </div>
          </Reveal>

          {/* 3-Tier Blame Cascade Grid */}
          <Reveal delay={100}>
            <div className="border-t border-(--border)">
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
                
                {/* Tier 1 */}
                <div className="py-10 lg:py-12 lg:pr-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold">
                      Priority 1 · Critical
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Loop Attribution
                  </h3>
                  <p className="text-sm text-(--muted) leading-relaxed">
                    Identifies the exact cycle length, repeating function name, and stagnant parameter payload that caused the failure.
                  </p>
                  <div className="pt-2 text-xs text-rose-500 font-mono">
                    → Culprit: retry_sql_query (k=1)
                  </div>
                </div>

                {/* Tier 2 */}
                <div className="py-10 lg:py-12 lg:px-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-amber-500 font-semibold">
                      Priority 2 · Drift
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Fork Point Discovery
                  </h3>
                  <p className="text-sm text-(--muted) leading-relaxed">
                    Pins the exact step index where the candidate execution graph diverged from the golden baseline DAG.
                  </p>
                  <div className="pt-2 text-xs text-amber-500 font-mono">
                    → Fork Index: Step 03 diverged
                  </div>
                </div>

                {/* Tier 3 */}
                <div className="py-10 lg:py-12 lg:pl-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                      Priority 3 · Delta
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Resource Attribution
                  </h3>
                  <p className="text-sm text-(--muted) leading-relaxed">
                    Calculates exact token delta percentages and sub-cent USD cost spikes directly attributed to the culprit node.
                  </p>
                  <div className="pt-2 text-xs text-emerald-500 font-mono">
                    → Cost Spike: +170% on Step 04
                  </div>
                </div>

              </div>
            </div>
          </Reveal>

          {/* Live Terminal Output Showcase */}
          <Reveal delay={120}>
            <div className="mt-16 pt-16 border-t border-(--border)">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
                
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-xs uppercase tracking-wider text-(--faint) font-semibold block">
                    Deterministic Explanation Engine
                  </span>
                  <h3 className="text-2xl font-bold text-(--fg) tracking-tight">
                    Instant root-cause isolation in your terminal and PR comments.
                  </h3>
                  <p className="text-base text-(--muted) leading-relaxed">
                    No guessing whether a regression was caused by prompt drift, tool schema changes, or database timeouts. AgentDiff renders the entire execution hierarchy with actionable blame lines.
                  </p>
                  <div className="flex items-center gap-3 pt-2 text-xs text-(--muted)">
                    <span className="flex items-center gap-1.5 text-(--fg) font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>0ms LLM Latency</span>
                    </span>
                    <span>•</span>
                    <span>Pure AST Graph Evaluation</span>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="rounded-2xl border border-(--border) bg-(--code-bg) p-6 font-mono text-xs text-(--fg) space-y-4 shadow-2xs overflow-x-auto">
                    <div className="text-(--muted) text-[11px] border-b border-(--border) pb-3 flex items-center justify-between">
                      <span>$ agentdiff diff baseline.json candidate.json --tree</span>
                      <span className="text-rose-500 font-sans font-semibold">Exit Code 1</span>
                    </div>

                    <div className="space-y-1 text-(--muted) text-[11.5px] leading-relaxed">
                      <div>baseline [4 steps] vs candidate [6 steps]</div>
                      <div className="text-emerald-500">&nbsp;&nbsp;1 · planner:task_intent</div>
                      <div className="text-emerald-500">&nbsp;&nbsp;2 · search_vector_db</div>
                      <div className="text-amber-500">&nbsp;&nbsp;3 ~ synthesize_sql&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(changed)</div>
                      <div className="text-rose-500 font-semibold">&nbsp;&nbsp;4 + retry_sql_query&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(added — culprit loop)</div>
                      <div className="text-rose-500 font-semibold">&nbsp;&nbsp;5 + retry_sql_query&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(added — stagnant cycle)</div>
                      <div className="text-emerald-500">&nbsp;&nbsp;6 · execute_db_pool</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs leading-relaxed">
                      <strong className="font-semibold block mb-0.5">Root Cause Finding:</strong>
                      &apos;retry_sql_query&apos; entered an infinite loop repeating 2 times with identical arguments after a 500 SQL syntax error.
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6. SECTION 05: CONFIG-AS-CODE SPECIFICATION */}
      <section className="py-24 sm:py-32 w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mb-16 sm:mb-20">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
                05 / Config as Code
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
                Declarative governance in <span className="font-mono text-xl sm:text-3xl lg:text-4xl text-emerald-500 font-semibold">agentdiff.toml</span>.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
                Thresholds and masking rules live directly in your Git repository. Every engineer, branch, and CI runner shares the exact same single source of truth.
              </p>
            </div>
          </Reveal>

          {/* 3 Value Pillars */}
          <Reveal delay={100}>
            <div className="border-t border-(--border)">
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
                
                {/* Pillar 1 */}
                <div className="py-10 lg:py-12 lg:pr-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                      01 · Version Controlled
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Tracked in Git
                  </h3>
                  <p className="text-sm text-(--muted) leading-relaxed">
                    Gate rules sit right next to your agent code. Changes to tolerance thresholds require PR approval and code review.
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className="py-10 lg:py-12 lg:px-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-(--fg) font-semibold">
                      02 · Masking Engine
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Semantic Regex Masks
                  </h3>
                  <p className="text-sm text-(--muted) leading-relaxed">
                    Automatically strip non-deterministic tokens, ephemeral session IDs, and UUIDs to prevent false-positive CI failures.
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className="py-10 lg:py-12 lg:pl-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold">
                      03 · CI Automation
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Deterministic Exit Codes
                  </h3>
                  <p className="text-sm text-(--muted) leading-relaxed">
                    Emits clean 0/1 exit codes that instantly integrate into GitHub Actions, GitLab CI, and custom test runners.
                  </p>
                </div>

              </div>
            </div>
          </Reveal>

          {/* Code Configuration Box */}
          <Reveal delay={120}>
            <div className="mt-16 pt-16 border-t border-(--border)">
              <div className="max-w-2xl mb-8">
                <span className="text-xs uppercase tracking-wider text-(--faint) font-semibold block mb-2">
                  Production Configuration
                </span>
                <h3 className="text-2xl font-bold text-(--fg) tracking-tight">
                  Complete TOML Schema Specification
                </h3>
                <p className="text-base text-(--muted) mt-1 leading-relaxed">
                  Drop this file at your repository root to configure assertion thresholds, semantic masks, and governance policies.
                </p>
              </div>

              <div className="rounded-2xl border border-(--border) bg-(--surface) overflow-hidden shadow-2xs">
                <CodeBlock
                  language="toml"
                  filename="agentdiff.toml"
                  code={`# agentdiff.toml — Committed v0.5.0 repository configuration

[scenario.customer_support]
mode = "statistical"                # "statistical" (N-run envelope) or "strict" (N=1)
sample_runs = 3                     # Rolling window of recorded runs
max_cost_increase_pct = 5.0         # Max cost increase delta

[scenario.customer_support.hard_invariants]
fail_on_identical_loops = true      # Hard block: infinite retry loops never pass
max_tool_repeats = 3                # Hard block: repeat limit per tool node

[scenario.customer_support.tolerances]
step_count_std_dev = 2.0            # Variance band: mean ± 2σ step count
divergence_ceiling = 0.35           # Max acceptable sequence drift

[masking]
ignore_keys = ["timestamp", "session_id", "trace_id", "auth_token"]
regex_patterns = ["^uuid_[0-9a-f-]+$", "^Bearer\\\\s+.*$"]

[governance]
warn_stale_baseline_days = 30       # Warns when envelope exceeds 30 days
flag_threshold_changes = true       # Flags PRs that lower gate rigor`}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. CTA / NEXT STEPS */}
      <section className="py-24 sm:py-36 w-full bg-transparent text-center border-t border-(--border) relative overflow-hidden">
        {/* Background Radial Glow in the top-right corner */}
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
                Ready to catch regressions <span className="text-emerald-500/90 dark:text-emerald-400">before they hit production?</span>
              </h2>
              <p className="text-base sm:text-lg text-(--muted) max-w-xl mx-auto font-normal leading-relaxed">
                Install the Python package, record your first golden baseline, and guard your CI pipeline in under 5 minutes.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm font-semibold">
                <Link
                  href="/quickstart"
                  className="px-8 py-3.5 rounded-full bg-(--fg) text-(--bg) hover:opacity-90 transition-opacity shadow-sm"
                >
                  Get Started with Quickstart →
                </Link>
                <Link
                  href="/docs"
                  className="px-8 py-3.5 rounded-full border border-(--border) text-(--fg) hover:bg-(--surface-2) transition-colors"
                >
                  Explore Full Documentation
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
