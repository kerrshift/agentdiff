# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "agent-trajectory-diff",
#     "langfuse",
# ]
# ///
"""Cookbook: Langfuse (live) -> real trace -> `langfuse` adapter.

Creates a real trace in a Langfuse project (cloud or self-hosted) with the
Python SDK, fetches the full trace (trace + observations) back from the API,
and feeds it straight through the ``langfuse`` adapter. Two runs are diffed.

The adapter accepts both the dashboard-export camelCase and the SDK's
snake_case observation keys natively, so no manual normalization is needed.

Requires a Langfuse project (free cloud tier or self-hosted):
    export LANGFUSE_HOST="http://localhost:3000"   # self-hosted, or Langfuse Cloud
    export LANGFUSE_PUBLIC_KEY="pk-..."
    export LANGFUSE_SECRET_KEY="sk-..."
"""

import os
import sys

from langfuse import Langfuse

from agentdiff import compare, parse_trace_data


def run_trace(lf: Langfuse, prompt: str, redundant: bool = False) -> dict:
    trace = lf.trace(name="orders_agent", input={"task": prompt})
    trace.generation(
        name="planner",
        model="gpt-4o-mini",
        input={"query": prompt},
        output={"plan": "lookup then synthesize"},
        usage={"input": 320, "output": 40, "total": 360},
    )
    trace.span(
        name="search_database",
        input={"action": "query"},
        output={"rows": 14},
    )
    if redundant:
        trace.span(
            name="search_database", input={"action": "query"}, output={"rows": 14}
        )
    trace.generation(
        name="synthesize",
        model="gpt-4o-mini",
        input={"plan": "lookup then synthesize"},
        output={"answer": "14 pending orders"},
        usage={"input": 400, "output": 60, "total": 460},
    )
    lf.flush()
    return lf.api.trace.get(trace.id).model_dump()


def main() -> None:
    host = os.environ.get("LANGFUSE_HOST")
    pk = os.environ.get("LANGFUSE_PUBLIC_KEY")
    sk = os.environ.get("LANGFUSE_SECRET_KEY")
    if not (host and pk and sk):
        print("[Error] Set LANGFUSE_HOST / LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY.")
        sys.exit(1)

    lf = Langfuse(public_key=pk, secret_key=sk, host=host)

    baseline = run_trace(lf, "How many pending orders?")
    candidate = run_trace(lf, "How many pending orders?", redundant=True)

    base = parse_trace_data(baseline, "langfuse")
    cand = parse_trace_data(candidate, "langfuse")

    print("\nNormalized traces (real Langfuse trace):")
    print("  baseline :", [f"{s.name}/{s.step_type.value}" for s in base.steps])
    print("  candidate:", [f"{s.name}/{s.step_type.value}" for s in cand.steps])
    print(
        f"  baseline tokens={base.total_tokens.total_tokens} "
        f"latency={base.total_latency_ms:.0f}ms"
    )

    report = compare(base, cand)
    print(f"\nTrajectory Divergence Index: {report.trajectory_divergence_index:.3f}")
    if report.loops_detected:
        for loop in report.loops_detected:
            print(f"Loop detected: {loop['steps']} repeated {loop['iterations']}x")
    else:
        print("No loops detected.")


if __name__ == "__main__":
    main()
