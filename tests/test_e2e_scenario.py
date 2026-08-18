"""Realistic end-to-end scenario: a multi-turn tool-using agent that regresses.

Gates the full pipeline (build -> compare -> assert) on a realistic trace where
the candidate loops on the same tool, exactly the regression AgentDiff exists
to catch.
"""

import pytest
from conftest import make_step, make_trace

from agentdiff.engine.comparator import compare
from agentdiff.testing import assert_no_regressions


def _baseline():
    return make_trace(
        "base-1",
        [
            make_step("planner", step_type="llm_call"),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_web", input_payload={"query": "orders"}),
            make_step("synthesize", step_type="llm_call"),
        ],
    )


def _candidate_with_loop():
    return make_trace(
        "cand-1",
        [
            make_step("planner", step_type="llm_call"),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_database", input_payload={"state": "NY"}),
            make_step("search_web", input_payload={"query": "orders"}),
            make_step("synthesize", step_type="llm_call"),
        ],
    )


def test_loop_regression_is_detected_and_blocks():
    report = compare(_baseline(), _candidate_with_loop())
    assert len(report.loops_detected) >= 1
    assert report.trajectory_divergence_index > 0.0
    with pytest.raises(AssertionError):
        assert_no_regressions(report, max_divergence=0.15, allow_loops=False)


def test_loop_regression_passes_when_allowed():
    report = compare(_baseline(), _candidate_with_loop())
    # A loop also inflates cost, so relax the cost gate to isolate the loop check
    assert_no_regressions(
        report, max_divergence=0.3, allow_loops=True, max_cost_increase_pct=100.0
    )


def test_loop_inflated_cost_still_blocks_even_when_loops_allowed():
    report = compare(_baseline(), _candidate_with_loop())
    with pytest.raises(AssertionError):
        assert_no_regressions(report, allow_loops=True, max_cost_increase_pct=5.0)


def test_identical_runs_pass_strict_gate():
    base = _baseline()
    report = compare(base, base)
    assert report.loops_detected == []
    assert report.trajectory_divergence_index == 0.0
    assert_no_regressions(report, max_divergence=0.0, allow_loops=False)
