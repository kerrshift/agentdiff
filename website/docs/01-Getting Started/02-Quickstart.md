# Quickstart

Get AgentDiff running in your terminal or test suite in a few minutes.

## 1. Install

```bash
pip install agent-trajectory-diff
# or with uv
uv add agent-trajectory-diff
```

This installs the `agentdiff` CLI and the `agentdiff` Python package.

## 2. Compare two traces

The CLI takes a baseline trace and a candidate trace. Run the same task twice
(e.g. on `main` and on your branch), export the traces, then:

```bash
agentdiff baseline.json candidate.json
```

AgentDiff auto-detects the telemetry format (`generic`, `openinference`,
`langfuse`, `langsmith`, `openai_agents`) and prints a terminal report with
the divergence metrics:

```text
Trajectory Divergence Index (TDI):  0.33
Loops Detected:                     1
Candidate Wasted Effort (WEI):      0.00
Cost Delta:                         +41.0%
Status:                             REGRESSION
```

**Why did it diverge?** Add `--explain` for a human-readable breakdown and
`--tree` for a collapsed, visual comparison of the two paths:

```bash
agentdiff baseline.json candidate.json --explain --tree
```

**Gate it in CI.** Add `--fail-on-regression` to exit non-zero when thresholds
are exceeded:

```bash
agentdiff baseline.json candidate.json --fail-on-regression
```

The full CLI surface — including baseline rotation and PR comments — is covered
in the Guides.

## 3. Gate it in pytest

The pytest plugin compares each test's run against a committed baseline and
fails the test on regression:

```bash
pytest --agentdiff
```

Record your current runs as the new baselines with:

```bash
pytest --agentdiff --agentdiff-update-baselines
```

See the **pytest Plugin** guide for the full setup, and the `cookbooks/`
directory for runnable end-to-end examples.

## Next steps

- **Reading the Report** — what the metrics mean.
- **Regression Gates** — thresholds.
- **Ingestion Adapters** — formats you can load.