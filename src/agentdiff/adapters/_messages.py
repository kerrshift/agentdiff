"""Shared role-message parsing used by direct framework adapters (A5).

LangGraph states and CrewAI task logs both reduce to OpenAI-style role
messages - system/user/human, assistant/ai with ``tool_calls``, and tool
results - serialized in one of several shapes. This module owns that
interpretation once so every direct-ingestion adapter maps identically:

- ``message_kind``    -> canonical role for any known message shape
- ``tool_calls_of``   -> normalized [{name, args, id}] from an AI payload
- ``usage_of``        -> best-effort TokenUsage across metadata layouts
- ``RoleStepBuilder`` -> accumulates TraceSteps with collision-safe ids

Mapping contract (shared by all consumers):

- human/system messages -> task-input context / skipped, never steps
- assistant tool calls  -> one ROUTING step per call, named after the tool
- matching tool result  -> one TOOL_CALL step, status honored when present
- final assistant text  -> one LLM_CALL step named ``response``
"""

from agentdiff.models.step import StepStatus, StepType, TokenUsage, TraceStep

WASTED_STATUS = {
    "error": StepStatus.ERROR,
    "retry": StepStatus.RETRY,
    "abandoned": StepStatus.ABANDONED,
}


def message_kind(msg):
    """Returns ``(kind, payload)`` for any known message shape.

    kind is one of ``human`` | ``ai`` | ``tool`` | ``system`` | ``unknown``;
    payload is the dict carrying content/tool_calls/metadata fields.
    """
    if not isinstance(msg, dict):
        return "unknown", {}

    # Shape 1: message_to_dict dump - {"type": "ai", "data": {...}}
    if isinstance(msg.get("data"), dict) and msg.get("type"):
        return str(msg["type"]).lower(), msg["data"]

    kwargs = msg.get("kwargs") if isinstance(msg.get("kwargs"), dict) else None

    # Shape 2: LC constructor dump - {"lc": 1, "id": [.., "AIMessage"], ...}
    if kwargs is not None:
        ident = msg.get("id")
        tail = ident[-1] if isinstance(ident, list) and ident else ""
        tail = str(tail)
        if "AIMessage" in tail:
            return "ai", kwargs
        if "HumanMessage" in tail:
            return "human", kwargs
        if "ToolMessage" in tail:
            return "tool", kwargs
        if "SystemMessage" in tail:
            return "system", kwargs

    # Shape 3: plain role dicts
    role = msg.get("role")
    if role in ("user", "human"):
        return "human", msg
    if role in ("assistant", "ai"):
        return "ai", msg
    if role == "tool":
        return "tool", msg
    if role == "system":
        return "system", msg

    # Fallback for partial shapes (e.g. type field without data wrapper)
    t = msg.get("type")
    if t in ("ai", "human", "tool", "system"):
        return str(t), msg
    return "unknown", {}


def tool_calls_of(payload):
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


def usage_of(payload):
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
    for holder in ("response_metadata", "additional_kwargs"):
        meta = payload.get(holder)
        if isinstance(meta, dict):
            tu = meta.get("token_usage")
            if isinstance(tu, dict):
                prompt = int(tu.get("prompt_tokens") or 0)
                completion = int(tu.get("completion_tokens") or 0)
                return TokenUsage(
                    prompt_tokens=prompt,
                    completion_tokens=completion,
                    total_tokens=int(tu.get("total_tokens") or (prompt + completion)),
                )
    return TokenUsage()


class RoleStepBuilder:
    """Accumulates canonical steps from a role-message stream.

    Ids are collision-safe by construction: explicit call ids get role-scoped
    suffixes (``<id>#decision`` / ``<id>#result``), anything else falls back to
    sequential ids, and duplicates are disambiguated deterministically.
    """

    def __init__(self):
        self.steps = []
        self.task_input = {}
        self.pending_calls = {}  # tool_call_id -> tool name
        self._seen_ids = set()

    def _unique(self, raw, idx):
        candidate = raw or f"role_step_{idx}"
        if candidate not in self._seen_ids:
            self._seen_ids.add(candidate)
            return candidate
        n = 2
        while f"{candidate}#{n}" in self._seen_ids:
            n += 1
        final = f"{candidate}#{n}"
        self._seen_ids.add(final)
        return final

    def add_step(
        self,
        name,
        step_type,
        payload_in,
        payload_out,
        status=StepStatus.SUCCESS,
        error_message=None,
        tokens=None,
        call_id=None,
    ):
        idx = len(self.steps)
        self.steps.append(
            TraceStep(
                step_id=self._unique(call_id, idx),
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

    def feed(self, message, *, task_prefix=""):
        """Consumes one message dict into the builder.

        Returns ``"step"`` when a step was appended, ``"input"`` when the
        message was absorbed as task input, ``"skip"`` otherwise.
        """
        kind, payload = message_kind(message)

        if kind == "human":
            content = payload.get("content")
            if not self.task_input and content:
                self.task_input = {"input": content}
            return "input"
        if kind == "system":
            return "skip"

        prefix = f"{task_prefix}/" if task_prefix else ""

        if kind == "ai":
            tokens = usage_of(payload)
            calls = tool_calls_of(payload)
            content = payload.get("content")
            if calls:
                for call in calls:
                    if call["id"]:
                        self.pending_calls[call["id"]] = call["name"]
                    self.add_step(
                        name=f"{prefix}{call['name']}",
                        step_type=StepType.ROUTING,
                        payload_in={"arguments": call["args"]},
                        payload_out={"decision": call["name"]},
                        tokens=tokens,
                        call_id=f"{call['id']}#decision" if call["id"] else None,
                    )
                return "step"
            if content:
                self.add_step(
                    name=f"{prefix}response",
                    step_type=StepType.LLM_CALL,
                    payload_in={"prompt": ""},
                    payload_out={"result": content},
                    tokens=tokens,
                )
                return "step"
            return "skip"

        if kind == "tool":
            call_id = payload.get("tool_call_id")
            name = payload.get("name") or self.pending_calls.get(
                call_id or "", "tool_response"
            )
            status = WASTED_STATUS.get(
                str(payload.get("status")).lower(), StepStatus.SUCCESS
            )
            content = payload.get("content")
            self.add_step(
                name=f"{prefix}{name}",
                step_type=StepType.TOOL_CALL,
                payload_in={"tool_call_id": call_id} if call_id else {},
                payload_out={"result": content},
                status=status,
                error_message=(
                    content if status is StepStatus.ERROR and content else None
                ),
                call_id=f"{call_id}#result" if call_id else None,
            )
            return "step"

        return "skip"

    @property
    def last_step_name(self):
        return self.steps[-1].name if self.steps else None
