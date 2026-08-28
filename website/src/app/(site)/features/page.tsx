import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import CodeBlock from "@/components/CodeBlock";

const SITE_URL = "https://agentdiff.lostmartian.in";

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
    <div className="w-full font-sans pb-32">
      {/* 1. TECHNICAL SPEC HEADER */}
      <section className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-4">
              Engine Specification & Architecture
            </span>
            <h1
              className="font-semibold tracking-[-0.035em] text-(--fg) leading-[1.04]"
              style={{ fontSize: "var(--text-display)" }}
            >
              How the comparator actually works under the hood.
            </h1>
            <p
              className="mt-6 text-base sm:text-lg text-(--muted) leading-relaxed max-w-2xl font-normal"
              style={{ lineHeight: "var(--leading-subtitle)" }}
            >
              This is the technical deep-dive into the deterministic graph algorithms powering AgentDiff: topological trace normalization, modified LCS alignment, k-gram loop detection, rule-based root cause isolation, and CI exit code specifications.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-mono">
              <span className="text-(--accent) font-semibold">Zero LLM calls</span>
              <span className="text-(--border-strong)">•</span>
              <span className="text-(--muted)">&lt;10ms execution latency</span>
              <span className="text-(--border-strong)">•</span>
              <span className="text-(--muted)">100% Deterministic CI verdicts</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 2. SECTION 01: TRACE NORMALIZATION & EQUIVALENCE SIGNATURES */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-(--border)">
        <Reveal>
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-3">
              01 / Trace Ingestion & Equivalence
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              Step Signatures & Semantic Equivalence
            </h2>
            <p className="mt-3 text-sm sm:text-base text-(--muted) leading-relaxed">
              Before comparison, raw JSON telemetry traces from adapters (LangGraph, CrewAI, OpenAI Agents, OTel) are normalized into strongly typed DAGs. Every node computes a structural equivalence signature:
            </p>
          </div>
        </Reveal>

        {/* Ingestion & Signature Hasher Vector Asset */}
        <Reveal delay={100}>
          <IngestionSignatureAsset />
        </Reveal>

        <Reveal delay={120}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mt-6">
            <div className="lg:col-span-6 space-y-4 text-sm text-(--muted) leading-relaxed">
              <p>
                Two steps <code className="font-mono text-xs text-(--fg)">A</code> and <code className="font-mono text-xs text-(--fg)">B</code> are considered equal by the comparator if and only if their signature matches:
              </p>
              <div className="p-4 rounded-xl bg-(--code-bg) border border-(--border) font-mono text-xs text-(--fg) leading-relaxed overflow-x-auto">
                <span className="text-(--faint)"># Equivalence Signature Tuple</span><br />
                Signature(Node) = (<br />
                &nbsp;&nbsp;step.step_type,&nbsp;&nbsp;<span className="text-(--faint)"># tool | llm | retrieval | reasoning</span><br />
                &nbsp;&nbsp;step.name,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-(--faint)"># tool/function identifier</span><br />
                &nbsp;&nbsp;sorted_keys&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-(--faint)"># tuple(sorted(input_payload.keys()))</span><br />
                )
              </div>
              <p>
                When <code className="font-mono text-xs text-(--fg)">strict_tool_signatures = true</code> is set in <code className="font-mono text-xs text-(--fg)">agentdiff.toml</code>, the comparator performs recursive value hashing on the input payload, while applying user-defined regex exclusion masks to discard non-deterministic timestamps, request UUIDs, and auth tokens.
              </p>
            </div>

            <div className="lg:col-span-6">
              <CodeBlock
                language="json"
                filename="trace_step.json"
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
        </Reveal>
      </section>

      {/* 3. SECTION 02: MODIFIED TOPOLOGICAL LCS ALIGNMENT */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-(--border)">
        <Reveal>
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-3">
              02 / The Comparison Algorithm
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              Topological Longest Common Subsequence (LCS)
            </h2>
            <p className="mt-3 text-sm sm:text-base text-(--muted) leading-relaxed">
              Standard string diff algorithms fail on agent traces because tool executions contain dependencies and state mutations. AgentDiff uses a 3-phase graph alignment pipeline:
            </p>
          </div>
        </Reveal>

        {/* Alignment Matrix Vector Asset */}
        <Reveal delay={100}>
          <TopologicalMatrixAsset />
        </Reveal>

        <Reveal delay={120}>
          <div className="space-y-10 mt-6">
            {/* 3 Phases */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
              <div className="space-y-2">
                <div className="font-mono text-xs font-semibold text-(--accent)">PHASE 1: TOPO-SORT</div>
                <h3 className="font-semibold text-(--fg)">Dependency DAG Sorting</h3>
                <p className="text-(--muted) leading-relaxed font-normal">
                  Linearizes the execution graph via Kahn&apos;s algorithm while preserving strict causal dependency edges defined by <code className="font-mono text-xs text-(--fg)">parent_id</code> pointers.
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-mono text-xs font-semibold text-(--accent)">PHASE 2: DP LCS TABLE</div>
                <h3 className="font-semibold text-(--fg)">2D Matrix Reconstruction</h3>
                <p className="text-(--muted) leading-relaxed font-normal">
                  Constructs an <code className="font-mono text-xs text-(--fg)">O(N · M)</code> dynamic programming grid scoring sequence matches, insertions, and branch modifications.
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-mono text-xs font-semibold text-(--accent)">PHASE 3: BACKTRACKING</div>
                <h3 className="font-semibold text-(--fg)">Diff Classification</h3>
                <p className="text-(--muted) leading-relaxed font-normal">
                  Backtracks the optimal alignment path to mark each step as <code className="font-mono text-xs text-emerald-400">MATCHED</code>, <code className="font-mono text-xs text-(--danger)">ADDED</code>, <code className="font-mono text-xs text-(--danger)">REMOVED</code>, or <code className="font-mono text-xs text-amber-400">MODIFIED</code>.
                </p>
              </div>
            </div>

            {/* LCS Matrix Visual Table */}
            <div className="pt-4">
              <div className="text-xs font-mono text-(--faint) mb-3">Alignment Trace Matrix Table</div>
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-xs font-mono border-collapse min-w-[620px]">
                  <thead>
                    <tr className="border-b border-(--border) text-(--faint) text-left">
                      <th className="py-2.5 px-3">Idx</th>
                      <th className="py-2.5 px-3">Baseline Step</th>
                      <th className="py-2.5 px-3">Candidate Step</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">State Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border) text-(--muted)">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-(--fg)">01</td>
                      <td className="py-2.5 px-3 text-(--fg)">planner:intent</td>
                      <td className="py-2.5 px-3 text-(--fg)">planner:intent</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">· MATCHED</td>
                      <td className="py-2.5 px-3 text-(--faint)">identical</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-(--fg)">02</td>
                      <td className="py-2.5 px-3 text-(--fg)">search_db(query)</td>
                      <td className="py-2.5 px-3 text-(--fg)">search_db(query)</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">· MATCHED</td>
                      <td className="py-2.5 px-3 text-(--faint)">identical</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-(--fg)">03</td>
                      <td className="py-2.5 px-3 text-(--fg)">synthesize_sql</td>
                      <td className="py-2.5 px-3 text-(--fg)">synthesize_sql</td>
                      <td className="py-2.5 px-3 text-amber-400 font-semibold">~ MODIFIED</td>
                      <td className="py-2.5 px-3 text-amber-400 font-mono text-[11px]">{`output.syntax_version: 1 → 2`}</td>
                    </tr>
                    <tr className="bg-(--danger)/5">
                      <td className="py-2.5 px-3 font-semibold text-(--danger)">04</td>
                      <td className="py-2.5 px-3 text-(--faint)">— (absent)</td>
                      <td className="py-2.5 px-3 text-(--danger) font-semibold">retry_sql_query</td>
                      <td className="py-2.5 px-3 text-(--danger) font-bold">+ ADDED</td>
                      <td className="py-2.5 px-3 text-(--danger)">Loop entry point (500 syntax error)</td>
                    </tr>
                    <tr className="bg-(--danger)/5">
                      <td className="py-2.5 px-3 font-semibold text-(--danger)">05</td>
                      <td className="py-2.5 px-3 text-(--faint)">— (absent)</td>
                      <td className="py-2.5 px-3 text-(--danger) font-semibold">retry_sql_query</td>
                      <td className="py-2.5 px-3 text-(--danger) font-bold">+ ADDED</td>
                      <td className="py-2.5 px-3 text-(--danger)">Stagnant parameter repetition (k=1)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-(--fg)">06</td>
                      <td className="py-2.5 px-3 text-(--fg)">execute_db_pool</td>
                      <td className="py-2.5 px-3 text-(--fg)">execute_db_pool</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">· MATCHED</td>
                      <td className="py-2.5 px-3 text-(--faint)">Fell back to working query</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 4. SECTION 03: MATHEMATICAL SPECIFICATION OF THE 5 METRICS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-(--border)">
        <Reveal>
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-3">
              03 / Mathematical Formulas
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              Formal Metric Definitions & Visual Logic
            </h2>
            <p className="mt-3 text-sm sm:text-base text-(--muted) leading-relaxed">
              Every verdict in AgentDiff is backed by closed-form equations and visual step breakdowns.
            </p>
          </div>
        </Reveal>

        <div className="space-y-12">
          {/* Formula 1: TDI */}
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 font-mono">
                <span className="text-xs text-(--faint) uppercase">Metric 01</span>
                <h3 className="text-lg font-semibold text-(--fg) mt-1">Trajectory Divergence Index</h3>
                <div className="text-2xl font-bold text-(--danger) mt-2">TDI ∈ [0.0, 1.0]</div>
              </div>
              <div className="lg:col-span-8 space-y-4">
                <div className="p-4 rounded-xl bg-(--code-bg) border border-(--border) font-mono text-sm text-(--accent) font-semibold">
                  TDI(A, B) = 1 − [ 2 · |LCS(A, B)| ] / [ |A| + |B| ]
                </div>
                {/* Visual TDI Comparison Strip */}
                <div className="p-3.5 rounded-xl bg-(--surface-2) font-mono text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-(--muted) w-14">Base:</span>
                    <div className="flex gap-1">
                      {["auth", "search", "filter", "export"].map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold text-[11px]">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-(--muted) w-14">Cand:</span>
                    <div className="flex gap-1">
                      {["auth", "search"].map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold text-[11px]">{s}</span>
                      ))}
                      {["raw_sql", "scrape", "export"].map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-(--danger-soft) text-(--danger) font-bold text-[11px]">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-(--muted) leading-relaxed">
                  Where <code className="font-mono text-xs text-(--fg)">|A|</code> and <code className="font-mono text-xs text-(--fg)">|B|</code> are trace step counts, and <code className="font-mono text-xs text-(--fg)">|LCS(A, B)|</code> is the longest common valid subsequence.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Formula 2: WEI */}
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 font-mono">
                <span className="text-xs text-(--faint) uppercase">Metric 02</span>
                <h3 className="text-lg font-semibold text-(--fg) mt-1">Wasted Effort Index</h3>
                <div className="text-2xl font-bold text-(--danger) mt-2">WEI ∈ [0.0, 1.0]</div>
              </div>
              <div className="lg:col-span-8 space-y-4">
                <div className="p-4 rounded-xl bg-(--code-bg) border border-(--border) font-mono text-sm text-(--accent) font-semibold">
                  WEI = ( N_failed + N_retry + N_abandoned ) / N_total
                </div>
                {/* Visual Compute Allocation Bar */}
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="h-3.5 w-full rounded-full bg-(--border) overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: "42%" }} title="Useful" />
                    <div className="bg-(--danger) h-full" style={{ width: "58%" }} title="Wasted" />
                  </div>
                  <div className="flex justify-between text-[11px] text-(--muted)">
                    <span>42% Productive Execution (3 steps)</span>
                    <span className="text-(--danger) font-semibold">58% Ineffective Retries (4 iterations)</span>
                  </div>
                </div>
                <p className="text-sm text-(--muted) leading-relaxed">
                  Measures the fraction of total trace compute allocated to non-productive branches. A step is flagged as wasted if it emits an error status or is superseded by retries.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Formula 3: Stagnant Loop Detector */}
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 font-mono">
                <span className="text-xs text-(--faint) uppercase">Metric 03</span>
                <h3 className="text-lg font-semibold text-(--fg) mt-1">k-Gram Cycle Detector</h3>
                <div className="text-2xl font-bold text-(--danger) mt-2">Loops ∈ ℕ₀</div>
              </div>
              <div className="lg:col-span-8 space-y-4">
                <div className="p-4 rounded-xl bg-(--code-bg) border border-(--border) font-mono text-xs text-(--fg) leading-relaxed overflow-x-auto">
                  <span className="text-(--faint)"># Stagnant Loop Condition:</span><br />
                  is_loop = (Sequence[i : i+k] == Sequence[i+k : i+2k]) ∧ (Input_Payload[i] == Input_Payload[i+k])
                </div>
                {/* Visual Stagnant State Flow */}
                <div className="p-3 rounded-xl bg-(--surface-2) font-mono text-xs space-y-1.5 text-(--muted)">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-(--fg) font-semibold">query_sql(id=104, limit=10)</span>
                    <span className="text-(--danger)">500 Syntax Error</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pl-3 border-l-2 border-(--danger)">
                    <span className="text-(--danger)">↻ query_sql(id=104, limit=10) [stagnant args]</span>
                    <span className="text-(--danger)">500 Syntax Error</span>
                  </div>
                </div>
                <p className="text-sm text-(--muted) leading-relaxed">
                  Evaluates sliding window sub-sequences for pattern lengths <code className="font-mono text-xs text-(--fg)">k ∈ [1, N/2]</code>. Checks state stagnation to allow progressive pagination while halting recursive loops.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Formula 4: RSR */}
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 font-mono">
                <span className="text-xs text-(--faint) uppercase">Metric 04</span>
                <h3 className="text-lg font-semibold text-(--fg) mt-1">Recovery Step Ratio</h3>
                <div className="text-2xl font-bold text-(--danger) mt-2">RSR ∈ [0.0, ∞)</div>
              </div>
              <div className="lg:col-span-8 space-y-4">
                <div className="p-4 rounded-xl bg-(--code-bg) border border-(--border) font-mono text-sm text-(--accent) font-semibold">
                  RSR = Steps_to_Resolution(Candidate) / Steps_to_Resolution(Baseline)
                </div>
                <div className="p-3.5 rounded-xl bg-(--surface-2) font-mono text-xs space-y-2 text-(--muted)">
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-(--faint)">Baseline:</span>
                    <span className="px-1.5 py-0.5 rounded bg-(--danger-soft) text-(--danger)">Error</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">Fallback (1 step · 420ms)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-(--faint)">Candidate:</span>
                    <span className="px-1.5 py-0.5 rounded bg-(--danger-soft) text-(--danger)">Error</span>
                    <span>→</span>
                    <span className="px-1.5 py-0.5 rounded bg-(--surface) text-(--fg)">Retry 1</span>
                    <span>→</span>
                    <span className="px-1.5 py-0.5 rounded bg-(--surface) text-(--fg)">Retry 2</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">Fallback (3 steps · 1,840ms)</span>
                  </div>
                </div>
                <p className="text-sm text-(--muted) leading-relaxed">
                  Isolates the sub-graph following the first non-fatal tool error. An RSR &gt; 1.0 indicates degraded self-healing capability.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. SECTION 04: DETERMINISTIC ROOT CAUSE EXPLANATIONS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-(--border)">
        <Reveal>
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-3">
              04 / Root Cause Synthesis
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              Rule-Based Blame Attribution Tree
            </h2>
            <p className="mt-3 text-sm sm:text-base text-(--muted) leading-relaxed">
              When a gate fails, developers do not need raw graph matrices — they need the culpable step and the exact failure mechanism. AgentDiff runs a deterministic rules engine (<code className="font-mono text-xs text-(--fg)">explanations.py</code>) that converts diff reports into human-readable findings:
            </p>
          </div>
        </Reveal>

        {/* Blame Attribution Vector Tree Asset */}
        <Reveal delay={100}>
          <BlameAttributionTreeAsset />
        </Reveal>

        <Reveal delay={120}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-mono text-xs mt-6">
            <div className="lg:col-span-6 p-5 rounded-2xl bg-(--code-bg) border border-(--border) space-y-3">
              <div className="text-(--faint) text-[11px]">Rule Priority Cascade Execution</div>
              <div className="space-y-2 text-(--muted)">
                <div className="text-(--fg) font-semibold">1. Loop Attribution (Highest Severity)</div>
                <p className="text-[11px] leading-relaxed">Identifies exact cycle length <code className="text-xs text-(--danger)">k</code>, repeated tool names, and stagnant parameter signatures.</p>
                <div className="text-(--fg) font-semibold pt-2">2. Divergence Fork Isolation</div>
                <p className="text-[11px] leading-relaxed">Pins the exact step index where candidate sequence forked away from baseline.</p>
                <div className="text-(--fg) font-semibold pt-2">3. Cost & Latency Attribution</div>
                <p className="text-[11px] leading-relaxed">Computes delta percentages for tokens and milliseconds on the culprit node.</p>
              </div>
            </div>

            <div className="lg:col-span-6 p-5 rounded-2xl bg-(--code-bg) border border-(--border) space-y-3 text-(--fg)">
              <div className="text-(--faint) text-[11px]">Rendered Terminal Tree Output (<code className="text-(--fg)">--tree</code>)</div>
              <pre className="text-[11.5px] leading-relaxed text-(--muted) overflow-x-auto">
{`baseline [4 steps] vs candidate [6 steps]
     1 · planner:task_intent
     2 · search_vector_db
     3 ~ synthesize_sql            (changed)
     4 + retry_sql_query           (added — culprit loop)
     5 + retry_sql_query           (added — stagnant cycle)
     6 · execute_db_pool

> Root Cause: 'retry_sql_query' [loop] — entered a loop
  repeating 'retry_sql_query' (2 times) after SQL syntax error.`}
              </pre>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 6. SECTION 05: CONFIG-AS-CODE SPECIFICATION */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-(--border)">
        <Reveal>
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-3">
              05 / Configuration Specification
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              Declarative Governance (<code className="font-mono text-xl sm:text-2xl">agentdiff.toml</code>)
            </h2>
            <p className="mt-3 text-sm sm:text-base text-(--muted) leading-relaxed">
              Thresholds and masking rules are committed directly to your git repository, ensuring consistent CI gate evaluation across all developer machines and automated workflows.
            </p>
          </div>
        </Reveal>

        {/* Declarative Governance Vector Flow Asset */}
        <Reveal delay={100}>
          <DeclarativeGovernanceAsset />
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-6">
            <CodeBlock
              language="toml"
              filename="agentdiff.toml"
              code={`# agentdiff.toml — Committed repository configuration

[compare]
detect_loops = true
strict_tool_signatures = false

[assertions]
max_divergence = 0.25              # Fails CI if TDI > 0.25
max_wasted_effort = 0.10           # Fails CI if > 10% compute is wasted
allow_loops = false                # Fails CI on any tool repetition
max_cost_increase_pct = 5.0        # Fails CI if cost delta > +5%
max_recovery_step_ratio = 1.5      # Fails CI if error recovery degrades > 1.5x

[masking]
ignore_keys = ["timestamp", "session_id", "trace_id", "auth_token"]
regex_patterns = ["^uuid_[0-9a-f-]+$", "^Bearer\\\\s+.*$"]

[governance]
warn_stale_baseline_days = 30      # Warns when golden baseline exceeds 30 days
flag_threshold_changes = true      # Flags PRs that lower gate rigor`}
            />
          </div>
        </Reveal>
      </section>

      {/* 7. CTA / DOCS LINK */}
      <section className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg) mb-3">
            Ready to integrate into your CI pipeline?
          </h2>
          <p className="text-base text-(--muted) max-w-lg mx-auto mb-8 font-normal">
            Install the Python package, record your first golden baseline trace, and gate your agent in 5 minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
            <Link
              href="/quickstart"
              className="px-8 py-3.5 rounded-full bg-(--fg) text-(--bg) hover:opacity-90 transition-opacity"
            >
              Get Started with Quickstart →
            </Link>
            <Link
              href="/docs"
              className="px-8 py-3.5 rounded-full border border-(--border) text-(--fg) hover:bg-(--surface-2) transition-colors"
            >
              Explore Full CLI & SDK Docs
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
