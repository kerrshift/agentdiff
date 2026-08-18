import pytest

from agentdiff.adapters import LangSmithAdapter
from agentdiff.models.step import StepStatus, StepType


def _run_tree():
    return {
        "trace_id": "ls-trace-1",
        "id": "root",
        "name": "agent",
        "run_type": "chain",
        "inputs": {"query": "orders"},
        "outputs": {"answer": "42"},
        "start_time": "2024-01-01T00:00:00Z",
        "end_time": "2024-01-01T00:00:02Z",
        "child_runs": [
            {
                "id": "llm1",
                "name": "planner",
                "run_type": "llm",
                "inputs": {"query": "orders"},
                "outputs": {"plan": "x"},
                "usage_metadata": {
                    "input_tokens": 10,
                    "output_tokens": 5,
                    "total_tokens": 15,
                    "total_cost": 0.01,
                },
                "start_time": "2024-01-01T00:00:00Z",
                "end_time": "2024-01-01T00:00:01Z",
            },
            {
                "id": "tool1",
                "name": "search_database",
                "run_type": "tool",
                "inputs": {"state": "NY"},
                "outputs": {"res": "x"},
                "error": "timeout",
                "start_time": "2024-01-01T00:00:01Z",
                "end_time": "2024-01-01T00:00:02Z",
            },
        ],
    }


def test_langsmith_flattens_run_tree():
    trace = LangSmithAdapter.from_dict(_run_tree())
    assert trace.trace_id == "ls-trace-1"
    assert trace.agent_name == "agent"
    assert [s.name for s in trace.steps] == ["agent", "planner", "search_database"]
    assert trace.steps[0].step_type == StepType.ROUTING
    assert trace.steps[1].step_type == StepType.LLM_CALL
    assert trace.steps[2].step_type == StepType.TOOL_CALL


def test_langsmith_hierarchy_and_tokens():
    trace = LangSmithAdapter.from_dict(_run_tree())
    assert trace.steps[1].parent_id == "root"
    assert trace.steps[2].parent_id == "root"
    assert trace.steps[1].tokens.prompt_tokens == 10
    assert trace.steps[1].tokens.completion_tokens == 5
    assert trace.total_tokens.prompt_tokens == 10
    assert trace.steps[0].parent_id is None


def test_langsmith_error_sets_status():
    trace = LangSmithAdapter.from_dict(_run_tree())
    assert trace.steps[2].status == StepStatus.ERROR
    assert trace.steps[2].error_message == "timeout"
    assert trace.steps[1].status == StepStatus.SUCCESS


def test_langsmith_latency_from_timestamps():
    trace = LangSmithAdapter.from_dict(_run_tree())
    assert trace.steps[1].latency_ms == 1000.0
    assert trace.steps[2].latency_ms == 1000.0
    assert trace.total_latency_ms == 2000.0


def test_langsmith_root_input_output_becomes_task():
    trace = LangSmithAdapter.from_dict(_run_tree())
    assert trace.task_input == {"query": "orders"}
    assert trace.final_output == {"answer": "42"}


def test_langsmith_empty_list_raises():
    with pytest.raises(ValueError):
        LangSmithAdapter.from_dict([])


def test_langsmith_rejects_non_dict():
    with pytest.raises(ValueError):
        LangSmithAdapter.from_dict(None)
