# Changelog

All notable changes to **AgentDiff** (`agent-trajectory-diff`) are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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