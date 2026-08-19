# Baseline Rotation

As your agent legitimately changes over time, the baseline must advance too -
but it should advance **deliberately**, not silently. Baseline rotation
controls when the committed baseline is replaced.

## Persistent baseline

Point at a persistent baseline file that AgentDiff establishes and advances:

```bash
# first run: establish the baseline (with --update-baseline)
agentdiff baseline.json candidate.json --baseline prod.json --update-baseline

# later runs: compare against the stored baseline, no candidate file needed
agentdiff candidate.json --baseline prod.json
```

- `--baseline <path>` (or `-b`): the persistent baseline trace file.
- `--update-baseline`: overwrite the persistent baseline with the candidate
  *after* a clean diff.

## Rotation policies

`--baseline-rotation` selects how a clean run may become the new baseline:

| Policy | Behavior |
| --- | --- |
| `manual` (default) | The baseline only changes when you pass `--update-baseline`. |
| `auto` | A clean run automatically replaces the baseline. |
| `staged` | A clean run replaces the baseline only if it's close enough to the current one (guarded by `--max-drift`). |

`--max-drift` sets the max TDI a clean run may have for `staged` auto-rotation
(default `0.05`), preventing large jumps from silently re-baselining.

## Guarding against drift creep

Without rotation, thresholds never move and intentional changes fail forever.
Without **drift guards**, baselines silently chase every small change and
regressions slip through. The combination you want is usually:

- `manual` + `--update-baseline` for most workflows, or
- `staged` with a small `--max-drift` for fully automated pipelines.

## In Python

```python
from agentdiff.ci.baseline import decide_rotation

decision = decide_rotation(
    report,
    policy="staged",      # manual | auto | staged
    max_drift=0.05,
    explicit_update=False,
)
# decision tells you whether/how to advance the baseline
```

See the `cookbooks/baseline_rotation.py` example for a complete walkthrough.