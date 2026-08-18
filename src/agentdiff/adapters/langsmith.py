import json
from datetime import datetime
from typing import Any

from agentdiff.adapters.base import BaseAdapter
from agentdiff.models.step import StepStatus, StepType, TokenUsage, TraceStep
from agentdiff.models.trace import AgentTrace


class LangSmithAdapter(BaseAdapter):
    """Parses a LangSmith run-tree into a canonical AgentTrace.

    LangSmith exports traces as nested ``run`` objects (each with ``run_type``,
    ``name``, ``inputs``/``outputs``, ``start_time``/``end_time``,
    ``parent_run_id``, ``error``, and nested ``child_runs``). This adapter
    flattens the tree into ordered steps and preserves the parent hierarchy.
    """

    @classmethod
    def from_dict(cls, data: dict[str, Any] | list[Any]) -> AgentTrace:
        """Parses a LangSmith run (or list of runs) into an AgentTrace."""
        if isinstance(data, list):
            if not data:
                raise ValueError("LangSmith run list is empty")
            data = data[0]
        if not isinstance(data, dict):
            raise ValueError("LangSmith trace data must be an object")

        runs: list[TraceStep] = []
        cls._collect_runs(data, None, runs)

        if not runs:
            raise ValueError("No LangSmith runs found to parse")

        # Root run -> task input / final output / agent name
        root = runs[0]
        task_input = root.input_payload or {}
        final_output = root.output_payload or {}
        agent_name = root.name or "langsmith_agent"
        trace_id = str(
            data.get("trace_id")
            or data.get("session_id")
            or data.get("id")
            or "langsmith_trace"
        )

        total_latency = sum(r.latency_ms for r in runs if not r.parent_id)
        total_tokens = TokenUsage(
            prompt_tokens=sum(r.tokens.prompt_tokens for r in runs),
            completion_tokens=sum(r.tokens.completion_tokens for r in runs),
            total_tokens=sum(r.tokens.total_tokens for r in runs),
            estimated_cost_usd=sum(r.tokens.estimated_cost_usd for r in runs),
        )

        return AgentTrace(
            trace_id=trace_id,
            agent_name=agent_name,
            task_input=task_input,
            final_output=final_output,
            steps=runs,
            total_latency_ms=total_latency,
            total_tokens=total_tokens,
            metadata=data.get("extra") or data.get("metadata") or {},
        )

    @classmethod
    def _collect_runs(
        cls, run: dict[str, Any], parent_id: str | None, acc: list[TraceStep]
    ) -> None:
        """Recursively flattens a LangSmith run tree into ordered steps."""
        if not isinstance(run, dict):
            raise ValueError("LangSmith run must be an object")

        step = cls._run_to_step(run, parent_id)
        acc.append(step)

        children = run.get("child_runs")
        if not isinstance(children, list):
            children = []
        for child in children:
            cls._collect_runs(child, step.step_id, acc)

    @classmethod
    def _run_to_step(cls, run: dict[str, Any], parent_id: str | None) -> TraceStep:
        run_type = str(run.get("run_type", "")).lower()
        if "tool" in run_type or "retriever" in run_type:
            step_type = StepType.TOOL_CALL
        elif "llm" in run_type or "prompt" in run_type or "embedding" in run_type:
            step_type = StepType.LLM_CALL
        elif "agent" in run_type or "chain" in run_type:
            step_type = StepType.ROUTING
        else:
            step_type = StepType.THOUGHT

        name = run.get("name") or run_type or "step"

        # Token usage: LangSmith exposes it under usage_metadata or extra.metadata.usage
        usage = run.get("usage_metadata")
        if not isinstance(usage, dict):
            extra = run.get("extra")
            usage = (
                extra.get("metadata", {}).get("usage", {})
                if isinstance(extra, dict)
                else {}
            )
            if not isinstance(usage, dict):
                usage = {}
        prompt_tokens = cls._as_int(
            usage.get("input_tokens") or usage.get("prompt_tokens")
        )
        completion_tokens = cls._as_int(
            usage.get("output_tokens") or usage.get("completion_tokens")
        )
        total_tokens = cls._as_int(usage.get("total_tokens"))
        if total_tokens == 0:
            total_tokens = prompt_tokens + completion_tokens
        cost = cls._as_float(usage.get("total_cost"))

        tokens = TokenUsage(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=cost,
        )

        latency_ms = 0.0
        start = run.get("start_time")
        end = run.get("end_time")
        if start and end:
            try:
                t1 = datetime.fromisoformat(str(start).replace("Z", "+00:00"))
                t2 = datetime.fromisoformat(str(end).replace("Z", "+00:00"))
                latency_ms = max(0.0, (t2 - t1).total_seconds() * 1000.0)
            except Exception:
                pass

        error = run.get("error")
        status = StepStatus.ERROR if error else StepStatus.SUCCESS

        return TraceStep(
            step_id=str(run.get("id") or run.get("run_id") or name),
            parent_id=parent_id,
            step_index=0,  # fixed up by make_trace-like ordering in loader
            step_type=step_type,
            name=name,
            input_payload=cls._to_payload(run.get("inputs")),
            output_payload=cls._to_payload(run.get("outputs")),
            status=status,
            error_message=error if status == StepStatus.ERROR else None,
            latency_ms=latency_ms,
            tokens=tokens,
            metadata=run.get("extra") or run.get("metadata") or {},
        )

    @classmethod
    def _to_payload(cls, val: Any) -> dict[str, Any]:
        """Coerces inputs/outputs into a dict payload."""
        if val is None:
            return {}
        if isinstance(val, dict):
            return val
        if isinstance(val, str):
            try:
                parsed = json.loads(val)
                if isinstance(parsed, dict):
                    return parsed
                return {"value": parsed}
            except Exception:
                return {"value": val}
        return {"value": val}
