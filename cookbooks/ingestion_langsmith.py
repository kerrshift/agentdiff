"""AgentDiff — Ingest a LangSmith run tree. Offline, no API keys.

LangSmith (the observability backend for LangGraph, the most-adopted agent
framework) exports nested ``run`` objects with ``run_type``. AgentDiff flattens
the tree into ordered steps. To run:

    uv run cookbooks/ingestion_langsmith.py
"""

from __future__ import annotations

import json
from pathlib import Path

from agentdiff import compare, parse_trace_data

SAMPLE = Path(__file__).parent / "sample"


def main() -> None:
    with open(SAMPLE / "langsmith.json", encoding="utf-8") as fh:
        trace = parse_trace_data(json.load(fh), adapter_name="langsmith")

    print(f"agent: {trace.agent_name}")
    print(f"steps: {[(s.name, s.step_type.value) for s in trace.steps]}")

    with open(SAMPLE / "generic_baseline.json", encoding="utf-8") as fh:
        baseline = parse_trace_data(json.load(fh))

    report = compare(baseline, trace, detect_loops=True)
    print(f"vs canonical baseline -> TDI={report.trajectory_divergence_index:.3f}")


if __name__ == "__main__":
    main()
