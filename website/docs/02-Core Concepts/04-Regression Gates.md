# Regression Gates

AgentDiff lets you define thresholds so a change either **passes** or **blocks**
in CI. There are two ways to gate: the `assert_no_regressions` helper in Python,
and the CLI's `--fail-on-regression` flag.

## Python: `assert_no_regressions`

```python
from agentdiff.testing import assert_no_regressions

assert_no_regressions(
    report,
    max_divergence=0.25,         # max TDI (default 0.25)
    max_cost_increase_pct=5.0,   # max cost increase %, default 5.0
    allow_loops=False,           # reject any detected loop
    max_wasted_effort=0.10,      # max WEI, default 0.10
)
```

Raises an `AssertionError` naming each violated threshold if any metric exceeds
its boundary:

```text
AssertionError: AgentDiff Regression Verification Failed:
  - Trajectory Divergence Index (TDI) of 0.3333 exceeded threshold of 0.2500.
  - Candidate Wasted Effort Index (WEI) of 0.2500 exceeded threshold of 0.1000.
```

## CLI: `--fail-on-regression`

```bash
agentdiff baseline.json candidate.json --fail-on-regression
```

Exits with code `1` when a regression is detected. The default thresholds are:

| Flag | Default | Meaning |
| --- | --- | --- |
| `--max-divergence` | `0.3` | Max TDI before regression. |
| `--max-loops` | `0` | Max loop count before regression. |
| `--max-cost-delta` | `10.0` | Max cost increase % before regression. |

```bash
agentdiff baseline.json candidate.json \
  --fail-on-regression \
  --max-divergence 0.2 \
  --max-loops 1 \
  --max-cost-delta 5.0
```

## pytest plugin

The same gating is available as a pytest plugin:

```bash
pytest --agentdiff --agentdiff-max-divergence 0.2
```

See the **pytest Plugin** guide.

## Tuning the thresholds

There's no universal "right" value. Start conservative (low `max_divergence`,
`allow_loops=False`) and loosen as you learn what changes are intentional. Use
`--max-drift` and baseline rotation to control how often the baseline advances
instead of letting gates creep silently — see
[Baseline Rotation].