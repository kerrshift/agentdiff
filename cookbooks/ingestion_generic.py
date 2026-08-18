"""AgentDiff — Ingest a Generic (canonical) trace. Offline, no API keys.

AgentDiff's canonical schema is the baseline for comparing runs from ANY
framework. To run:

    uv run cookbooks/ingestion_generic.py
"""

from __future__ import annotations

import json
from pathlib import Path

from agentdiff import compare, parse_trace_data

SAMPLE = Path(__file__).parent / "sample"


def main() -> None:
    with open(SAMPLE / "generic_baseline.json", encoding="utf-8") as fh:
        baseline = parse_trace_data(json.load(fh))
    with open(SAMPLE / "generic_candidate.json", encoding="utf-8") as fh:
        candidate = parse_trace_data(json.load(fh))

    print(
        f"parsed baseline : {len(baseline.steps)} steps -> {[s.name for s in baseline.steps]}"
    )
    print(
        f"parsed candidate: {len(candidate.steps)} steps -> {[s.name for s in candidate.steps]}"
    )

    report = compare(baseline, candidate, detect_loops=True)
    print(
        f"TDI={report.trajectory_divergence_index:.3f}  loops={len(report.loops_detected)}"
    )


if __name__ == "__main__":
    main()
