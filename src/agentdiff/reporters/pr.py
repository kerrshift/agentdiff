from __future__ import annotations

from agentdiff.engine.explanations import locate_culprit
from agentdiff.engine.tree import render_tree
from agentdiff.models.report import DiffReport

DEFAULT_MAX_DIVERGENCE = 0.3
DEFAULT_MAX_COST_DELTA = 10.0


def generate_pr_markdown(
    report: DiffReport,
    max_divergence: float = DEFAULT_MAX_DIVERGENCE,
    max_loops: int = 0,
    max_cost_delta: float = DEFAULT_MAX_COST_DELTA,
) -> str:
    """Renders a compact, PR-ready markdown comment.

    Summary status + gate thresholds, the collapsed divergence tree, and the
    root-cause step — everything a reviewer needs without the full diff.
    """
    status = "⛔ **FAILED**" if not report.passed else "✅ **PASSED**"

    lines = [
        "## AgentDiff — Trajectory Regression Check",
        "",
        f"**Status:** {status}",
        "",
        "| Gate | Value | Threshold |",
        "| :--- | :--- | :--- |",
        f"| TDI | `{report.trajectory_divergence_index:.4f}` | ≤ `{max_divergence}` |",
        f"| Loops | `{len(report.loops_detected)}` | ≤ `{max_loops}` |",
        f"| Cost delta | `{report.cost_delta_percentage:+.2f}%` | ≤ `{max_cost_delta}%` |",
        "",
    ]

    culprit = locate_culprit(report)
    if culprit:
        lines.append(
            "### Root cause\n"
            f"\n> **Culprit:** `{culprit.step_name}` "
            f"`[{culprit.kind}]` — {culprit.reason}."
        )
        lines.append("")

    lines.extend(
        [
            "### Divergence tree",
            "",
            "```text",
            render_tree(report),
            "```",
            "",
        ]
    )

    if report.loops_detected:
        lines.append("### Loops detected")
        for idx, loop in enumerate(report.loops_detected):
            stagnant = " (stagnant state)" if loop.get("stagnant") else ""
            lines.append(
                f"- Loop #{idx + 1}: repeated {loop.get('steps', [])} "
                f"`{loop.get('iterations', 0)}` times{stagnant}"
            )
        lines.append("")

    return "\n".join(lines)
