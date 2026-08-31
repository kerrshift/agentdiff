"""Pillar 3 — in-PR baseline approval (``/agentdiff approve``).

Closes the baseline-maintenance loop entirely inside GitHub: a reviewer
comments ``/agentdiff approve`` on a flagged PR, the approve workflow calls
:func:`approve_candidate`, and the candidate trace becomes (or joins) the
golden baseline. No local checkout, no manual JSON.

Policy (decision D3, SPEC-0.5.0 §10): a human may bless **path drift** and
**cost spikes** — those are product judgments. **Loops are never blessable**:
a cyclical tool loop or a tool-repeat-cap breach is non-termination, and
re-baselining it would teach the gate that broken is the new normal.
"""

from __future__ import annotations

from dataclasses import dataclass

from agentdiff.engine.comparator import compare, compare_envelope
from agentdiff.loader import load_baseline, load_trace
from agentdiff.models.envelope import BaselineEnvelope
from agentdiff.models.report import DiffReport, GateFinding
from agentdiff.models.trace import AgentTrace
from agentdiff.testing.assertions import GateResult, evaluate_gate

# Loop-family codes: hard invariants that approve must never bless (D3).
_UNBLESSABLE_CODES = frozenset({"tool_loop", "tool_repeats", "loops"})

DEFAULT_SAMPLE_RUNS = 3


@dataclass(frozen=True)
class ApproveDecision:
    """Outcome of an ``/agentdiff approve`` invocation."""

    approved: bool
    reason: str
    report: DiffReport | None
    unblessable_findings: tuple[GateFinding, ...] = ()

    @property
    def refusals(self) -> tuple[str, ...]:
        return tuple(f.message for f in self.unblessable_findings)


def _gate_for(
    envelope: BaselineEnvelope, candidate: AgentTrace, scenario_cfg
) -> tuple[DiffReport, GateResult]:
    if envelope.mode == "statistical" and envelope.n_runs >= 2:
        tol = getattr(scenario_cfg, "tolerances", None)
        return compare_envelope(
            envelope,
            candidate,
            max_divergence=tol.divergence_ceiling if tol else 0.35,
            max_cost_increase_pct=(
                getattr(scenario_cfg, "max_cost_increase_pct", 20.0)
                if scenario_cfg
                else 20.0
            ),
            step_count_std_dev=tol.step_count_std_dev if tol else 2.0,
        )
    report = compare(envelope.runs[0], candidate)
    return report, evaluate_gate(report)


def approve_candidate(
    baseline_path: str,
    candidate_path: str,
    scenario_cfg=None,
    adapter: str = "auto",
    sample_runs: int = DEFAULT_SAMPLE_RUNS,
) -> ApproveDecision:
    """Blesses a candidate run as the new golden baseline.

    Refuses when a loop-family hard invariant fires (D3). Otherwise rotates
    the baseline — envelopes append the candidate into their rolling window
    and recompute bands; strict baselines are replaced.

    Raises the same load errors as ``load_baseline``/``load_trace``.
    """
    envelope = load_baseline(baseline_path, adapter)
    candidate = load_trace(candidate_path, adapter)

    report, gate = _gate_for(envelope, candidate, scenario_cfg)

    loop_findings = tuple(f for f in gate.violations if f.code in _UNBLESSABLE_CODES)
    if loop_findings:
        return ApproveDecision(
            approved=False,
            reason=(
                "refused: loop violations are never blessable — fix the loop, "
                "then approve (policy: non-termination is not a baseline)"
            ),
            report=report,
            unblessable_findings=loop_findings,
        )

    if envelope.mode == "statistical" and envelope.n_runs >= 2:
        envelope.runs.append(candidate)
        keep = max(2, sample_runs)
        envelope.runs = envelope.runs[-keep:]
        envelope.refresh()
    else:
        # strict baseline: candidate replaces the run set; mode is preserved
        envelope.runs = [candidate]
        envelope.refresh()

    with open(baseline_path, "w", encoding="utf-8") as fh:
        fh.write(envelope.model_dump_json())

    blessed = []
    if gate.violations:
        blessed = [f.code for f in gate.violations]
    reason = (
        "approved with human blessing of: " + ", ".join(blessed)
        if blessed
        else "approved: candidate is clean against its own new baseline"
    )
    return ApproveDecision(approved=True, reason=reason, report=report)
