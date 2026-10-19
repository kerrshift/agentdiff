"""In-memory model of a coding-agent session, independent of the source tool."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from agentdiff.models.step import StepStatus, StepType, TokenUsage, TraceStep
from agentdiff.models.trace import AgentTrace
from agentdiff.sessions.pricing import FAST_MODE_MULTIPLIER, price_for


@dataclass
class ModelRequest:
    """One billed model request (a turn of the agent loop)."""

    request_id: str
    model: str | None
    timestamp: datetime | None
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_5m_tokens: int = 0
    cache_write_1h_tokens: int = 0
    fast: bool = False
    tool_call_ids: list[str] = field(default_factory=list)

    @property
    def context_tokens(self) -> int:
        """Tokens the model had to read this turn (the conversation size)."""
        return (
            self.input_tokens
            + self.cache_read_tokens
            + self.cache_write_5m_tokens
            + self.cache_write_1h_tokens
        )

    def cost_breakdown(self) -> dict[str, float]:
        price = price_for(self.model)
        if price is None:
            return {"input": 0.0, "output": 0.0, "cache_read": 0.0, "cache_write": 0.0}
        mult = FAST_MODE_MULTIPLIER if self.fast else 1.0
        in_mult = out_mult = mult
        if (
            price.long_context_tokens
            and self.context_tokens > price.long_context_tokens
        ):
            in_mult *= price.long_input_mult
            out_mult *= price.long_output_mult
        per = 1_000_000
        return {
            "input": self.input_tokens * price.input * in_mult / per,
            "output": self.output_tokens * price.output * out_mult / per,
            "cache_read": self.cache_read_tokens * price.cache_read * in_mult / per,
            "cache_write": (
                self.cache_write_5m_tokens * price.cache_write_5m
                + self.cache_write_1h_tokens * price.cache_write_1h
            )
            * in_mult
            / per,
        }

    @property
    def cost(self) -> float:
        return sum(self.cost_breakdown().values())

    @property
    def priced(self) -> bool:
        return price_for(self.model) is not None


@dataclass
class ToolCall:
    """A tool invocation and (when logged) its result."""

    call_id: str
    name: str
    input: dict[str, Any]
    request_id: str
    timestamp: datetime | None
    is_error: bool = False
    result_hash: str | None = None
    result_chars: int = 0
    has_result: bool = False


@dataclass
class Session:
    """A coding-agent session, with any subagent sessions nested inside it."""

    session_id: str
    source: str
    path: str
    project: str
    title: str | None = None
    git_branch: str | None = None
    requests: list[ModelRequest] = field(default_factory=list)
    tool_calls: list[ToolCall] = field(default_factory=list)
    subagents: list["Session"] = field(default_factory=list)
    reported_cost: float | None = None
    agent_id: str | None = None
    parent_id: str | None = None

    @property
    def started_at(self) -> datetime | None:
        stamps = [r.timestamp for r in self.requests if r.timestamp]
        return min(stamps) if stamps else None

    @property
    def ended_at(self) -> datetime | None:
        stamps = [r.timestamp for r in self.all_requests() if r.timestamp]
        return max(stamps) if stamps else None

    @property
    def label(self) -> str:
        if self.title:
            return self.title
        when = self.started_at.strftime("%b %d %H:%M") if self.started_at else "?"
        return f"{self.project} · {when}"

    def all_requests(self) -> list[ModelRequest]:
        reqs = list(self.requests)
        for sub in self.subagents:
            reqs.extend(sub.all_requests())
        return reqs

    def all_tool_calls(self) -> list[ToolCall]:
        calls = list(self.tool_calls)
        for sub in self.subagents:
            calls.extend(sub.all_tool_calls())
        return calls

    @property
    def own_cost(self) -> float:
        return sum(r.cost for r in self.requests)

    @property
    def cost(self) -> float:
        """Total cost including subagents."""
        return sum(r.cost for r in self.all_requests())

    @property
    def peak_context(self) -> int:
        return max((r.context_tokens for r in self.requests), default=0)

    def to_trace(self) -> AgentTrace:
        """Normalises the session's tool calls into a canonical AgentTrace.

        Tool results are represented by their content hash so the engine's
        stagnation checks (identical input *and* identical output) apply.
        """
        steps = []
        for idx, call in enumerate(self.tool_calls):
            steps.append(
                TraceStep(
                    step_id=call.call_id,
                    step_index=idx,
                    step_type=StepType.TOOL_CALL,
                    name=call.name,
                    input_payload=call.input,
                    output_payload=(
                        {"result_hash": call.result_hash, "is_error": call.is_error}
                        if call.has_result
                        else None
                    ),
                    status=StepStatus.ERROR if call.is_error else StepStatus.SUCCESS,
                    metadata={"request_id": call.request_id},
                )
            )
        output = sum(r.output_tokens for r in self.requests)
        prompt = sum(r.context_tokens for r in self.requests)
        return AgentTrace(
            trace_id=self.session_id,
            agent_name=self.source,
            task_input={"title": self.title or ""},
            steps=steps,
            total_tokens=TokenUsage(
                prompt_tokens=prompt,
                completion_tokens=output,
                total_tokens=prompt + output,
                estimated_cost_usd=self.own_cost,
            ),
            metadata={"project": self.project, "path": self.path},
        )
