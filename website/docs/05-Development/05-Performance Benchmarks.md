# Performance Benchmarks

AgentDiff ships a pytest-benchmark suite that measures the engine at scale.
It is deliberately **excluded from the regular test run** - invoke it with:

```bash
make bench
```

Results are autosaved under `.benchmarks/` (gitignored), so you can compare a
branch against `main` with `--benchmark-compare`.

## What is measured

| Benchmark | Scales | What it tells you |
| --- | --- | --- |
| `align_traces` | 100 / 500 / 1000 steps | The core LCS alignment - the engine's dominant cost. |
| `compare` end-to-end | 100 / 500 / 1000 steps | Everything combined: align + metrics + loops. |
| Loop detection | 100 / 500 / 1000 steps, plus a pathological single-tool repeat | Sequence/cycle scanning cost. |
| Recovery metrics | 1000 steps with error clusters | WEI + Recovery Step Ratio overhead. |
| OpenInference parsing | 1000 spans | Adapter ingestion cost at OTel-export scale. |
| Report serialization | 500-step diff | JSON export cost. |

## Baseline findings (2026-08, M-series laptop)

- **LCS alignment dominates everything**: ~16ms at 100 steps grows to ~1.6s at
  1000 steps - quadratic-ish growth, as expected for sequence alignment.
- Everything else is noise by comparison: loop detection ~3ms and adapter
  parsing ~17ms at 1000 elements; recovery/WEI computation is sub-millisecond.
- Practical implication: trace *ingestion* is never the bottleneck - very
  large traces strain the aligner first. That is why incremental/streaming
  ingestion was descoped in favor of these measurements.

If you touch the aligner or add per-step work to `compare()`, run
`make bench` before and after - a regression here is invisible to the unit
suite's runtime but real for users gating large trajectories in CI.
