from agentdiff.models.step import StepStatus, TraceStep


def calculate_tdi(steps_a_len: int, steps_b_len: int, lcs_len: int) -> float:
    """Calculates Trajectory Divergence Index (TDI).
    TDI = 1.0 - (2 * |LCS(A, B)|) / (|Steps_A| + |Steps_B|)
    """
    total_steps = steps_a_len + steps_b_len
    if total_steps == 0:
        return 0.0
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
