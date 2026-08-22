# /// script
# requires-python = ">=3.10"
# dependencies = ["agent-trajectory-diff"]
# ///
"""Cookbook: LangGraph direct ingestion -> `langgraph` adapter (offline).

LangGraph agents expose their execution as **state** — a list of messages
(Human / AI / Tool). This recipe ingests a *real* LangGraph state snapshot
(captured live from a `create_react_agent` run on `gpt-4o-mini`, see
``sample/langgraph_state.json``) through the ``langgraph`` adapter — no
OpenTelemetry instrumentation required — and diffs it against a hand-built
loop variant to show regression detection on native artifacts.

No API keys needed: the fixture is committed.
"""

import copy
import json
import os
import sys

from agentdiff import compare, load_trace, parse_trace_data
from agentdiff.testing import assert_no_regressions

SAMPLE = os.path.join(
    os.path.dirname(__file__), "sample", "langgraph_state.json"
)


def make_loop_variant(state: dict) -> dict:
    """Simulates a candidate that re-ran the tool twice before answering.

    Duplicates the AI tool-decision + tool-result message pair — exactly how a
    redundant lookup appears in real state dumps, except a real second
    invocation carries its own fresh ``tool_call_id``, which we mirror here.
    """
    variant = copy.deepcopy(state)
    messages = variant["messages"]
    decision_idx = next(
        i for i, m in enumerate(messages) if m["type"] == "ai" and
        m["data"].get("tool_calls")
    )
    tool_idx = next(i for i, m in enumerate(messages) if m["type"] == "tool")

    decision_copy = copy.deepcopy(messages[decision_idx])
    tool_copy = copy.deepcopy(messages[tool_idx])
    for call in decision_copy["data"]["tool_calls"]:
        call["id"] = f"{call['id']}_repeat"
    tool_copy["data"]["tool_call_id"] = (
        f"{messages[tool_idx]['data']['tool_call_id']}_repeat"
    )

    variant["messages"] = (
        messages[: tool_idx + 1]
        + [decision_copy, tool_copy]
        + messages[tool_idx + 1 :]
    )
    return variant


def main() -> None:
    if not os.path.exists(SAMPLE):
        print(f"[Error] Sample state not found at {SAMPLE}")
        sys.exit(1)

    baseline_state = json.load(open(SAMPLE))
    candidate_state = make_loop_variant(baseline_state)

    # Direct ingestion — adapter_name="auto" detects native LangGraph shapes.
    baseline = load_trace(SAMPLE)
    candidate = parse_trace_data(candidate_state)

    print("Normalized traces (real LangGraph state):")
    print("  baseline :", [f"{s.name}/{s.step_type.value}" for s in baseline.steps])
    print("  candidate:", [f"{s.name}/{s.step_type.value}" for s in candidate.steps])
    print(f"  baseline tokens={baseline.total_tokens.total_tokens}")
    print(f"  candidate tokens={candidate.total_tokens.total_tokens}")

    report = compare(baseline, candidate)
    print(f"\nTrajectory Divergence Index: {report.trajectory_divergence_index:.3f}")
    print(f"Loops detected:              {len(report.loops_detected)}")

    try:
        print("\n[-] Checking regression gates...")
        assert_no_regressions(report, max_divergence=0.15, allow_loops=False)
        print("Gate: PASSED")
    except AssertionError as e:
        print("\nCI/CD GATE BLOCKED:")
        print(e)


if __name__ == "__main__":
    main()
