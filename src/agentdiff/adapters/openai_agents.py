"""Adapter for the OpenAI Agents SDK's built-in tracing.

The OpenAI Agents SDK records every run as a ``trace`` containing a flat list of
``spans``. Each span exports as::

    {
      "object": "trace.span",
      "id": span_id,
      "trace_id": trace_id,
      "parent_id": parent_id,
      "started_at": <ISO>,
      "ended_at": <ISO>,
      "span_data": {"type": "...", ...},
      "error": {...} | None,
    }

``span_data.type`` identifies the operation:
``agent`` / ``guardrail`` / ``handoff`` → routing,
``generation`` / ``response`` → LLM call,
``function`` → tool call,
``custom`` → thought.

The ``task`` and ``turn`` spans are internal bookkeeping wrappers (around the
whole run and each model turn) and are skipped so the normalized trace reflects
the meaningful agent activity. See
https://openai.github.io/openai-agents-python/ref/tracing/
"""

from __future__ import annotations

import json
from typing import Any

from agentdiff.adapters._iso import parse_iso_timestamp
from agentdiff.adapters.base import BaseAdapter
from agentdiff.models.step import StepStatus, StepType, TokenUsage, TraceStep
from agentdiff.models.trace import AgentTrace

_SKIPPED_TYPES = {"task", "turn"}

_TYPE_MAP = {
    "agent": StepType.ROUTING,
    "guardrail": StepType.ROUTING,
    "handoff": StepType.ROUTING,
    "generation": StepType.LLM_CALL,
    "response": StepType.LLM_CALL,
    "function": StepType.TOOL_CALL,
    "custom": StepType.THOUGHT,
}


class OpenAIAgentsAdapter(BaseAdapter):
    """Parses an OpenAI Agents SDK trace export into a canonical AgentTrace."""

    @classmethod
    def from_dict(cls, data: dict[str, Any] | list[Any]) -> AgentTrace:
        """Parses a trace export (dict) or span list into an AgentTrace."""
        spans = cls._extract_spans(data)
        if not spans:
            raise ValueError("No OpenAI Agents SDK spans found to parse")

        steps: list[TraceStep] = []
        for span in spans:
            step = cls._span_to_step(span)
            if step is None:
                continue
            steps.append(step)

        if not steps:
            raise ValueError("No parseable OpenAI Agents SDK spans found")

        # Order by start time for a deterministic, chronological trajectory.
        steps.sort(key=lambda s: s.metadata.get("_started_at", ""))

        for i, step in enumerate(steps):
            step.step_index = i

        # A span-level sort key is carried on metadata (not part of the schema).
        for step in steps:
            step.metadata.pop("_started_at", None)

        root = next((s for s in steps if s.parent_id is None), steps[0])
        trace_id = cls._trace_id(data) or str(root.step_id)
        workflow = cls._workflow_name(data)
        agent_name = workflow or root.name or "openai_agents_agent"

        task_input = cls._task_input(spans, workflow)
        final_output = steps[-1].output_payload or {}

        total_latency = root.latency_ms
        total_tokens = TokenUsage(
            prompt_tokens=sum(s.tokens.prompt_tokens for s in steps),
            completion_tokens=sum(s.tokens.completion_tokens for s in steps),
            total_tokens=sum(s.tokens.total_tokens for s in steps),
            estimated_cost_usd=sum(s.tokens.estimated_cost_usd for s in steps),
        )

        return AgentTrace(
            trace_id=trace_id,
            agent_name=agent_name,
            task_input=task_input,
            final_output=final_output,
            steps=steps,
            total_latency_ms=total_latency,
            total_tokens=total_tokens,
            metadata=cls._trace_metadata(data),
        )

    @classmethod
    def _extract_spans(cls, data: Any) -> list[dict[str, Any]]:
        """Pulls the flat span list out of a trace export."""
        if isinstance(data, list):
            return [s for s in data if isinstance(s, dict)]
        if not isinstance(data, dict):
            raise ValueError("OpenAI Agents SDK trace data must be an object")
        spans = data.get("spans")
        if isinstance(spans, list):
            return [s for s in spans if isinstance(s, dict)]
        # A bare span payload (single span object).
        if isinstance(data.get("span_data"), dict):
            return [data]
        return []

    @classmethod
    def _span_to_step(cls, span: dict[str, Any]) -> TraceStep | None:
        span_data = span.get("span_data")
        if not isinstance(span_data, dict):
            span_data = {}
        stype = str(span_data.get("type") or span.get("type") or "").lower()
        sname = str(span_data.get("name") or "").lower()
        # Real OpenAI Agents traces mark the task/turn bookkeeping spans as
        # type="custom" with name="task"/"turn"; older/fixture shapes used a
        # dedicated type. Skip both so they don't surface as steps.
        if stype in _SKIPPED_TYPES or (stype == "custom" and sname in _SKIPPED_TYPES):
            return None

        step_type = _TYPE_MAP.get(stype, StepType.THOUGHT)

        if stype == "generation":
            name = str(span_data.get("model") or "llm_generation")
        elif stype == "function":
            name = str(span_data.get("name") or "tool_call")
        elif stype == "agent":
            name = str(span_data.get("name") or "agent")
        else:
            name = str(span_data.get("name") or stype or "span")

        error = span.get("error")
        status = StepStatus.ERROR if error else StepStatus.SUCCESS
        error_message = None
        if error:
            if isinstance(error, dict):
                error_message = str(error.get("message") or error)
            else:
                error_message = str(error)

        input_payload = cls._payload(span_data.get("input"), fallback=span_data)
        output_payload = cls._payload(span_data.get("output"))
        if stype == "response" and not output_payload:
            output_payload = {"response_id": span_data.get("response_id")}

        tokens = cls._tokens(span_data.get("usage"))

        start = span.get("started_at")
        end = span.get("ended_at")
        latency_ms = cls._latency_ms(start, end)

        metadata = dict(span.get("metadata") or {})
        metadata["_started_at"] = str(start or "")

        return TraceStep(
            step_id=str(span.get("id") or span.get("span_id") or name),
            parent_id=str(span["parent_id"]) if span.get("parent_id") else None,
            step_index=0,  # fixed up by chronological ordering below
            step_type=step_type,
            name=name,
            input_payload=input_payload,
            output_payload=output_payload,
            status=status,
            error_message=error_message,
            latency_ms=latency_ms,
            tokens=tokens,
            metadata=metadata,
        )

    @classmethod
    def _payload(cls, val: Any, fallback: Any = None) -> dict[str, Any]:
        """Coerces span input/output into a dict payload."""
        if val is None:
            if fallback:
                return {"value": fallback}
            return {}
        if isinstance(val, dict):
            return val
        if isinstance(val, list):
            return {"value": val}
        if isinstance(val, str):
            try:
                parsed = json.loads(val)
                if isinstance(parsed, dict):
                    return parsed
                return {"value": parsed}
            except Exception:
                return {"value": val}
        return {"value": val}

    @classmethod
    def _tokens(cls, usage: Any) -> TokenUsage:
        if not isinstance(usage, dict):
            return TokenUsage()
        prompt = cls._as_int(usage.get("input_tokens") or usage.get("prompt_tokens"))
        completion = cls._as_int(
            usage.get("output_tokens") or usage.get("completion_tokens")
        )
        total = cls._as_int(usage.get("total_tokens"))
        if total == 0:
            total = prompt + completion
        return TokenUsage(
            prompt_tokens=prompt,
            completion_tokens=completion,
            total_tokens=total,
            estimated_cost_usd=cls._as_float(usage.get("total_cost")),
        )

    @classmethod
    def _latency_ms(cls, start: Any, end: Any) -> float:
        if not start or not end:
            return 0.0
        t1 = parse_iso_timestamp(start)
        t2 = parse_iso_timestamp(end)
        if t1 is None or t2 is None:
            return 0.0
        return max(0.0, (t2 - t1).total_seconds() * 1000.0)

    @classmethod
    def _task_input(
        cls, spans: list[dict[str, Any]], workflow: str | None
    ) -> dict[str, Any]:
        # Prefer the first span that carried a real input payload.
        for span in spans:
            span_data = span.get("span_data") or {}
            if span_data.get("input"):
                return cls._payload(span_data.get("input"))
        if workflow:
            return {"workflow_name": workflow}
        return {}

    @classmethod
    def _trace_id(cls, data: Any) -> str | None:
        if isinstance(data, dict):
            return str(data.get("id") or data.get("trace_id") or "") or None
        return None

    @classmethod
    def _workflow_name(cls, data: Any) -> str | None:
        if isinstance(data, dict):
            return str(data.get("workflow_name") or data.get("name") or "") or None
        return None

    @classmethod
    def _trace_metadata(cls, data: Any) -> dict[str, Any]:
        if isinstance(data, dict) and isinstance(data.get("metadata"), dict):
            return data["metadata"]
        return {}
