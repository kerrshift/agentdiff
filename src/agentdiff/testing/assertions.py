from dataclasses import dataclass, field

from agentdiff.models.report import DiffReport, GateFinding, GateSeverity

# Large loop allowance used to translate the legacy boolean ``allow_loops``
# flag into the count-based ``max_loops`` gate.
_ALLOW_ALL_LOOPS = 2**31 - 1


@dataclass
class GateResult:
    """Outcome of severity-aware gate evaluation (Pillar 2).

    ``violations`` are HARD findings — they fail the gate (exit 1).
    ``warnings`` are SOFT findings — rendered everywhere, never blocking.
    """

    violations: list[GateFinding] = field(default_factory=list)
    warnings: list[GateFinding] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return not self.violations

    @property
    def violation_messages(self) -> list[str]:
        return [f.message for f in self.violations]

    @property
    def warning_messages(self) -> list[str]:
        return [f.message for f in self.warnings]


def evaluate_gate(
    report: DiffReport,
    *,
    max_divergence: float = 0.25,
    max_cost_increase_pct: float = 5.0,
    max_loops: int = 0,
    max_wasted_effort: float | None = None,
    max_recovery_step_ratio: float | None = None,
    fail_on_identical_loops: bool = True,
    max_tool_repeats: int | None = None,
) -> GateResult:
    """Severity-aware gate evaluation shared by every AgentDiff gate consumer.

    This is the single source of truth for gate semantics — the CLI,
    :func:`assert_no_regressions`, and the scenario runner all evaluate
    through here, so a new gate applies everywhere at once.

    HARD (blocking) checks:
    1. Divergence — TDI above ``max_divergence``.
    2. Loops — more candidate loops than ``max_loops`` (0 = none allowed).
    3. Cost / token spike — cost increase above ``max_cost_increase_pct``.
    4. Wasted effort — candidate WEI above ``max_wasted_effort`` (opt-in).
    5. Recovery cascade — RSR above ``max_recovery_step_ratio`` (opt-in).
    6. Cyclical tool loop — same endpoint called >= 2 times with identical
       inputs and stagnant outputs, when ``fail_on_identical_loops`` is set.
    7. Tool repeat cap — any single tool called more than ``max_tool_repeats``
       times (opt-in).

    SOFT (non-blocking) checks:
    - Path drift — the run passed every budget but took an alternate route
      (TDI > 0). Rendered in reports/PR comments; never blocks CI.

    Returns a :class:`GateResult`; empty ``violations`` means clean.
    """
    violations: list[GateFinding] = []

    def hard(code: str, message: str) -> None:
        violations.append(
            GateFinding(severity=GateSeverity.HARD, code=code, message=message)
        )

    # 1. Divergence
    if report.trajectory_divergence_index > max_divergence:
        hard(
            "divergence",
            f"Trajectory Divergence Index (TDI) of {report.trajectory_divergence_index:.4f} "
            f"exceeded threshold of {max_divergence:.4f}.",
        )

    # 2. Loops (count-based)
    if len(report.loops_detected) > max_loops:
        hard(
            "loops",
            f"Detected {len(report.loops_detected)} loop(s) in the candidate run, "
            f"but the loop gate allows at most {max_loops}.",
        )

    # 3. Cost / token spike
    if report.cost_delta_percentage > max_cost_increase_pct:
        hard(
            "cost_spike",
            f"Cost increase of {report.cost_delta_percentage:+.2f}% "
            f"exceeded threshold of {max_cost_increase_pct:+.2f}%.",
        )

    # 4. Wasted effort (opt-in)
    if max_wasted_effort is not None and report.candidate_wei > max_wasted_effort:
        hard(
            "wasted_effort",
            f"Candidate Wasted Effort Index (WEI) of {report.candidate_wei:.4f} "
            f"exceeded threshold of {max_wasted_effort:.4f}.",
        )

    # 5. Recovery cascade (opt-in)
    if (
        max_recovery_step_ratio is not None
        and report.recovery_step_ratio > max_recovery_step_ratio
    ):
        hard(
            "recovery_cascade",
            f"Recovery Step Ratio (RSR) of {report.recovery_step_ratio:.4f} "
            f"(candidate {report.candidate_recovery_steps} recovery step(s) vs "
            f"baseline {report.baseline_recovery_steps}) exceeded threshold of "
            f"{max_recovery_step_ratio:.4f}.",
        )

    # 6. Cyclical tool loop (hard invariant)
    if fail_on_identical_loops and report.identical_call_loops:
        for loop in report.identical_call_loops:
            hard(
                "tool_loop",
                f"Cyclical tool loop: '{loop['steps'][0]}' called {loop['iterations']} "
                "times with identical inputs and stagnant output state.",
            )

    # 7. Tool repeat cap (hard invariant, opt-in)
    if max_tool_repeats is not None:
        for name, count in sorted(report.tool_call_counts.items()):
            if count > max_tool_repeats:
                hard(
                    "tool_repeats",
                    f"Tool '{name}' called {count} time(s), exceeding the "
                    f"max_tool_repeats cap of {max_tool_repeats}.",
                )

    warnings: list[GateFinding] = []
    if not violations and report.trajectory_divergence_index > 0:
        counts = {"added": 0, "removed": 0, "modified": 0}
        for sd in report.step_diffs:
            if sd.diff_status.value in counts:
                counts[sd.diff_status.value] += 1
        drifted = counts["added"] + counts["removed"] + counts["modified"]
        if drifted:
            warnings.append(
                GateFinding(
                    severity=GateSeverity.SOFT,
                    code="path_drift",
                    message=f"Path drift (benign): {drifted} step(s) differ from the "
                    f"baseline ({counts['added']} added, {counts['removed']} removed, "
                    f"{counts['modified']} modified) but all budgets were respected — "
                    "alternate valid route; review the diff below.",
                )
            )

    return GateResult(violations=violations, warnings=warnings)


def evaluate_report(
    report: DiffReport,
    max_divergence: float = 0.25,
    max_cost_increase_pct: float = 5.0,
    allow_loops: bool = False,
    max_wasted_effort: float = 0.10,
    max_recovery_step_ratio: float | None = None,
) -> list[str]:
    """Legacy string gate: returns human-readable HARD violation messages.

    Thin wrapper over :func:`evaluate_gate` preserving the historical
    signature and messages — empty list means clean. New consumers should
    call :func:`evaluate_gate` for severity-aware findings.
    """
    result = evaluate_gate(
        report,
        max_divergence=max_divergence,
        max_cost_increase_pct=max_cost_increase_pct,
        max_loops=_ALLOW_ALL_LOOPS if allow_loops else 0,
        max_wasted_effort=max_wasted_effort,
        max_recovery_step_ratio=max_recovery_step_ratio,
        # Legacy semantics: allow_loops=True tolerates every loop flavor.
        fail_on_identical_loops=not allow_loops,
        max_tool_repeats=None,
    )
    if not allow_loops and report.loops_detected:
        # Preserve the exact legacy message for the boolean loop gate.
        return [
            (
                f"Detected {len(report.loops_detected)} loops in the candidate run, "
                "but allow_loops is False."
            )
        ] + [f.message for f in result.violations if f.code != "loops"]
    return result.violation_messages


def assert_no_regressions(
    report: DiffReport,
    max_divergence: float = 0.25,
    max_cost_increase_pct: float = 5.0,
    allow_loops: bool = False,
    max_wasted_effort: float = 0.10,
    max_recovery_step_ratio: float | None = None,
):
    """Regression assertion helper for pytest suites.

    Raises an :class:`AssertionError` (with a descriptive message) if any HARD
    gate is violated. SOFT warnings (path drift) are noted but never fail.

    Args:
        report: The :class:`DiffReport` produced by :func:`compare`.
        max_divergence: Maximum allowed Trajectory Divergence Index (TDI).
        max_cost_increase_pct: Maximum allowed cost increase, in percent.
        allow_loops: If True, detected loops (including identical-call
            runaway loops) do not fail the assertion.
        max_wasted_effort: Maximum allowed candidate Wasted Effort Index (WEI).
        max_recovery_step_ratio: Maximum allowed Recovery Step Ratio (RSR) —
            candidate vs baseline post-error recovery effort. Opt-in: when
            ``None`` (default) the gate is disabled.
    """
    errors = evaluate_report(
        report,
        max_divergence=max_divergence,
        max_cost_increase_pct=max_cost_increase_pct,
        allow_loops=allow_loops,
        max_wasted_effort=max_wasted_effort,
        max_recovery_step_ratio=max_recovery_step_ratio,
    )

    if errors:
        report.passed = False
        errors_str = "\n".join(f"  - {err}" for err in errors)
        summary_str = report.summary()
        raise AssertionError(
            f"AgentDiff Regression Verification Failed:\n{errors_str}\n\n{summary_str}"
        )
