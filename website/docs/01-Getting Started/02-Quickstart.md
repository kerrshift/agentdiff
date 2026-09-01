# Quickstart

Get AgentDiff running in your terminal or test suite in a few minutes.

## 1. Install

```bash
pip install agent-trajectory-diff
# or with uv
uv add agent-trajectory-diff
```

This installs the `agentdiff` CLI and the `agentdiff` Python package.

## 2. Initialize with `agentdiff init`

Run the zero-config setup wizard in your project root. It auto-detects your agent framework (LangGraph, CrewAI, OpenAI Agents SDK, OpenTelemetry, etc.) and generates your config plus CI gate workflow:

```bash
agentdiff init --scenario customer_support --runs 3 --with-approve
```

## 3. Record a statistical baseline envelope

Capture an N-run baseline envelope so variance bands prevent false-positive CI failures:

```bash
agentdiff record my_agent:run \
  --input '{"question": "What is AgentDiff?"}' \
  --runs 3 \
  --out baselines/customer_support.envelope.json
```

- `--input` takes a JSON object or `@file.json`
- `--runs 3` captures a statistical envelope with empirical mean ± k·sigma bands

## 4. Compare candidate runs

Run candidate executions against your baseline envelope:

```bash
agentdiff diff baselines/customer_support.envelope.json traces/candidate.json
```

AgentDiff compares the candidate with min-TDI-of-N matching and variance bands:

```text
Baseline:       customer_support.envelope.json (3 runs)
Candidate:      traces/candidate.json
TDI (min-of-3): 0.00 [PASS]
Step Count:     6 (band: 6.3 ± 0.9) [PASS]
Cost Delta:     +2.1% [PASS]
Loops:          0 [PASS]
Status:         PASSED
```

**Why did it diverge?** Add `--explain` for a breakdown and `--tree` for a visual comparison:

```bash
agentdiff diff baselines/customer_support.envelope.json traces/candidate.json --explain --tree
```

**Gate it in CI.** Add `--fail-on-regression` to exit non-zero when hard invariants or thresholds are breached:

```bash
agentdiff diff baselines/customer_support.envelope.json traces/candidate.json --fail-on-regression --pr 12
```

The full CLI surface - including baseline rotation and PR comments - is covered
in the Guides.

## 4. Gate it in pytest

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

Tip: enable tab-completion for the CLI:

```bash
agentdiff --install-completion
```

- **Reading the Report** - what the metrics mean.
- **Regression Gates** - thresholds.
- **Ingestion Adapters** - formats you can load.