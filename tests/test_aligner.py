from conftest import make_step, make_trace

from agentdiff.engine.aligner import align_traces, dict_diff, step_signature
from agentdiff.models.report import StepDiffStatus
from agentdiff.models.step import StepStatus, StepType


def test_step_signature_includes_type_name_and_input_keys():
    step = make_step(
        "sql_executor",
        step_type=StepType.TOOL_CALL,
        input_payload={"query": "SELECT 1", "connection": "prod"},
        output_payload={"rows": []},
    )
    assert step_signature(step) == (
        StepType.TOOL_CALL,
        "sql_executor",
        ("connection", "query"),
    )


def test_step_signature_ignores_input_values_and_output():
    a = make_step("x", input_payload={"k": 1}, output_payload={"out": "A"})
    b = make_step("x", input_payload={"k": 2}, output_payload={"out": "B"})
    assert step_signature(a) == step_signature(b)


def test_step_signature_empty_input():
    step = make_step("x", input_payload={})
    assert step_signature(step) == (StepType.TOOL_CALL, "x", ())


def test_dict_diff_unchanged_returns_none():
    assert dict_diff({"a": 1}, {"a": 1}) is None


def test_dict_diff_added_key():
    assert dict_diff({"a": 1}, {"a": 1, "b": 2}) == {
        "b": {"status": "added", "new_value": 2}
    }


def test_dict_diff_removed_key():
    assert dict_diff({"a": 1, "b": 2}, {"a": 1}) == {
        "b": {"status": "removed", "old_value": 2}
    }


def test_dict_diff_changed_value():
    assert dict_diff({"a": 1}, {"a": 2}) == {
        "a": {"status": "changed", "old_value": 1, "new_value": 2}
    }


def test_align_identical_traces_all_matched():
    steps = [
        make_step("fetch_user", step_type=StepType.TOOL_CALL),
        make_step("summarize", step_type=StepType.LLM_CALL),
    ]
    baseline = make_trace("b", steps)
    candidate = make_trace("c", steps)

    diffs = align_traces(baseline, candidate)

    assert len(diffs) == 2
    assert all(d.diff_status == StepDiffStatus.MATCHED for d in diffs)


def test_align_candidate_added_step():
    baseline = make_trace("b", [make_step("a"), make_step("b")])
    candidate = make_trace("c", [make_step("a"), make_step("b"), make_step("c")])

    diffs = align_traces(baseline, candidate)

    assert any(d.diff_status == StepDiffStatus.ADDED for d in diffs)
    assert any(d.diff_status == StepDiffStatus.MATCHED for d in diffs)


def test_align_baseline_removed_step():
    baseline = make_trace("b", [make_step("a"), make_step("b"), make_step("c")])
    candidate = make_trace("c", [make_step("a"), make_step("c")])

    diffs = align_traces(baseline, candidate)

    assert any(d.diff_status == StepDiffStatus.REMOVED for d in diffs)


def test_align_modified_input_marks_modified():
    baseline = make_trace("b", [make_step("sql", input_payload={"q": 1})])
    candidate = make_trace("c", [make_step("sql", input_payload={"q": 2})])

    diffs = align_traces(baseline, candidate)

    assert len(diffs) == 1
    assert diffs[0].diff_status == StepDiffStatus.MODIFIED
    assert diffs[0].argument_diff == {
        "q": {"status": "changed", "old_value": 1, "new_value": 2}
    }


def test_align_modified_status_marks_modified():
    baseline = make_trace("b", [make_step("sql", status=StepStatus.SUCCESS)])
    candidate = make_trace(
        "c",
        [make_step("sql", status=StepStatus.ERROR, error_message="boom")],
    )

    diffs = align_traces(baseline, candidate)

    assert diffs[0].diff_status == StepDiffStatus.MODIFIED


def test_align_strict_signatures_flags_payload_difference():
    a = make_step("sql", input_payload={"q": 1})
    b = make_step("sql", input_payload={"q": 2})

    baseline = make_trace("b", [a])
    candidate = make_trace("c", [b])

    # Signature (type, name, input keys) is equal, so non-strict mode aligns the
    # pair and surfaces the payload diff as MODIFIED.
    assert align_traces(baseline, candidate)[0].diff_status == StepDiffStatus.MODIFIED

    # Strict mode requires full payload equality, so the pair is NOT aligned:
    # baseline step removed and candidate step added.
    strict = align_traces(baseline, candidate, strict_tool_signatures=True)
    assert {d.diff_status for d in strict} == {
        StepDiffStatus.ADDED,
        StepDiffStatus.REMOVED,
    }


def test_align_returns_in_execution_order():
    steps = [make_step("a"), make_step("b"), make_step("c")]
    baseline = make_trace("b", steps)
    candidate = make_trace("c", steps)

    diffs = align_traces(baseline, candidate)

    assert [d.step_name for d in diffs] == ["a", "b", "c"]
