from agentdiff.models.report import DiffReport, StepDiffStatus
from agentdiff.models.step import StepStatus


def generate_markdown(report: DiffReport) -> str:
    """Generates a markdown formatted summary of the comparison report."""
    status_emoji = "✅ PASSED" if report.passed else "❌ FAILED"

    lines = [
        f"# AgentDiff Comparison Report: {status_emoji}",
        "",
        "## Summary Metrics",
        "",
        "| Metric | Baseline | Candidate | Delta |",
        "| :--- | :--- | :--- | :--- |",
        f"| **Trajectory Divergence (TDI)** | - | - | `{report.trajectory_divergence_index:.4f}` |",
        f"| **Wasted Effort Index (WEI)** | `{report.baseline_wei:.4f}` | `{report.candidate_wei:.4f}` | - |",
        f"| **Total Latency** | - | - | `{report.latency_delta_percentage:+.2f}%` |",
        f"| **Total Tokens** | - | - | `{report.token_delta_percentage:+.2f}%` |",
        f"| **Estimated Cost** | - | - | `{report.cost_delta_percentage:+.2f}%` |",
        "",
    ]

    if report.loops_detected:
        lines.extend(
            [
                "## ⚠️ Warnings: Loops Detected",
                "",
                "The candidate trace contains repeating step sequences:",
                "",
            ]
        )
        for idx, loop in enumerate(report.loops_detected):
            stagnant_str = " (Stagnant state changes)" if loop.get("stagnant") else ""
            lines.append(
                f"- **Loop #{idx + 1}:** Repeated {loop['steps']} `{loop['iterations']}` times{stagnant_str}"
            )
        lines.append("")

    if report.violations:
        lines.extend(
            [
                "## ✖ Hard Violations (blocking)",
                "",
            ]
        )
        for finding in report.violations:
            lines.append(f"- {finding.message}")
        lines.append("")

    if report.warnings:
        lines.extend(
            [
                "## ⚠️ Soft Warnings (non-blocking)",
                "",
            ]
        )
        for finding in report.warnings:
            lines.append(f"- {finding.message}")
        lines.append("")

    lines.extend(
        [
            "## Step-by-Step Trajectory Diff",
            "",
            "| # | Step Name | Status | Baseline (Latency / Tokens / Cost) | Candidate (Latency / Tokens / Cost) |",
            "| :--- | :--- | :--- | :--- | :--- |",
        ]
    )

    for idx, sd in enumerate(report.step_diffs):
        status_emoji_map = {
            StepDiffStatus.MATCHED: "🟢 MATCHED",
            StepDiffStatus.ADDED: "🔵 ADDED",
            StepDiffStatus.REMOVED: "🔴 REMOVED",
            StepDiffStatus.MODIFIED: "🟡 MODIFIED",
        }
        status_str = status_emoji_map.get(sd.diff_status, sd.diff_status.value.upper())

        base_info = "-"
        if sd.baseline_step:
            s = sd.baseline_step
            err_str = (
                f" ({s.status.value.upper()})" if s.status != StepStatus.SUCCESS else ""
            )
            base_info = f"{s.latency_ms:.0f}ms / {s.tokens.total_tokens}t / ${s.tokens.estimated_cost_usd:.4f}{err_str}"

        cand_info = "-"
        if sd.candidate_step:
            s = sd.candidate_step
            err_str = (
                f" ({s.status.value.upper()})" if s.status != StepStatus.SUCCESS else ""
            )
            cand_info = f"{s.latency_ms:.0f}ms / {s.tokens.total_tokens}t / ${s.tokens.estimated_cost_usd:.4f}{err_str}"

        lines.append(
            f"| {idx + 1} | {sd.step_name} | {status_str} | {base_info} | {cand_info} |"
        )

    return "\n".join(lines)
