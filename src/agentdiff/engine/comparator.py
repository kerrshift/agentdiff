from typing import Any

from agentdiff.engine.aligner import align_traces
from agentdiff.engine.loop_detector import detect_all_loops
from agentdiff.engine.metrics import (
    calculate_delta_percentage,
    calculate_tdi,
    calculate_wei,
)
from agentdiff.models.report import DiffReport, StepDiffStatus
from agentdiff.models.trace import AgentTrace


def compare(
    baseline: AgentTrace,
    candidate: AgentTrace,
    detect_loops: bool = True,
    strict_tool_signatures: bool = False,
) -> DiffReport:
    """Compares baseline and candidate AgentTrace runs, returning a DiffReport."""
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

    # 6. Build the DiffReport
    report = DiffReport(
        baseline_id=baseline.trace_id,
        candidate_id=candidate.trace_id,
        trajectory_divergence_index=tdi,
        baseline_wei=baseline_wei,
        candidate_wei=candidate_wei,
        loops_detected=loops,
        cost_delta_percentage=cost_delta,
        latency_delta_percentage=latency_delta,
        token_delta_percentage=token_delta,
        step_diffs=step_diffs,
        passed=True,  # Default to True, assertions/plugins override this
    )

    return report
