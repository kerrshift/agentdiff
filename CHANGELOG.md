# Changelog

All notable changes to **AgentDiff** (`agent-trajectory-diff`) are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **LangGraph adapter** (`agentdiff.adapters.LangGraphAdapter`, name
  `"langgraph"`): direct ingestion of native LangGraph artifacts — state
  snapshots, checkpoint dumps (`channel_values`), and message lists — in all
  three serialization shapes (`message_to_dict` dumps, LangChain constructor
  dumps, plain OpenAI-style role dicts). Tool decisions map to routing steps,
  tool results to tool_call steps (status from the message's own `status`
  field), and the final AI answer to a response step; token usage is read from
  `usage_metadata` / `response_metadata.token_usage`. Participates in `auto`
  detection (conservative structural checks) and ships with a real captured
  fixture + offline cookbook.
- **Parallel scenario execution**: `run_scenarios(..., workers=N)` executes
  scenarios on a thread pool (opt-in; sequential by default). Results are
  always returned in input order, and per-scenario errors stay contained.
- **Scenario runner** (`agentdiff.run_scenarios`): run multi-scenario
  regression suites programmatically. Each `Scenario` pairs a baseline and a
  candidate (trace objects or file paths) with its own `GateThresholds`; the
  resulting `SuiteReport` aggregates pass/fail/error per scenario with a
  CI-friendly `summary()` — one broken trace or failing scenario never aborts
  the rest of the suite.
- Gate semantics are now centralized in a pure `evaluate_report()` shared by
  `assert_no_regressions` and the scenario runner (single source of truth for
  current and future gates).

### Added
- **Adapter registry + plugin discovery** (`agentdiff.adapters.register_adapter` /
  `available_adapters`): custom adapters can be registered at runtime or via
  the standard `agentdiff.adapters` entry-point group, and resolved by name
  through `load_trace(..., adapter_name=...)` / `[adapter] name = "..."`.
  Custom adapters may implement a `detect(data) -> bool` classmethod to join
  `auto` detection (built-ins always take priority).

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

### Cookbooks
- Added `live_langgraph.py`: runs a real **LangGraph** ReAct agent
  (`create_react_agent` + `gpt-4o-mini`), instruments it with OpenInference,
  and diffs two live graph executions through the `openinference` adapter —
  demonstrating end-to-end LangGraph regression testing (divergence, loop
  flags, and gate blocking on real graph output).
- Added `live_crewai.py`: runs a real **CrewAI** crew (custom `BaseTool` +
  `gpt-4o-mini`) under OpenInference instrumentation and diffs two live crew
  executions through the `openinference` adapter — CrewAI's product telemetry
  is disabled; scope creep in the candidate run raises TDI, flags a loop, and
  blocks the gate.

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