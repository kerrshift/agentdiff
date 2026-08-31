from __future__ import annotations

from agentdiff.engine.explanations import locate_culprit
from agentdiff.engine.tree import render_tree
from agentdiff.governance import ThresholdChange
from agentdiff.models.report import DiffReport

DEFAULT_MAX_DIVERGENCE = 0.3
DEFAULT_MAX_COST_DELTA = 10.0


def generate_pr_markdown(
    report: DiffReport,
    max_divergence: float = DEFAULT_MAX_DIVERGENCE,
    max_loops: int = 0,
    max_cost_delta: float = DEFAULT_MAX_COST_DELTA,
    max_recovery_ratio: float | None = None,
    threshold_changes: list[ThresholdChange] | None = None,
    gate_provenance: str | None = None,
) -> str:
    """Renders a compact, PR-ready markdown comment.

    Summary status + gate thresholds, the collapsed divergence tree, and the
    root-cause step — everything a reviewer needs without the full diff.
    The Recovery Step Ratio row only appears when a threshold is provided.

    When ``threshold_changes`` is non-empty (G6), a warning block renders
    above the gate table: the gate itself moved in this PR, so the diff
    above was judged against looser/tighter rules than the baseline had.
    """
    status = "⛔ **FAILED**" if not report.passed else "✅ **PASSED**"

    # Human-first verdict (Pillar 2/3): lead with what the reviewer cares
    # about — loops and money — and demote the metric table to details.
    if report.passed:
        verdict = (
            "No infinite loops. No cost spikes. "
            "Trajectory within budget — safe to merge."
        )
    else:
        blocking = sorted(
            {f.code for f in report.violations if f.severity.value == "hard"}
        )
        verdict = (
            f"Blocked by: {', '.join(blocking) if blocking else 'gate violations'}."
        )

    lines = [
        "## AgentDiff — Trajectory Regression Check",
        "",
        f"**Status:** {status}",
        "",
        verdict,
        "",
    ]

    if threshold_changes:
        lines.append("> [!WARNING]")
        lines.append(
            "> **Gate thresholds changed in this PR** — the diff below was judged against this PR's rules, not the baseline's."
        )
        lines.append(">")
        for change in threshold_changes:
            lines.append(f"> - {change.render()}")
        lines.append("")

    lines.append("<details>")
    lines.append("<summary>Gate details (metrics & thresholds)</summary>")
    lines.append("")
    lines.extend(
        [
            "| Gate | Value | Threshold |",
            "| :--- | :--- | :--- |",
            f"| TDI | `{report.trajectory_divergence_index:.4f}` | ≤ `{max_divergence}` |",
            f"| Loops | `{len(report.loops_detected)}` | ≤ `{max_loops}` |",
            f"| Cost delta | `{report.cost_delta_percentage:+.2f}%` | ≤ `{max_cost_delta}%` |",
        ]
    )
    if max_recovery_ratio is not None:
        lines.append(
            f"| Recovery Step Ratio | `{report.recovery_step_ratio:.2f} "
            f"({report.candidate_recovery_steps}/{report.baseline_recovery_steps})` | "
            f"≤ `{max_recovery_ratio}` |"
        )
    lines.append("")
    lines.append("</details>")
    lines.append("")

    if report.violations:
        lines.append("### Hard violations (blocking)")
        lines.append("")
        for finding in report.violations:
            lines.append(f"- ✖ {finding.message}")
        lines.append("")

    if report.warnings:
        lines.append("> [!NOTE]")
        lines.append(
            "> **Soft warnings (non-blocking)** — the build is green; review before merging."
        )
        lines.append(">")
        for finding in report.warnings:
            lines.append(f"> - {finding.message}")
        lines.append("")

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

    if gate_provenance:
        lines.append(f"<sub>{gate_provenance}</sub>")

    return "\n".join(lines)
