"""G1 — human-readable, rules-based divergence explanations.

Turns a :class:`DiffReport` into plain-language findings that say *why* a run
regressed — where the path forked, which loop or error chain drove it, and what
the resource spikes are attributable to. Purely rule-based: no LLM, no judge,
deterministic and testable.
"""

from dataclasses import dataclass

from agentdiff.models.report import DiffReport, StepDiffStatus


@dataclass(frozen=True)
class Finding:
    """A single human-readable explanation with a severity."""

    severity: str  # "info" | "warning" | "error"
    category: str  # "divergence" | "loop" | "wasted_effort" | "resources" | "clean"
    message: str

    @property
    def is_issue(self) -> bool:
        return self.severity in ("warning", "error")


# Thresholds for narrative severity
HIGH_TDI = 0.5
MODERATE_TDI = 0.25
COST_SPIKE = 10.0
RESOURCE_MOVED = 5.0
WEI_THRESHOLD = 0.05


def generate_explanations(report: DiffReport) -> list[Finding]:
    """Builds an ordered list of findings explaining the comparison.

    Findings are ordered most-severe-first. An empty list with a single "clean"
    finding is returned when there is nothing concerning.
    """
    findings: list[Finding] = []

    findings.extend(_explain_loops(report))
    findings.extend(_explain_divergence(report))
    findings.extend(_explain_wasted_effort(report))
    findings.extend(_explain_resources(report))

    if not any(f.is_issue for f in findings):
        findings.append(
            Finding(
                "info",
                "clean",
                "No concerning divergence, loops, wasted effort, or resource "
                "spikes detected in the candidate run.",
            )
        )

    return findings


def _explain_loops(report: DiffReport) -> list[Finding]:
    findings: list[Finding] = []
    for loop in report.loops_detected:
        pattern = loop.get("steps", [])
        iterations = loop.get("iterations", 0)
        start = loop.get("start_index")
        length = loop.get("length", len(pattern))
        stagnant = loop.get("stagnant")
        loop_type = loop.get("type", "sequence")

        if loop_type == "graph_cycle":
            msg = (
                f"Cyclic dependency detected on steps {_fmt_list(pattern)} — "
                "the candidate graph contains a cycle, which can cause infinite "
                "or redundant execution."
            )
        else:
            state = (
                "repeating with identical state (stagnant)"
                if stagnant
                else "repeating while state evolves"
            )
            position = (
                f"starting at step {start}" if start is not None and start >= 0 else ""
            )
            msg = (
                f"Loop detected: pattern {_fmt_list(pattern)} ({length} step"
                f"{'s' if length != 1 else ''}) ran {iterations} times {position}, "
                f"{state}. This inflates cost and latency."
            )

        findings.append(Finding("error", "loop", msg))
    return findings


def _explain_divergence(report: DiffReport) -> list[Finding]:
    findings: list[Finding] = []
    diffs = report.step_diffs

    added = [d for d in diffs if d.diff_status == StepDiffStatus.ADDED]
    removed = [d for d in diffs if d.diff_status == StepDiffStatus.REMOVED]
    modified = [d for d in diffs if d.diff_status == StepDiffStatus.MODIFIED]

    if added:
        names = [d.step_name for d in added[:5]]
        suffix = f" (and {len(added) - 5} more)" if len(added) > 5 else ""
        findings.append(
            Finding(
                "warning",
                "divergence",
                f"Candidate introduced {len(added)} step(s) not in the baseline: "
                f"{_fmt_list(names)}{suffix}.",
            )
        )
    if removed:
        names = [d.step_name for d in removed[:5]]
        suffix = f" (and {len(removed) - 5} more)" if len(removed) > 5 else ""
        findings.append(
            Finding(
                "warning",
                "divergence",
                f"Candidate dropped {len(removed)} step(s) that were in the "
                f"baseline: {_fmt_list(names)}{suffix}.",
            )
        )
    for diff in modified[:3]:
        changes = _describe_change(diff)
        findings.append(
            Finding(
                "warning",
                "divergence",
                f"Step '{diff.step_name}' changed behavior: {changes}.",
            )
        )

    tdi = report.trajectory_divergence_index
    if tdi >= HIGH_TDI:
        findings.append(
            Finding(
                "error",
                "divergence",
                f"High structural divergence (TDI={tdi:.2f}): the candidate took "
                "a substantially different path than the baseline.",
            )
        )
    elif tdi >= MODERATE_TDI:
        findings.append(
            Finding(
                "warning",
                "divergence",
                f"Moderate structural divergence (TDI={tdi:.2f}): paths diverge "
                "in a meaningful number of steps.",
            )
        )

    # Pinpoint the first point the two paths diverge.
    for i, diff in enumerate(diffs):
        if diff.diff_status != StepDiffStatus.MATCHED:
            findings.append(
                Finding(
                    "warning",
                    "divergence",
                    f"First divergence at position {i}: {_describe_fork(diff)}.",
                )
            )
            break

    return findings


def _explain_wasted_effort(report: DiffReport) -> list[Finding]:
    if report.candidate_wei <= WEI_THRESHOLD:
        return []

    errored = [
        d.step_name
        for d in report.step_diffs
        if d.candidate_step is not None
        and (d.candidate_step.status.value in ("error", "retry", "abandoned"))
    ]
    worst = _fmt_list(errored[:5]) if errored else "unknown steps"
    suffix = f" (and {len(errored) - 5} more)" if len(errored) > 5 else ""
    return [
        Finding(
            "warning",
            "wasted_effort",
            f"Candidate wasted {report.candidate_wei * 100:.0f}% of effort on "
            f"errored/retried/abandoned steps: {worst}{suffix}.",
        )
    ]


def _explain_resources(report: DiffReport) -> list[Finding]:
    findings: list[Finding] = []

    def add(label: str, delta: float, spike_threshold: float) -> None:
        if delta >= spike_threshold:
            findings.append(
                Finding(
                    "error" if delta >= COST_SPIKE else "warning",
                    "resources",
                    f"{label} increased {delta:+.0f}% versus baseline — "
                    f"{_likely_cause(report)}.",
                )
            )
        elif abs(delta) >= RESOURCE_MOVED:
            findings.append(
                Finding(
                    "info",
                    "resources",
                    f"{label} moved {delta:+.0f}% versus baseline.",
                )
            )

    add("Cost", report.cost_delta_percentage, COST_SPIKE)
    add("Latency", report.latency_delta_percentage, COST_SPIKE)
    add("Token usage", report.token_delta_percentage, COST_SPIKE)
    return findings


def _likely_cause(report: DiffReport) -> str:
    """Infers the most plausible driver of a resource increase from the report."""
    loop_count = len(report.loops_detected)
    added = sum(1 for d in report.step_diffs if d.diff_status == StepDiffStatus.ADDED)
    if loop_count:
        return f"driven by {loop_count} detected loop(s) repeating work"
    if added:
        return f"driven by {added} additional step(s) in the candidate"
    if report.candidate_wei > report.baseline_wei:
        return "driven by wasted effort on errored/retried steps"
    return "consistent with the change in trajectory"


def _describe_fork(diff) -> str:
    base = diff.baseline_step
    cand = diff.candidate_step
    if diff.diff_status == StepDiffStatus.ADDED:
        return f"the candidate added '{diff.step_name}' (absent in baseline)"
    if diff.diff_status == StepDiffStatus.REMOVED:
        return f"the baseline ran '{diff.step_name}' but the candidate did not"
    if base and cand:
        return f"'{base.name}' diverged into '{cand.name}'"
    return f"'{diff.step_name}' diverged ({diff.diff_status.value})"


def _describe_change(diff) -> str:
    parts: list[str] = []
    arg = diff.argument_diff or {}
    out = diff.output_diff or {}
    changed_keys = [k for k, v in arg.items() if v.get("status") == "changed"]
    out_keys = [k for k, v in out.items() if v.get("status") == "changed"]
    if changed_keys:
        parts.append(f"inputs changed ({', '.join(changed_keys)})")
    if out_keys:
        parts.append(f"outputs changed ({', '.join(out_keys)})")
    if diff.baseline_step and diff.candidate_step:
        if diff.baseline_step.status != diff.candidate_step.status:
            parts.append(
                f"status went from {diff.baseline_step.status.value} to "
                f"{diff.candidate_step.status.value}"
            )
    return "; ".join(parts) if parts else "arguments or outputs differed"


def _fmt_list(items: list[str]) -> str:
    if not items:
        return ""
    if len(items) == 1:
        return f"'{items[0]}'"
    if len(items) == 2:
        return f"'{items[0]}' and '{items[1]}'"
    return ", ".join(f"'{s}'" for s in items[:-1]) + f", and '{items[-1]}'"


def format_explanations(report: DiffReport) -> str:
    """Renders findings as a readable multi-line explanation block."""
    lines = ["What happened in this run:"]
    for finding in generate_explanations(report):
        marker = {"info": "·", "warning": "!", "error": "✗"}[finding.severity]
        lines.append(f"  {marker} {finding.message}")
    return "\n".join(lines)


@dataclass(frozen=True)
class Culprit:
    """The single step most likely responsible for the regression."""

    step_name: str
    step_id: str | None
    step_index: int | None
    kind: str  # "loop" | "divergence" | "wasted_effort"
    reason: str
    severity: str

    def render(self) -> str:
        location = f" (step {self.step_index})" if self.step_index is not None else ""
        return f"Culprit: '{self.step_name}'{location} [{self.kind}] — {self.reason}"


def locate_culprit(report: DiffReport) -> Culprit | None:
    """Pinpoints the single root-cause step of a regression.

    Priority order: loop entry > a newly-ADDED step > an errored/retried step
    > a behavior-changed (MODIFIED) step > a REMOVED step. Returns ``None`` for
    a clean run.
    """
    # 1. Loop entry step is the most likely culprit.
    for loop in report.loops_detected:
        step_ids = loop.get("step_ids") or []
        culprit_step = _candidate_step(report, step_ids[0]) if step_ids else None
        name = culprit_step.name if culprit_step else (loop.get("steps") or ["?"])[0]
        return Culprit(
            step_name=name,
            step_id=culprit_step.step_id if culprit_step else None,
            step_index=culprit_step.step_index
            if culprit_step
            else loop.get("start_index"),
            kind="loop",
            reason=(
                f"entered a loop repeating {_fmt_list(loop.get('steps', []))} "
                f"({loop.get('iterations', 0)} times)"
            ),
            severity="error",
        )

    # 2. A newly-added step in the candidate (the candidate did something new).
    for diff in report.step_diffs:
        if diff.diff_status == StepDiffStatus.ADDED and diff.candidate_step:
            step = diff.candidate_step
            return Culprit(
                step_name=step.name,
                step_id=step.step_id,
                step_index=step.step_index,
                kind="divergence",
                reason="the candidate introduced this step (absent in baseline)",
                severity="warning",
            )

    # 3. An errored / retried / abandoned step (wasted effort).
    for diff in report.step_diffs:
        cand = diff.candidate_step
        if cand and cand.status.value in ("error", "retry", "abandoned"):
            return Culprit(
                step_name=cand.name,
                step_id=cand.step_id,
                step_index=cand.step_index,
                kind="wasted_effort",
                reason=f"step ended in status '{cand.status.value}'",
                severity="warning",
            )

    # 4. A step whose behavior changed.
    for diff in report.step_diffs:
        if diff.diff_status == StepDiffStatus.MODIFIED:
            step = diff.candidate_step or diff.baseline_step
            return Culprit(
                step_name=step.name if step else diff.step_name,
                step_id=step.step_id if step else None,
                step_index=step.step_index if step else None,
                kind="divergence",
                reason="the candidate changed this step's behavior",
                severity="warning",
            )

    # 5. A step the candidate dropped.
    for diff in report.step_diffs:
        if diff.diff_status == StepDiffStatus.REMOVED:
            step = diff.baseline_step
            return Culprit(
                step_name=step.name if step else diff.step_name,
                step_id=step.step_id if step else None,
                step_index=step.step_index if step else None,
                kind="divergence",
                reason="the baseline ran this step but the candidate did not",
                severity="warning",
            )

    return None


def _candidate_step(report: DiffReport, step_id: str):
    for diff in report.step_diffs:
        if diff.candidate_step and diff.candidate_step.step_id == step_id:
            return diff.candidate_step
    return None
