"""D3 — programmatic scenario runner: multi-case regression suites.

A *scenario* is one baseline/candidate pair plus its own gate thresholds.
:func:`run_scenarios` executes a list of scenarios and returns a
:class:`SuiteReport`, so teams can gate whole families of agent behaviors in
one call — per-user-flow thresholds, shared defaults, and no early exits:
one broken trace file or failing scenario never aborts the rest of the suite.

Example::

    from agentdiff.engine.suite import Scenario, GateThresholds, run_scenarios

    suite = run_scenarios([
        Scenario("checkout_flow", "traces/checkout_base.json", "traces/checkout_cand.json"),
        Scenario(
            "refunds",
            "traces/refund_base.json",
            "traces/refund_cand.json",
            thresholds=GateThresholds(max_divergence=0.1, allow_loops=True),
        ),
    ])
    if not suite.passed:
        print(suite.summary())
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from agentdiff.loader import load_trace
from agentdiff.models.report import DiffReport
from agentdiff.models.trace import AgentTrace
from agentdiff.testing.assertions import evaluate_report


@dataclass
class GateThresholds:
    """Per-scenario gate configuration (mirrors ``assert_no_regressions``)."""

    max_divergence: float = 0.25
    max_cost_increase_pct: float = 5.0
    allow_loops: bool = False
    max_wasted_effort: float = 0.10
    max_recovery_step_ratio: float | None = None

    def violations(self, report: DiffReport) -> list[str]:
        return evaluate_report(
            report,
            max_divergence=self.max_divergence,
            max_cost_increase_pct=self.max_cost_increase_pct,
            allow_loops=self.allow_loops,
            max_wasted_effort=self.max_wasted_effort,
            max_recovery_step_ratio=self.max_recovery_step_ratio,
        )


TraceInput = str | Path | AgentTrace


@dataclass
class Scenario:
    """One baseline/candidate comparison with its own gates."""

    name: str
    baseline: TraceInput
    candidate: TraceInput
    thresholds: GateThresholds = field(default_factory=GateThresholds)


@dataclass
class ScenarioResult:
    """Outcome of a single scenario; ``error`` is set when it could not run."""

    name: str
    report: DiffReport | None
    passed: bool
    violations: list[str] = field(default_factory=list)
    error: str | None = None

    @property
    def status(self) -> str:
        if self.error is not None:
            return "ERROR"
        return "PASSED" if self.passed else "FAILED"


def _resolve_trace(value: TraceInput) -> AgentTrace:
    if isinstance(value, AgentTrace):
        return value
    return load_trace(str(value))


def run_scenarios(
    scenarios: list[Scenario],
    *,
    detect_loops: bool = True,
    strict_tool_signatures: bool = False,
) -> SuiteReport:
    """Runs every scenario sequentially; nothing aborts the suite."""
    results = [
        run_scenario(
            s, detect_loops=detect_loops, strict_tool_signatures=strict_tool_signatures
        )
        for s in scenarios
    ]
    return SuiteReport(results=results)


def run_scenario(
    scenario: Scenario,
    *,
    detect_loops: bool = True,
    strict_tool_signatures: bool = False,
) -> ScenarioResult:
    """Runs a single scenario, converting any failure into a result."""
    from agentdiff.engine.comparator import compare

    try:
        baseline = _resolve_trace(scenario.baseline)
        candidate = _resolve_trace(scenario.candidate)
    except Exception as e:
        return ScenarioResult(
            name=scenario.name,
            report=None,
            passed=False,
            error=f"failed to load traces: {e}",
        )

    try:
        report = compare(
            baseline,
            candidate,
            detect_loops=detect_loops,
            strict_tool_signatures=strict_tool_signatures,
        )
    except Exception as e:
        return ScenarioResult(
            name=scenario.name,
            report=None,
            passed=False,
            error=f"comparison failed: {e}",
        )

    violations = scenario.thresholds.violations(report)
    if violations:
        report.passed = False  # keep report.passed consistent with the gates
    return ScenarioResult(
        name=scenario.name,
        report=report,
        passed=not violations,
        violations=violations,
    )


@dataclass
class SuiteReport:
    """Aggregated outcome of :func:`run_scenarios`."""

    results: list[ScenarioResult] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return all(r.passed for r in self.results)

    @property
    def counts(self) -> dict[str, int]:
        counts = {"passed": 0, "failed": 0, "errors": 0}
        for r in self.results:
            if r.error is not None:
                counts["errors"] += 1
            elif r.passed:
                counts["passed"] += 1
            else:
                counts["failed"] += 1
        return counts

    def summary(self) -> str:
        """Human-readable suite summary suitable for CI logs."""
        counts = self.counts
        total = len(self.results)
        lines = [
            "=" * 41,
            "         AGENTDIFF SUITE SUMMARY       ",
            "=" * 41,
            f"Status: {'PASSED' if self.passed else 'FAILED'}  "
            f"({counts['passed']}/{total} passed, "
            f"{counts['failed']} failed, {counts['errors']} errors)",
            "-" * 41,
        ]
        for r in self.results:
            lines.append(f"  [{r.status:>6}] {r.name}")
            for violation in r.violations:
                lines.append(f"           - {violation}")
            if r.error is not None:
                lines.append(f"           - {r.error}")
        lines.append("=" * 41)
        return "\n".join(lines)
