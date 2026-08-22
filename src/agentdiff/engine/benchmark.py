"""G3 — cross-framework A/B benchmark mode.

Compares two agents (any frameworks, any adapters) head-to-head on the same
task. Unlike regression diffing — which asks "did the candidate break?" — the
A/B mode asks "which agent ran this task more efficiently?", so both sides are
treated as peers and scored on deterministic efficiency dimensions:

- **steps**      — total execution steps (leaner path)
- **wei**        — wasted-effort share (fewer failed/retried steps)
- **tokens**     — total token usage
- **latency_ms** — wall-clock time

Each case is won by the side taking the majority of those dimensions; ties
are explicit, never coin flips. This is a *structural efficiency* verdict by
design: judging answer semantics would violate AgentDiff's no-LLM-judge
non-goal.

Example::

    from agentdiff import BenchmarkCase, run_benchmark

    report = run_benchmark([
        BenchmarkCase(
            name="user_lookup",
            agent_a="runs/crewai_ny.json",    # CrewAI kickoff output
            agent_b="runs/langgraph_ny.json", # LangGraph state snapshot
        ),
    ])
    print(report.summary())
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field

from agentdiff.engine.suite import TraceInput, _resolve_trace
from agentdiff.models.report import DiffReport
from agentdiff.models.trace import AgentTrace


@dataclass
class BenchmarkCase:
    """One same-task pairing of two agent runs."""

    name: str
    agent_a: TraceInput
    agent_b: TraceInput


@dataclass
class CaseOutcome:
    """Result of one benchmark case; ``error`` is set when it could not run."""

    name: str
    report: DiffReport | None = None
    trace_a: AgentTrace | None = None
    trace_b: AgentTrace | None = None
    winner: str = "tie"  # "a" | "b" | "tie"
    dimensions_won_a: int = 0
    dimensions_won_b: int = 0
    error: str | None = None


def _dimension_score(trace: AgentTrace) -> dict[str, float]:
    from agentdiff.engine.metrics import calculate_wei

    return {
        "steps": float(len(trace.steps)),
        "wei": calculate_wei(trace.steps),
        "tokens": float(trace.total_tokens.total_tokens),
        "latency": float(trace.total_latency_ms),
    }


def _decide_winner(
    score_a: dict[str, float], score_b: dict[str, float]
) -> tuple[int, int]:
    """Counts dimensions won per side (lower raw value wins each)."""
    a = b = 0
    for dim in ("steps", "wei", "tokens", "latency"):
        if score_a[dim] < score_b[dim]:
            a += 1
        elif score_b[dim] < score_a[dim]:
            b += 1
    return a, b


def _run_case(case: BenchmarkCase) -> CaseOutcome:
    from agentdiff.engine.comparator import compare

    try:
        trace_a = _resolve_trace(case.agent_a)
        trace_b = _resolve_trace(case.agent_b)
    except Exception as e:
        return CaseOutcome(name=case.name, error=f"failed to load traces: {e}")

    try:
        report = compare(trace_a, trace_b)
    except Exception as e:
        return CaseOutcome(name=case.name, error=f"comparison failed: {e}")

    score_a = _dimension_score(trace_a)
    score_b = _dimension_score(trace_b)
    won_a, won_b = _decide_winner(score_a, score_b)

    winner = "a" if won_a > won_b else "b" if won_b > won_a else "tie"
    return CaseOutcome(
        name=case.name,
        report=report,
        trace_a=trace_a,
        trace_b=trace_b,
        winner=winner,
        dimensions_won_a=won_a,
        dimensions_won_b=won_b,
    )


@dataclass
class BenchmarkReport:
    """Aggregated A/B results across cases."""

    outcomes: list[CaseOutcome] = field(default_factory=list)

    @property
    def wins_a(self) -> int:
        return sum(1 for o in self.outcomes if o.winner == "a")

    @property
    def wins_b(self) -> int:
        return sum(1 for o in self.outcomes if o.winner == "b")

    @property
    def ties(self) -> int:
        return sum(1 for o in self.outcomes if o.winner == "tie")

    @property
    def overall_winner(self) -> str:
        if self.wins_a > self.wins_b:
            return "a"
        if self.wins_b > self.wins_a:
            return "b"
        return "tie"

    def summary(self) -> str:
        lines = [
            "=" * 41,
            "       AGENTDIFF A/B BENCHMARK          ",
            "=" * 41,
            f"Overall: agent {'A' if self.overall_winner == 'a' else 'B' if self.overall_winner == 'b' else 'TIE'} "
            f"(A {self.wins_a} - B {self.wins_b}, {self.ties} tied)",
            "-" * 41,
        ]
        for outcome in self.outcomes:
            if outcome.error is not None:
                lines.append(f"  [ ERROR] {outcome.name}: {outcome.error}")
                continue
            sa = outcome.trace_a
            sb = outcome.trace_b
            lines.append(
                f"  [{outcome.winner.upper():>5}] {outcome.name} "
                f"(A won {outcome.dimensions_won_a}, B won {outcome.dimensions_won_b})\n"
                f"          steps   A={len(sa.steps):>4}  B={len(sb.steps):>4}\n"
                f"          tokens  A={sa.total_tokens.total_tokens:>6}  "
                f"B={sb.total_tokens.total_tokens:>6}\n"
                f"          latency A={sa.total_latency_ms:>6.0f}ms  "
                f"B={sb.total_latency_ms:>6.0f}ms\n"
                f"          TDI(a,b)={outcome.report.trajectory_divergence_index:.3f}"
            )
        lines.append("=" * 41)
        return "\n".join(lines)

    def to_markdown(self) -> str:
        """Paste-ready markdown table of the benchmark."""
        header = (
            "| Case | Steps A | Steps B | Tokens A | Tokens B "
            "| Latency A | Latency B | TDI | Winner |\n"
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"
        )
        rows = []
        for o in self.outcomes:
            if o.error is not None:
                rows.append(f"| {o.name} | - | - | - | - | - | - | - | ERROR |")
                continue
            rows.append(
                f"| {o.name} "
                f"| {len(o.trace_a.steps)} | {len(o.trace_b.steps)} "
                f"| {o.trace_a.total_tokens.total_tokens} "
                f"| {o.trace_b.total_tokens.total_tokens} "
                f"| {o.trace_a.total_latency_ms:.0f}ms "
                f"| {o.trace_b.total_latency_ms:.0f}ms "
                f"| {o.report.trajectory_divergence_index:.3f} "
                f"| {o.winner.upper() if o.winner != 'tie' else 'TIE'} |"
            )
        tally = (
            f"\n\n**Overall:** agent "
            f"{'A' if self.overall_winner == 'a' else 'B' if self.overall_winner == 'b' else 'TIE'} "
            f"— A {self.wins_a} / B {self.wins_b} / tied {self.ties}"
        )
        return "\n".join([header, *rows]) + tally


def run_benchmark(
    cases: list[BenchmarkCase],
    *,
    workers: int | None = None,
) -> BenchmarkReport:
    """Runs every benchmark case; nothing aborts the benchmark.

    Args mirror :func:`agentdiff.run_scenarios`: ``workers >= 2`` fans out to
    a thread pool; ``None``/``1`` runs sequentially. Results keep input order.
    """
    if workers is not None and workers < 1:
        raise ValueError("workers must be >= 1, or None for sequential execution")
    if not cases:
        return BenchmarkReport(outcomes=[])

    if workers is None or workers == 1 or len(cases) == 1:
        outcomes = [_run_case(c) for c in cases]
    else:
        max_workers = min(workers, len(cases))
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            futures = [pool.submit(_run_case, case) for case in cases]
            outcomes = [f.result() for f in futures]

    return BenchmarkReport(outcomes=outcomes)
