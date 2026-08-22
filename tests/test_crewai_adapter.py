import json
import os

import pytest

from agentdiff.adapters import CrewAIAdapter
from agentdiff.loader import load_trace, parse_trace_data

FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "crewai_output.json")


def _task_output(**overrides):
    task = {
        "description": "Do the thing",
        "expected_output": "A summary",
        "raw": "final answer text",
        "agent": "Researcher",
        "output_format": "raw",
        "messages": [
            {"role": "system", "content": "You are Researcher."},
            {"role": "user", "content": "Current Task: Do the thing"},
            {
                "role": "assistant",
                "content": "",
                "tool_calls": [{"name": "search_web", "args": {"q": "x"}, "id": "c1"}],
            },
            {
                "role": "tool",
                "name": "search_web",
                "tool_call_id": "c1",
                "content": "results",
            },
            {"role": "user", "content": "Analyze the tool result."},
            {"role": "assistant", "content": "final answer text"},
        ],
    }
    task.update(overrides)
    return task


def test_full_message_log_maps_to_fine_grained_steps():
    trace = CrewAIAdapter.from_dict(
        {
            "tasks_output": [_task_output()],
            "token_usage": {
                "total_tokens": 100,
                "prompt_tokens": 80,
                "completion_tokens": 20,
            },
        }
    )
    names = [(s.name, s.step_type.value) for s in trace.steps]
    assert names == [
        ("Researcher/search_web", "routing"),
        ("Researcher/search_web", "tool_call"),
        ("Researcher/response", "llm_call"),
    ]
    assert trace.task_input["input"].startswith("Current Task: Do the thing")
    assert trace.final_output == {"result": "final answer text"}
    assert trace.total_tokens.total_tokens == 100


def test_multi_task_prefixing_keeps_steps_distinct():
    data = {
        "tasks_output": [
            _task_output(agent="Researcher"),
            {
                "agent": "Writer",
                "description": "Write it up",
                "raw": "the report",
                "messages": [
                    {"role": "system", "content": "You are Writer."},
                    {"role": "user", "content": "Current Task: Write it up"},
                    {"role": "assistant", "content": "the report"},
                ],
            },
        ]
    }
    trace = CrewAIAdapter.from_dict(data)
    assert [s.name for s in trace.steps] == [
        "Researcher/search_web",
        "Researcher/search_web",
        "Researcher/response",
        "Writer/response",
    ]
    assert trace.final_output == {"result": "the report"}


def test_simplified_export_without_logs_makes_one_step_per_task():
    trace = CrewAIAdapter.from_dict(
        {
            "tasks_output": [
                {"description": "Task A", "raw": "out a", "agent": "AgentA"},
                {"description": "Task B", "raw": "out b", "agent": "AgentB"},
            ]
        }
    )
    assert [s.name for s in trace.steps] == ["AgentA/Task A", "AgentB/Task B"]
    assert all(s.step_type.value == "llm_call" for s in trace.steps)


def test_tasks_alias_supported():
    trace = CrewAIAdapter.from_dict(
        {"tasks": [{"raw": "r", "agent": "A", "description": "d"}]}
    )
    assert len(trace.steps) == 1


def test_aggregate_usage_falls_back_to_summing_messages():
    data = {
        "tasks_output": [
            {
                "raw": "x",
                "agent": "A",
                "messages": [
                    {
                        "role": "assistant",
                        "content": "working",
                        "usage_metadata": {"input_tokens": 5, "output_tokens": 3},
                    }
                ],
            }
        ]
    }
    trace = CrewAIAdapter.from_dict(data)
    assert trace.total_tokens.total_tokens == 8


def test_real_fixture_auto_detects_and_loads():
    raw = json.load(open(FIXTURE))
    assert CrewAIAdapter.detect(raw) is True
    trace = parse_trace_data(raw)
    assert trace.agent_name == "crewai_crew"
    names = [s.name for s in trace.steps]
    assert "Reporter/db_stats" in names
    assert any(s.step_type.value == "tool_call" for s in trace.steps)
    # Real aggregate usage from the captured run.
    assert trace.total_tokens.total_tokens == 298


def test_load_real_fixture_from_disk_explicit():
    trace = load_trace(FIXTURE, adapter_name="crewai")
    assert trace.steps[0].name == "Reporter/db_stats"


def test_detect_rejects_other_shapes():
    assert not CrewAIAdapter.detect({"tasks_output": []})
    assert not CrewAIAdapter.detect({"tasks_output": [{"name": "generic"}]})
    assert not CrewAIAdapter.detect({"messages": []})


def test_invalid_payloads_raise_valueerror():
    for bad in ({}, {"tasks_output": []}, {"tasks_output": [{"nope": 1}]}):
        with pytest.raises(ValueError):
            CrewAIAdapter.from_dict(bad)


@pytest.mark.parametrize(
    "payload",
    [
        {"tasks_output": [42]},
        {"tasks_output": [{"messages": "nope"}]},
        {"tasks": [{"messages": [1, 2]}]},
    ],
)
def test_malformed_inputs_raise_cleanly(payload):
    try:
        trace = CrewAIAdapter.from_dict(payload)
    except ValueError:
        return
    assert trace.trace_id
