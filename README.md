# AgentDiff

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](pyproject.toml)

**AgentDiff** is a developer-first Python library and CLI designed to solve the hardest problem in agent engineering: **regression testing multi-turn, tool-using AI agents by comparing execution paths (trajectories) head-to-head.**

## What AgentDiff Is

* **A Trajectory Diff Engine:** Compares Run A (Baseline) against Run B (Candidate) across their execution Directed Acyclic Graphs (DAGs).
* **A Local-First CI/CD Gate:** Runs locally in your terminal or inside `pytest` and GitHub Actions, raising errors or exit codes on regression violations.
* **A Universal Comparator:** Ingests telemetry run files from **DeepEval**, OpenInference/OTel, Langfuse, or raw/custom JSON.

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

### 1. CLI Usage

Compare two trajectory JSON traces from your terminal:
```bash
agentdiff diff baseline_run.json candidate_run.json --fail-on-regression --max-divergence 0.25
```

Options:
- `--adapter`: Telemetry parser to use (`auto`, `generic`, `deepeval`, `openinference`, `langfuse`).
- `--format`: Format for the output (`terminal`, `json`, `markdown`).
- `--fail-on-regression`: Return exit code `1` if thresholds are violated.
- `--max-loops`: Maximum loops allowed.
- `--max-divergence`: Maximum Trajectory Divergence Index (TDI) allowed.
- `--max-cost-delta`: Maximum cost increase percentage allowed.

### 2. Python SDK & Pytest Integration

Catch agent loop regressions or token cost spikes in your test suites:

```python
import pytest
from agentdiff import load_trace, compare
from agentdiff.testing import assert_no_regressions

def test_agent_refactor_efficiency():
    # Load traces from disk (auto-detects formats like DeepEval)
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

## Core Metrics

| Metric | Target / Range | Algorithmic Definition |
| --- | --- | --- |
| **Trajectory Divergence Index (TDI)** | `0.0` (Identical) to `1.0` (Divergent) | $$1.0 - \frac{2 \times \vert{}\text{LCS}(\text{Steps}_A, \text{Steps}_B)\vert{}}{\vert{}\text{Steps}_A\vert{} + \vert{}\text{Steps}_B\vert{}}$$ |
| **Wasted Effort Index (WEI)** | `0.0` (Optimal) to `1.0` (Total Waste) | $$\frac{\text{Count}(\text{Steps with status} \in \{\text{ERROR, RETRY, ABANDONED}\})}{\text{Total Execution Steps}}$$ |
| **Loop Buster Index (LBI)** | Integer ($\ge 0$) | Detects consecutive repeating sequences of tools with stagnant state changes. |
| **Resource Deltas ($\Delta\text{Res}$)** | Percentage ($\pm\%$) | Standard deltas for $\Delta\text{Tokens}$, $\Delta\text{Cost}$, and $\Delta\text{Latency}$. |

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
