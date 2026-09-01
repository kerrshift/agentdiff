# Statistical Baselines & N-Run Envelopes

Modern AI agents often exhibit non-deterministic execution paths: step orders can vary slightly, tool responses may require extra or fewer tokens, and latency fluctuates. 

If CI diffs a candidate run against a single strict baseline trace, harmless non-determinism can trigger false-positive gate failures. **Statistical Baselines** (introduced in AgentDiff 0.5.0) solve this with **N-run baseline envelopes** and empirical variance bands.

---

## 1. How It Works

Instead of capturing a single execution trace, you record $N$ representative runs (e.g. $N=3$ or $N=5$) into a versioned **Baseline Envelope** (`agentdiff_baseline_envelope` artifact, schema 2.0.0):

```bash
agentdiff record my_agent:run \
  --input '{"query": "Generate Q3 sales analysis"}' \
  --runs 3 \
  --out baselines/sales_analysis.envelope.json
```

When gating in CI, AgentDiff performs:
1. **Min-TDI-of-$N$ Matching**: If *any* of the $N$ recorded baseline runs explains the candidate's trajectory within tolerance, the sequence is considered valid.
2. **Variance Band Boundaries**: Calculates the empirical mean and standard deviation ($\mu \pm k\sigma$) across step count, latency, and token consumption.
3. **Hard Invariant Gating**: Infinite retry loops and repetitive stagnant failures are still strictly blocked regardless of variance bands.

---

## 2. Baseline Envelope Structure

The envelope JSON holds all $N$ canonical traces alongside computed statistical boundaries:

```json
{
  "schema_version": "2.0.0",
  "artifact_type": "agentdiff_baseline_envelope",
  "scenario": "sales_analysis",
  "runs": 3,
  "statistics": {
    "step_count": { "mean": 6.33, "std_dev": 0.47, "min": 6, "max": 7 },
    "cost_usd": { "mean": 0.0142, "std_dev": 0.0011 },
    "total_latency_ms": { "mean": 1820.0, "std_dev": 140.5 }
  },
  "traces": [ ... ]
}
```

---

## 3. Configuration in `agentdiff.toml`

Declare statistical tolerances in `agentdiff.toml`:

```toml
[scenario.sales_analysis]
mode = "statistical"                # Enables envelope gating mode
sample_runs = 3                     # Target envelope size
max_cost_increase_pct = 5.0

[scenario.sales_analysis.hard_invariants]
fail_on_identical_loops = true      # Zero-tolerance: loops always block
max_tool_repeats = 3

[scenario.sales_analysis.tolerances]
step_count_std_dev = 2.0            # Candidate must be within mean ± 2.0 * sigma
divergence_ceiling = 0.35           # Max acceptable sequence TDI
```

---

## 4. Comparing Against an Envelope

Run the comparator explicitly against the envelope:

```bash
agentdiff diff baselines/sales_analysis.envelope.json traces/candidate.json --fail-on-regression
```

Output:

```text
Baseline:   sales_analysis.envelope.json (3 runs, mode: statistical)
Candidate:  traces/candidate.json

TDI (min-of-3):      0.00 (matched Run 2)  [PASS]
Step Count:          7 (envelope: 6.3 ± 0.9) [PASS]
Cost Delta:          +2.1% (band: ≤ +5.0%)  [PASS]
Loops:               0 loops                [PASS]

Verdict: PASSED (Candidate within baseline envelope variance bands)
```

---

## 5. Rolling Window Baseline Rotation

When you update a baseline envelope (via CLI `--update-baseline` or `/agentdiff approve`), AgentDiff rotates the rolling window of `sample_runs`: the oldest run drops off and the candidate run joins, automatically recalculating the empirical $\mu$ and $\sigma$ bands.

### Backward Compatibility
Existing single-trace baselines (`agent_trace.schema.json` v1.0.0) remain fully supported. When AgentDiff loads a single-run baseline, it wraps it as an envelope with $N=1$ in `strict` mode.
