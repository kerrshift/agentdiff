import json
from datetime import datetime
from typing import Any

from agentdiff.adapters.base import BaseAdapter
from agentdiff.models.step import StepStatus, StepType, TokenUsage, TraceStep
from agentdiff.models.trace import AgentTrace


class OpenInferenceAdapter(BaseAdapter):
    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AgentTrace:
        """Parses an OpenInference span or collection of spans into an AgentTrace."""
        spans = []
        if isinstance(data, dict):
            raw_spans = data.get("spans") or data.get("spans_list")
            if isinstance(raw_spans, list):
                spans = raw_spans
            else:
                spans = [data]
        elif isinstance(data, list):
            spans = data

        if not spans:
            raise ValueError("No spans found to parse")

        steps: list[TraceStep] = []
        for idx, span in enumerate(spans):
            if not isinstance(span, dict):
                raise ValueError(f"OpenInference span at index {idx} is not an object")
            context = span.get("context")
            if not isinstance(context, dict):
                context = {}
            span_id = context.get("span_id") or span.get("span_id") or f"span_{idx}"
            parent_id = span.get("parent_span_id") or span.get("parent_id")

            attrs = span.get("attributes")
            if not isinstance(attrs, dict):
                attrs = {}

            # Map OpenInference span kind to StepType
            span_kind = attrs.get("openinference.span.kind") or span.get("kind") or ""
            span_kind_str = str(span_kind).upper()

            if "TOOL" in span_kind_str or "RETRIEVER" in span_kind_str:
                step_type = StepType.TOOL_CALL
            elif "LLM" in span_kind_str:
                step_type = StepType.LLM_CALL
            elif "AGENT" in span_kind_str or "CHAIN" in span_kind_str:
                step_type = StepType.ROUTING
            else:
                step_type = StepType.THOUGHT

            # Parse input value
            input_val = (
                attrs.get("input.value")
                or attrs.get("llm.input_messages")
                or span.get("input")
                or {}
            )
            input_payload = cls._to_payload_dict(input_val, "input")

            # Parse output value
            output_val = (
                attrs.get("output.value")
                or attrs.get("llm.output_messages")
                or span.get("output")
                or {}
            )
            output_payload = cls._to_payload_dict(output_val, "output")

            # Tokens
            prompt_tokens = cls._as_int(
                attrs.get("llm.token_count.prompt") or attrs.get("prompt_tokens")
            )
            completion_tokens = cls._as_int(
                attrs.get("llm.token_count.completion")
                or attrs.get("completion_tokens")
            )
            total_tokens = cls._as_int(
                attrs.get("llm.token_count.total") or attrs.get("total_tokens")
            )
            if total_tokens == 0:
                total_tokens = prompt_tokens + completion_tokens
            cost = cls._as_float(attrs.get("llm.cost") or attrs.get("cost"))

            tokens = TokenUsage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                estimated_cost_usd=cost,
            )

            # Compute Latency
            latency_ms = 0.0
            start_time = span.get("start_time")
            end_time = span.get("end_time")
            if start_time and end_time:
                try:
                    if isinstance(start_time, (int, float)) and isinstance(
                        end_time, (int, float)
                    ):
                        latency_ms = (end_time - start_time) * 1000.0
                    else:
                        t1 = datetime.fromisoformat(
                            str(start_time).replace("Z", "+00:00")
                        )
                        t2 = datetime.fromisoformat(
                            str(end_time).replace("Z", "+00:00")
                        )
                        latency_ms = (t2 - t1).total_seconds() * 1000.0
                except Exception:
                    pass
            if latency_ms == 0.0:
                latency_ms = span.get("latency_ms") or 0.0

            # Status and error messages
            status_val = span.get("status")
            if not isinstance(status_val, dict):
                status_val = {}
            status_code = (
                status_val.get("status_code") or span.get("status_code") or "OK"
            )
            status_code_str = str(status_code).upper()

            status = StepStatus.SUCCESS
            error_message = None
            if "ERROR" in status_code_str or status_val.get("message"):
                status = StepStatus.ERROR
                error_message = status_val.get("message")

            step = TraceStep(
                step_id=span_id,
                parent_id=parent_id,
                step_index=idx,
                step_type=step_type,
                name=span.get("name")
                or attrs.get("openinference.span.name")
                or f"step_{idx}",
                input_payload=input_payload,
                output_payload=output_payload,
                status=status,
                error_message=error_message,
                latency_ms=latency_ms,
                tokens=tokens,
                metadata=attrs,
            )
            steps.append(step)

        steps.sort(key=lambda s: s.step_index)

        # Retrieve trace metadata
        trace_id = "openinference_trace"
        if spans:
            first_span = spans[0]
            trace_id = (
                first_span.get("context", {}).get("trace_id")
                or first_span.get("trace_id")
                or trace_id
            )

        # Task input / Final output from root span if available
        task_input = {}
        final_output = {}
        agent_name = "openinference_agent"

        root_spans = [s for s in steps if not s.parent_id]
        if root_spans:
            task_input = root_spans[0].input_payload
            final_output = root_spans[0].output_payload
            agent_name = root_spans[0].name
        elif steps:
            task_input = steps[0].input_payload
            final_output = steps[-1].output_payload

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
            metadata={},
        )

    @classmethod
    def _to_payload_dict(cls, val: Any, key_name: str) -> dict[str, Any]:
        """Ensures input/output values are returned as dictionary payloads."""
        if not val:
            return {}
        if isinstance(val, dict):
            return val
        if isinstance(val, list):
            return {f"{key_name}_list": val}
        if isinstance(val, str):
            try:
                parsed = json.loads(val)
                if isinstance(parsed, dict):
                    return parsed
                return {key_name: parsed}
            except Exception:
                return {key_name: val}
        return {key_name: val}
