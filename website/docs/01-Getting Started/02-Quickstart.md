# Quickstart Guide

Get AgentDiff running in your Python environment or test suite in under 5 minutes.

## 1. Installation

Install AgentDiff from PyPI using your favorite package manager:

```bash
pip install agent-trajectory-diff
# or using uv
uv add agent-trajectory-diff
```

## 2. Compare Traces via CLI

You can compare two execution traces (e.g. from a baseline version and your new candidate branch) directly in your terminal. AgentDiff will auto-detect the telemetry formats:

```bash
agentdiff diff baseline_run.json candidate_run.json --fail-on-regression --max-divergence 0.25
```

### CLI Command Options
- `--adapter`: Telemetry parser to use (`auto`, `generic`, `deepeval`, `openinference`, `langfuse`). Default is `auto`.
- `--format`: Output format (`terminal`, `json`, `markdown`). Default is `terminal`.
- `--output-file`: File path to write the comparison report output.
- `--fail-on-regression`: Returns exit code `1` if any regression thresholds are violated.
- `--max-loops`: Maximum loops allowed before regression.
- `--max-divergence`: Maximum allowed Trajectory Divergence Index (TDI) [0.0 - 1.0].
- `--max-cost-delta`: Maximum allowed LLM cost increase percentage.

## 3. Python SDK & pytest Integration

Integrate trajectory regression gates directly into your test suites to catch agent bugs before merging:

```python
import pytest
from agentdiff import load_trace, compare
from agentdiff.testing import assert_no_regressions

def test_agent_refactor_efficiency():
    # Load traces from disk (auto-detects formats like DeepEval)
    baseline = load_trace("tests/traces/baseline.json")
    candidate = load_trace("tests/traces/candidate.json")

    # Run the comparison engine
    report = compare(baseline, candidate)

    # Expressive assertion helper that raises detailed error messages
    assert_no_regressions(
        report,
        max_divergence=0.25,        # Max allowed divergence (TDI)
        max_cost_increase_pct=5.0,  # Max cost increase allowed
        allow_loops=False,           # Reject if tool loops are detected
        max_wasted_effort=0.10      # Max allowed WEI (failed/retry steps ratio)
    )
```
