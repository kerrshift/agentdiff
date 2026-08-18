"""AgentDiff — PR-Ready Markdown (offline, no API keys).

Renders the paste-ready PR comment a reviewer sees: the regression gate, the
collapsed divergence tree, and the culprit step. Then shows how the same body
is posted to a GitHub PR with ``--pr <number>``. To run:

    uv run cookbooks/pr_markdown.py
    # or: python cookbooks/pr_markdown.py
"""

from __future__ import annotations

import json
from pathlib import Path

from agentdiff import compare, generate_pr_markdown, parse_trace_data

SAMPLE = Path(__file__).parent / "sample"


def main() -> None:
    with open(SAMPLE / "generic_baseline.json", encoding="utf-8") as fh:
        baseline = parse_trace_data(json.load(fh))
    with open(SAMPLE / "generic_candidate.json", encoding="utf-8") as fh:
        candidate = parse_trace_data(json.load(fh))

    report = compare(baseline, candidate, detect_loops=True)
    report.passed = False

    markdown = generate_pr_markdown(
        report, max_divergence=0.3, max_loops=0, max_cost_delta=10.0
    )

    print("Paste-ready PR comment:\n")
    print(markdown)

    print()
    print("-" * 70)
    print(
        "In CI, the same body is posted automatically with:\n"
        "\n"
        "    agentdiff baseline.json candidate.json \\\n"
        "      --format pr --pr <PR_NUMBER> \\\n"
        "      --fail-on-regression\n"
        "\n"
        "(requires GITHUB_TOKEN / GH_TOKEN; repo from GITHUB_REPOSITORY.)"
    )


if __name__ == "__main__":
    main()
