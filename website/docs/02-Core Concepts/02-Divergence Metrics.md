# Divergence & Regression Metrics

AgentDiff computes deterministic metrics that compare how an agent's execution
path and resource use change between a baseline and a candidate run.

## 1. Trajectory Divergence Index (TDI)

TDI measures the structural difference between two execution paths, computed
from the Longest Common Subsequence (LCS) of their steps:

$$TDI = 1.0 - \frac{2 \times \vert{}\text{LCS}(\text{Steps}_A, \text{Steps}_B)\vert{}}{\vert{}\text{Steps}_A\vert{} + \vert{}\text{Steps}_B\vert{}}$$

- **Range:** `0.0` (identical path) to `1.0` (completely different path).
- **Equivalence:** two steps match in the LCS when their step type, action
  name, and input-payload keys are equal. This ignores exact wording and only
  cares about *how* the agent navigated.

## 2. Wasted Effort Index (WEI)

WEI is the share of a run spent on error, retry, or abandoned steps:

$$\text{WEI} = \frac{\text{Count}(\text{steps with status} \in \{\text{error, retry, abandoned}\})}{\text{Total steps}}$$

- **Range:** `0.0` (no waste) to `1.0` (fully wasted).
- AgentDiff reports WEI for **both** the baseline and the candidate so you can
  see whether a refactor made the agent fail or retry more often.

## 3. Loop detection

A loop is a subsequence of steps that repeats consecutively (often with
stagnant inputs/outputs) — a sign of redundant tool calls or near-infinite
retries. The report lists each detected loop; the pytest plugin and CLI gate
fail when the loop count exceeds your threshold.

## 4. Resource deltas

Percentage change in cost, tokens, and latency between candidate and baseline:

$$\Delta\text{Cost} = \frac{\text{Cost}_{\text{Candidate}} - \text{Cost}_{\text{Baseline}}}{\text{Cost}_{\text{Baseline}}} \times 100$$

Analogous deltas are reported for **total tokens** and **latency**.

## Seeing it all together

The **Reading the Report** guide shows the
full report, plus the `--explain` and `--tree` views that make these numbers
actionable.