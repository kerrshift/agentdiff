"""A5 — LangGraph direct ingestion: native state artifacts, no OTel required.

Ingests the artifacts a LangGraph user actually has on disk:

- **Message lists** — ``result["messages"]`` serialized with
  ``langchain_core.messages.message_to_dict`` (``{"type": ..., "data": ...}``)
  or LangChain constructor dumps (``{"lc": 1, "id": [..., "AIMessage"], ...}``),
  or plain OpenAI-style role dicts (``{"role": "assistant", "tool_calls": [...]}``).
- **State snapshots** — a state dict wrapping messages (``{"values": {"messages": [...]}}``).
- **Checkpoint dumps** — saver exports (``{"channel_values": {"messages": [...]}}``).

Mapping into canonical steps mirrors real graph execution:

- every ``tool_call`` on an AI message -> one ROUTING step named after the tool
- each matching tool result message   -> one TOOL_CALL step (status from the
  message's own ``status`` field when present)
- the final AI message (no tool calls) -> one LLM_CALL step named ``response``
- human/system messages               -> task input context, not steps

Token usage attached to AI steps comes from ``usage_metadata`` or the OpenAI-style
``response_metadata.token_usage``, whichever is present.
"""

from typing import Any

from agentdiff.adapters._messages import (
    RoleStepBuilder,
    message_kind,
    tool_calls_of,
)
from agentdiff.adapters.base import BaseAdapter
from agentdiff.models.step import StepType, TokenUsage
from agentdiff.models.trace import AgentTrace


def _unwrap_messages(data: dict[str, Any]) -> list[Any] | None:
    """Finds the message list inside supported wrapper shapes."""
    if isinstance(data.get("messages"), list):
        return data["messages"]
    channel_values = data.get("channel_values")
    if isinstance(channel_values, dict) and isinstance(
        channel_values.get("messages"), list
    ):
        return channel_values["messages"]
    values = data.get("values")
    if isinstance(values, dict) and isinstance(values.get("messages"), list):
        return values["messages"]
    return None


class LangGraphAdapter(BaseAdapter):
    """Converts native LangGraph state/checkpoint/message artifacts to AgentTrace."""

    @classmethod
    def detect(cls, data: dict[str, Any]) -> bool:
        """Auto-detection hook (opted in): conservative structural checks."""
        if _unwrap_messages(data) is None:
            return False
        messages = _unwrap_messages(data)
        if not messages:
            return False
        first_kind = message_kind(messages[0])[0]
        if first_kind in ("human", "ai", "tool", "system"):
            # Distinguish from arbitrary chat logs: require at least one
            # AI message somewhere carrying tool calls or usage metadata.
            for msg in messages:
                kind, payload = message_kind(msg)
                if kind == "ai" and (
                    tool_calls_of(payload)
                    or isinstance(payload.get("usage_metadata"), dict)
                    or isinstance(
                        (payload.get("response_metadata") or {}).get("token_usage"),
                        dict,
                    )
                ):
                    return True
            return len(messages) > 1 and any(
                message_kind(m)[0] == "tool" for m in messages
            )
        return False

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AgentTrace:
        """Parses a LangGraph state / checkpoint / message list into AgentTrace."""
        messages = _unwrap_messages(data)
        if not messages:
            raise ValueError(
                "No LangGraph messages found: expected 'messages', "
                "'channel_values.messages', or 'values.messages'"
            )

        builder = RoleStepBuilder()
        for msg in messages:
            builder.feed(msg)

        if not builder.steps:
            raise ValueError("No AI/tool steps found in LangGraph messages")

        steps = builder.steps
        total_prompt = sum(s.tokens.prompt_tokens for s in steps)
        total_completion = sum(s.tokens.completion_tokens for s in steps)
        total_all = sum(s.tokens.total_tokens for s in steps)

        final_output = {}
        for step in reversed(steps):
            if step.step_type is StepType.LLM_CALL:
                final_output = step.output_payload or {}
                break

        trace_id = str(data.get("id") or data.get("checkpoint_id") or "langgraph_state")

        return AgentTrace(
            trace_id=trace_id,
            agent_name=data.get("agent_name") or "langgraph_agent",
            task_input=builder.task_input,
            final_output=final_output,
            steps=steps,
            total_latency_ms=0.0,
            total_tokens=TokenUsage(
                prompt_tokens=total_prompt,
                completion_tokens=total_completion,
                total_tokens=total_all,
            ),
            metadata={},
        )
