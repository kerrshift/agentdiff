"""AgentDiff — Ingest an OpenInference / OTel trace. Offline, no API keys.

OpenInference is the semantic-conventions standard used by LlamaIndex, Arize
Phoenix, and OTel-based agent tracing. AgentDiff auto-detects it. To run:

    uv run cookbooks/ingestion_openinference.py
"""

from __future__ import annotations

import json
from pathlib import Path

from agentdiff import compare, parse_trace_data

SAMPLE = Path(__file__).parent / "sample"


def main() -> None:
    with open(SAMPLE / "openinference.json", encoding="utf-8") as fh:
        trace = parse_trace_data(json.load(fh), adapter_name="openinference")

    print(f"agent: {trace.agent_name}")
    print(f"steps: {[(s.name, s.step_type.value) for s in trace.steps]}")

    # Compare against the same canonical run to show cross-format equivalence.
    with open(SAMPLE / "generic_baseline.json", encoding="utf-8") as fh:
        baseline = parse_trace_data(json.load(fh))

    report = compare(baseline, trace, detect_loops=True)
    print(f"vs canonical baseline -> TDI={report.trajectory_divergence_index:.3f}")


if __name__ == "__main__":
    main()
