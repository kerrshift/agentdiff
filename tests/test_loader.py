import json

import pytest

from agentdiff.loader import load_trace, parse_trace_data
from agentdiff.models.step import StepType


def test_parse_auto_detects_langsmith_run_tree():
    data = {
        "run_type": "chain",
        "name": "agent",
        "child_runs": [{"id": "s1", "name": "tool", "run_type": "tool"}],
    }
    trace = parse_trace_data(data)
    assert len(trace.steps) == 2
    assert trace.steps[1].step_type == StepType.TOOL_CALL


def test_parse_auto_detects_langfuse():
    data = {"observations": [{"id": "o1", "name": "call_llm", "type": "generation"}]}
    trace = parse_trace_data(data)
    assert trace.steps[0].step_type == StepType.LLM_CALL


def test_parse_auto_detects_openinference_spans():
    data = {
        "spans": [
            {
                "context": {"span_id": "s1"},
                "name": "call",
                "attributes": {"openinference.span.kind": "TOOL"},
            }
        ]
    }
    trace = parse_trace_data(data)
    assert trace.steps[0].step_type == StepType.TOOL_CALL


def test_parse_auto_falls_back_to_generic():
    data = {
        "trace_id": "t",
        "agent_name": "a",
        "task_input": {"q": 1},
        "steps": [
            {"step_id": "s0", "step_index": 0, "step_type": "llm_call", "name": "n"}
        ],
    }
    trace = parse_trace_data(data)
    assert trace.trace_id == "t"


def test_parse_explicit_adapter_bypasses_autodetect():
    # openinference-shaped data forced through langfuse would fail validation
    data = {
        "id": "t",
        "observations": [{"id": "o1", "type": "generation", "name": "g"}],
    }
    trace = parse_trace_data(data, adapter_name="langfuse")
    assert len(trace.steps) == 1


def test_parse_auto_rejects_empty_list():
    with pytest.raises(ValueError):
        parse_trace_data([])


def test_parse_auto_rejects_unstructured_type():
    with pytest.raises(ValueError):
        parse_trace_data("not-a-dict")


def test_load_trace_reads_file(tmp_path):
    trace_file = tmp_path / "trace.json"
    data = {
        "id": "t",
        "observations": [{"id": "o1", "type": "generation", "name": "g"}],
    }
    trace_file.write_text(json.dumps(data))
    trace = load_trace(str(trace_file))
    assert trace.trace_id == "t"


def test_load_trace_missing_file_raises(tmp_path):
    with pytest.raises(FileNotFoundError):
        load_trace(str(tmp_path / "nope.json"))


def test_load_trace_invalid_json_raises(tmp_path):
    trace_file = tmp_path / "trace.json"
    trace_file.write_text("{ not json")
    with pytest.raises(json.JSONDecodeError):
        load_trace(str(trace_file))
