import pytest

from agentdiff.adapters import OpenAIAgentsAdapter
from agentdiff.models.step import StepStatus, StepType


def _span(
    sid, parent, stype, started, ended, name=None, usage=None, error=None, model=None
):
    span = {
        "object": "trace.span",
        "id": sid,
        "trace_id": "trace_1",
        "parent_id": parent,
        "started_at": started,
        "ended_at": ended,
        "span_data": {"type": stype},
    }
    if model is not None:
        span["span_data"]["model"] = model
    if name is not None:
        span["span_data"]["name"] = name
    if usage is not None:
        span["span_data"]["usage"] = usage
    if error is not None:
        span["error"] = {"message": error}
    return span


def _trace(spans, workflow="support_agent"):
    return {
        "object": "trace",
        "id": "trace_1",
        "workflow_name": workflow,
        "metadata": {"session": "s1"},
        "spans": spans,
    }


def _sample_spans():
    return [
        _span(
            "a1",
            None,
            "agent",
            "2026-08-01T00:00:00Z",
            "2026-08-01T00:00:04Z",
            name="agent",
        ),
        _span(
            "g1",
            "a1",
            "generation",
            "2026-08-01T00:00:00Z",
            "2026-08-01T00:00:01Z",
            model="gpt-4o-mini",
            usage={"input_tokens": 10, "output_tokens": 5, "total_tokens": 15},
        ),
        _span(
            "f1",
            "a1",
            "function",
            "2026-08-01T00:00:02Z",
            "2026-08-01T00:00:03Z",
            name="search",
        ),
    ]


def test_openai_agents_maps_span_types():
    trace = OpenAIAgentsAdapter.from_dict(_trace(_sample_spans()))
    assert trace.trace_id == "trace_1"
    assert trace.agent_name == "support_agent"
    types = [s.step_type for s in trace.steps]
    assert types == [StepType.ROUTING, StepType.LLM_CALL, StepType.TOOL_CALL]
    assert [s.name for s in trace.steps] == ["agent", "gpt-4o-mini", "search"]


def test_openai_agents_skips_task_and_turn():
    spans = [
        _span(
            "a1",
            None,
            "agent",
            "2026-08-01T00:00:00Z",
            "2026-08-01T00:00:04Z",
            name="agent",
        ),
        _span("t1", "a1", "task", "2026-08-01T00:00:00Z", "2026-08-01T00:00:04Z"),
        _span("g1", "a1", "generation", "2026-08-01T00:00:00Z", "2026-08-01T00:00:01Z"),
    ]
    trace = OpenAIAgentsAdapter.from_dict(_trace(spans))
    assert [s.step_id for s in trace.steps] == ["a1", "g1"]


def test_openai_agents_error_sets_status():
    spans = [
        _span(
            "a1",
            None,
            "agent",
            "2026-08-01T00:00:00Z",
            "2026-08-01T00:00:01Z",
            name="agent",
        ),
        _span(
            "f1",
            "a1",
            "function",
            "2026-08-01T00:00:00Z",
            "2026-08-01T00:00:01Z",
            error="boom",
        ),
    ]
    trace = OpenAIAgentsAdapter.from_dict(_trace(spans))
    assert trace.steps[1].status == StepStatus.ERROR
    assert trace.steps[1].error_message == "boom"
    assert trace.steps[0].status == StepStatus.SUCCESS


def test_openai_agents_latency_and_tokens():
    trace = OpenAIAgentsAdapter.from_dict(_trace(_sample_spans()))
    assert trace.steps[1].latency_ms == 1000.0
    assert trace.total_latency_ms == 4000.0
    assert trace.total_tokens.prompt_tokens == 10
    assert trace.total_tokens.completion_tokens == 5
    assert trace.steps[1].parent_id == "a1"
    assert trace.steps[0].parent_id is None


def test_openai_agents_orders_chronologically():
    # Generation recorded before the agent start in file order is reordered.
    spans = [
        _span("g1", "a1", "generation", "2026-08-01T00:00:02Z", "2026-08-01T00:00:03Z"),
        _span(
            "a1",
            None,
            "agent",
            "2026-08-01T00:00:00Z",
            "2026-08-01T00:00:04Z",
            name="agent",
        ),
    ]
    trace = OpenAIAgentsAdapter.from_dict(_trace(spans))
    assert [s.step_id for s in trace.steps] == ["a1", "g1"]
    assert [s.step_index for s in trace.steps] == [0, 1]


def test_openai_agents_guardrail_handoff_maps_to_routing():
    spans = [
        _span(
            "a1",
            None,
            "agent",
            "2026-08-01T00:00:00Z",
            "2026-08-01T00:00:04Z",
            name="agent",
        ),
        _span(
            "gr1",
            "a1",
            "guardrail",
            "2026-08-01T00:00:00Z",
            "2026-08-01T00:00:01Z",
            name="safety",
        ),
        _span(
            "h1",
            "a1",
            "handoff",
            "2026-08-01T00:00:02Z",
            "2026-08-01T00:00:03Z",
            name="billing",
        ),
    ]
    trace = OpenAIAgentsAdapter.from_dict(_trace(spans))
    assert [s.step_type for s in trace.steps] == [
        StepType.ROUTING,
        StepType.ROUTING,
        StepType.ROUTING,
    ]


def test_openai_agents_empty_list_raises():
    with pytest.raises(ValueError):
        OpenAIAgentsAdapter.from_dict([])


def test_openai_agents_rejects_non_dict():
    with pytest.raises(ValueError):
        OpenAIAgentsAdapter.from_dict(None)


def test_openai_agents_parse_trace_data_name():
    from agentdiff import parse_trace_data

    trace = parse_trace_data(_trace(_sample_spans()), adapter_name="openai_agents")
    assert trace.agent_name == "support_agent"


def test_openai_agents_autodetect_from_span_data():
    from agentdiff import parse_trace_data

    trace = parse_trace_data(_trace(_sample_spans()))
    assert trace.agent_name == "support_agent"
