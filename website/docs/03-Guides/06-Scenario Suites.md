# Scenario Suites

One baseline/candidate pair covers one behavior. Real agent systems gate whole
families of flows - checkout, refunds, support - each with its own risk
tolerance. The scenario runner (`agentdiff.run_scenarios`) executes many
comparisons in one call with per-scenario gates, and never aborts on the first
failure.

## Basic usage

```python
from agentdiff import GateThresholds, Scenario, run_scenarios

suite = run_scenarios(
    [
        Scenario("checkout_flow", "traces/checkout_base.json",
                 "traces/checkout_cand.json"),
        Scenario("refunds", "traces/refund_base.json",
                 "traces/refund_cand.json"),
    ]
)

if not suite.passed:
    print(suite.summary())
```

Traces can be file paths or `AgentTrace` objects; loading errors become
per-scenario `ERROR` results instead of exceptions, so one corrupt file fails
its scenario - not the suite.

## Per-scenario gates

Each scenario takes its own `GateThresholds` (mirroring
`assert_no_regressions`):

```python
Scenario(
    "refunds",
    "traces/refund_base.json",
    "traces/refund_cand.json",
    thresholds=GateThresholds(
        max_divergence=0.10,      # refunds must stay near-identical
        allow_loops=True,         # ...but retries are expected there
        max_recovery_step_ratio=1.5,
    ),
)
```

A scenario's report is marked `passed=False` when its gates fail - consistent
with `assert_no_regressions` semantics.

## Reading results

`suite.counts` returns `{"passed": n, "failed": n, "errors": n}`;
each `ScenarioResult` carries `.status` (`PASSED` / `FAILED` / `ERROR`),
`.violations` (the exact failed thresholds), and `.report`.

```text
=========================================
         AGENTDIFF SUITE SUMMARY
=========================================
Status: FAILED  (2/3 passed, 1 failed, 0 errors)
-----------------------------------------
  [PASSED] checkout_flow
  [FAILED] refunds
           - Trajectory Divergence Index (TDI) of 0.3333 exceeded threshold of 0.1000.
  [PASSED] support_flow
=========================================
```

## Parallel execution

Suites over many flows (or large trace files) can fan out to a thread pool:

```python
suite = run_scenarios(scenarios, workers=4)
```

Results always come back in input order regardless of completion order.
Sequential execution remains the zero-overhead default (`workers=None`).
