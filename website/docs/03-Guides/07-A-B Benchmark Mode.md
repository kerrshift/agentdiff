# A/B Benchmark Mode

Regression diffing answers "did the candidate break?". The A/B benchmark mode
(`agentdiff.run_benchmark`) answers a different question: **which of two
agents runs the same task more efficiently?** Both sides are treated as peers,
so you can compare a CrewAI run against a LangGraph run, or two versions of
the same agent - any pairing that normalizes to traces.

```python
from agentdiff import BenchmarkCase, run_benchmark

report = run_benchmark(
    [
        BenchmarkCase(
            name="user_lookup",
            agent_a="runs/crewai_ny.json",     # CrewAI kickoff output
            agent_b="runs/langgraph_ny.json",  # LangGraph state snapshot
        ),
        BenchmarkCase(
            name="refund_flow",
            agent_a="runs/crewai_refund.json",
            agent_b="runs/langgraph_refund.json",
        ),
    ]
)

print(report.summary())       # CI-friendly text
print(report.to_markdown())   # paste-ready table for a PR or doc
```

## How winners are decided

Each case is scored on four deterministic efficiency dimensions - **steps**
(leaner path), **wasted effort** (fewer failed/retried steps), **tokens**, and
**latency**. Lower wins each dimension; the case winner is the side taking the
majority. Equal values never count as wins, and ties are first-class outcomes,
never coin flips.

The per-case diff (TDI between the two runs) is included as structural
context in the output.

!!! note
    Verdicts are *structural efficiency* only. Judging answer semantics would
    require an LLM judge, which is an explicit AgentDiff non-goal.

## Output

`summary()` renders a log-friendly block:

```text
=========================================
       AGENTDIFF A/B BENCHMARK
=========================================
Overall: agent A (A 1 - B 0, 0 tied)
-----------------------------------------
  [    A] user_lookup (A won 3, B won 0)
          steps   A=   2  B=   5
          tokens  A=    60  B=   225
          latency A=   100ms  B=  1000ms
          TDI(a,b)=0.429
=========================================
```

`to_markdown()` renders the same data as a table with an overall tally:

| Case | Steps A | Steps B | Tokens A | Tokens B | Latency A | Latency B | TDI | Winner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| user_lookup | 2 | 5 | 60 | 225 | 100ms | 1000ms | 0.429 | A |

**Overall:** agent A - A 1 / B 0 / tied 0

## Parallel execution

Like scenario suites, benchmarks accept `workers=N` to fan cases out across a
thread pool; results keep input order and `workers=None` (default) stays
sequential.
