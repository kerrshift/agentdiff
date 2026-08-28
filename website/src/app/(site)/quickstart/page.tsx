import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles, Terminal, FileCode2, Play, GitPullRequest, ShieldCheck, Flame, ArrowDown } from "lucide-react";
import Reveal from "@/components/Reveal";
import CodeBlock from "@/components/CodeBlock";

const SITE_URL = "https://agentdiff.lostmartian.in";

export const metadata: Metadata = {
  title: "Quickstart — Zero to Gated Agent in 5 Minutes",
  description:
    "Install, record, diff, and gate with AgentDiff. Step-by-step developer guide with CLI commands, pytest integration, and GitHub Action workflows.",
  keywords: [
    "AgentDiff quickstart",
    "agent trajectory testing tutorial",
    "AI agent regression CI/CD",
    "record agent trace",
    "agentdiff CLI",
  ],
  authors: [{ name: "AgentDiff", url: SITE_URL }],
  creator: "AgentDiff",
  publisher: "AgentDiff",
  alternates: { canonical: "/quickstart" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Quickstart | AgentDiff",
    description: "Install, record, diff, and gate — AgentDiff in five minutes.",
    url: `${SITE_URL}/quickstart`,
    siteName: "AgentDiff",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quickstart | AgentDiff",
    description: "Install, record, diff, and gate — AgentDiff in five minutes.",
  },
};

export default function QuickstartPage() {
  return (
    <div className="w-full font-sans pb-32">
      {/* 1. HERO HEADER */}
      <section className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-5xl">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-4">
              Developer Onboarding
            </span>
            <h1
              className="font-semibold tracking-[-0.035em] text-(--fg) leading-[1.04]"
              style={{ fontSize: "var(--text-display)" }}
            >
              Zero to gated agent in five minutes.
            </h1>
            <p
              className="mt-6 text-base sm:text-lg text-(--muted) leading-relaxed max-w-4xl font-normal"
              style={{ lineHeight: "var(--leading-subtitle)" }}
            >
              No API keys. No accounts. No telemetry daemons. One clean install, one recorded golden trace, and an automated regression gate in CI.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-mono">
              <span className="text-(--fg) font-semibold">&lt;5 minute setup</span>
              <span className="text-(--border-strong)">•</span>
              <span className="text-(--muted)">Python 3.10+</span>
              <span className="text-(--border-strong)">•</span>
              <span className="text-(--muted)">Air-gapped &amp; Local</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 2. MAIN 4-STEP PIPELINE */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-28 w-full">
          
          {/* STEP 01 */}
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-emerald-500 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/25">
                    01
                  </span>
                  <span className="text-xs font-mono uppercase tracking-wider text-(--faint)">
                    INSTALLATION
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
                  Install the CLI &amp; Python SDK
                </h2>
                <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                  Install AgentDiff into your virtual environment or global toolchain. Compatible with Python 3.10+ and managed with uv or pip with zero background daemons.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-(--muted)">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-(--fg) font-semibold">Python 3.10+</span>
                  <span className="text-(--faint)">· macOS / Linux / Windows</span>
                </div>
              </div>

              <div className="lg:col-span-7">
                <CodeBlock
                  language="bash"
                  filename="terminal"
                  code={`# Install via pip
pip install agent-trajectory-diff

# Or add to your project via uv
uv add agent-trajectory-diff`}
                />
              </div>
            </div>
          </Reveal>

          {/* STEP 02 */}
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-blue-500 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/25">
                    02
                  </span>
                  <span className="text-xs font-mono uppercase tracking-wider text-(--faint)">
                    BASELINE CAPTURE
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
                  Record a Golden Baseline Trace
                </h2>
                <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                  Point AgentDiff directly at your agent entry callable. It executes once and emits a deterministic canonical JSON trace file. Commit this to git next to your tests.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-(--muted)">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-(--fg) font-semibold">Canonical AgentTrace DAG</span>
                  <span className="text-(--faint)">· Schema v1.0</span>
                </div>
              </div>

              <div className="lg:col-span-7">
                <CodeBlock
                  language="bash"
                  filename="terminal"
                  code={`agentdiff record my_agent_module:run \\
  --input '{"query": "Generate Q3 sales analysis"}' \\
  --output baselines/golden_run.json`}
                />
              </div>
            </div>
          </Reveal>

          {/* STEP 03 */}
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-amber-500 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/25">
                    03
                  </span>
                  <span className="text-xs font-mono uppercase tracking-wider text-(--faint)">
                    TOPOLOGICAL EVALUATION
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
                  Diff the Next Run &amp; Inspect Divergence
                </h2>
                <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                  When modifying prompts, model versions, or tools, run the comparator to inspect structural divergence (TDI), loop cycles, and cost delta in &lt;10ms.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-(--muted)">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-(--fg) font-semibold">&lt;10ms execution</span>
                  <span className="text-(--faint)">· Zero LLM judge calls</span>
                </div>
              </div>

              <div className="lg:col-span-7">
                <CodeBlock
                  language="bash"
                  filename="terminal"
                  code={`agentdiff baselines/golden_run.json candidate_run.json \\
  --explain \\
  --tree`}
                />
              </div>
            </div>
          </Reveal>

          {/* STEP 04 */}
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-purple-500 px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/25">
                    04
                  </span>
                  <span className="text-xs font-mono uppercase tracking-wider text-(--faint)">
                    CI/CD REGRESSION GATE
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
                  Gate Every PR in Your CI Pipeline
                </h2>
                <p className="text-sm sm:text-base text-(--muted) leading-relaxed">
                  Add a strict exit-code regression gate to your continuous integration workflow. Exits with code 1 if thresholds are breached and outputs a rich diagnostic PR comment.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-(--muted)">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-(--fg) font-semibold">Exit Code 0 / 1</span>
                  <span className="text-(--faint)">· Automated PR diagnostics</span>
                </div>
              </div>

              <div className="lg:col-span-7">
                <CodeBlock
                  language="bash"
                  filename="ci_pipeline.sh"
                  code={`agentdiff baselines/golden_run.json candidate_run.json \\
  --fail-on-regression \\
  --max-divergence 0.25 \\
  --max-cost-delta 10.0 \\
  --format markdown \\
  --output-file pr_verdict.md`}
                />
              </div>
            </div>
          </Reveal>

        </div>
      </section>

      {/* 3. INTEGRATION PATTERNS: PYTEST & DECLARATIVE POLICY */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-(--border)">
        <Reveal>
          <div className="mb-14 max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint) block mb-2">
              Integration Frameworks
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              Two Ways to Run in Your Toolchain
            </h2>
            <p className="mt-3 text-sm sm:text-base text-(--muted) leading-relaxed">
              Whether you want standard unit test assertions in pytest or repository-wide threshold governance in <code className="font-mono text-xs text-(--fg)">agentdiff.toml</code>:
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full items-start">
            {/* Pattern 1 */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-emerald-500 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">
                    A
                  </span>
                  <h3 className="font-semibold text-lg text-(--fg)">Native Pytest Plugin</h3>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-(--faint) px-2 py-0.5 rounded bg-(--surface-2) border border-(--border)">
                  pytest-plugin
                </span>
              </div>
              <p className="text-sm text-(--muted) leading-relaxed">
                Run your golden test baselines directly through standard pytest runners. Automatically flag regressions with expressive <code className="font-mono text-xs text-(--fg) bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">assert_no_regressions()</code> assertions.
              </p>
              <div className="pt-2">
                <CodeBlock
                  language="python"
                  filename="test_agent.py"
                  code={`def test_agent_checkout():
    baseline = load_trace("golden.json")
    candidate = run_agent(input_data)
    
    assert_no_regressions(
        compare(baseline, candidate),
        max_divergence=0.25,
        allow_loops=False
    )`}
                />
              </div>
            </div>

            {/* Pattern 2 */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-blue-500 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/25">
                    B
                  </span>
                  <h3 className="font-semibold text-lg text-(--fg)">Declarative Governance Policy</h3>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-(--faint) px-2 py-0.5 rounded bg-(--surface-2) border border-(--border)">
                  agentdiff.toml
                </span>
              </div>
              <p className="text-sm text-(--muted) leading-relaxed">
                Commit your regression thresholds once in <code className="font-mono text-xs text-(--fg) bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">agentdiff.toml</code>. Audit threshold alterations directly on PRs to prevent silent test weakening.
              </p>
              <div className="pt-2">
                <CodeBlock
                  language="toml"
                  filename="agentdiff.toml"
                  code={`[assertions]
max_divergence = 0.25
max_cost_increase_pct = 5.0
allow_loops = false
max_wasted_effort = 0.10
max_recovery_step_ratio = 1.5`}
                />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 4. CTA */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center border-t border-(--border)">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg) mb-3">
            Ready to Automate on GitHub?
          </h2>
          <p className="text-base text-(--muted) max-w-lg mx-auto mb-8 font-normal">
            Add the one-step AgentDiff GitHub Action to your workflows and get automatic PR comment verdicts on every commit.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
            <Link
              href="/action"
              className="px-8 py-3.5 rounded-full bg-(--fg) text-(--bg) hover:opacity-90 transition-opacity"
            >
              Setup GitHub Action →
            </Link>
            <Link
              href="/docs"
              className="px-8 py-3.5 rounded-full border border-(--border) text-(--fg) hover:bg-(--surface-2) transition-colors"
            >
              Explore Full CLI Docs
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
