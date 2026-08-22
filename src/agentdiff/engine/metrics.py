from agentdiff.models.report import StepDiff, StepDiffStatus
from agentdiff.models.step import StepStatus, TraceStep

# Statuses treated as wasted effort (shared with WEI).
WASTED_STATUSES = frozenset({StepStatus.ERROR, StepStatus.RETRY, StepStatus.ABANDONED})

# Diff statuses that mean "back on the shared path with the other run"
# (the same set TDI counts as LCS matches).
_ALIGNED_STATUSES = frozenset({StepDiffStatus.MATCHED, StepDiffStatus.MODIFIED})


def calculate_tdi(steps_a_len: int, steps_b_len: int, lcs_len: int) -> float:
    """Calculates Trajectory Divergence Index (TDI).
    TDI = 1.0 - (2 * |LCS(A, B)|) / (|Steps_A| + |Steps_B|)

    The LCS length is clamped to the valid range ``[0, min(a, b)]`` so the
    result is always in ``[0, 1]`` regardless of the caller's input.
    """
    if steps_a_len < 0 or steps_b_len < 0 or lcs_len < 0:
        raise ValueError("Step and LCS counts must be non-negative")
    total_steps = steps_a_len + steps_b_len
    if total_steps == 0:
        return 0.0
    lcs_len = min(lcs_len, steps_a_len, steps_b_len)
    return 1.0 - (2.0 * lcs_len) / total_steps


def calculate_wei(steps: list[TraceStep]) -> float:
    """Calculates Wasted Effort Index (WEI).
    WEI = Count(Steps with status in {ERROR, RETRY, ABANDONED}) / Total Steps
    """
    if not steps:
        return 0.0
    wasted_statuses = {StepStatus.ERROR, StepStatus.RETRY, StepStatus.ABANDONED}
    wasted_count = sum(1 for s in steps if s.status in wasted_statuses)
    return wasted_count / len(steps)


def calculate_delta_percentage(baseline_val: float, candidate_val: float) -> float:
    """Calculates percentage delta between candidate and baseline values."""
    if baseline_val == 0.0:
        if candidate_val == 0.0:
            return 0.0
        return 100.0  # Standard representation for positive spike from zero
    return ((candidate_val - baseline_val) / baseline_val) * 100.0


def compute_recovery_steps(step_diffs: list[StepDiff], side: str) -> int:
    """B2 — counts the successful steps a run spends recovering from failures.

    A *recovery window* opens at every step whose status is ERROR, RETRY, or
    ABANDONED (the same wasted statuses WEI counts). While a window is open,
    each successful step counts toward recovery effort. The window closes at
    the first successful step that re-aligns with the other trace (diff status
    MATCHED or MODIFIED — the same set TDI treats as LCS matches), so the
    realigning retry itself is counted as part of the recovery.

    If the run ends before it re-aligns, all remaining successful steps count
    as unrecovered effort. Successful steps before any failure never count.
    The failed steps themselves are not counted here (WEI already covers them).

    Args:
        step_diffs: The aligned diff produced by :func:`align_traces`.
        side: Which run to measure — ``"baseline"`` or ``"candidate"``.

    Returns:
        Total number of post-failure successful steps spent recovering.
    """
    if side not in ("baseline", "candidate"):
        raise ValueError("side must be 'baseline' or 'candidate'")
    total = 0
    window_open = False
    for diff in step_diffs:
        step = diff.baseline_step if side == "baseline" else diff.candidate_step
        if step is None:
            continue
        if step.status in WASTED_STATUSES:
            window_open = True
            continue
        if not window_open:
            continue
        total += 1  # successful effort spent getting back on track
        if diff.diff_status in _ALIGNED_STATUSES:
            window_open = False  # back on the shared path
    return total


def calculate_recovery_step_ratio(
    candidate_recovery_steps: int, baseline_recovery_steps: int
) -> float:
    """Calculates the Recovery Step Ratio (RSR): candidate vs baseline effort.

    - Both runs clean: ``0.0``.
    - Baseline needed recovery: ``candidate / baseline`` (>1.0 means the
      candidate recovered slower than the baseline did).
    - Baseline clean but candidate needed recovery: there is nothing to be
      relative to, so the raw candidate count is returned — every recovery
      step is pure regression overhead in that case.
    """
    if candidate_recovery_steps <= 0 and baseline_recovery_steps <= 0:
        return 0.0
    if baseline_recovery_steps > 0:
        return candidate_recovery_steps / baseline_recovery_steps
    return float(candidate_recovery_steps)
