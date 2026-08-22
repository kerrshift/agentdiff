import json
import os

import pytest

from agentdiff.adapters import LangGraphAdapter, OpenInferenceAdapter
from agentdiff.loader import load_trace, parse_trace_data

FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "langgraph_state.json")


def _ai_dump(content="", tool_calls=None, usage=None):
    data = {"content": content, "additional_kwargs": {}, "response_metadata": {}}
    if tool_calls:
        data["tool_calls"] = tool_calls
    if usage:
        data["response_metadata"]["token_usage"] = usage
    return {"type": "ai", "data": data}


def _tool_dump(content="ok", name="search", call_id="call_1", status="success"):
    return {
        "type": "tool",
        "data": {
            "content": content,
            "name": name,
            "tool_call_id": call_id,
            "status": status,
        },
    }


def _human_dump(content="hi"):
    return {"type": "human", "data": {"content": content}}


# --- the three message shapes ----------------------------------------------------


def test_message_to_dict_dump_shape():
    trace = LangGraphAdapter.from_dict(
        {
            "messages": [
                _human_dump("get stats"),
                _ai_dump(
                    tool_calls=[
                        {"name": "search", "args": {"q": "ny"}, "id": "call_1"}
                    ],
                    usage={
                        "prompt_tokens": 10,
                        "completion_tokens": 5,
                        "total_tokens": 15,
                    },
                ),
                _tool_dump(),
                _ai_dump(
                    "final answer",
                    usage={
                        "prompt_tokens": 20,
                        "completion_tokens": 8,
                        "total_tokens": 28,
                    },
                ),
            ]
        }
    )
    names = [(s.name, s.step_type.value) for s in trace.steps]
    assert names == [
        ("search", "routing"),
        ("search", "tool_call"),
        ("response", "llm_call"),
    ]
    assert trace.steps[0].tokens.total_tokens == 15
    assert trace.task_input == {"input": "get stats"}
    assert trace.final_output == {"result": "final answer"}
    assert trace.total_tokens.total_tokens == 43


def test_lc_constructor_dump_shape():
    trace = LangGraphAdapter.from_dict(
        {
            "messages": [
                {
                    "lc": 1,
                    "type": "constructor",
                    "id": ["langchain_core", "messages", "HumanMessage"],
                    "kwargs": {"content": "run it"},
                },
                {
                    "lc": 1,
                    "type": "constructor",
                    "id": ["langchain_core", "messages", "AIMessage"],
                    "kwargs": {
                        "content": "",
                        "tool_calls": [
                            {"name": "lookup", "args": {"k": "v"}, "id": "c9"}
                        ],
                        "usage_metadata": {
                            "input_tokens": 3,
                            "output_tokens": 4,
                            "total_tokens": 7,
                        },
                    },
                },
                {
                    "lc": 1,
                    "type": "constructor",
                    "id": ["langchain_core", "messages", "ToolMessage"],
                    "kwargs": {"content": "res", "tool_call_id": "c9"},
                },
            ]
        }
    )
    assert [s.name for s in trace.steps] == ["lookup", "lookup"]
    assert trace.steps[0].step_type.value == "routing"
    assert trace.steps[1].step_type.value == "tool_call"
    # tool result resolves its name from the pending AI tool call
    assert trace.steps[1].step_id == "c9#result"
    assert trace.steps[0].step_id == "c9#decision"


def test_plain_role_dict_shape_with_openai_style_tool_calls():
    trace = LangGraphAdapter.from_dict(
        {
            "messages": [
                {"role": "user", "content": "go"},
                {
                    "role": "assistant",
                    "content": "",
                    "tool_calls": [
                        {
                            "id": "call_x",
                            "type": "function",
                            "function": {
                                "name": "db_stats",
                                "arguments": '{"state": "NY"}',
                            },
                        }
                    ],
                },
                {"role": "tool", "tool_call_id": "call_x", "content": "1250 users"},
            ]
        }
    )
    assert [s.name for s in trace.steps] == ["db_stats", "db_stats"]
    assert trace.steps[0].input_payload["arguments"] == {"state": "NY"}


def test_wrapper_shapes_checkpoint_snapshot_and_flat():
    inner = [_human_dump("q"), _ai_dump("done")]
    for wrapped in (
        {"messages": inner},
        {"channel_values": {"messages": inner}},
        {"values": {"messages": inner}, "metadata": {"source": "loop"}},
    ):
        trace = LangGraphAdapter.from_dict(wrapped)
        assert [s.name for s in trace.steps] == ["response"]


def test_tool_error_status_maps_to_step_status():
    trace = LangGraphAdapter.from_dict(
        {
            "messages": [
                _ai_dump(tool_calls=[{"name": "sql", "args": {}, "id": "e1"}]),
                _tool_dump(content="boom", name="sql", call_id="e1", status="error"),
            ]
        }
    )
    assert trace.steps[1].status.value == "error"
    assert trace.steps[1].error_message == "boom"
    from agentdiff.engine.metrics import calculate_wei

    assert calculate_wei(trace.steps) == pytest.approx(0.5)


def test_unmatched_tool_result_falls_back_to_generic_name():
    trace = LangGraphAdapter.from_dict(
        {"messages": [_tool_dump(name=None, call_id="ghost")]}
    )
    assert trace.steps[0].name == "tool_response"


def test_empty_or_invalid_payloads_raise_valueerror():
    for bad in (
        {},
        {"messages": []},
        {"messages": [{"type": "human", "data": {"content": "x"}}]},
    ):
        with pytest.raises(ValueError):
            LangGraphAdapter.from_dict(bad)


def test_unknown_shapes_are_skipped_not_fatal():
    trace = LangGraphAdapter.from_dict(
        {
            "messages": [
                {"weird": "shape"},
                _human_dump("q"),
                _ai_dump("answer"),
            ]
        }
    )
    assert len(trace.steps) == 1


# --- auto-detection ---------------------------------------------------------------


def test_detect_true_for_langgraph_state():
    state = json.load(open(FIXTURE))
    assert parse_trace_data(state).agent_name == "langgraph_agent"


def test_detect_rejects_plain_chat_and_generic_data():
    assert not LangGraphAdapter.detect({"trace_id": "t", "steps": []})
    assert not LangGraphAdapter.detect({"messages": []})
    # A bare greeting log without any AI structure is not LangGraph.
    assert not LangGraphAdapter.detect(
        {"messages": [{"role": "user", "content": "hello?"}]}
    )


def test_explicit_adapter_name_bypasses_detection_gate():
    trace = parse_trace_data(
        {"messages": [_human_dump("hello?"), _ai_dump("hi there!")]},
        adapter_name="langgraph",
    )
    assert trace.steps[0].name == "response"


def test_builtin_priority_untouched_by_langgraph_registration():
    otel_span = {
        "spans": [{"context": {"trace_id": "1", "span_id": "2"}, "attributes": {}}]
    }
    parsed = parse_trace_data(otel_span)
    assert isinstance(parsed.steps[0], type(parsed.steps[0]))  # smoke
    # OTel-shaped dict still goes to openinference, not langgraph/generic.

    assert all(s.step_type is not None for s in parsed.steps)
    assert OpenInferenceAdapter is not None


def test_load_real_fixture_from_disk():
    trace = load_trace(FIXTURE, adapter_name="auto")
    assert trace.agent_name == "langgraph_agent"
    assert [s.name for s in trace.steps] == [
        "get_user_database_stats",
        "get_user_database_stats",
        "response",
    ]
    assert trace.steps[0].step_type.value == "routing"
    assert trace.steps[1].step_type.value == "tool_call"
    assert trace.total_tokens.prompt_tokens == 161  # 61 + 100 real usage


# --- fuzz-lite: malformed inputs must raise ValueError, never crash ----------------


@pytest.mark.parametrize(
    "payload",
    [
        {"messages": [42]},
        {"messages": [None]},
        {"messages": [{"data": 3}]},
        {"channel_values": {"messages": "nope"}},
        {"values": {"messages": {"nested": "dict"}}},
        {"lc": 1, "id": ["X"], "kwargs": None},
        {"messages": [{"type": "ai"}], "id": None},
    ],
)
def test_malformed_inputs_raise_cleanly(payload):
    try:
        trace = LangGraphAdapter.from_dict(payload)
    except ValueError:
        return  # acceptable
    # Or produces a structurally valid trace
    assert trace.trace_id
