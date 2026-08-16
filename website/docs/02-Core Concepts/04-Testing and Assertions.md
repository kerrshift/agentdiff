# Regression Testing and Assertions

AgentDiff provides native testing helpers to define quality and performance thresholds for your agent pipelines.

## The `assert_no_regressions` Helper

The `assert_no_regressions` function raises an `AssertionError` if any compared metrics exceed the specified boundaries:

```python
from agentdiff.testing import assert_no_regressions

assert_no_regressions(
    report,
    max_divergence=0.25,        # Maximum allowed TDI (Path Divergence Index)
    max_cost_increase_pct=5.0,  # Maximum allowed cost increase percentage
    allow_loops=False,           # Raise error if loop sequences are detected
    max_wasted_effort=0.10      # Maximum allowed WEI (Wasted Effort Index)
)
```


## Threshold Options

### 1. `max_divergence` (Float, Default: `0.25`)
Defines the maximum allowed path difference between candidate and baseline. A threshold of `0.25` allows up to 25% path change structure differences before throwing an error.

### 2. `max_cost_increase_pct` (Float, Default: `5.0`)
Blocks PRs if the new agent prompts, model configurations, or tools increase estimated API cost (USD) by more than 5%.

### 3. `allow_loops` (Bool, Default: `False`)
If set to `False`, the test fails immediately if any repeating, circular tool-calling sequences or graph cycles are detected in the candidate trace.

### 4. `max_wasted_effort` (Float, Default: `0.10`)
Sets the maximum ratio of failed, retried, or abandoned steps. A value of `0.10` restricts wasted steps to no more than 10% of total run length.


## Detailed Failure Reports

When a threshold is violated, `assert_no_regressions` outputs an expressive error message containing the list of violated parameters and the output report summary, making it easy to identify the issue in CI/CD pipeline logs:

```
AssertionError: AgentDiff Regression Verification Failed:
  - Tragence Divergence Index (TDI) of 0.3333 exceeded threshold of 0.2500.
  - Candidate Wasted Effort Index (WEI) of 0.2500 exceeded threshold of 0.1000.

=========================================
           AGENTDIFF REPORT SUMMARY      
=========================================
Baseline ID:  v1_trace
Candidate ID: v2_trace
Status:       FAILED
-----------------------------------------
Trajectory Divergence Index (TDI): 0.3333
Baseline Wasted Effort Index (WEI): 0.0000
Candidate Wasted Effort Index (WEI): 0.2500
...
```
