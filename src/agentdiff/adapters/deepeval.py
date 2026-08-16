from typing import Any

from agentdiff.adapters.base import BaseAdapter
from agentdiff.models.step import StepStatus, StepType, TokenUsage, TraceStep
from agentdiff.models.trace import AgentTrace


class DeepEvalAdapter(BaseAdapter):
    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AgentTrace:
        """Parses a DeepEval trace dictionary into a canonical AgentTrace."""
        if isinstance(data, list):
            if not data:
                raise ValueError("DeepEval trace list is empty")
            data = data[0]

        trace_id = data.get("id") or data.get("trace_id") or "deepeval_trace"
        agent_name = data.get("name") or data.get("agent_name") or "deepeval_agent"

        task_input = data.get("input")
        if not isinstance(task_input, dict):
            task_input = {"input": task_input}

        final_output = data.get("output")
        if not isinstance(final_output, dict):
            final_output = {"output": final_output}

        steps: list[TraceStep] = []

        # Traverse child spans/nodes
        spans = data.get("spans") or data.get("children") or data.get("nodes") or []
        for span in spans:
            cls._parse_span(span, None, steps)

        total_latency_ms = data.get("latency") or data.get("executionTime") or 0.0
        if total_latency_ms < 100.0 and total_latency_ms > 0:
            total_latency_ms *= 1000.0

        prompt_tokens = sum(s.tokens.prompt_tokens for s in steps)
        completion_tokens = sum(s.tokens.completion_tokens for s in steps)
        total_tokens = sum(s.tokens.total_tokens for s in steps)
        cost = sum(s.tokens.estimated_cost_usd for s in steps)

        total_tokens_obj = TokenUsage(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=cost,
        )

        return AgentTrace(
            trace_id=trace_id,
            agent_name=agent_name,
            task_input=task_input,
            final_output=final_output,
            steps=steps,
            total_latency_ms=total_latency_ms,
            total_tokens=total_tokens_obj,
            metadata=data.get("metadata") or {},
        )

    @classmethod
    def _parse_span(
        cls, span: dict[str, Any], parent_id: str | None, steps_list: list[TraceStep]
    ):
        """Recursively parses DeepEval spans and adds them to steps_list."""
        span_id = span.get("id") or span.get("span_id") or f"step_{len(steps_list)}"
        span_type_str = str(span.get("type", "")).lower()

        # Map span type to StepType
        if "tool" in span_type_str or "retriever" in span_type_str:
            step_type = StepType.TOOL_CALL
        elif "llm" in span_type_str:
            step_type = StepType.LLM_CALL
        elif "agent" in span_type_str:
            step_type = StepType.ROUTING
        else:
            step_type = StepType.THOUGHT

        input_payload = span.get("input")
        if not isinstance(input_payload, dict):
            input_payload = {"input": input_payload}

        output_payload = span.get("output")
        if not isinstance(output_payload, dict):
            output_payload = {"output": output_payload}

        # Tokens & Cost
        prompt_tokens = span.get("input_token_count") or span.get("prompt_tokens") or 0
        completion_tokens = (
            span.get("output_token_count") or span.get("completion_tokens") or 0
        )
        total_tokens = (
            span.get("total_token_count")
            or span.get("total_tokens")
            or (prompt_tokens + completion_tokens)
        )
        cost = span.get("cost") or span.get("estimated_cost_usd") or 0.0

        tokens = TokenUsage(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=cost,
        )

        latency_ms = span.get("latency") or span.get("executionTime") or 0.0
        if latency_ms < 100.0 and latency_ms > 0:
            latency_ms *= 1000.0

        step = TraceStep(
            step_id=span_id,
            parent_id=parent_id,
            step_index=len(steps_list),
            step_type=step_type,
            name=span.get("name") or span.get("displayName") or f"step_{span_type_str}",
            input_payload=input_payload,
            output_payload=output_payload,
            status=StepStatus.SUCCESS,
            error_message=span.get("error") or span.get("errorMessage"),
            latency_ms=latency_ms,
            tokens=tokens,
            metadata=span.get("metadata") or {},
        )

        if step.error_message:
            step.status = StepStatus.ERROR

        steps_list.append(step)

        # Recurse children
        children = span.get("spans") or span.get("children") or span.get("nodes") or []
        for child in children:
            cls._parse_span(child, span_id, steps_list)
