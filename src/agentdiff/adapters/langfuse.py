from typing import Any

from agentdiff.adapters._iso import parse_iso_timestamp
from agentdiff.adapters.base import BaseAdapter
from agentdiff.models.step import StepStatus, StepType, TokenUsage, TraceStep
from agentdiff.models.trace import AgentTrace


class LangfuseAdapter(BaseAdapter):
    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AgentTrace:
        """Parses exported Langfuse trace JSON into a canonical AgentTrace."""
        if not isinstance(data, dict):
            raise ValueError("Langfuse trace data must be an object")
        trace_id = data.get("id") or "langfuse_trace"
        agent_name = data.get("name") or "langfuse_agent"

        task_input = data.get("input")
        if not isinstance(task_input, dict):
            task_input = {"input": task_input}

        final_output = data.get("output")
        if not isinstance(final_output, dict):
            final_output = {"output": final_output}

        observations = data.get("observations")
        if not isinstance(observations, list):
            observations = []
        steps: list[TraceStep] = []

        for idx, obs in enumerate(observations):
            if not isinstance(obs, dict):
                raise ValueError(
                    f"Langfuse observation at index {idx} is not an object"
                )
            obs_id = obs.get("id") or f"obs_{idx}"
            parent_id = obs.get("parentObservationId")

            # Map Langfuse type to StepType
            obs_type = str(obs.get("type", "")).upper()
            if obs_type == "GENERATION":
                step_type = StepType.LLM_CALL
            elif obs_type == "SPAN":
                name_lower = str(obs.get("name", "")).lower()
                if "tool" in name_lower or "call" in name_lower:
                    step_type = StepType.TOOL_CALL
                else:
                    step_type = StepType.ROUTING
            else:
                step_type = StepType.THOUGHT

            input_payload = obs.get("input")
            if not isinstance(input_payload, dict):
                input_payload = {"input": input_payload}

            output_payload = obs.get("output")
            if not isinstance(output_payload, dict):
                output_payload = {"output": output_payload}

            # Parse Usage
            usage = obs.get("usage") or {}
            if not isinstance(usage, dict):
                usage = {}
            prompt_tokens = cls._as_int(
                usage.get("promptTokens") or usage.get("input_tokens")
            )
            completion_tokens = cls._as_int(
                usage.get("completionTokens") or usage.get("output_tokens")
            )
            total_tokens = cls._as_int(
                usage.get("totalTokens") or usage.get("total_tokens")
            )
            if total_tokens == 0:
                total_tokens = prompt_tokens + completion_tokens
            cost = cls._as_float(usage.get("cost") or obs.get("cost"))

            tokens = TokenUsage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                estimated_cost_usd=cost,
            )

            # Latency
            latency_ms = 0.0
            start_str = obs.get("startTime")
            end_str = obs.get("endTime")
            if start_str and end_str:
                t1 = parse_iso_timestamp(start_str)
                t2 = parse_iso_timestamp(end_str)
                if t1 is not None and t2 is not None:
                    latency_ms = max(0.0, (t2 - t1).total_seconds() * 1000.0)
            if latency_ms == 0.0:
                latency_ms = (
                    cls._as_float(obs.get("latency_ms"))
                    or cls._as_float(obs.get("duration") or 0.0) * 1000.0
                )

            # Error Levels
            level = str(obs.get("level", "")).upper()
            status = StepStatus.SUCCESS
            error_message = None
            if "ERROR" in level or obs.get("statusMessage"):
                status = StepStatus.ERROR
                error_message = obs.get("statusMessage")

            step = TraceStep(
                step_id=obs_id,
                parent_id=parent_id,
                step_index=idx,
                step_type=step_type,
                name=obs.get("name") or f"obs_{obs_type.lower()}",
                input_payload=input_payload,
                output_payload=output_payload,
                status=status,
                error_message=error_message,
                latency_ms=latency_ms,
                tokens=tokens,
                metadata=obs.get("metadata") or {},
            )
            steps.append(step)

        steps.sort(key=lambda s: s.step_index)

        # Total latency of trace (in seconds, convert to ms)
        total_latency_ms = cls._as_float(data.get("duration") or 0.0) * 1000.0
        if total_latency_ms == 0.0:
            root_spans = [s for s in steps if not s.parent_id]
            total_latency_ms = (
                sum(s.latency_ms for s in root_spans)
                if root_spans
                else sum(s.latency_ms for s in steps)
            )

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
