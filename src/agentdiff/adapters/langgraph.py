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

from agentdiff.adapters.base import BaseAdapter
from agentdiff.models.step import StepStatus, StepType, TokenUsage, TraceStep
from agentdiff.models.trace import AgentTrace

_WASTED_STATUS = {"error": StepStatus.ERROR, "retry": StepStatus.RETRY}


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


def _message_kind(msg: Any) -> tuple[str, dict[str, Any]]:
    """Returns ``(kind, payload)`` for any of the three message shapes.

    kind is one of ``human`` | ``ai`` | ``tool`` | ``system`` | ``unknown``.
    """
    if not isinstance(msg, dict):
        return "unknown", {}

    # Shape 1: message_to_dict dump — {"type": "ai", "data": {...}}
    if isinstance(msg.get("data"), dict) and msg.get("type"):
        return str(msg["type"]).lower(), msg["data"]

    kwargs = msg.get("kwargs") if isinstance(msg.get("kwargs"), dict) else None

    # Shape 2: LC constructor dump — {"lc": 1, "id": [.., "AIMessage"], "kwargs": ..}
    if kwargs is not None:
        ident = msg.get("id")
        tail = ident[-1] if isinstance(ident, list) and ident else ""
        if "AIMessage" in str(tail):
            return "ai", kwargs
        if "HumanMessage" in str(tail):
            return "human", kwargs
        if "ToolMessage" in str(tail):
            return "tool", kwargs
        if "SystemMessage" in str(tail):
            return "system", kwargs

    # Shape 3: plain role dicts
    role = msg.get("role")
    if role in ("user", "human"):
        return "human", msg
    if role == "assistant" or role == "ai":
        return "ai", msg
    if role == "tool":
        return "tool", msg
    if role == "system":
        return "system", msg

    # Fallbacks for partial shapes (e.g. type field without data wrapper)
    t = msg.get("type")
    if t in ("ai", "human", "tool", "system"):
        return str(t), msg
    return "unknown", {}


def _tool_calls(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Extracts normalized tool calls from an AI-message payload."""
    calls = payload.get("tool_calls")
    out = []
    if isinstance(calls, list):
        for call in calls:
            if not isinstance(call, dict):
                continue
            name = call.get("name") or call.get("function", {}).get("name")
            args = call.get("args")
            if args is None and isinstance(call.get("function"), dict):
                raw_args = call["function"].get("arguments")
                try:
                    import json

                    args = json.loads(raw_args) if isinstance(raw_args, str) else None
                except Exception:
                    args = None
            call_id = call.get("id") or call.get("tool_call_id")
            if name:
                out.append({"name": str(name), "args": args or {}, "id": call_id})
    return out


def _usage(payload: dict[str, Any]) -> TokenUsage:
    """Best-effort token extraction across known metadata layouts."""
    usage = payload.get("usage_metadata")
    if isinstance(usage, dict):
        prompt = usage.get("input_tokens") or 0
        completion = usage.get("output_tokens") or 0
        total = usage.get("total_tokens") or (prompt + completion)
        return TokenUsage(
            prompt_tokens=int(prompt),
            completion_tokens=int(completion),
            total_tokens=int(total),
        )
    response_meta = payload.get("response_metadata")
    if isinstance(response_meta, dict):
        tu = response_meta.get("token_usage")
        if isinstance(tu, dict):
            prompt = int(tu.get("prompt_tokens") or 0)
            completion = int(tu.get("completion_tokens") or 0)
            return TokenUsage(
                prompt_tokens=prompt,
                completion_tokens=completion,
                total_tokens=int(tu.get("total_tokens") or (prompt + completion)),
            )
    additional = payload.get("additional_kwargs")
    if isinstance(additional, dict):
        tu = additional.get("token_usage")
        if isinstance(tu, dict):
            prompt = int(tu.get("prompt_tokens") or 0)
            completion = int(tu.get("completion_tokens") or 0)
            return TokenUsage(
                prompt_tokens=prompt,
                completion_tokens=completion,
                total_tokens=int(tu.get("total_tokens") or (prompt + completion)),
            )
    return TokenUsage()


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
        first_kind = _message_kind(messages[0])[0]
        if first_kind in ("human", "ai", "tool", "system"):
            # Distinguish from arbitrary chat logs: require at least one
            # AI message somewhere carrying tool calls or usage metadata.
            for msg in messages:
                kind, payload = _message_kind(msg)
                if kind == "ai" and (
                    _tool_calls(payload)
                    or isinstance(payload.get("usage_metadata"), dict)
                    or isinstance(
                        (payload.get("response_metadata") or {}).get("token_usage"),
                        dict,
                    )
                ):
                    return True
            return len(messages) > 1 and any(
                _message_kind(m)[0] == "tool" for m in messages
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

        steps: list[TraceStep] = []
        task_input: dict[str, Any] = {}
        pending_calls: dict[str, str] = {}  # tool_call_id -> tool name
        seen_step_ids: set[str] = set()

        def unique_id(raw: str | None, idx: int) -> str:
            """Stable step id that never collides, even on duplicated state."""
            candidate = raw or f"lg_step_{idx}"
            if candidate not in seen_step_ids:
                seen_step_ids.add(candidate)
                return candidate
            n = 2
            while f"{candidate}#{n}" in seen_step_ids:
                n += 1
            final = f"{candidate}#{n}"
            seen_step_ids.add(final)
            return final

        def add_step(
            name: str,
            step_type: StepType,
            payload_in: dict[str, Any],
            payload_out: dict[str, Any],
            status: StepStatus = StepStatus.SUCCESS,
            error_message: str | None = None,
            tokens: TokenUsage | None = None,
            call_id: str | None = None,
        ) -> None:
            idx = len(steps)
            steps.append(
                TraceStep(
                    step_id=unique_id(call_id, idx),
                    parent_id=None,
                    step_index=idx,
                    step_type=step_type,
                    name=name,
                    input_payload=payload_in,
                    output_payload=payload_out,
                    status=status,
                    error_message=error_message,
                    latency_ms=0.0,
                    tokens=tokens or TokenUsage(),
                    metadata={},
                )
            )

        for msg in messages:
            kind, payload = _message_kind(msg)

            if kind == "human":
                if not task_input:
                    content = payload.get("content")
                    task_input = {"input": content} if content else {}
                continue
            if kind == "system":
                continue

            if kind == "ai":
                tokens = _usage(payload)
                calls = _tool_calls(payload)
                content = payload.get("content")
                if calls:
                    for call in calls:
                        if call["id"]:
                            pending_calls[call["id"]] = call["name"]
                        add_step(
                            name=call["name"],
                            step_type=StepType.ROUTING,
                            payload_in={"arguments": call["args"]},
                            payload_out={"decision": call["name"]},
                            tokens=tokens,
                            # Role-scoped ids keep decision/result pairs
                            # traceable to their shared tool_call_id without
                            # colliding with each other.
                            call_id=f"{call['id']}#decision" if call["id"] else None,
                        )
                elif content:
                    add_step(
                        name="response",
                        step_type=StepType.LLM_CALL,
                        payload_in={"prompt": ""},
                        payload_out={"result": content},
                        tokens=tokens,
                    )
                continue

            if kind == "tool":
                call_id = payload.get("tool_call_id")
                name = payload.get("name") or pending_calls.get(
                    call_id or "", "tool_response"
                )
                status_value = payload.get("status")
                status = _WASTED_STATUS.get(
                    str(status_value).lower(), StepStatus.SUCCESS
                )
                content = payload.get("content")
                add_step(
                    name=str(name),
                    step_type=StepType.TOOL_CALL,
                    payload_in={"tool_call_id": call_id} if call_id else {},
                    payload_out={"result": content},
                    status=status,
                    error_message=(
                        content if status is StepStatus.ERROR and content else None
                    ),
                    # Role-scoped suffix keeps decision/result pairs traceable
                    # to their shared tool_call_id without colliding.
                    call_id=f"{call_id}#result" if call_id else None,
                )
                continue

            # unknown shapes are ignored rather than fatal: checkpoints carry
            # non-message channel values we deliberately skip.

        if not steps:
            raise ValueError("No AI/tool steps found in LangGraph messages")

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
            task_input=task_input,
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
