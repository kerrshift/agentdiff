import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles, Terminal, Play, GitPullRequest, ShieldCheck, Zap, Layers, FileCode2 } from "lucide-react";
import Reveal from "@/components/Reveal";
import CodeBlock from "@/components/CodeBlock";

const SITE_URL = "https://agentdiff.app";

export const metadata: Metadata = {
  title: "Quickstart — Zero to Gated Agent in 5 Minutes",
  description:
    "Install, record, diff, and gate with AgentDiff. Step-by-step developer onboarding with CLI commands, pytest integration, and GitHub Action workflows.",
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

const STEPS = [
  {
    num: "01",
    tag: "INSTALLATION",
    title: "Install the Engine",
    description:
      "Install AgentDiff into your project via pip or uv. Air-gapped, zero cloud accounts, and zero background services.",
    badge: "< 3 seconds",
    codeLanguage: "bash",
    filename: "terminal",
    code: `# Install via pip
pip install agent-trajectory-diff

# Or add to uv project
uv add agent-trajectory-diff`,
  },
  {
    num: "02",
    tag: "BASELINE CAPTURE",
    title: "Record Golden Baseline Trace",
    description:
      "Execute your known good agent once to capture its canonical execution DAG. Commit the resulting JSON file directly into git.",
    badge: "1-Click Snapshot",
    codeLanguage: "bash",
    filename: "terminal",
    code: `agentdiff record my_agent_module:run \\
  --input '{"query": "Generate Q3 sales analysis"}' \\
  --output baselines/golden_run.json`,
  },
  {
    num: "03",
    tag: "TOPOLOGICAL EVALUATION",
    title: "Diff Candidate Trajectories",
    description:
      "When upgrading prompts, tools, or model weights, run the comparator to verify graph invariance and catch loops in < 5ms.",
    badge: "< 5ms Diff",
    codeLanguage: "bash",
    filename: "terminal",
    code: `agentdiff baselines/golden_run.json candidate_run.json \\
  --explain \\
  --tree`,
  },
  {
    num: "04",
    tag: "CI/CD REGRESSION GATE",
    title: "Gate Pull Requests in CI",
    description:
      "Enforce strict trajectory thresholds in your CI pipeline. Automatically exits with code 1 if thresholds fail and posts a rich PR comment.",
    badge: "Exit Code 0 / 1",
    codeLanguage: "bash",
    filename: "ci_pipeline.sh",
    code: `agentdiff baselines/golden_run.json candidate_run.json \\
  --fail-on-regression \\
  --max-divergence 0.25 \\
  --max-cost-delta 10.0 \\
  --format markdown \\
  --output-file pr_verdict.md`,
  },
];

export default function QuickstartPage() {
  return (
    <div className="w-full font-sans divide-y divide-(--border)">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-20 sm:pt-24 sm:pb-24 bg-transparent">
        {/* Subtle top spotlight glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[300px] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-500/15 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="max-w-4xl">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-4 font-medium">
                Developer Onboarding
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.08]">
                Zero to gated agent in <span className="text-emerald-500/90 dark:text-emerald-400">five minutes</span>.
              </h1>
              <p className="mt-6 text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed max-w-3xl font-normal">
                No API keys. No external accounts. No telemetry daemons. One clean install, one recorded golden trace, and an automated regression gate protecting every PR.
              </p>

              {/* Fast Proof Points */}
              <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-(--muted)">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-(--fg) font-semibold">5-Minute Setup</span>
                </span>
                <span className="text-(--border) select-none">•</span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Python 3.10+</span>
                </span>
                <span className="text-(--border) select-none">•</span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>100% Local-First &amp; Air-Gapped</span>
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. STEP-BY-STEP MARKETING PIPELINE */}
      <section className="py-24 sm:py-32 bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Reveal>
            <div className="max-w-3xl mb-16 sm:mb-20">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
                The 4-Step Flow
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
                From local execution to automated CI gate.
              </h2>
            </div>
          </Reveal>

          <div className="space-y-20 sm:space-y-24 w-full">
            {STEPS.map((step) => (
              <Reveal key={step.num}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                  
                  {/* Left Column: Spec & Marketing Copy */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-(--fg) px-2.5 py-1 rounded-full bg-(--surface-2) border border-(--border)">
                        {step.num}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-(--faint) font-medium">
                        {step.tag}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-(--fg)">
                      {step.title}
                    </h3>

                    <p className="text-sm sm:text-base text-(--muted) leading-relaxed font-normal">
                      {step.description}
                    </p>

                    <div className="pt-2 flex items-center gap-2 text-xs text-(--muted)">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-(--fg) font-semibold">{step.badge}</span>
                    </div>
                  </div>

                  {/* Right Column: Sleek Code Terminal */}
                  <div className="lg:col-span-7">
                    <div className="rounded-2xl border border-(--border) bg-(--surface) overflow-hidden shadow-2xs">
                      <CodeBlock
                        language={step.codeLanguage}
                        filename={step.filename}
                        code={step.code}
                      />
                    </div>
                  </div>

                </div>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* 3. TOOLCHAIN PATTERNS: PYTEST VS DECLARATIVE TOML */}
      <section className="py-24 sm:py-32 bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Reveal>
            <div className="mb-16 sm:mb-20 max-w-3xl">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-3 font-medium">
                Integration Modes
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
                Two ways to integrate in your workflow.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-(--muted) leading-relaxed">
                Whether you prefer unit test assertions in pytest or repository-wide threshold governance in <code className="text-xs text-(--fg) font-mono bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">agentdiff.toml</code>:
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
              
              {/* Pattern A: Pytest Plugin */}
              <div className="p-6 sm:p-8 rounded-3xl border border-(--border) bg-(--surface) shadow-2xs space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-(--fg) bg-(--surface-2) border border-(--border) rounded-full px-3 py-1 font-semibold">
                      Option A · Pytest Plugin
                    </span>
                    <span className="text-xs text-emerald-500 font-medium">Native Python</span>
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Programmatic Pytest Assertions
                  </h3>
                  <p className="text-sm text-(--muted) leading-relaxed">
                    Run your golden test baselines directly through standard pytest runners. Automatically flag regressions with expressive <code className="text-xs text-(--fg) font-mono bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">assert_no_regressions()</code> assertions.
                  </p>
                </div>

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

              {/* Pattern B: agentdiff.toml */}
              <div className="p-6 sm:p-8 rounded-3xl border border-(--border) bg-(--surface) shadow-2xs space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-(--fg) bg-(--surface-2) border border-(--border) rounded-full px-3 py-1 font-semibold">
                      Option B · Declarative Config
                    </span>
                    <span className="text-xs text-emerald-500 font-medium">Repository Policy</span>
                  </div>
                  <h3 className="text-xl font-bold text-(--fg) tracking-tight">
                    Declarative Governance Policy
                  </h3>
                  <p className="text-sm text-(--muted) leading-relaxed">
                    Commit your regression thresholds once in <code className="text-xs text-(--fg) font-mono bg-(--surface-2) px-1.5 py-0.5 rounded border border-(--border)">agentdiff.toml</code>. Audit threshold alterations directly on PRs to prevent silent test weakening.
                  </p>
                </div>

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

        </div>
      </section>

      {/* 4. CLOSING MARKETING CTA */}
      <section className="py-24 sm:py-32 bg-transparent relative overflow-hidden">
        {/* Background radial glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/15 dark:bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none -mr-24 -mt-24" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Reveal>
            <div className="max-w-2xl mx-auto space-y-4">
              <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block font-medium">
                Next Step
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-(--fg)">
                Ready to automate on GitHub?
              </h2>
              <p className="text-base sm:text-lg text-(--muted) leading-relaxed font-normal">
                Add the official AgentDiff GitHub Action to your repository and receive instant diagnostic PR comments on every commit.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
                <Link
                  href="/action"
                  className="px-8 py-3.5 rounded-full bg-(--fg) text-(--bg) text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-sm"
                >
                  <span>Explore GitHub Action</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/docs"
                  className="px-7 py-3.5 rounded-full border border-(--border) bg-(--surface) text-(--fg) text-sm font-semibold hover:bg-(--surface-2) transition-colors"
                >
                  <span>Full CLI Documentation</span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
