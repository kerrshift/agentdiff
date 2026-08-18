from conftest import make_step, make_trace

from agentdiff.engine.comparator import compare
from agentdiff.engine.explanations import (
    Finding,
    format_explanations,
    generate_explanations,
    locate_culprit,
)
from agentdiff.models.step import StepStatus


def _baseline():
    return make_trace(
        "b",
        [
            make_step("planner", step_type="llm_call"),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_web", input_payload={"query": "orders"}),
            make_step("synthesize", step_type="llm_call"),
        ],
    )


def test_clean_run_produces_single_clean_finding():
    base = _baseline()
    findings = generate_explanations(compare(base, base))
    assert len(findings) == 1
    assert findings[0].category == "clean"
    assert not findings[0].is_issue


def test_loop_produces_error_finding_with_pattern():
    candidate = make_trace(
        "c",
        [
            make_step("planner", step_type="llm_call"),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_web", input_payload={"query": "orders"}),
            make_step("synthesize", step_type="llm_call"),
        ],
    )
    report = compare(_baseline(), candidate)
    findings = generate_explanations(report)
    loops = [f for f in findings if f.category == "loop"]
    assert loops
    assert loops[0].severity == "error"
    assert "search_database" in loops[0].message


def test_added_steps_explained():
    candidate = make_trace(
        "c",
        [
            make_step("planner", step_type="llm_call"),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("re_rank", step_type="llm_call"),
            make_step("search_web", input_payload={"query": "orders"}),
            make_step("synthesize", step_type="llm_call"),
        ],
    )
    report = compare(_baseline(), candidate)
    findings = generate_explanations(report)
    divergence = [f for f in findings if f.category == "divergence"]
    assert any("introduced" in f.message and "re_rank" in f.message for f in divergence)


def test_wasted_effort_reported():
    candidate = make_trace(
        "c",
        [
            make_step("planner", step_type="llm_call"),
            make_step(
                "search_database", status=StepStatus.ERROR, error_message="timeout"
            ),
            make_step("search_database", status=StepStatus.RETRY),
            make_step("search_database"),
            make_step("synthesize", step_type="llm_call"),
        ],
    )
    report = compare(_baseline(), candidate)
    findings = generate_explanations(report)
    wei = [f for f in findings if f.category == "wasted_effort"]
    assert wei
    assert "search_database" in wei[0].message


def test_cost_spike_attributes_to_loop():
    candidate = make_trace(
        "c",
        [
            make_step("planner", step_type="llm_call"),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_web", input_payload={"query": "orders"}),
            make_step("synthesize", step_type="llm_call"),
        ],
    )
    report = compare(_baseline(), candidate)
    findings = generate_explanations(report)
    resources = [f for f in findings if f.category == "resources"]
    assert any("Cost increased" in f.message and "loop" in f.message for f in resources)


def test_first_divergence_pinpointed():
    baseline = make_trace("b", [make_step("a"), make_step("b"), make_step("c")])
    candidate = make_trace("c", [make_step("a"), make_step("x"), make_step("c")])
    report = compare(baseline, candidate)
    findings = generate_explanations(report)
    divergence = [f for f in findings if f.category == "divergence"]
    assert any("First divergence at position 1" in f.message for f in divergence)


def test_format_explanations_renders_lines():
    candidate = make_trace(
        "c",
        [
            make_step("planner", step_type="llm_call"),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_database", input_payload={"state": "NY"}),
        ],
    )
    text = format_explanations(compare(_baseline(), candidate))
    assert "What happened in this run:" in text
    assert "Loop detected" in text


def test_finding_is_frozen_dataclass():
    f = Finding("error", "loop", "msg")
    assert f.severity == "error"
    assert f.is_issue is True


# ── G2: culprit-step locator ────────────────────────────────────────────────


def test_culprit_clean_run_is_none():
    base = _baseline()
    assert locate_culprit(compare(base, base)) is None


def test_culprit_loop_points_to_repeated_step():
    candidate = make_trace(
        "c",
        [
            make_step("planner", step_type="llm_call"),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_database", input_payload={"state": "NY"}),
        ],
    )
    culprit = locate_culprit(compare(_baseline(), candidate))
    assert culprit is not None
    assert culprit.kind == "loop"
    assert culprit.step_name == "search_database"
    assert culprit.severity == "error"
    assert "loop" in culprit.reason


def test_culprit_divergence_points_to_first_fork():
    baseline = make_trace("b", [make_step("a"), make_step("b"), make_step("c")])
    candidate = make_trace("c", [make_step("a"), make_step("x"), make_step("c")])
    culprit = locate_culprit(compare(baseline, candidate))
    assert culprit is not None
    assert culprit.kind == "divergence"
    assert culprit.step_name == "x"
    assert culprit.step_index == 1


def test_culprit_wasted_effort_falls_back_to_error_step():
    baseline = make_trace(
        "b",
        [make_step("planner", step_type="llm_call"), make_step("tool")],
    )
    candidate = make_trace(
        "c",
        [
            make_step("planner", step_type="llm_call"),
            make_step("tool", status=StepStatus.ERROR, error_message="boom"),
        ],
    )
    culprit = locate_culprit(compare(baseline, candidate))
    assert culprit is not None
    assert culprit.kind == "wasted_effort"
    assert culprit.step_name == "tool"


def test_culprit_render_includes_name_and_reason():
    culprit = locate_culprit(
        compare(
            make_trace("b", [make_step("a"), make_step("b")]),
            make_trace("c", [make_step("a"), make_step("x")]),
        )
    )
    assert culprit is not None
    rendered = culprit.render()
    assert "Culprit:" in rendered
    assert "x" in rendered
