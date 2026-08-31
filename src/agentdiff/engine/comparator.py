from typing import Any

from agentdiff.engine.aligner import align_traces
from agentdiff.engine.loop_detector import (
    count_tool_calls,
    detect_all_loops,
    detect_identical_call_loops,
)
from agentdiff.engine.metrics import (
    calculate_delta_percentage,
    calculate_recovery_step_ratio,
    calculate_tdi,
    calculate_wei,
    compute_recovery_steps,
)
from agentdiff.models.report import DiffReport, StepDiffStatus
from agentdiff.models.trace import AgentTrace


def compare(
    baseline: AgentTrace,
    candidate: AgentTrace,
    detect_loops: bool = True,
    strict_tool_signatures: bool = False,
) -> DiffReport:
    """Aligns two agent runs and scores their divergence.

    Produces a :class:`DiffReport` with step-level alignment, trajectory
    divergence (TDI), wasted-effort (WEI), post-error recovery effort
    (Recovery Step Ratio), cost/latency/token deltas, and (optionally) loop
    detection on the candidate run.

    Args:
        baseline: The known-good trace to compare against.
        candidate: The new trace under test.
        detect_loops: Detect repeating sub-sequences and graph cycles in the
            candidate run.
        strict_tool_signatures: When True, steps only match if both their
            type/name/input-keys AND their full input payloads are equal.

    Returns:
        A DiffReport describing the comparison. ``passed`` defaults to True and
        is only set False by the CLI/assertion gates.

    Raises:
        ValueError: If either trace contains duplicate ``step_id`` values.
    """
    # 1. Align execution traces
    step_diffs = align_traces(baseline, candidate, strict_tool_signatures)

    # 2. Compute LCS length for TDI
    lcs_len = sum(
        1
        for sd in step_diffs
        if sd.diff_status in (StepDiffStatus.MATCHED, StepDiffStatus.MODIFIED)
    )

    # 3. Calculate metrics
    tdi = calculate_tdi(len(baseline.steps), len(candidate.steps), lcs_len)
    baseline_wei = calculate_wei(baseline.steps)
    candidate_wei = calculate_wei(candidate.steps)

    # 3b. Recovery effort (B2): steps spent getting back on track after errors
    baseline_recovery_steps = compute_recovery_steps(step_diffs, "baseline")
    candidate_recovery_steps = compute_recovery_steps(step_diffs, "candidate")
    recovery_step_ratio = calculate_recovery_step_ratio(
        candidate_recovery_steps, baseline_recovery_steps
    )

    # 4. Calculate Resource Deltas
    cost_delta = calculate_delta_percentage(
        baseline.total_tokens.estimated_cost_usd,
        candidate.total_tokens.estimated_cost_usd,
    )
    latency_delta = calculate_delta_percentage(
        baseline.total_latency_ms, candidate.total_latency_ms
    )
    token_delta = calculate_delta_percentage(
        baseline.total_tokens.total_tokens, candidate.total_tokens.total_tokens
    )

    # 5. Detect loops in the candidate run
    loops: list[dict[str, Any]] = []
    if detect_loops:
        loops = detect_all_loops(candidate)

    # 5b. Hard-invariant facts (Pillar 2): identical-call runaway loops and
    # per-endpoint call counts. Recorded unconditionally — they are cheap,
    # order-insensitive, and the gate decides whether they block.
    identical_call_loops = detect_identical_call_loops(candidate)
    tool_call_counts = count_tool_calls(candidate)

    # 6. Build the DiffReport
    report = DiffReport(
        baseline_id=baseline.trace_id,
        candidate_id=candidate.trace_id,
        trajectory_divergence_index=tdi,
        baseline_wei=baseline_wei,
        candidate_wei=candidate_wei,
        loops_detected=loops,
        identical_call_loops=identical_call_loops,
        tool_call_counts=tool_call_counts,
        cost_delta_percentage=cost_delta,
        latency_delta_percentage=latency_delta,
        token_delta_percentage=token_delta,
        baseline_recovery_steps=baseline_recovery_steps,
        candidate_recovery_steps=candidate_recovery_steps,
        recovery_step_ratio=recovery_step_ratio,
        step_diffs=step_diffs,
        passed=True,  # Default to True, assertions/plugins override this
    )

    return report
