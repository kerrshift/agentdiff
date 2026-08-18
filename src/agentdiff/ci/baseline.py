"""Baseline rotation policy: when a clean run may advance the stored baseline.

Guards against drift creep by refusing to auto-rotate a trajectory that is
"clean" but still meaningfully diverged from the baseline.
"""

from __future__ import annotations

from dataclasses import dataclass

from agentdiff.models.report import DiffReport

__all__ = ["RotationDecision", "decide_rotation"]


@dataclass(frozen=True)
class RotationDecision:
    rotate: bool
    reason: str


def decide_rotation(
    report: DiffReport,
    policy: str = "manual",
    max_drift: float = 0.05,
    explicit_update: bool = False,
) -> RotationDecision:
    """Decides whether to advance the baseline after a run.

    Policies:
    - ``manual``: advance only when ``explicit_update`` is set (default).
    - ``auto``: advance on any non-regression run.
    - ``staged``: advance only when non-regression AND the trajectory is still
      within ``max_drift`` of the current baseline (guards drift creep).
    """
    clean = report.passed
    if not clean:
        return RotationDecision(False, "run is a regression; baseline must not advance")

    if policy == "auto":
        return RotationDecision(True, "auto rotation on clean run")

    if policy == "staged":
        if report.trajectory_divergence_index <= max_drift:
            return RotationDecision(
                True,
                f"clean run within drift budget (TDI {report.trajectory_divergence_index:.3f} ≤ {max_drift})",
            )
        return RotationDecision(
            False,
            "clean run exceeds drift budget; hold baseline to avoid creep "
            f"(TDI {report.trajectory_divergence_index:.3f} > {max_drift}). "
            "Rotate explicitly with --update-baseline.",
        )

    # manual
    if explicit_update:
        return RotationDecision(True, "explicit baseline update requested")
    return RotationDecision(False, "manual policy; no explicit update requested")
