# Reading the Report

`compare()` returns a `DiffReport`, but the numbers only help if you can act on
them. AgentDiff ships three views that turn the metrics into an answer.

## The terminal report

```text
Trajectory Divergence Index (TDI):  0.33
Loops Detected:                     1
Candidate Wasted Effort (WEI):      0.00
Cost Delta:                         +41.0%
Status:                             REGRESSION
```

## `--explain` — why did it diverge?

Human-readable findings that describe the concrete differences between the two
runs — added, removed, or modified steps, new loops, and resource changes.

```bash
agentdiff baseline.json candidate.json --explain
```

```text
Finding: step "search_database" was added 2 times in the candidate run.
Finding: a tool-calling loop of length 1 repeats 3 times.
Finding: candidate cost increased by 41.0% over baseline.
```

In Python, use `generate_explanations(report)` (returns structured findings) or
`format_explanations(report)` (returns the formatted text).

## `--tree` — where did it diverge?

A collapsed, capped visual comparison of the two paths, side by side. Matched
runs are collapsed so you can focus on the parts that actually changed.

```bash
agentdiff baseline.json candidate.json --tree
```

In Python: `render_tree(report)`.

## Culprit step — what to fix first

AgentDiff can point at the single step most responsible for the divergence,
prioritizing loop entries, then added steps, then errored steps, then modified
steps.

```python
from agentdiff import compare, load_trace
from agentdiff.engine.explanations import locate_culprit

report = compare(load_trace("base.json"), load_trace("cand.json"))
culprit = locate_culprit(report)   # Culprit | None
if culprit:
    print(culprit.step_id, culprit.reason)
```

## Pull-request format

`--format pr` produces paste-ready markdown (status, metrics, divergence tree,
culprit) for a pull request. See [PR Comments](04-PR-Comments.md) for posting it
automatically.