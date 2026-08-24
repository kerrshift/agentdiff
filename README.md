# AgentDiff

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](pyproject.toml)

**AgentDiff** is a developer-first Python library and CLI designed to solve the hardest problem in agent engineering: **regression testing multi-turn, tool-using AI agents by comparing execution paths (trajectories) head-to-head.**

## What AgentDiff Is

* **A Trajectory Diff Engine:** Compares Run A (Baseline) against Run B (Candidate) across their execution Directed Acyclic Graphs (DAGs).
* **A Local-First CI/CD Gate:** Runs locally in your terminal or inside `pytest` and GitHub Actions, raising errors or exit codes on regression violations.
* **A Universal Comparator:** Ingests telemetry run files from **OpenInference/OTel**, **Langfuse**, **LangSmith**, **OpenAI Agents SDK**, or raw/custom JSON.

### What AgentDiff Is Not

* **Not an observability backend.** No hosted tracing, no APM, no log storage — AgentDiff works on trace files you already have, at test time.
* **Not an LLM-as-a-judge scorer.** Semantic answer quality is DeepEval/Ragas territory; AgentDiff measures *how* your agent got there — structurally and deterministically.
* **Not an agent framework.** It doesn't orchestrate or run agents; it evaluates the trajectories your existing agents (LangGraph, CrewAI, OpenAI Agents SDK, custom loops) already produce.

### Local-First Privacy

Agent trajectories contain your prompts, your tool outputs, and often your customers' data. AgentDiff is architected so that **nothing ever leaves your machine:**

* **No network calls at diff time.** Parsing, DAG alignment, and scoring are pure local computation — run a diff on a plane, in a bank's air-gapped CI, or behind a strict egress firewall.
* **No account, no telemetry.** AgentDiff doesn't phone home, has no API to sign up for, and collects nothing.
* **Your baselines live in your repo.** Baseline traces are ordinary committed files (`--baseline` / `--update-baseline`), versioned with the code they gate — no external service holds them.
* **CI stays inside your perimeter.** The GitHub Action reads traces from your checkout and posts reports with your own `GITHUB_TOKEN`; traces are never uploaded anywhere by us.

Hosted eval platforms require shipping production traces to a third party before you can diff them. With AgentDiff, the diff is a file operation.

## Installation

Install the PyPI package:
```bash
pip install agent-trajectory-diff
```

Or using `uv`:
```bash
uv add agent-trajectory-diff
```

## Quickstart

### 0. No trace yet? Record one.

Point `record` at any callable (your agent's entry function) and it captures a canonical trace:

```bash
agentdiff record my_agent:run --input '{"question": "What is AgentDiff?"}' --out traces/run.json
```

- `--input` takes a JSON object (passed as kwargs) or `@file.json`
- A failed run is still recorded — diff it to see exactly what broke
- Then compare: `agentdiff traces/baseline.json traces/run.json`

### 1. CLI Usage

Compare two trajectory JSON traces from your terminal:
```bash
agentdiff baseline_run.json candidate_run.json --fail-on-regression --max-divergence 0.25
```

Options:
- `--adapter`: Telemetry parser to use (`auto`, `generic`, `openinference`, `langfuse`, `langsmith`, `openai_agents`).
- `--format`: Format for the output (`terminal`, `json`, `markdown`).
- `--fail-on-regression`: Return exit code `1` if thresholds are violated.
- `--max-loops`: Maximum loops allowed.
- `--max-divergence`: Maximum Trajectory Divergence Index (TDI) allowed.
- `--max-cost-delta`: Maximum cost increase percentage allowed.
- `--baseline, -b PATH`: Compare against a persistent baseline trace file (see [Baseline workflow](#baseline-workflow)).
- `--update-baseline`: Overwrite the persistent baseline with the candidate after a clean diff.
- `--baseline-config PATH`: The `agentdiff.toml` the **baseline** was recorded with. When gate values differ from this run's config, the report flags the change (Goodhart guard — see [Gate governance](https://agentdiff.lostmartian.in/docs/configuration#gate-governance-goodhart-guard)).
- `--config PATH`: Load defaults from an `agentdiff.toml` (auto-discovered if not given).

#### Config-as-code (`agentdiff.toml`)

Commit your thresholds, adapter, and baseline path next to your traces instead of repeating CLI flags. Explicit flags always win over config.

```toml
[compare]
detect_loops = true
strict_tool_signatures = false

[adapter]
name = "auto"            # auto, generic, openinference, langfuse, langsmith, openai_agents

[cli]
format = "terminal"      # terminal, json, markdown, pr
baseline = "baselines/current.json"
max_loops = 0
max_divergence = 0.3
max_cost_delta = 10.0

[assertions]             # defaults used by assert_no_regressions / pytest plugin
max_divergence = 0.25
max_cost_increase_pct = 5.0
allow_loops = false
max_wasted_effort = 0.1
```

AgentDiff auto-discovers `agentdiff.toml` from the current directory upward, or you can point at it explicitly with `--config`.

## Baseline workflow

Keep a single `baseline.json` file committed to your repo instead of hand-managing two trace files. The first run establishes the baseline; later runs compare against it and advance it only on clean diffs.

```bash
# First run: stores candidate as the baseline, exits 0
agentdiff baseline.json today.json --baseline baseline.json --update-baseline

# Later runs: compare today's run against the stored baseline
agentdiff baseline.json today.json --baseline baseline.json --update-baseline --fail-on-regression
```

- If `baseline.json` does not exist and `--update-baseline` is set, the candidate is copied in as the baseline and the command exits `0`.
- If it does not exist and `--update-baseline` is omitted, the command exits `2` with a helpful message.
- On a regression the baseline is **never** overwritten, and `--fail-on-regression` exits `1`.

### 2. Python SDK & Pytest Integration

Catch agent loop regressions or token cost spikes in your test suites:

```python
import pytest
from agentdiff import load_trace, compare
from agentdiff.testing import assert_no_regressions

def test_agent_refactor_efficiency():
    # Load traces from disk (auto-detects the telemetry format)
    baseline = load_trace("tests/traces/baseline.json")
    candidate = load_trace("tests/traces/candidate.json")

    # Run the comparison
    report = compare(baseline, candidate)

    # Expressive assertion helper that raises detailed error messages on regression
    assert_no_regressions(
        report,
        max_divergence=0.25,        # TDI threshold [0.0 - 1.0]
        max_cost_increase_pct=5.0,  # Max cost increase allowed
        allow_loops=False,           # Reject if tool loops are detected
        max_wasted_effort=0.10      # Max Wasted Effort Index (WEI) allowed
    )
```

### 3. GitHub Action

Gate a PR on agent trajectory regressions with the reusable composite action.
Pin it to a release tag and point `package` at the published package (or a
`git+` path / local directory for pre-release testing):

```yaml
name: AgentDiff Gate
on:
  pull_request:

permissions:
  contents: read
  pull-requests: write   # lets the action post the PR comment

jobs:
  agentdiff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - uses: lostmartian/agentdiff/.github/actions/agentdiff-check@v0.2.2
        with:
          baseline: traces/baseline.json   # committed baseline trace
          candidate: traces/candidate.json # generated by an earlier step
          update-baseline: "false"
          max-divergence: "0.3"
          max-cost-delta: "10.0"
          # Optional: auto-post the report onto the triggering PR.
          pr: ${{ github.event.pull_request.number }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

The action installs the package (default `agent-trajectory-diff` from PyPI),
runs `agentdiff --fail-on-regression`, and fails the job when divergence,
loops, or cost spikes exceed the thresholds. When `pr` is set it also posts the
PR-ready report (status, gate table, root-cause culprit, collapsed divergence
tree, loops) as a comment on that PR — even when the gate blocks. See the
[`agentdiff-demo`](https://github.com/lostmartian/agentdiff-demo) repository
for a working, live example (real Gemini agent + auto PR comments).

**Available inputs:**

| Input | Default | Description |
| --- | --- | --- |
| `baseline` | *(required)* | Path to the stored baseline trace JSON. |
| `candidate` | *(required)* | Path to the candidate trace JSON. |
| `package` | `agent-trajectory-diff` | Python package spec to install (PyPI name, `git+https://…`, or a local path). |
| `adapter` | `auto` | Telemetry adapter: `auto`, `generic`, `openinference`, `langfuse`, `langsmith`, `openai_agents`. |
| `max-divergence` | `0.3` | Maximum Trajectory Divergence Index (TDI) before regression. |
| `max-loops` | `0` | Maximum loop count before regression. |
| `max-cost-delta` | `10.0` | Maximum cost increase percentage before regression. |
| `update-baseline` | `false` | Overwrite the stored baseline with the candidate when the run is clean. |
| `pr` | *(empty)* | GitHub PR number to post the report comment to (e.g. `github.event.pull_request.number`). |
| `github-token` | *(empty)* | GitHub token used to post the comment (e.g. `secrets.GITHUB_TOKEN`). Required when `pr` is set. |

> **Permission:** to post the PR comment the workflow needs `pull-requests: write`
> (the built-in `GITHUB_TOKEN` is otherwise read-only). No manual token required.

## Core Metrics

| Metric | Target / Range | Algorithmic Definition |
| --- | --- | --- |
| **Trajectory Divergence Index (TDI)** | `0.0` (Identical) to `1.0` (Divergent) | $$1.0 - \frac{2 \times \vert{}\text{LCS}(\text{Steps}_A, \text{Steps}_B)\vert{}}{\vert{}\text{Steps}_A\vert{} + \vert{}\text{Steps}_B\vert{}}$$ |
| **Wasted Effort Index (WEI)** | `0.0` (Optimal) to `1.0` (Total Waste) | $$\frac{\text{Count}(\text{Steps with status} \in \{\text{ERROR, RETRY, ABANDONED}\})}{\text{Total Execution Steps}}$$ |
| **Loop Buster Index (LBI)** | Integer ($\ge 0$) | Detects consecutive repeating sequences of tools with stagnant state changes. |
| **Recovery Step Ratio (RSR)** | `1.0` = parity; $> 1.0$ = slower recovery than baseline | Successful steps spent after ERROR/RETRY/ABANDONED clusters until re-aligning with the baseline path: $\text{RSR} = \frac{\text{Recovery}_{\text{candidate}}}{\text{Recovery}_{\text{baseline}}}$ (falls back to the raw candidate count when the baseline is clean). Gate via `--max-recovery-ratio` / `max_recovery_step_ratio`. |
| **Resource Deltas ($\Delta\text{Res}$)** | Percentage ($\pm\%$) | Standard deltas for $\Delta\text{Tokens}$, $\Delta\text{Cost}$, and $\Delta\text{Latency}$. |

## FAQ

**How is AgentDiff different from DeepEval or Ragas?**
They score *what* the agent said (semantic quality, via LLM judges). AgentDiff measures *how* the agent got there — step order, tool loops, wasted effort, cost/latency deltas — using deterministic graph algorithms. They complement each other; AgentDiff adds no LLM calls and is fully deterministic.

**Do I need API keys to run a diff?**
No. AgentDiff is pure math over trace files you already have. Keys are only needed by your own agent when it produces traces, or by the optional live cookbooks that generate them.

**Where do trace files come from?**
Export them from whatever already records your runs: Langfuse or LangSmith exports, OpenTelemetry/OpenInference span dumps, the OpenAI Agents SDK tracing processor, or hand-rolled JSON matching the generic schema. See [`cookbooks/`](cookbooks/) for working recipes per source.

**Can I compare runs from different frameworks?**
Yes. Traces are normalized to one canonical `AgentTrace` schema before comparison, so an OpenInference baseline can be diffed against a Langfuse candidate (or any other pairing).

**What do TDI / WEI / LBI mean in one line each?**
TDI: fraction of trajectory structure that changed (0 = identical). WEI: share of steps that were errors/retries/abandonments. LBI: count of repeating tool sequences with no state progress. Definitions above.

**How does the pytest plugin know which baseline belongs to a test?**
Mark tests with the `agentdiff` marker and use the `agentdiff_trace` fixture; a committed baseline file per test is compared automatically (`--agentdiff-update-baselines` advances baselines on clean runs). See the docs for setup.

**Which Python versions are supported?**
Python 3.10 through 3.13, tested in CI on every PR.

**Is it production-safe to gate merges on this?**
That's the point — exit codes 0/1 make it a drop-in CI gate, and the GitHub Action posts the culprit + divergence tree right onto the PR so reviewers see *why* a gate blocked.

## Development & Operations

This project utilizes `uv` to manage environments and dependencies. Automation tasks are defined in the **[`Makefile`](file:///Users/lostmartian/Desktop/interview/agentdiff/Makefile)**:

- `make lint` / `make format`: Run Ruff linter checks and formatter.
- `make test`: Run pytest suite (including style & formatting assertions).
- `make build`: Package the library into source and wheel distributions in `dist/`.
- `make website-dev`: Start the Next.js landing and documentation site local server.
- `make website-build`: Build the Next.js static output in `website/out/`.

### Repository Layout
- `src/`: Python source code package modules.
- `tests/`: Quality assurance unit tests.
- `website/`: Next.js web application and documentation pages.
