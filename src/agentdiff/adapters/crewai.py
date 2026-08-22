"""A5 — CrewAI direct ingestion: kickoff output, no OTel required.

Ingests what a CrewAI crew hands back from ``crew.kickoff()`` — the
``CrewOutput`` object serialized with ``model_dump()`` (or an equivalent dict):

- ``tasks_output``: one entry per executed task, each carrying the full
  per-task ``messages`` conversation (system/user/assistant/tool roles) plus
  ``agent`` (role name), ``description`` and ``raw`` output.
- ``token_usage``: aggregate crew usage (prompt/completion/total tokens).

Mapping into canonical steps mirrors real crew execution:

- each task becomes a step group prefixed with its agent role
- assistant tool calls -> ROUTING steps; tool results -> TOOL_CALL steps
- the task's final answer -> an LLM_CALL ``response`` step
- aggregate ``token_usage`` populates trace totals

Also accepts simplified exports that only carry per-task outputs (no message
log): one LLM_CALL step per task is synthesized so structural diffs still work.
"""

from typing import Any

from agentdiff.adapters._messages import RoleStepBuilder
from agentdiff.adapters.base import BaseAdapter
from agentdiff.models.step import StepType, TokenUsage
from agentdiff.models.trace import AgentTrace


def _unwrap_tasks(data: dict[str, Any]) -> list[Any] | None:
    """Finds the task list inside supported wrapper shapes."""
    tasks = data.get("tasks_output")
    if isinstance(tasks, list):
        return tasks
    if isinstance(data.get("tasks"), list):
        return data["tasks"]
    return None


def _task_messages(task: Any) -> list[Any]:
    if isinstance(task, dict) and isinstance(task.get("messages"), list):
        return [m for m in task["messages"] if isinstance(m, dict)]
    return []


def _task_field(task: Any, key: str, default: str = "") -> str:
    if isinstance(task, dict):
        value = task.get(key)
        if value:
            return str(value)
    return default


def _aggregate_usage(data: dict[str, Any]) -> TokenUsage:
    usage = data.get("token_usage")
    if not isinstance(usage, dict):
        # Fall back to summing per-message usage across tasks.
        prompt = completion = 0
        for task in _unwrap_tasks(data) or []:
            for msg in _task_messages(task):
                kind_payload = msg.get("data") or msg.get("kwargs") or msg
                meta = (
                    kind_payload.get("usage_metadata")
                    if isinstance(kind_payload, dict)
                    else None
                )
                if isinstance(meta, dict):
                    prompt += int(meta.get("input_tokens") or 0)
                    completion += int(meta.get("output_tokens") or 0)
        total = prompt + completion
        return TokenUsage(
            prompt_tokens=prompt,
            completion_tokens=completion,
            total_tokens=total,
        )
    prompt = int(usage.get("prompt_tokens") or 0)
    completion = int(usage.get("completion_tokens") or 0)
    total = int(usage.get("total_tokens") or (prompt + completion))
    return TokenUsage(
        prompt_tokens=prompt,
        completion_tokens=completion,
        total_tokens=total,
    )


class CrewAIAdapter(BaseAdapter):
    """Converts CrewAI kickoff output / task exports into canonical traces."""

    @classmethod
    def detect(cls, data: dict[str, Any]) -> bool:
        """Auto-detection hook (opted in): CrewOutput-shaped dicts only."""
        tasks = _unwrap_tasks(data)
        if not tasks:
            return False
        first = tasks[0]
        if not isinstance(first, dict):
            return False
        # Distinguish from arbitrary task lists: CrewAI task entries carry
        # either a message log with assistant/tool roles or raw+agent fields.
        has_log = any(
            isinstance(m, dict) and m.get("role") in ("assistant", "tool", "user")
            for m in _task_messages(first)
        )
        has_crew_fields = bool(first.get("raw")) and bool(first.get("agent"))
        return has_log or has_crew_fields

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AgentTrace:
        """Parses CrewAI kickoff output into an :class:`AgentTrace`."""
        tasks = _unwrap_tasks(data)
        if not tasks:
            raise ValueError(
                "No CrewAI tasks found: expected 'tasks_output' or 'tasks'"
            )

        builder = RoleStepBuilder()
        final_raw = ""

        for idx, task in enumerate(tasks):
            if not isinstance(task, dict):
                continue
            role_prefix = _task_field(task, "agent")
            messages = _task_messages(task)

            if messages:
                for msg in messages:
                    builder.feed(msg, task_prefix=role_prefix)
            else:
                # Simplified export without logs: one step per task.
                description = _task_field(task, "description") or f"task_{idx + 1}"
                raw = _task_field(task, "raw")
                if not raw and not _task_field(task, "agent"):
                    continue  # not an executable task entry
                builder.add_step(
                    name=f"{role_prefix}/{description}" if role_prefix else description,
                    step_type=StepType.LLM_CALL,
                    payload_in={"description": description},
                    payload_out={"result": raw},
                )

            raw = _task_field(task, "raw")
            if raw:
                final_raw = raw

        if not builder.steps:
            raise ValueError("No executable steps found in CrewAI output")

        steps = builder.steps
        totals = _aggregate_usage(data)

        return AgentTrace(
            trace_id=str(data.get("id") or "crewai_run"),
            agent_name=data.get("name") or "crewai_crew",
            task_input=builder.task_input,
            final_output={"result": final_raw} if final_raw else {},
            steps=steps,
            total_latency_ms=0.0,
            total_tokens=totals,
            metadata={},
        )
