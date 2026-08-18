# pytest Plugin

The AgentDiff pytest plugin turns your test suite into a trajectory regression
gate. Each test records its run; on teardown the plugin compares it against a
committed baseline (keyed by the test's nodeid) and **fails the test** on
regression.

## Enable it

The plugin registers itself when AgentDiff is installed. Enable per run:

```bash
pytest --agentdiff
```

## Record a run

Use the `agentdiff_trace` fixture to record your test's trace:

```python
def test_returns_orders(agentdiff_trace):
    agentdiff_trace.record(build_candidate_trace())
    # ... your assertion ...
```

The trace can be a dict in any supported format, or an `AgentTrace` instance.

## Committed baselines

Baselines live in a directory (default `baselines/`), one JSON file per test,
named from the test's nodeid:

```text
baselines/
  test_agent.py_test_returns_orders.json
```

Generate them once, then commit them:

```bash
pytest --agentdiff --agentdiff-update-baselines
```

## Options

| Flag | Default | Meaning |
| --- | --- | --- |
| `--agentdiff` | off | Enable trajectory regression checks. |
| `--agentdiff-baselines` | `baselines` | Directory of committed baseline JSONs. |
| `--agentdiff-max-divergence` | `0.3` | Max TDI before regression. |
| `--agentdiff-max-loops` | `0` | Max loop count before regression. |
| `--agentdiff-max-cost-delta` | `10.0` | Max cost increase % before regression. |
| `--agentdiff-update-baselines` | off | Record current runs as the new baselines. |

## A note on loops

A loop is flagged on the run itself, independent of the baseline. So a test
whose candidate loops will keep failing even after you re-baseline, unless you
raise `--agentdiff-max-loops` or remove the loop.

## Full example

A complete, runnable mini-project lives in `cookbooks/pytest_plugin_demo/`.
Run it with:

```bash
cd cookbooks/pytest_plugin_demo
pytest --agentdiff --agentdiff-baselines baselines   # expect a regression