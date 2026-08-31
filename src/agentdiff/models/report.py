from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from agentdiff.models.step import TraceStep


class StepDiffStatus(str, Enum):
    MATCHED = "matched"
    MATCHED_COMMUTATIVE = "matched_commutative"
    ADDED = "added"
    REMOVED = "removed"
    MODIFIED = "modified"


class StepDiff(BaseModel):
    step_name: str
    diff_status: StepDiffStatus
    baseline_step: TraceStep | None = None
    candidate_step: TraceStep | None = None
    argument_diff: dict[str, Any] | None = None
    output_diff: dict[str, Any] | None = None


class GateSeverity(str, Enum):
    """Action tier for a gate finding (Pillar 2: decoupled failure modes).

    ``HARD`` findings block CI (exit 1); ``SOFT`` findings are rendered in
    every report format but never flip the exit code.
    """

    HARD = "hard"
    SOFT = "soft"


class GateFinding(BaseModel):
    """One outcome of gate evaluation, typed for severity-aware reporting.

    ``code`` values: ``divergence``, ``loops``, ``cost_spike``, ``wasted_effort``,
    ``recovery_cascade``, ``tool_loop`` (identical-call runaway loop),
    ``tool_repeats`` (over the per-tool repeat cap), ``path_drift`` (benign).
    """

    severity: GateSeverity
    code: str
    message: str


class DiffReport(BaseModel):
    baseline_id: str
    candidate_id: str
    trajectory_divergence_index: float
    baseline_wei: float
    candidate_wei: float
    loops_detected: list[dict[str, Any]] = Field(default_factory=list)
    identical_call_loops: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Non-consecutive runaway loops: same step name called >= 2 "
        "times with identical inputs and stagnant outputs (hard-invariant facts).",
    )
    tool_call_counts: dict[str, int] = Field(
        default_factory=dict,
        description="Calls per step name in the candidate run (for the "
        "max_tool_repeats hard invariant).",
    )
    warnings: list[GateFinding] = Field(
        default_factory=list,
        description="SOFT findings (Pillar 2): rendered in every format but "
        "never block CI or flip the exit code. Populated by gate consumers.",
    )
    violations: list[GateFinding] = Field(
        default_factory=list,
        description="HARD findings (Pillar 2): blocking gate violations that "
        "flip the exit code. Populated by gate consumers.",
    )
    cost_delta_percentage: float
    latency_delta_percentage: float
    token_delta_percentage: float
    baseline_recovery_steps: int = 0
    candidate_recovery_steps: int = 0
    recovery_step_ratio: float = 0.0
    step_diffs: list[StepDiff] = Field(default_factory=list)
    passed: bool = True
    gate_provenance: str | None = Field(
        default=None,
        description="G7: one-line summary of active gate thresholds and their "
        "source (agentdiff.toml path or defaults). Populated by the CLI.",
    )

    def summary(self) -> str:
        """Returns a string summarizing the comparison report."""
        lines = [
            "=========================================",
            "           AGENTDIFF REPORT SUMMARY      ",
            "=========================================",
            f"Baseline ID:  {self.baseline_id}",
            f"Candidate ID: {self.candidate_id}",
            f"Status:       {'PASSED' if self.passed else 'FAILED'}",
            "-----------------------------------------",
            f"Trajectory Divergence Index (TDI): {self.trajectory_divergence_index:.4f}",
            f"Baseline Wasted Effort Index (WEI): {self.baseline_wei:.4f}",
            f"Candidate Wasted Effort Index (WEI): {self.candidate_wei:.4f}",
            "-----------------------------------------",
            "Recovery Effort:",
            f"  Baseline Recovery Steps:  {self.baseline_recovery_steps}",
            f"  Candidate Recovery Steps: {self.candidate_recovery_steps}",
            f"  Recovery Step Ratio (RSR): {self.recovery_step_ratio:.4f}",
            "-----------------------------------------",
            "Resource Deltas:",
            f"  Cost Delta:    {self.cost_delta_percentage:+.2f}%",
            f"  Latency Delta: {self.latency_delta_percentage:+.2f}%",
            f"  Token Delta:   {self.token_delta_percentage:+.2f}%",
            "-----------------------------------------",
            f"Loops Detected: {len(self.loops_detected)}",
        ]

        for idx, loop in enumerate(self.loops_detected):
            lines.append(
                f"  - Loop #{idx + 1}: Repeated steps {loop.get('steps', [])} (Count: {loop.get('iterations', 0)})"
            )

        lines.append("Step Diff Summary:")
        counts = {status: 0 for status in StepDiffStatus}
        for sd in self.step_diffs:
            counts[sd.diff_status] += 1

        for status, count in counts.items():
            lines.append(f"  - {status.value.capitalize()}: {count}")

        lines.append("=========================================")
        return "\n".join(lines)
