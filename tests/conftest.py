from agentdiff.models.step import StepStatus, StepType, TokenUsage, TraceStep
from agentdiff.models.trace import AgentTrace


def make_step(
    name: str,
    step_type: StepType = StepType.TOOL_CALL,
    step_id: str | None = None,
    parent_id: str | None = None,
    step_index: int = 0,
    input_payload: dict | None = None,
    output_payload: dict | None = None,
    status: StepStatus = StepStatus.SUCCESS,
    error_message: str | None = None,
    latency_ms: float = 100.0,
    prompt_tokens: int = 50,
    completion_tokens: int = 25,
    cost_usd: float = 0.001,
) -> TraceStep:
    """Builds a TraceStep with sensible defaults."""
    return TraceStep(
        step_id=step_id or f"step_{step_index}",
        parent_id=parent_id,
        step_index=step_index,
        step_type=step_type,
        name=name,
        input_payload=input_payload or {},
        output_payload=output_payload or {},
        status=status,
        error_message=error_message,
        latency_ms=latency_ms,
        tokens=TokenUsage(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            estimated_cost_usd=cost_usd,
        ),
    )


def make_trace(
    trace_id: str,
    steps: list[TraceStep],
    agent_name: str = "mock_agent",
    **kwargs,
) -> AgentTrace:
    """Builds an AgentTrace, renumbering step indices by list order."""
    steps = list(steps)
    for idx, step in enumerate(steps):
        step.step_index = idx
        if step.step_id == f"step_{0}":
            step.step_id = f"step_{idx}"

    total_latency = sum(s.latency_ms for s in steps)
    total_tokens = TokenUsage(
        prompt_tokens=sum(s.tokens.prompt_tokens for s in steps),
        completion_tokens=sum(s.tokens.completion_tokens for s in steps),
        total_tokens=sum(s.tokens.total_tokens for s in steps),
        estimated_cost_usd=sum(s.tokens.estimated_cost_usd for s in steps),
    )
    return AgentTrace(
        trace_id=trace_id,
        agent_name=agent_name,
        task_input={"input": "test"},
        final_output={"output": "done"},
        steps=steps,
        total_latency_ms=kwargs.get("total_latency_ms", total_latency),
        total_tokens=total_tokens,
        metadata=kwargs.get("metadata", {}),
    )
