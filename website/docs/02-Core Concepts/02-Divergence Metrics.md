# Divergence & Regression Metrics

AgentDiff computes deterministic mathematical metrics to evaluate how an agent's execution path and resource consumption change between a baseline and candidate version.

## 1. Trajectory Divergence Index (TDI)

TDI measures the topological structural differences between two execution paths. It is computed by finding the Longest Common Subsequence (LCS) of steps over their topological sorts:

$$TDI = 1.0 - \frac{2 \times \vert{}\text{LCS}(\text{Steps}_A, \text{Steps}_B)\vert{}}{\vert{}\text{Steps}_A\vert{} + \vert{}\text{Steps}_B\vert{}}$$

* **Range:** `0.0` (Identical signatures and paths) to `1.0` (Completely divergent).
* **Equivalence Signature:** Two nodes $N_a$ and $N_b$ are equivalent in the LCS if their step types, action names, and input payload keys match.

## 2. Wasted Effort Index (WEI)

WEI measures the proportion of inefficient steps (errors, retries, and abandoned calls) inside a single trace run:

$$\text{WEI} = \frac{\text{Count}(\text{Steps with status} \in \{\text{ERROR, RETRY, ABANDONED}\})}{\text{Total Execution Steps}}$$

* **Range:** `0.0` (Optimal, zero failures) to `1.0` (Total waste).
* Comparing WEI changes (Baseline vs. Candidate) helps identify if a code refactor causes the agent to fail more frequently or perform unnecessary retries.

## 3. Loop Buster Index (LBI)

LBI detects circular repeating execution sequences. It checks if:
1. A subsequence of steps $(v_1 \dots v_k)$ repeats consecutively $\ge 2$ times.
2. The state changes are stagnant (meaning the inputs and outputs do not change across iterations).

LBI alerts developers to infinite tool invocation loops or redundant database query cycles.

## 4. Resource Deltas ($\Delta\text{Res}$)

Calculates the percentage increase or decrease in resources used:

$$\Delta\text{Cost} = \frac{\text{Cost}_{\text{Candidate}} - \text{Cost}_{\text{Baseline}}}{\text{Cost}_{\text{Baseline}}} \times 100$$

Analogous percentage deltas are calculated for **Total Tokens** and **Wall-Clock Latency**.
