# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "agent-trajectory-diff",
#     "langfuse",
# ]
# ///
"""Cookbook: Langfuse (live) -> real trace -> `langfuse` adapter.

Creates a real trace in a Langfuse project (cloud or self-hosted) with the
Python SDK v4 observation-based API, fetches the full trace (trace +
observations) back from the API, and feeds it straight through the ``langfuse``
adapter. Two runs are diffed.

The adapter accepts both the dashboard-export camelCase and the SDK's
snake_case observation keys natively, so no manual normalization is needed.

Requires a Langfuse project (free cloud tier or self-hosted):
    export LANGFUSE_HOST="https://cloud.langfuse.com"   # or http://localhost:3000
    export LANGFUSE_PUBLIC_KEY="pk-..."
    export LANGFUSE_SECRET_KEY="sk-..."
"""

import os
import sys
import time

from langfuse import Langfuse

from agentdiff import compare, parse_trace_data


def run_trace(lf: Langfuse, prompt: str, redundant: bool = False) -> dict:
    with lf.start_as_current_observation(
        name="orders_agent", input={"task": prompt}, as_type="agent"
    ) as trace:
        gen = trace.start_observation(
            name="planner",
            as_type="generation",
            model="gpt-4o-mini",
            input={"query": prompt},
        )
        gen.update(
            output={"plan": "lookup then synthesize"},
            usage={"input": 320, "output": 40, "total": 360},
        )
        gen.end()

        span = trace.start_observation(
            name="search_database", as_type="tool", input={"action": "query"}
        )
        span.update(output={"rows": 14})
        span.end()

        if redundant:
            span2 = trace.start_observation(
                name="search_database", as_type="tool", input={"action": "query"}
            )
            span2.update(output={"rows": 14})
            span2.end()

        gen2 = trace.start_observation(
            name="synthesize",
            as_type="generation",
            model="gpt-4o-mini",
            input={"plan": "lookup then synthesize"},
        )
        gen2.update(
            output={"answer": "14 pending orders"},
            usage={"input": 400, "output": 60, "total": 460},
        )
        gen2.end()

        trace_id = trace.trace_id

    lf.flush()

    # Langfuse ingests asynchronously; poll until the trace + its observations
    # are queryable.
    for _ in range(15):
        try:
            full = lf.api.trace.get(trace_id).model_dump()
        except Exception:
            time.sleep(3)
            continue
        if full.get("observations"):
            return full
        time.sleep(3)
    raise RuntimeError(f"Trace {trace_id} observations were not ingested in time")


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
