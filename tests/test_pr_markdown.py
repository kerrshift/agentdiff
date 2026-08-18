from conftest import make_step, make_trace

from agentdiff.engine.comparator import compare
from agentdiff.reporters.pr import generate_pr_markdown


def _clean_report():
    base = make_trace("b", [make_step("a"), make_step("b")])
    return compare(base, base)


def _regressed_report():
    base = make_trace(
        "b",
        [make_step("planner", step_type="llm_call"), make_step("tool")],
    )
    cand = make_trace(
        "c",
        [
            make_step("planner", step_type="llm_call"),
            make_step("tool", status="error", error_message="boom"),
        ],
    )
    report = compare(base, cand)
    report.passed = False
    return report


def test_pr_markdown_clean_run():
    out = generate_pr_markdown(_clean_report())
    assert "**PASSED**" in out
    assert "AgentDiff" in out
    assert "No divergence" in out


def test_pr_markdown_regression_includes_status_and_culprit():
    out = generate_pr_markdown(_regressed_report())
    assert "**FAILED**" in out
    assert "Culprit:" in out
    assert "### Divergence tree" in out
    assert "```text" in out


def test_pr_markdown_shows_gate_thresholds():
    out = generate_pr_markdown(
        _regressed_report(), max_divergence=0.1, max_cost_delta=5.0
    )
    assert "TDI" in out
    assert "`0.1`" in out
    assert "`5.0%`" in out


def test_pr_markdown_clean_run_is_passed():
    out = generate_pr_markdown(_clean_report())
    assert "**PASSED**" in out
