# AgentDiff pytest plugin — demo

Shows the **`--agentdiff`** pytest plugin: a test records its agent run via the
`agentdiff_trace` fixture, and the plugin compares it against a **committed
baseline** (keyed by test nodeid under `baselines/`), failing the test on
regression.

## Run it

Install AgentDiff (with its pytest entry point) and pytest:

```bash
pip install agent-trajectory-diff pytest
```

Compare the candidate run in `test_agent.py` against the committed baseline:

```bash
pytest --agentdiff --agentdiff-baselines baselines
```

> The candidate deliberately repeats `search_database` (a loop) that the
> baseline does not → the plugin reports an **AgentDiff regression** and the
> test errors, gating CI.

### Record / advance the baseline

The candidate in `test_agent.py` repeats `search_database` 3 times. Note that a
**loop is flagged on the run itself**, independent of the baseline — so to
accept this change you must both record the new baseline *and* acknowledge the
loop by raising the loop gate (or removing the loop):

```bash
pytest --agentdiff \
  --agentdiff-baselines baselines \
  --agentdiff-update-baselines \
  --agentdiff-max-loops 1
```

Then re-run without `--update-baselines` (keeping `--agentdiff-max-loops 1`) to
confirm it now passes.

## Thresholds

```bash
pytest --agentdiff \
  --agentdiff-baselines baselines \
  --agentdiff-max-divergence 0.3 \
  --agentdiff-max-loops 0 \
  --agentdiff-max-cost-delta 10.0
```

Combine with **staged baseline rotation** in CI to refuse drifting-but-"clean"
runs from silently re-baselining themselves (`--baseline-rotation staged`,
`--max-drift`).
