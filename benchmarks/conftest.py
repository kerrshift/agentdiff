"""Shared synthetic-trace factories for the benchmark suite.

Self-contained (no imports from ``tests/``) so ``make bench`` works without
the test suite's fixtures. Generates deterministic traces so benchmarks
measure algorithmic behavior, not fixture variance.
"""

import pytest

from agentdiff.models.step import StepStatus, StepType, TokenUsage, TraceStep
from agentdiff.models.trace import AgentTrace


def build_step(name: str, index: int, status: str = "success") -> TraceStep:
    return TraceStep(
        step_id=f"step_{index}",
        parent_id=None,
        step_index=index,
        step_type=StepType.TOOL_CALL,
        name=name,
        input_payload={"i": index},
        output_payload={"out": index},
        status=StepStatus(status),
        error_message=None,
        latency_ms=1.0,
        tokens=TokenUsage(prompt_tokens=10, completion_tokens=5, total_tokens=15),
    )


def build_trace(trace_id: str, n_steps: int, *, error_every: int = 0) -> AgentTrace:
    """Builds a deterministic trace; every k-th step errors if ``error_every=k``."""
    steps = [
        build_step(
            f"tool_{i % 7}",
            i,
            status="error" if (error_every and i % error_every == 0) else "success",
        )
        for i in range(n_steps)
    ]
    totals = TokenUsage(
        prompt_tokens=sum(s.tokens.prompt_tokens for s in steps),
        completion_tokens=sum(s.tokens.completion_tokens for s in steps),
        total_tokens=sum(s.tokens.total_tokens for s in steps),
    )
    return AgentTrace(
        trace_id=trace_id,
        agent_name="bench_agent",
        task_input={"input": "bench"},
        final_output={"output": "done"},
        steps=steps,
        total_latency_ms=float(n_steps),
        total_tokens=totals,
    )


@pytest.fixture(scope="session")
def trace_sizes():
    """Step counts exercised by parametrized benchmarks."""
    return [100, 500, 1000]
