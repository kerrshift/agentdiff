import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus, X, GitPullRequest, Radio, Sparkles, Scale, Gauge, ShieldAlert, Cpu, ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";

const SITE_URL = "https://agentdiff.lostmartian.in";

export const metadata: Metadata = {
  title: "AgentDiff vs Alternatives — Objective Architectural Comparison",
  description:
    "Deterministic trajectory diffing in CI vs LLM-as-judge evals vs observability platforms. What each evaluation layer actually catches, honestly compared.",
  keywords: [
    "AgentDiff vs LLM judge",
    "LLM eval comparison",
    "agent observability vs testing",
    "trajectory regression testing",
    "Goodharts law agent eval",
  ],
  authors: [{ name: "AgentDiff", url: SITE_URL }],
  creator: "AgentDiff",
  publisher: "AgentDiff",
  alternates: { canonical: "/compare" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "AgentDiff vs Alternatives | AgentDiff",
    description:
      "Deterministic trajectory diffing in CI vs LLM judges vs observability platforms. An honest architectural breakdown.",
    url: `${SITE_URL}/compare`,
    siteName: "AgentDiff",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentDiff vs Alternatives | AgentDiff",
    description:
      "Deterministic trajectory diffing in CI vs LLM judges vs observability platforms. An honest architectural breakdown.",
  },
};

interface RowItem {
  capability: string;
  category: string;
  agentdiff: boolean | string;
  judge: boolean | string;
  observability: boolean | string;
}

const COMPARISON_ROWS: RowItem[] = [
  {
    category: "CI/CD & Determinism",
    capability: "Deterministic CI gate (100% reproducible verdict)",
    agentdiff: true,
    judge: false,
    observability: false,
  },
  {
    category: "CI/CD & Determinism",
    capability: "Catches silent trajectory drift (wrong path, right answer)",
    agentdiff: true,
    judge: "partial",
    observability: false,
  },
  {
    category: "CI/CD & Determinism",
    capability: "Blocks PR merge in automated CI pipelines",
    agentdiff: true,
    judge: "partial",
    observability: false,
  },
  {
    category: "CI/CD & Determinism",
    capability: "Flags when test thresholds are silently loosened in a PR",
    agentdiff: true,
    judge: false,
    observability: false,
  },
  {
    category: "Root-Cause Diagnostics",
    capability: "Isolates the exact culprit step & tool iteration loop",
    agentdiff: true,
    judge: false,
    observability: "partial",
  },
  {
    category: "Root-Cause Diagnostics",
    capability: "Zero LLM judge latency (<10ms execution)",
    agentdiff: true,
    judge: false,
    observability: true,
  },
  {
    category: "Security & Privacy",
    capability: "Runs air-gapped with zero API keys or external calls",
    agentdiff: true,
    judge: false,
    observability: "partial",
  },
  {
    category: "Security & Privacy",
    capability: "Traces stay 100% local on your machine / runner",
    agentdiff: true,
    judge: "partial",
    observability: false,
  },
  {
    category: "Complementary Domains",
    capability: "Semantic answer quality & tone grading",
    agentdiff: false,
    judge: true,
    observability: "partial",
  },
  {
    category: "Complementary Domains",
    capability: "Production traffic telemetry & live sampling dashboards",
    agentdiff: false,
    judge: false,
    observability: true,
  },
];

function StatusCell({ v }: { v: boolean | string }) {
  if (v === true) {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
        <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
          <Check className="w-3 h-3 stroke-[3]" />
        </span>
        <span>Yes</span>
      </div>
    );
  }
  if (v === false) {
    return (
      <div className="flex items-center gap-2 text-xs font-normal text-(--faint)">
        <span className="w-5 h-5 rounded-full bg-(--surface) border border-(--border) flex items-center justify-center text-(--faint) shrink-0">
          <X className="w-3 h-3 stroke-[2]" />
        </span>
        <span>No</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-amber-500">
      <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0">
        <Minus className="w-3 h-3 stroke-[2.5]" />
      </span>
      <span className="capitalize">{v}</span>
    </div>
  );
}

export default function ComparePage() {
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
                Architectural Breakdown
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.08]">
                Different tools. <span className="text-emerald-500/90 dark:text-emerald-400">Different jobs.</span>
              </h1>
              <p className="mt-6 text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed max-w-3xl font-normal">
                AgentDiff doesn&apos;t replace observability dashboards or LLM-as-judge evals — it covers the critical engineering gap they don&apos;t: deterministic, sub-10ms trajectory regression gates in CI before code merges.
              </p>

              {/* Fast Proof Points */}
              <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-(--muted)">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-(--fg) font-semibold">100% Deterministic CI</span>
                </span>
                <span className="text-(--border) select-none">•</span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Zero LLM Calls</span>
                </span>
                <span className="text-(--border) select-none">•</span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Air-Gapped Execution</span>
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. THE 3-LAYER PRODUCTION AGENT STACK */}
      <section className="py-24 sm:py-32 w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mb-16 sm:mb-20">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
                01 / Production Stack
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
                Where each layer fits in your lifecycle.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
                Modern AI engineering stacks separate testing, live monitoring, and offline research into distinct, complementary tiers.
              </p>
            </div>
          </Reveal>

          {/* 3 Pillars: High-Converting Open Layout */}
          <Reveal delay={100}>
            <div className="border-t border-(--border)">
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-(--border)">
                
                {/* Layer 1: AgentDiff */}
                <div className="py-10 lg:py-12 lg:pr-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
                      CI/CD Pull Request Gate
                    </span>
                    <GitPullRequest className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    AgentDiff
                  </h3>
                  <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                    Runs deterministically on every pull request. Diffing candidate traces against golden baselines to block tool loops, cost surges, and drift in under 10ms.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs text-(--muted)">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Verdict: PASS / FAIL (Exit Code 0 / 1)</span>
                  </div>
                </div>

                {/* Layer 2: Observability */}
                <div className="py-10 lg:py-12 lg:px-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-blue-500 font-semibold">
                      Production Telemetry
                    </span>
                    <Radio className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Observability Platforms
                  </h3>
                  <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                    Ingests live user traffic, distributed traces, and latency charts in production. Shows what happened in the wild, but does not block broken code from shipping.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs text-(--muted)">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Verdict: Real-time Telemetry &amp; Alerts</span>
                  </div>
                </div>

                {/* Layer 3: LLM Judge Evals */}
                <div className="py-10 lg:py-12 lg:pl-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-purple-500 font-semibold">
                      Offline Research &amp; Tone
                    </span>
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    LLM-as-Judge Evals
                  </h3>
                  <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                    Evaluates semantic output quality, tone, and subjective answers on offline datasets. Accepts non-deterministic scoring and API cost to grade language nuance.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs text-(--muted)">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Verdict: Qualitative Semantic Scores</span>
                  </div>
                </div>

              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. CAPABILITY MATRIX */}
      <section className="py-24 sm:py-32 w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mb-16 sm:mb-20">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
                02 / Feature Matrix
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
                Side-by-side capability breakdown.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
                An objective evaluation of what each evaluation tool is architected to solve across testing determinism, diagnostics, and privacy.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl border border-(--border) bg-(--surface) overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface-2)/60 text-xs text-(--muted) text-left font-medium">
                      <th className="py-3.5 px-6 w-5/12">Evaluation Dimension</th>
                      <th className="py-3.5 px-6 w-7/36 bg-emerald-500/5 text-emerald-500 font-semibold border-x border-(--border)">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>AgentDiff (CI Gate)</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-6 w-7/36">LLM Judges</th>
                      <th className="py-3.5 px-6 w-7/36">Observability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border) text-(--muted)">
                    
                    {/* Category 1 */}
                    <tr className="bg-(--surface-2)/40 border-t border-(--border)">
                      <td colSpan={4} className="py-3 px-6 text-xs uppercase tracking-wider font-semibold text-(--fg)">
                        01 · CI/CD &amp; Determinism
                      </td>
                    </tr>
                    {COMPARISON_ROWS.filter((r) => r.category === "CI/CD & Determinism").map((row) => (
                      <tr key={row.capability} className="hover:bg-(--surface-2)/20 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-(--fg)">
                          {row.capability}
                        </td>
                        <td className="py-4 px-6 bg-emerald-500/[0.02] border-x border-(--border)">
                          <StatusCell v={row.agentdiff} />
                        </td>
                        <td className="py-4 px-6">
                          <StatusCell v={row.judge} />
                        </td>
                        <td className="py-4 px-6">
                          <StatusCell v={row.observability} />
                        </td>
                      </tr>
                    ))}

                    {/* Category 2 */}
                    <tr className="bg-(--surface-2)/40 border-t border-(--border)">
                      <td colSpan={4} className="py-3 px-6 text-xs uppercase tracking-wider font-semibold text-(--fg)">
                        02 · Root-Cause Diagnostics
                      </td>
                    </tr>
                    {COMPARISON_ROWS.filter((r) => r.category === "Root-Cause Diagnostics").map((row) => (
                      <tr key={row.capability} className="hover:bg-(--surface-2)/20 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-(--fg)">
                          {row.capability}
                        </td>
                        <td className="py-4 px-6 bg-emerald-500/[0.02] border-x border-(--border)">
                          <StatusCell v={row.agentdiff} />
                        </td>
                        <td className="py-4 px-6">
                          <StatusCell v={row.judge} />
                        </td>
                        <td className="py-4 px-6">
                          <StatusCell v={row.observability} />
                        </td>
                      </tr>
                    ))}

                    {/* Category 3 */}
                    <tr className="bg-(--surface-2)/40 border-t border-(--border)">
                      <td colSpan={4} className="py-3 px-6 text-xs uppercase tracking-wider font-semibold text-(--fg)">
                        03 · Security &amp; Privacy
                      </td>
                    </tr>
                    {COMPARISON_ROWS.filter((r) => r.category === "Security & Privacy").map((row) => (
                      <tr key={row.capability} className="hover:bg-(--surface-2)/20 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-(--fg)">
                          {row.capability}
                        </td>
                        <td className="py-4 px-6 bg-emerald-500/[0.02] border-x border-(--border)">
                          <StatusCell v={row.agentdiff} />
                        </td>
                        <td className="py-4 px-6">
                          <StatusCell v={row.judge} />
                        </td>
                        <td className="py-4 px-6">
                          <StatusCell v={row.observability} />
                        </td>
                      </tr>
                    ))}

                    {/* Category 4 */}
                    <tr className="bg-(--surface-2)/40 border-t border-(--border)">
                      <td colSpan={4} className="py-3 px-6 text-xs uppercase tracking-wider font-semibold text-(--fg)">
                        04 · Complementary Domains
                      </td>
                    </tr>
                    {COMPARISON_ROWS.filter((r) => r.category === "Complementary Domains").map((row) => (
                      <tr key={row.capability} className="hover:bg-(--surface-2)/20 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-(--fg)">
                          {row.capability}
                        </td>
                        <td className="py-4 px-6 bg-emerald-500/[0.02] border-x border-(--border)">
                          <StatusCell v={row.agentdiff} />
                        </td>
                        <td className="py-4 px-6">
                          <StatusCell v={row.judge} />
                        </td>
                        <td className="py-4 px-6">
                          <StatusCell v={row.observability} />
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. REFERENCE ARCHITECTURE TOPOLOGY */}
      <section className="py-24 sm:py-32 w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mb-16 sm:mb-20">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
                03 / Reference Architecture
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
                The unified engineering workflow.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
                Leading AI engineering teams don&apos;t choose between these tools — they combine them according to each layer&apos;s strength:
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="p-8 rounded-2xl bg-(--surface) border border-(--border) space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 text-sm font-bold text-(--fg)">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Recommended Enterprise Topology:</span>
              </div>
              <p className="text-sm sm:text-base text-(--muted) leading-relaxed font-normal">
                Use <strong className="text-(--fg)">Observability (Langfuse / OTel)</strong> in production to capture real user telemetry traces. Ingest those traces into <strong className="text-emerald-500">AgentDiff</strong> as committed golden baselines to deterministically block regressions on every PR in CI. Run <strong className="text-(--fg)">LLM Judges</strong> offline when conducting prompt experimentation or evaluating natural language tone.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. CTA BANNER */}
      <section className="py-24 sm:py-36 w-full bg-transparent text-center border-t border-(--border) relative overflow-hidden">
        {/* Top-Right Emerald Flare */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/15 dark:bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
        
        {/* Center ambient wash */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[300px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="max-w-3xl mx-auto space-y-6">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block font-medium">
                Deterministic Testing
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.08]">
                Add deterministic regression testing <span className="text-emerald-500/90 dark:text-emerald-400">to your CI today.</span>
              </h2>
              <p className="text-base sm:text-lg text-(--muted) max-w-xl mx-auto font-normal leading-relaxed">
                No API keys or hosted subscriptions required. Diff your first two traces in seconds.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm font-semibold">
                <Link
                  href="/quickstart"
                  className="px-8 py-3.5 rounded-full bg-(--fg) text-(--bg) hover:opacity-90 transition-opacity shadow-sm"
                >
                  Get Started with Quickstart →
                </Link>
                <Link
                  href="/adapters"
                  className="px-8 py-3.5 rounded-full border border-(--border) text-(--fg) hover:bg-(--surface-2) transition-colors"
                >
                  Explore Supported Adapters
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
