import pytest

from agentdiff.adapters import (
    GenericAdapter,
    LangfuseAdapter,
    OpenInferenceAdapter,
)
from agentdiff.models.step import StepStatus, StepType


def test_generic_adapter_validates_canonical_schema():
    data = {
        "trace_id": "t1",
        "agent_name": "agent",
        "task_input": {"q": 1},
        "final_output": {"a": 1},
        "steps": [
            {
                "step_id": "s0",
                "step_index": 0,
                "step_type": "tool_call",
                "name": "search",
            }
        ],
    }
    trace = GenericAdapter.from_dict(data)
    assert trace.trace_id == "t1"
    assert len(trace.steps) == 1
    assert trace.steps[0].name == "search"


# ── OpenInference ───────────────────────────────────────────────────────────


def _openinference_data():
    return {
        "spans": [
            {
                "context": {"span_id": "s1", "trace_id": "tr1"},
                "name": "root",
                "kind": "AGENT",
                "attributes": {
                    "openinference.span.kind": "AGENT",
                    "input.value": {"q": 1},
                    "output.value": {"a": 2},
                },
                "start_time": 1000,
                "end_time": 2000,
            },
            {
                "context": {"span_id": "s2"},
                "parent_span_id": "s1",
                "name": "search",
                "kind": "TOOL",
                "attributes": {
                    "openinference.span.kind": "TOOL",
                    "llm.token_count.prompt": 10,
                    "llm.token_count.completion": 4,
                    "input.value": {"q": 1},
                    "output.value": {"res": "x"},
                },
                "start_time": "2024-01-01T00:00:00Z",
                "end_time": "2024-01-01T00:00:01Z",
            },
        ]
    }


def test_openinference_parses_spans():
    trace = OpenInferenceAdapter.from_dict(_openinference_data())
    assert trace.trace_id == "tr1"
    assert len(trace.steps) == 2
    assert trace.steps[0].step_type == StepType.ROUTING  # AGENT
    assert trace.steps[1].step_type == StepType.TOOL_CALL
    assert trace.steps[1].tokens.prompt_tokens == 10
    assert trace.steps[1].tokens.completion_tokens == 4
    # numeric timestamps -> ms
    assert trace.steps[0].latency_ms == 1_000_000.0
    # isoformat timestamps -> 1 second
    assert trace.steps[1].latency_ms == 1000.0


def test_openinference_accepts_single_span_dict():
    span = {
        "context": {"span_id": "s1"},
        "name": "think",
        "kind": "LLM",
        "attributes": {"llm.token_count.prompt": 2, "llm.token_count.completion": 1},
    }
    trace = OpenInferenceAdapter.from_dict(span)
    assert len(trace.steps) == 1
    assert trace.steps[0].step_type == StepType.LLM_CALL


def test_openinference_error_status():
    data = {
        "spans": [
            {
                "context": {"span_id": "s1"},
                "name": "call",
                "kind": "TOOL",
                "status": {"status_code": "ERROR", "message": "boom"},
            }
        ]
    }
    trace = OpenInferenceAdapter.from_dict(data)
    assert trace.steps[0].status == StepStatus.ERROR
    assert trace.steps[0].error_message == "boom"


def test_openinference_no_spans_raises():
    with pytest.raises(ValueError):
        OpenInferenceAdapter.from_dict([])


def test_openinference_root_span_becomes_task_and_output():
    trace = OpenInferenceAdapter.from_dict(_openinference_data())
    assert trace.task_input == {"q": 1}
    assert trace.final_output == {"a": 2}
    assert trace.agent_name == "root"


def test_openinference_accepts_real_otel_ints_and_nanoseconds():
    # In-memory OTel spans carry integer ids and nanosecond timestamps.
    start_ns = 1_730_000_000_000_000_000  # 2024-10
    end_ns = start_ns + 2_000_000_000  # +2 seconds
    data = {
        "spans": [
            {
                "context": {"span_id": 123456789, "trace_id": 987654321},
                "name": "call",
                "kind": "LLM",
                "attributes": {
                    "openinference.span.kind": "LLM",
                    "llm.token_count.prompt": 10,
                    "llm.token_count.completion": 5,
                },
                "start_time": start_ns,
                "end_time": end_ns,
                "status": {"status_code": "OK"},
            }
        ]
    }
    trace = OpenInferenceAdapter.from_dict(data)
    assert trace.steps[0].step_id == "123456789"  # int id -> str
    assert trace.trace_id == "987654321"
    assert trace.steps[0].latency_ms == 2000.0  # 2s from nanoseconds
    assert trace.steps[0].tokens.prompt_tokens == 10


# ── Langfuse ────────────────────────────────────────────────────────────────


def _langfuse_data():
    return {
        "id": "t1",
        "name": "agent",
        "input": {"q": 1},
        "output": {"a": 2},
        "duration": 2.0,
        "observations": [
            {
                "id": "o1",
                "type": "generation",
                "name": "call_llm",
                "input": {"q": 1},
                "output": {"a": 2},
                "usage": {
                    "promptTokens": 10,
                    "completionTokens": 4,
                    "totalTokens": 14,
                    "cost": 0.01,
                },
                "startTime": "2024-01-01T00:00:00Z",
                "endTime": "2024-01-01T00:00:00.5Z",
            },
            {
                "id": "o2",
                "type": "span",
                "name": "sql_tool",
                "input": {"q": 1},
                "output": {"x": 1},
                "parentObservationId": "o1",
                "duration": 0.3,
            },
            {
                "id": "o3",
                "type": "span",
                "name": "bad",
                "level": "ERROR",
                "statusMessage": "boom",
            },
        ],
    }


def test_langfuse_parses_observations():
    trace = LangfuseAdapter.from_dict(_langfuse_data())
    assert trace.trace_id == "t1"
    assert len(trace.steps) == 3
    assert trace.steps[0].step_type == StepType.LLM_CALL  # generation
    assert trace.steps[1].step_type == StepType.TOOL_CALL  # span name has "tool"
    assert trace.steps[2].step_type == StepType.ROUTING  # generic span
    assert trace.total_latency_ms == 2000.0  # duration * 1000
    assert trace.total_tokens.prompt_tokens == 10
    assert trace.total_tokens.completion_tokens == 4


def test_langfuse_error_level_sets_status():
    trace = LangfuseAdapter.from_dict(_langfuse_data())
    assert trace.steps[2].status == StepStatus.ERROR
    assert trace.steps[2].error_message == "boom"


def test_langfuse_iso_timestamp_latency():
    trace = LangfuseAdapter.from_dict(_langfuse_data())
    # o1 spans 0.5 seconds
    assert trace.steps[0].latency_ms == 500.0
    # o2 falls back to duration
    assert trace.steps[1].latency_ms == 300.0


def test_langfuse_accepts_sdk_snake_case_observations():
    # Langfuse SDK returns observations in snake_case (start_time,
    # parent_observation_id, status_message); the adapter must accept them
    # natively, not only the dashboard-export camelCase.
    data = {
        "id": "t1",
        "name": "agent",
        "input": {"q": 1},
        "output": {"a": 2},
        "observations": [
            {
                "id": "o1",
                "type": "generation",
                "name": "call_llm",
                "input": {"q": 1},
                "output": {"a": 2},
                "start_time": "2024-01-01T00:00:00Z",
                "end_time": "2024-01-01T00:00:00.5Z",
                "usage": {"input": 10, "output": 4, "total": 14, "cost": 0.01},
            },
            {
                "id": "o2",
                "type": "span",
                "name": "sql_tool",
                "parent_observation_id": "o1",
            },
            {
                "id": "o3",
                "type": "span",
                "name": "bad",
                "level": "ERROR",
                "status_message": "boom",
            },
        ],
    }
    trace = LangfuseAdapter.from_dict(data)
    assert trace.steps[0].latency_ms == 500.0  # snake start/end time parsed
    assert trace.steps[1].parent_id == "o1"  # snake parent parsed
    assert trace.steps[2].status == StepStatus.ERROR
    assert trace.steps[2].error_message == "boom"


def test_langfuse_maps_sdk_v4_types():
    # The Langfuse v4 SDK emits AGENT/TOOL observation types; the adapter must
    # map them (not only the legacy GENERATION/SPAN).
    data = {
        "id": "t1",
        "name": "agent",
        "input": {"q": 1},
        "output": {"a": 2},
        "observations": [
            {
                "id": "o1",
                "type": "AGENT",
                "name": "orders_agent",
                "start_time": "2024-01-01T00:00:00Z",
                "end_time": "2024-01-01T00:00:01Z",
            },
            {
                "id": "o2",
                "type": "GENERATION",
                "name": "planner",
                "start_time": "2024-01-01T00:00:00.1Z",
                "end_time": "2024-01-01T00:00:00.2Z",
            },
            {
                "id": "o3",
                "type": "TOOL",
                "name": "search_database",
                "start_time": "2024-01-01T00:00:00.3Z",
                "end_time": "2024-01-01T00:00:00.4Z",
            },
        ],
    }
    trace = LangfuseAdapter.from_dict(data)
    assert [s.step_type for s in trace.steps] == [
        StepType.ROUTING,
        StepType.LLM_CALL,
        StepType.TOOL_CALL,
    ]
    assert [s.name for s in trace.steps] == [
        "orders_agent",
        "planner",
        "search_database",
    ]
