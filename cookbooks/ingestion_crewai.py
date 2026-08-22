# /// script
# requires-python = ">=3.10"
# dependencies = ["agent-trajectory-diff"]
# ///
"""Cookbook: CrewAI direct ingestion -> `crewai` adapter (offline).

A real CrewAI crew hands back a ``CrewOutput`` from ``crew.kickoff()``. This
recipe ingests an actual captured ``model_dump()`` of one (a Reporter agent on
``gpt-4o-mini``, see ``sample/crewai_output.json``) through the ``crewai``
adapter — no OpenTelemetry instrumentation required — and diffs it against a
two-task variant to show structural regression detection on native artifacts.

No API keys needed: the fixture is committed.
"""

import copy
import json
import os
import sys

from agentdiff import compare, load_trace, parse_trace_data
from agentdiff.testing import assert_no_regressions

SAMPLE = os.path.join(
    os.path.dirname(__file__), "sample", "crewai_output.json"
)


def make_two_task_variant(output: dict) -> dict:
    """Simulates a crew that grew a second verification task."""
    variant = copy.deepcopy(output)
    first = copy.deepcopy(variant["tasks_output"][0])

    # Task 2: same machinery, different role + description.
    second = copy.deepcopy(first)
    second["agent"] = "Verifier"
    second["description"] = "Verify the reported numbers by calling the tool again."
    for msg in second.get("messages", []):
        if msg.get("role") == "user":
            msg["content"] = f"Current Task: {second['description']}"
    variant["tasks_output"].append(second)
    return variant


def main() -> None:
    if not os.path.exists(SAMPLE):
        print(f"[Error] Sample output not found at {SAMPLE}")
        sys.exit(1)

    baseline_output = json.load(open(SAMPLE))
    candidate_output = make_two_task_variant(baseline_output)

    # Direct ingestion — adapter_name="auto" detects native CrewAI shapes.
    baseline = load_trace(SAMPLE)
    candidate = parse_trace_data(candidate_output)

    print("Normalized traces (real CrewAI kickoff output):")
    print("  baseline :", [f"{s.name}/{s.step_type.value}" for s in baseline.steps])
    print("  candidate:", [f"{s.name}/{s.step_type.value}" for s in candidate.steps])
    print(f"  baseline tokens={baseline.total_tokens.total_tokens}")

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
