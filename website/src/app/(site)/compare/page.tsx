import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus, X, GitPullRequest, Radio, Sparkles, Scale, Gauge, ShieldAlert, Cpu } from "lucide-react";
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
      <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-500 dark:text-emerald-400">
        <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
          <Check className="w-3 h-3 stroke-[3]" />
        </span>
        <span>Yes</span>
      </div>
    );
  }
  if (v === false) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-(--faint)">
        <span className="w-5 h-5 rounded-full bg-(--surface) border border-(--border)/60 flex items-center justify-center text-(--faint) shrink-0">
          <X className="w-3 h-3 stroke-[2]" />
        </span>
        <span>No</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs font-mono text-amber-500/90 dark:text-amber-400/90">
      <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
        <Minus className="w-3 h-3 stroke-[2.5]" />
      </span>
      <span className="capitalize">{v}</span>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="w-full font-sans pb-32">
      {/* 1. MARKETING HERO */}
      <section className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-5xl">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-4">
              Architectural Comparison
            </span>
            <h1
              className="font-semibold tracking-[-0.035em] text-(--fg) leading-[1.04]"
              style={{ fontSize: "var(--text-display)" }}
            >
              Different tools, different jobs.
            </h1>
            <p
              className="mt-6 text-base sm:text-lg text-(--muted) leading-relaxed max-w-4xl font-normal"
              style={{ lineHeight: "var(--leading-subtitle)" }}
            >
              AgentDiff doesn&apos;t replace observability dashboards or LLM-as-judge evals — it covers the critical gap they don&apos;t: deterministic, sub-10ms trajectory regression gates in CI before code merges.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-mono">
              <span className="text-(--fg) font-semibold">100% Deterministic CI</span>
              <span className="text-(--border-strong)">•</span>
              <span className="text-(--muted)">Zero LLM calls</span>
              <span className="text-(--border-strong)">•</span>
              <span className="text-(--muted)">Air-gapped execution</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 2. THE 3-PILLAR TRIAD ARCHITECTURE */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-2">
              The Production Agent Stack
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              Where Each Layer Fits in Your Lifecycle
            </h2>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Layer 1: AgentDiff */}
            <div className="p-7 rounded-3xl bg-(--surface-2)/40 border border-(--border) space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-(--surface) border border-(--border) flex items-center justify-center text-(--fg)">
                <GitPullRequest className="w-5 h-5 text-(--accent)" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-(--faint)">CI/CD Pull Request Gate</div>
                <h3 className="text-lg font-semibold text-(--fg) mt-1">AgentDiff</h3>
              </div>
              <p className="text-sm text-(--muted) leading-relaxed">
                Runs deterministically on every pull request. Diffing candidate traces against golden baselines to block tool loops, cost surges, and drift in under 10ms.
              </p>
              <div className="pt-2 text-xs font-mono text-(--faint)">
                Verdict: PASS / FAIL (Exit Code 0 / 1)
              </div>
            </div>

            {/* Layer 2: Observability */}
            <div className="p-7 rounded-3xl bg-(--surface-2)/20 border border-(--border) space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-(--surface) border border-(--border) flex items-center justify-center text-(--muted)">
                <Radio className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-(--faint)">Production Telemetry</div>
                <h3 className="text-lg font-semibold text-(--fg) mt-1">Observability (OTel/Langfuse)</h3>
              </div>
              <p className="text-sm text-(--muted) leading-relaxed">
                Ingests live user traffic, distributed traces, and latency charts in production. Shows what happened in the wild, but does not block broken code from shipping.
              </p>
              <div className="pt-2 text-xs font-mono text-(--faint)">
                Verdict: Real-time Telemetry &amp; Alerts
              </div>
            </div>

            {/* Layer 3: LLM Judge Evals */}
            <div className="p-7 rounded-3xl bg-(--surface-2)/20 border border-(--border) space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-(--surface) border border-(--border) flex items-center justify-center text-(--muted)">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-(--faint)">Offline Research &amp; Tone</div>
                <h3 className="text-lg font-semibold text-(--fg) mt-1">LLM-as-Judge Evals</h3>
              </div>
              <p className="text-sm text-(--muted) leading-relaxed">
                Evaluates semantic output quality, tone, and subjective answers on offline datasets. Accepts non-deterministic scoring and API cost to grade language nuance.
              </p>
              <div className="pt-2 text-xs font-mono text-(--faint)">
                Verdict: Qualitative Semantic Scores
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 3. CAPABILITY MATRIX (GROUPED BY DOMAIN) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-2">
              Feature-by-Feature Breakdown
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              Capability Matrix
            </h2>
            <p className="mt-3 text-sm sm:text-base text-(--muted) leading-relaxed max-w-3xl">
              An objective evaluation of what each tool is architected to solve across testing determinism, diagnostics, and privacy.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="rounded-3xl border border-(--border) bg-(--surface) overflow-hidden shadow-xs">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[720px]">
                <thead>
                  <tr className="border-b border-(--border) bg-(--surface-2)/80 text-xs font-mono text-(--faint) uppercase tracking-wider">
                    <th className="py-4.5 px-6 font-semibold text-(--fg) w-5/12">Evaluation Dimension</th>
                    <th className="py-4.5 px-6 font-semibold text-(--fg) w-7/36 bg-(--surface-2)">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-(--accent)" />
                        <span>AgentDiff (CI Gate)</span>
                      </div>
                    </th>
                    <th className="py-4.5 px-6 font-semibold text-(--muted) w-7/36">LLM Judges</th>
                    <th className="py-4.5 px-6 font-semibold text-(--muted) w-7/36">Observability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)/50 text-sm">
                  {/* Category 1 */}
                  <tr className="bg-(--surface-2)/40 border-t border-(--border)">
                    <td colSpan={4} className="py-2.5 px-6 text-[11px] font-mono uppercase tracking-[0.14em] font-semibold text-(--fg)">
                      01 · CI/CD &amp; Determinism
                    </td>
                  </tr>
                  {COMPARISON_ROWS.filter((r) => r.category === "CI/CD & Determinism").map((row) => (
                    <tr key={row.capability} className="hover:bg-(--surface-2)/30 transition-colors">
                      <td className="py-3.5 px-6 text-[13.5px] font-medium text-(--fg)">
                        {row.capability}
                      </td>
                      <td className="py-3.5 px-6 bg-(--surface-2)/20">
                        <StatusCell v={row.agentdiff} />
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusCell v={row.judge} />
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusCell v={row.observability} />
                      </td>
                    </tr>
                  ))}

                  {/* Category 2 */}
                  <tr className="bg-(--surface-2)/40 border-t border-(--border)">
                    <td colSpan={4} className="py-2.5 px-6 text-[11px] font-mono uppercase tracking-[0.14em] font-semibold text-(--fg)">
                      02 · Root-Cause Diagnostics
                    </td>
                  </tr>
                  {COMPARISON_ROWS.filter((r) => r.category === "Root-Cause Diagnostics").map((row) => (
                    <tr key={row.capability} className="hover:bg-(--surface-2)/30 transition-colors">
                      <td className="py-3.5 px-6 text-[13.5px] font-medium text-(--fg)">
                        {row.capability}
                      </td>
                      <td className="py-3.5 px-6 bg-(--surface-2)/20">
                        <StatusCell v={row.agentdiff} />
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusCell v={row.judge} />
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusCell v={row.observability} />
                      </td>
                    </tr>
                  ))}

                  {/* Category 3 */}
                  <tr className="bg-(--surface-2)/40 border-t border-(--border)">
                    <td colSpan={4} className="py-2.5 px-6 text-[11px] font-mono uppercase tracking-[0.14em] font-semibold text-(--fg)">
                      03 · Security &amp; Privacy
                    </td>
                  </tr>
                  {COMPARISON_ROWS.filter((r) => r.category === "Security & Privacy").map((row) => (
                    <tr key={row.capability} className="hover:bg-(--surface-2)/30 transition-colors">
                      <td className="py-3.5 px-6 text-[13.5px] font-medium text-(--fg)">
                        {row.capability}
                      </td>
                      <td className="py-3.5 px-6 bg-(--surface-2)/20">
                        <StatusCell v={row.agentdiff} />
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusCell v={row.judge} />
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusCell v={row.observability} />
                      </td>
                    </tr>
                  ))}

                  {/* Category 4 */}
                  <tr className="bg-(--surface-2)/40 border-t border-(--border)">
                    <td colSpan={4} className="py-2.5 px-6 text-[11px] font-mono uppercase tracking-[0.14em] font-semibold text-(--fg)">
                      04 · Complementary Domains
                    </td>
                  </tr>
                  {COMPARISON_ROWS.filter((r) => r.category === "Complementary Domains").map((row) => (
                    <tr key={row.capability} className="hover:bg-(--surface-2)/30 transition-colors">
                      <td className="py-3.5 px-6 text-[13.5px] font-medium text-(--fg)">
                        {row.capability}
                      </td>
                      <td className="py-3.5 px-6 bg-(--surface-2)/20">
                        <StatusCell v={row.agentdiff} />
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusCell v={row.judge} />
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusCell v={row.observability} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 4. GUIDANCE: WHEN TO USE WHAT */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-3">
              Stack Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              The Unified Engineering Stack
            </h2>
            <p className="mt-3 text-sm sm:text-base text-(--muted) leading-relaxed">
              Leading agent engineering teams don&apos;t choose between these tools — they combine them according to each layer&apos;s strength:
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="p-8 rounded-3xl bg-(--surface-2)/30 border border-(--border) space-y-4">
            <div className="flex items-center gap-2 text-sm font-mono font-semibold text-(--fg)">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Recommended Reference Topology:</span>
            </div>
            <p className="text-sm text-(--muted) leading-relaxed">
              Use <strong>Observability (Langfuse / OTel)</strong> in production to capture real user traces. Ingest those traces into <strong>AgentDiff</strong> as committed golden baselines to deterministically block regressions on every PR in CI. Run <strong>LLM Judges</strong> offline when conducting prompt experimentation or evaluating natural language tone.
            </p>
          </div>
        </Reveal>
      </section>

      {/* 5. CTA */}
      <section className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg) mb-3">
            Add Deterministic Regression Testing to Your CI
          </h2>
          <p className="text-base text-(--muted) max-w-lg mx-auto mb-8 font-normal">
            No API keys or hosted subscriptions required. Diff your first two traces in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
            <Link
              href="/quickstart"
              className="px-8 py-3.5 rounded-full bg-(--fg) text-(--bg) hover:opacity-90 transition-opacity"
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
        </Reveal>
      </section>
    </div>
  );
}
