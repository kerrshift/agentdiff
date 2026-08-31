from typing import Any

from agentdiff.engine.aligner import align_traces, mark_commutative_swaps
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
from agentdiff.models.envelope import BaselineEnvelope
from agentdiff.models.report import (
    DiffReport,
    GateFinding,
    GateSeverity,
    StepDiffStatus,
)
from agentdiff.models.trace import AgentTrace
from agentdiff.testing.assertions import GateResult, evaluate_gate


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
    # 1. Align execution traces (with topological-equivalence pass)
    step_diffs = mark_commutative_swaps(
        align_traces(baseline, candidate, strict_tool_signatures),
        baseline,
        candidate,
    )

    # 2. Compute LCS length for TDI (commutative swaps count as matched)
    lcs_len = sum(
        1
        for sd in step_diffs
        if sd.diff_status
        in (
            StepDiffStatus.MATCHED,
            StepDiffStatus.MODIFIED,
            StepDiffStatus.MATCHED_COMMUTATIVE,
        )
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


def compare_envelope(
    envelope: BaselineEnvelope,
    candidate: AgentTrace,
    *,
    max_divergence: float = 0.35,
    max_cost_increase_pct: float = 20.0,
    max_loops: int = 0,
    step_count_std_dev: float = 2.0,
    max_wasted_effort: float | None = None,
    max_recovery_step_ratio: float | None = None,
    fail_on_identical_loops: bool = True,
    max_tool_repeats: int | None = None,
) -> tuple[DiffReport, GateResult]:
    """Statistical comparison: candidate vs an N-run baseline envelope.

    Semantics (decision D1): the candidate is aligned against *every*
    recorded run and judged against its best match (minimum TDI) — "within
    normal variance" means some recorded run explains it. Resource bands
    (step count, cost) are evaluated against the envelope's mean ± k·sigma
    rather than a single static run.

    Hard gates: divergence ceiling, cost ceiling over the envelope mean,
    step-count band, loop count, and the hard invariants (identical-call
    loops, tool repeat cap, recovery cascade — all inherited from
    :func:`evaluate_gate`). Soft: benign path drift, as usual.

    Returns:
        ``(report, gate)`` where ``report`` is the best-matching pair diff
        (loops injected once) and ``gate`` the merged severity result.
    """
    if envelope.n_runs < 2:
        raise ValueError(
            "statistical comparison requires >= 2 recorded runs in the envelope; "
            f"got {envelope.n_runs}. Record more runs or use strict mode."
        )

    # 1. Align the candidate against every run; keep the best explanation.
    pair_reports = [
        compare(run, candidate, detect_loops=False) for run in envelope.runs
    ]
    report = min(pair_reports, key=lambda r: r.trajectory_divergence_index)
    report.loops_detected = detect_all_loops(candidate)

    findings: list[GateFinding] = []
    bands = envelope.envelope

    # 2. Step-count band: |candidate - mean| must sit within k·sigma.
    step_band = bands.get("step_count")
    if step_band is not None:
        allowed = step_count_std_dev * step_band.std_dev
        drift = len(candidate.steps) - step_band.mean
        if abs(drift) > allowed:
            findings.append(
                GateFinding(
                    severity=GateSeverity.HARD,
                    code="step_count_band",
                    message=f"Step count {len(candidate.steps)} is outside the "
                    f"envelope band (mean {step_band.mean:.1f} ± "
                    f"{step_count_std_dev:g} sigma = {allowed:.1f}); drift "
                    f"{drift:+.1f} steps.",
                )
            )

    # 3. Cost ceiling: candidate cost above the envelope mean by more than
    #    max_cost_increase_pct (the "200% cost spike" hard gate). The ceiling
    #    is the LOOSER of the relative cap and the variance band, so a run
    #    that is merely longer-but-in-band is not flagged as a cost spike.
    cost_band = bands.get("estimated_cost_usd")
    if cost_band is not None:
        candidate_cost = candidate.total_tokens.estimated_cost_usd
        relative = cost_band.mean * (1 + max_cost_increase_pct / 100.0)
        variance = cost_band.ceiling(step_count_std_dev)
        ceiling = max(relative, variance)
        if candidate_cost > ceiling and ceiling > 0:
            findings.append(
                GateFinding(
                    severity=GateSeverity.HARD,
                    code="cost_spike",
                    message=f"Cost ${candidate_cost:.4f} exceeds the envelope "
                    f"ceiling ${ceiling:.4f} (mean ${cost_band.mean:.4f} + "
                    f"{max_cost_increase_pct:g}%).",
                )
            )

    # 4. Path gates (divergence ceiling, loops, recovery, invariants) plus
    #    the soft path-drift warning — reuse the shared gate. Cost is
    #    envelope-relative (checked above), so the pairwise cost check is
    #    opened here.
    pair_gate = evaluate_gate(
        report,
        max_divergence=max_divergence,
        max_cost_increase_pct=float("inf"),
        max_loops=max_loops,
        max_wasted_effort=max_wasted_effort,
        max_recovery_step_ratio=max_recovery_step_ratio,
        fail_on_identical_loops=fail_on_identical_loops,
        max_tool_repeats=max_tool_repeats,
    )

    gate = GateResult(
        violations=[*findings, *pair_gate.violations], warnings=pair_gate.warnings
    )
    if not gate.passed:
        report.passed = False
    return report, gate
