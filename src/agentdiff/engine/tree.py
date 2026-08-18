from __future__ import annotations

from agentdiff.models.report import DiffReport, StepDiffStatus

MAX_LINES = 25
COLLAPSE_THRESHOLD = 3

_MARKER = {
    StepDiffStatus.MATCHED: "·",
    StepDiffStatus.ADDED: "+",
    StepDiffStatus.REMOVED: "-",
    StepDiffStatus.MODIFIED: "~",
}

_NOTE = {
    StepDiffStatus.ADDED: "added — absent in baseline",
    StepDiffStatus.REMOVED: "removed — absent in candidate",
    StepDiffStatus.MODIFIED: "changed",
}

_ANSI = {
    "reset": "\x1b[0m",
    "dim": "\x1b[2m",
    "green": "\x1b[32m",
    "red": "\x1b[31m",
    "yellow": "\x1b[33m",
    "cyan": "\x1b[36m",
}

_COLOR_FOR = {
    StepDiffStatus.MATCHED: "dim",
    StepDiffStatus.ADDED: "green",
    StepDiffStatus.REMOVED: "red",
    StepDiffStatus.MODIFIED: "yellow",
}


def _render_diff(diff, color: bool) -> str:
    marker = _MARKER[diff.diff_status]
    step = diff.candidate_step or diff.baseline_step
    idx = step.step_index if step else None
    name = step.name if step else diff.step_name
    location = f"{idx:>4} " if idx is not None else "  —  "
    line = f"  {location}{marker} {name}"
    if diff.diff_status != StepDiffStatus.MATCHED:
        line += f"   ({_NOTE[diff.diff_status]})"
    if color:
        code = _COLOR_FOR[diff.diff_status]
        line = f"{_ANSI[code]}{line}{_ANSI['reset']}"
    return line


def render_tree(
    report: DiffReport,
    max_lines: int = MAX_LINES,
    collapse_threshold: int = COLLAPSE_THRESHOLD,
    color: bool = False,
) -> str:
    """Renders a collapsed, capped view of the divergence.

    Long runs of matched steps are collapsed into an ellipsis line, only the
    divergent steps are shown in detail, and the output is capped at
    ``max_lines`` with a trailer when changes are omitted.
    """
    diffs = report.step_diffs
    baseline_count = sum(1 for d in diffs if d.baseline_step is not None)
    candidate_count = sum(1 for d in diffs if d.candidate_step is not None)
    header = f"baseline [{baseline_count} steps] vs candidate [{candidate_count} steps]"
    if not any(d.diff_status != StepDiffStatus.MATCHED for d in diffs):
        return header + "\n  No divergence — trajectories match."

    lines: list[str] = []
    matched_run: list = []

    def flush_run() -> None:
        if not matched_run:
            return
        if len(matched_run) >= collapse_threshold:
            lines.append(f"  · · · {len(matched_run)} matched step(s) · · ·")
        else:
            lines.extend(_render_diff(d, color) for d in matched_run)
        matched_run.clear()

    for diff in diffs:
        if diff.diff_status == StepDiffStatus.MATCHED:
            matched_run.append(diff)
        else:
            flush_run()
            lines.append(_render_diff(diff, color))
    flush_run()

    omitted = 0
    if len(lines) > max_lines:
        # Count divergent lines (non-ellipsis) dropped beyond the cap.
        tail = lines[max_lines:]
        omitted = sum(1 for ln in tail if not ln.startswith("  · · · ") and ln != "")
        lines = lines[:max_lines]

    body = "\n".join(lines)
    trailer = f"\n  … and {omitted} more change(s) omitted" if omitted else ""
    return header + "\n" + body + trailer
