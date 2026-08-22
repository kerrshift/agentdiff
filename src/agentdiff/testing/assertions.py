from agentdiff.models.report import DiffReport


def evaluate_report(
    report: DiffReport,
    max_divergence: float = 0.25,
    max_cost_increase_pct: float = 5.0,
    allow_loops: bool = False,
    max_wasted_effort: float = 0.10,
    max_recovery_step_ratio: float | None = None,
) -> list[str]:
    """Pure gate evaluation shared by every AgentDiff gate consumer.

    Returns a list of human-readable violation messages; empty means clean.
    This is the single source of truth for gate semantics —
    :func:`assert_no_regressions` raises on it, the scenario runner collects
    it, and future gates must be added here so they apply everywhere at once.
    """
    errors = []

    # 1. Divergence Check
    if report.trajectory_divergence_index > max_divergence:
        errors.append(
            f"Trajectory Divergence Index (TDI) of {report.trajectory_divergence_index:.4f} "
            f"exceeded threshold of {max_divergence:.4f}."
        )

    # 2. Cost Check
    if report.cost_delta_percentage > max_cost_increase_pct:
        errors.append(
            f"Cost increase of {report.cost_delta_percentage:+.2f}% "
            f"exceeded threshold of {max_cost_increase_pct:+.2f}%."
        )

    # 3. Loops Check
    if not allow_loops and report.loops_detected:
        errors.append(
            f"Detected {len(report.loops_detected)} loops in the candidate run, "
            f"but allow_loops is False."
        )

    # 4. Wasted Effort Check
    if report.candidate_wei > max_wasted_effort:
        errors.append(
            f"Candidate Wasted Effort Index (WEI) of {report.candidate_wei:.4f} "
            f"exceeded threshold of {max_wasted_effort:.4f}."
        )

    # 5. Recovery Effort Check (opt-in)
    if (
        max_recovery_step_ratio is not None
        and report.recovery_step_ratio > max_recovery_step_ratio
    ):
        errors.append(
            f"Recovery Step Ratio (RSR) of {report.recovery_step_ratio:.4f} "
            f"(candidate {report.candidate_recovery_steps} recovery step(s) vs "
            f"baseline {report.baseline_recovery_steps}) exceeded threshold of "
            f"{max_recovery_step_ratio:.4f}."
        )

    return errors


def assert_no_regressions(
    report: DiffReport,
    max_divergence: float = 0.25,
    max_cost_increase_pct: float = 5.0,
    allow_loops: bool = False,
    max_wasted_effort: float = 0.10,
    max_recovery_step_ratio: float | None = None,
):
    """Regression assertion helper for pytest suites.

    Raises an :class:`AssertionError` (with a descriptive message) if any gate
    is violated.

    Args:
        report: The :class:`DiffReport` produced by :func:`compare`.
        max_divergence: Maximum allowed Trajectory Divergence Index (TDI).
        max_cost_increase_pct: Maximum allowed cost increase, in percent.
        allow_loops: If True, detected loops do not fail the assertion.
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
