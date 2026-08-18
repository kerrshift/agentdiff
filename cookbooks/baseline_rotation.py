"""AgentDiff — Baseline Rotation Policy (offline, no API keys).

How AgentDiff decides when a run may advance the stored baseline, and the
drift-creep guard that prevents a "clean but drifting" trajectory from being
re-baselined over and over. To run:

    uv run cookbooks/baseline_rotation.py
    # or: python cookbooks/baseline_rotation.py
"""

from __future__ import annotations

import json
from pathlib import Path

from agentdiff import compare, decide_rotation, parse_trace_data

SAMPLE = Path(__file__).parent / "sample"


def load(name: str):
    with open(SAMPLE / name, encoding="utf-8") as fh:
        return parse_trace_data(json.load(fh))


def heading(text: str) -> None:
    print()
    print("=" * 70)
    print(f" {text}")
    print("=" * 70)


def main() -> None:
    baseline = load("generic_baseline.json")
    regressed = load("generic_candidate.json")  # loop -> a regression
    clean = load("generic_baseline.json")  # identical -> perfectly clean

    heading("A. A REGRESSION never rotates the baseline")
    report = compare(baseline, regressed, detect_loops=True)
    report.passed = False
    for policy in ("manual", "auto", "staged"):
        decision = decide_rotation(report, policy=policy, explicit_update=True)
        print(f"  {policy:>8}: rotate={decision.rotate}  {decision.reason}")

    heading("B. A CLEAN run")
    report = compare(baseline, clean)
    for policy in ("manual", "auto", "staged"):
        decision = decide_rotation(report, policy=policy, explicit_update=False)
        print(f"  {policy:>8}: rotate={decision.rotate}  {decision.reason}")
    print("  (with --update-baseline, manual rotates too)")

    heading("C. Drift-creep guard (staged policy)")
    # A run that is "clean" (passes gates) but drifted TDI above max_drift.
    drift = compare(baseline, clean)
    drift.trajectory_divergence_index = (
        0.15  # below divergence gate, above drift budget
    )
    decision = decide_rotation(drift, policy="staged", max_drift=0.05)
    print(f"  staged: rotate={decision.rotate}  {decision.reason}")
    print("  -> refuses to auto-rotate a drifted trajectory; hold until")
    print("     an explicit --update-baseline acknowledges the change.")


if __name__ == "__main__":
    main()
