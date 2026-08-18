"""AgentDiff — Ingest an OpenAI Agents SDK trace export. Offline, no API keys.

The OpenAI Agents SDK records a ``trace`` containing a flat list of ``spans``
(agent / function / generation / response / guardrail / handoff / custom).
AgentDiff maps each span to a canonical step type and orders them
chronologically. To run:

    uv run cookbooks/ingestion_openai_agents.py
"""

from __future__ import annotations

import json
from pathlib import Path

from agentdiff import compare, parse_trace_data

SAMPLE = Path(__file__).parent / "sample"


def main() -> None:
    with open(SAMPLE / "openai_agents.json", encoding="utf-8") as fh:
        trace = parse_trace_data(json.load(fh), adapter_name="openai_agents")

    print(f"agent: {trace.agent_name}")
    print(f"steps: {[(s.name, s.step_type.value) for s in trace.steps]}")

    with open(SAMPLE / "generic_baseline.json", encoding="utf-8") as fh:
        baseline = parse_trace_data(json.load(fh))

    report = compare(baseline, trace, detect_loops=True)
    print(f"vs canonical baseline -> TDI={report.trajectory_divergence_index:.3f}")


if __name__ == "__main__":
    main()