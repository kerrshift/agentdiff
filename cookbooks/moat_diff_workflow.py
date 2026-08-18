"""AgentDiff — Moat Diff Workflow (offline, no API keys).

The core story: hand AgentDiff two agent runs (baseline vs candidate) and it
tells you WHAT changed, WHY it regressed, and WHERE to fix it.

Runs entirely offline against the bundled sample traces. To run:

    uv run cookbooks/moat_diff_workflow.py
    # or: python cookbooks/moat_diff_workflow.py
"""

from __future__ import annotations

from pathlib import Path

from agentdiff import (
    compare,
    format_explanations,
    locate_culprit,
    render_tree,
)

SAMPLE = Path(__file__).parent / "sample"


def main() -> None:
    baseline = compare_loader(SAMPLE / "generic_baseline.json")
    candidate = compare_loader(SAMPLE / "generic_candidate.json")

    # 1. Compare the two runs.
    report = compare(baseline, candidate, detect_loops=True)
    report.passed = False  # demonstrate a failing (regressed) run

    print("=" * 70)
    print(" 1) WHAT changed")
    print("=" * 70)
    print(f"  TDI (trajectory divergence) : {report.trajectory_divergence_index:.3f}")
    print(f"  Loops detected              : {len(report.loops_detected)}")
    print(f"  Candidate wasted effort     : {report.candidate_wei:.2%}")
    print(f"  Cost delta                  : {report.cost_delta_percentage:+.1f}%")
    print(f"  Latency delta               : {report.latency_delta_percentage:+.1f}%")

    print()
    print("=" * 70)
    print(" 2) WHY it regressed")
    print("=" * 70)
    print(format_explanations(report))

    print()
    print("=" * 70)
    print(" 3) WHERE it diverged (collapsed tree)")
    print("=" * 70)
    print(render_tree(report))

    culprit = locate_culprit(report)
    if culprit:
        print()
        print("=" * 70)
        print(" 4) The culprit step")
        print("=" * 70)
        print(" " + culprit.render())


def compare_loader(path: Path):
    """Small helper so the sample path stays consistent regardless of CWD."""
    import json

    from agentdiff import parse_trace_data

    with open(path, encoding="utf-8") as fh:
        return parse_trace_data(json.load(fh))


if __name__ == "__main__":
    main()
