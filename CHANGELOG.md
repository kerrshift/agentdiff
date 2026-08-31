# Changelog

All notable changes to **AgentDiff** (`agent-trajectory-diff`) are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Hosted identity service** (`worker/`): a stateless Cloudflare Worker
  (free tier, ~100 lines, nothing stored) that mints 1-hour GitHub App
  installation tokens for AgentDiff workflows. Once the project App is
  installed on a repo, the approve bot comments as **agentdiff[bot]** with
  zero per-repo configuration — no secrets, no variables. Security model:
  the caller must present a Actions token that already has access to the
  repo it claims, and the App must be installed there; tokens expire in ≤1
  hour regardless. Deploy checklist in `worker/README.md`.
- Three-tier bot identity in generated workflows: self-managed App secrets →
  hosted token service → `github-actions[bot]` — each tier fully automatic,
  degrading gracefully.
- **`/agentdiff approve` — the interactive PR bot** (Pillar 3 of the 0.5.0
  release, pulled forward): reviewers comment `/agentdiff approve` on a
  flagged PR and the candidate run becomes (or joins) the golden baseline —
  no local checkout, no manual JSON. Policy D3: loop violations are **never
  blessable**; path drift and cost spikes are human judgments.
  `agentdiff approve BASELINE CANDIDATE [--pr N]` powers it.
- **Branded bot identity**: the approve workflow authenticates as a GitHub
  App (`agentdiff[bot]` with AgentDiff's logo — the repo ships the avatar
  PNG) via `actions/create-github-app-token`, falling back to
  `github-actions[bot]` when the App isn't configured. App-token pushes also
  re-trigger the check (GITHUB_TOKEN pushes never do), so the check genuinely
  flips to PASSED after approval.
- **Zero-setup approve bot**: the default path needs **no configuration at
  all** — the bot runs on the workflow's own `GITHUB_TOKEN` and, after
  re-baselining, posts a genuine green `AgentDiff Check` result on the new
  head via the Checks API. The GitHub App is purely optional branding
  (identity + auto re-trigger), and a one-click website installer (App
  Manifest flow, client-side, $0 hosting) lands with the site update.
- **`agentdiff init --with-approve`**: additionally writes the approve-bot
  workflow — command filter (`/agentdiff approve`, bots excluded),
  write-permission gate on the commenter, concurrency guard, and
  candidate-trace artifact handoff from the check workflow (which now
  uploads it).
- **Error Recovery Cascade is now a default hard gate** (PRD failure class):
  a candidate that spends ≥ 3× the baseline's post-error recovery steps
  blocks CI (exit 1). Explicit `--max-recovery-ratio` still wins; pass a
  large value (or `[cli] max_recovery_ratio`) to tune it.
- **`agentdiff init` — zero-config CLI wizard** (Pillar 4 of the 0.5.0
  "Circuit Breaker" release): auto-detects the agent framework (LangGraph,
  CrewAI, OpenAI Agents SDK, OpenTelemetry/OpenInference, or generic) and
  writes a production-ready `agentdiff.toml` (v0.5 spec, statistical
  scenario) plus a GitHub Actions gate workflow in seconds.
  Idempotent — refuses to clobber without `--force`; `--adapter` overrides
  detection; `--scenario`/`--runs` parameterize the generated config.
- **Human-first PR verdict** (positioning fix, product side): the PR comment
  now leads with what reviewers care about — "No infinite loops. No cost
  spikes. Trajectory within budget — safe to merge." or "Blocked by:
  tool_loop." — with the metric table demoted to a collapsible
  *Gate details* section.
- **Statistical envelopes — N-run baselines with variance bands** (Pillar 1 of
  the 0.5.0 "Circuit Breaker" release): baselines can now capture N ≥ 2 runs
  (`agentdiff record ... --runs 5`) into a versioned
  `agentdiff_baseline_envelope` artifact (`schema/baseline_envelope.schema.json`,
  schema 2.0.0 — additive; `agent_trace.schema.json` untouched). A candidate
  passes when *some* recorded run explains it (min-TDI-of-N) and its resource
  profile sits within mean ± k·sigma bands. Existing v1 baselines keep working:
  `load_baseline()` wraps a bare trace as an envelope with N=1, mode `strict`.
- **Topological equivalence (commutative subgraphs)**: executing `[A -> B]` or
  `[B -> A]` is zero-penalty when the swapped steps are data-independent (no
  parent-graph path in either direction) and did identical work; steps with a
  dependency path, changed arguments, or changed outcomes still count as real
  divergence. New `matched_commutative` diff status renders as "reordered"
  across terminal/JSON/markdown/PR.
- **`[scenario.<name>]` config sections** (PRD v0.5 spec): `mode`,
  `sample_runs`, `max_cost_increase_pct`, `[scenario.x.hard_invariants]`
  (`fail_on_identical_loops`, `max_tool_repeats`), and
  `[scenario.x.tolerances]` (`step_count_std_dev`, `divergence_ceiling`).
  A repo with a single scenario needs no `--scenario` flag.
- **CLI statistical mode**: envelope baselines gate via variance bands
  (step-count band, envelope-relative cost ceiling = max of the relative cap
  and the k·sigma band, divergence ceiling); strict single-run baselines are
  unchanged. `--update-baseline` on an envelope rotates a rolling window of
  `sample_runs` and recomputes bands.
- Envelope benchmarks (N=3/N=5 at 100/500/1000 steps): compare cost scales
  linearly with N (N=5 @ 1000 steps ≈ 7.4s worst case; realistic KB-scale
  traces are milliseconds).
- **Decoupled failure modes — hard gates vs soft warnings** (Pillar 2 of the
  0.5.0 "Circuit Breaker" release): gate evaluation is now severity-aware.
  HARD violations block CI (exit 1); SOFT warnings render in every report
  format but never flip the exit code. New `GateResult`/`GateFinding` types;
  `evaluate_gate()` is the shared severity-aware gate, while
  `evaluate_report()` keeps its historical string contract.
- **Cyclical tool loop invariant** (`[invariants] fail_on_identical_loops`,
  default on): the same endpoint called ≥ 2 times with identical inputs and
  stagnant output state — even non-consecutively (`A -> B -> A`) — is a hard
  block. `--allow-identical-loops` disables it for a run.
- **Tool repeat cap invariant** (`[invariants] max_tool_repeats`, opt-in):
  hard cap on calls to any single endpoint; `--max-tool-repeats` flag.
- **Path drift soft warning**: a run that passes every budget but took an
  alternate route renders a non-blocking "alternate valid route" note in
  terminal, JSON (`warnings`), markdown, and PR comments (`[!NOTE]` block).
- Hard violations now render in terminal, JSON (`violations`), markdown, and
  PR comments — a FAILED report shows exactly which rules fired.
- Gate provenance (G7) and threshold-change flagging (G6) now cover the new
  `[invariants]` knobs; config sections ignore unknown keys, so
  forward-compatible `agentdiff.toml` files load cleanly.

## [0.4.0] - 2026-08-28

AgentDiff v0.4.0 — trace capture, Goodhart-resistant gating, and a full docs
site redesign. Highlights: capture traces directly from any callable with
`agentdiff record`, every report self-describes its gate provenance, threshold
changes are flagged in the PR comment, stale baselines warn on `--explain`, and
the website gains a technical `/features` deep dive, `/adapters`, `/action`,
`/compare`, and `/quickstart` pages.

### Added
- **`record` subcommand** (#23): capture execution traces from any Python
  callable (`agentdiff record my_agent:run --input '{...}' --out
  traces/run.json`), making baseline capture a one-liner instead of
  hand-instrumented serialization.
- **Gate provenance in every report** (#25): terminal, JSON, and PR report
  formats self-describe the gate rules and their source, so a green check is
  always auditable against the thresholds that produced it.
- **Threshold-change flagging** (#24): when gate values in `agentdiff.toml`
  differ from the baseline commit, the PR comment says so — above the diff —
  closing the Goodhart loop where thresholds drift to keep CI green.
- **Stale-baseline warning** (#26): `--explain` surfaces the baseline's age
  past a configurable threshold, so re-recording is a deliberate act rather
  than silent decay.
- Shell completion install instructions for bash/zsh/fish (#27).

### Changed
- **Website redesign** (#28): new editorial `/features` page with engine and
  metric diagrams, plus dedicated `/adapters`, `/action`, `/compare`, and
  `/quickstart` pages; landing sections rebuilt under a `(site)` route group.

## [0.3.0] - 2026-08-23

AgentDiff v0.3.0 — framework-native ingestion, suite-level gating, and
recovery-effort metrics. Highlights: diff LangGraph and CrewAI artifacts
natively (no OTel required), gate whole scenario suites in one call, benchmark
two agents head-to-head, and gate on how expensive recovery from errors is.

### Added
- **Recovery Step Ratio (RSR)** — new metric quantifying how expensive it is
  to get back on track after errors: the successful steps spent after each
  ERROR/RETRY/ABANDONED cluster until the trajectory re-aligns with the
  baseline path. `DiffReport` gains `baseline_recovery_steps`,
  `candidate_recovery_steps`, and `recovery_step_ratio` (additive, defaulted);
  surfaced in `summary()`, terminal, PR markdown (row appears when a threshold
  is set), and `--explain` findings. Gateable via the opt-in
  `assert_no_regressions(..., max_recovery_step_ratio=...)` and CLI/config
  `--max-recovery-ratio` / `[cli] max_recovery_ratio`.
- **LangGraph adapter** (`agentdiff.adapters.LangGraphAdapter`, name
  `"langgraph"`): direct ingestion of native LangGraph artifacts — state
  snapshots, checkpoint dumps (`channel_values`), and message lists — in all
  three serialization shapes (`message_to_dict` dumps, LangChain constructor
  dumps, plain OpenAI-style role dicts). Tool decisions map to routing steps,
  tool results to tool_call steps (status honored), and the final AI answer to
  a response step; token usage read from `usage_metadata` /
  `response_metadata.token_usage`. Participates in `auto` detection.
- **CrewAI adapter** (`agentdiff.adapters.CrewAIAdapter`, name `"crewai"`):
  direct ingestion of CrewAI kickoff output (`CrewOutput.model_dump()`) —
  per-task message logs map to fine-grained routing/tool/response steps
  prefixed by agent role, aggregate `token_usage` populates trace totals, and
  simplified exports without logs degrade to one step per task. Participates
  in `auto` detection.
- **Shared role-message engine** (`adapters/_messages.py`): one interpretation
  of OpenAI-style role conversations across all serialization shapes,
  powering the LangGraph and CrewAI adapters identically.
- **Adapter registry + plugin discovery** (`agentdiff.adapters.register_adapter`
  / `available_adapters`): custom adapters can be registered at runtime or via
  the standard `agentdiff.adapters` entry-point group, and resolved by name
  through `load_trace(..., adapter_name=...)` / `[adapter] name = "..."`.
  Custom adapters may implement a `detect(data) -> bool` classmethod to join
  `auto` detection (built-ins always take priority).
- **Scenario runner** (`agentdiff.run_scenarios`): run multi-scenario
  regression suites programmatically. Each `Scenario` pairs a baseline and a
  candidate (trace objects or file paths) with its own `GateThresholds`; the
  resulting `SuiteReport` aggregates pass/fail/error per scenario with a
  CI-friendly `summary()` — one broken trace or failing scenario never aborts
  the rest of the suite.
- **Parallel scenario execution**: `run_scenarios(..., workers=N)` executes
  scenarios on a thread pool (opt-in; sequential by default). Results are
  always returned in input order, and per-scenario errors stay contained.
- **A/B benchmark mode** (`agentdiff.run_benchmark`): head-to-head comparison
  of two agents on the same task across frameworks. Each case is scored on
  four deterministic efficiency dimensions (steps, wasted effort, tokens,
  latency); majority wins with explicit ties, plus a per-case side-by-side
  table (`summary()` / `to_markdown()`) and overall tally. Opt-in parallel
  execution via `workers=N`. Verdicts are structural-efficiency only —
  semantic quality remains a non-goal.
- **Performance benchmark suite** (`make bench`, `benchmarks/`): pytest-benchmark
  coverage for alignment, end-to-end compare, loop detection, recovery metrics,
  adapter parsing, and report serialization at 100/500/1000-step scales.
  Baseline finding: LCS alignment dominates runtime (~1.6s at 1000 steps);
  ingestion and metric computation are negligible. Excluded from the regular
  test suite; results are local (`.benchmarks/` gitignored).
- Gate semantics are centralized in a pure `evaluate_report()` shared by
  `assert_no_regressions` and the scenario runner (single source of truth for
  current and future gates).

### Cookbooks
- Added `live_langgraph.py` and `live_crewai.py`: real framework executions
  instrumented with OpenInference, diffed through the `openinference` adapter
  — divergence, loop flags, and gate blocking on genuine graph/crew output.
- Added `ingestion_langgraph.py` and `ingestion_crewai.py`: offline direct-
  ingestion recipes against real captured fixtures (no OTel, no API keys),
  each diffing a regression variant of the fixture.

## [0.2.2] - 2026-08-19

### Added
- **`agentdiff-check` GitHub Action** gains `pr` and `github-token` inputs: when
  `pr` is set, the action runs `agentdiff --pr <N>` and posts the PR-ready
  report (status, gate thresholds, root-cause culprit, collapsed divergence
  tree, loops) as a comment on the pull request. The comment is posted even
  when the gate blocks (exit 1).

## [0.2.1] - 2026-08-19

Patch release. Every change below was **found by live-testing the adapters
against real SDK/API output** and fixed so the adapters ingest real traces
natively (no caller-side reshaping).

### Fixed
- **openai_agents**: skip `task`/`turn` bookkeeping spans as the real SDK emits
  them (type `custom` + name `task`/`turn`, not a dedicated span type).
- **langfuse**: map the v4 SDK's `AGENT`/`CHAIN`/`TOOL`/`RETRIEVER` observation
  types (previously they fell through to `thought`); sort observations
  chronologically by start time; accept snake_case SDK keys
  (`start_time`, `parent_observation_id`, `status_message`, `latency`).
- **openinference**: accept real OTel values natively — integer span/trace ids
  are stringified, and nanosecond timestamps are auto-detected (the legacy
  shape used seconds).
- **testing**: `assert_no_regressions` now marks the report `passed=False` on
  failure, so a printed `summary()` no longer misleadingly shows "PASSED" after
  a blocked gate.

### Cookbooks
- Added live recipes that ingest **real** traces through each adapter:
  `live_openai_agents.py` (OpenAI Agents SDK), `live_openinference.py`
  (OpenInference/OTel), `live_langfuse.py` (Langfuse Cloud, v4 SDK).

### Documentation
- README/cookbook guides updated for the live adapter recipes.

[0.2.1]: https://github.com/lostmartian/agentdiff/releases/tag/v0.2.1
[0.3.0]: https://github.com/lostmartian/agentdiff/releases/tag/v0.3.0
[0.2.2]: https://github.com/lostmartian/agentdiff/releases/tag/v0.2.2

## [0.2.0] - 2026-08-19

**AgentDiff v0.2.0** — the first PyPI release of a developer-first trajectory
regression engine for multi-turn, tool-using AI agents.

### Added
- **Trajectory diff engine**: structurally compares two agent execution DAGs,
  aligning steps to compute the **Trajectory Divergence Index (TDI)**, **Wasted
  Effort Index (WEI)**, resource/token deltas, and **tool-loop detection**.
- **Local-first CI/CD gate**: `assert_no_regressions(...)` for `pytest`, a CLI
  with exit codes, and a composite **GitHub Action** (`agentdiff-check`).
- **Telemetry adapters**: `generic`, `openinference`, `langfuse`, `langsmith`,
  and `openai_agents` — with `auto` detection from raw JSON/OTel files.
- **CLI**: `agentdiff baseline.json candidate.json` with `--format`
  (`terminal`/`json`/`markdown`/`pr`), `--fail-on-regression`,
  `--max-divergence`, `--max-loops`, `--max-cost-delta`, `--baseline/-b`,
  `--update-baseline`, baseline rotation (`--baseline-rotation` /
  `--max-drift`), and `--pr` PR report generation.
- **Config-as-code**: `agentdiff.toml` (`load_config` / `find_config_file`),
  with CLI flags overriding config.
- **Reporters**: terminal (rich), JSON, Markdown, PR reports, tree rendering,
  and human-readable change explanations / culprit location.
- **Public Python API**: `compare`, `assert_no_regressions`, `load_trace`,
  `parse_trace_data`, `load_config`, `decide_rotation`,
  `generate_pr_markdown`, plus canonical models (`AgentTrace`, `DiffReport`,
  `StepDiff`, ...).
- **pytest plugin**: `agentdiff` marker/entry-point for threshold gating.

### Fixed
- **Python 3.10 ISO timestamp parsing**: telemetry timestamps with a short
  fractional second (e.g. `...00.5Z`) now parse correctly across all adapters,
  instead of silently dropping latency to `0.0`.

### Documentation
- Full docs site (markdown) covering adapters, CLI, regression gates, CI/CD,
  configuration, and baseline workflows.
- `cookbooks/` with ingestion examples for each telemetry adapter.

### Notes
- Requires Python 3.10+.
- Licensed under MIT.

[0.2.0]: https://github.com/lostmartian/agentdiff/releases/tag/v0.2.0