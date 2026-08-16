from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class StepType(str, Enum):
    TOOL_CALL = "tool_call"
    LLM_CALL = "llm_call"
    ROUTING = "routing"
    THOUGHT = "thought"


class StepStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    RETRY = "retry"
    ABANDONED = "abandoned"


class TokenUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost_usd: float = 0.0


class TraceStep(BaseModel):
    step_id: str
    parent_id: str | None = None
    step_index: int
    step_type: StepType
    name: str  # e.g. "sql_executor", "web_search", "synthesize"
    input_payload: dict[str, Any] = Field(default_factory=dict)
    output_payload: dict[str, Any] | None = None
    status: StepStatus = StepStatus.SUCCESS
    error_message: str | None = None
    latency_ms: float = 0.0
    tokens: TokenUsage = Field(default_factory=TokenUsage)
    metadata: dict[str, Any] = Field(default_factory=dict)
