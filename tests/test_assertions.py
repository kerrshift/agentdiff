import pytest
from conftest import make_step, make_trace

from agentdiff.engine.comparator import compare
from agentdiff.testing import assert_no_regressions


def test_assert_no_regressions_passes_clean_run():
    steps = [make_step("a"), make_step("b")]
    baseline = make_trace("b", steps)
    candidate = make_trace("c", steps)
    report = compare(baseline, candidate)
    assert_no_regressions(report)  # should not raise


def test_assertion_raises_on_divergence():
    baseline = make_trace("b", [make_step("a"), make_step("b")])
    candidate = make_trace("c", [make_step("x"), make_step("y"), make_step("z")])
    report = compare(baseline, candidate)
    with pytest.raises(AssertionError) as excinfo:
        assert_no_regressions(report, max_divergence=0.10)
    assert "Trajectory Divergence Index" in str(excinfo.value)


def test_assertion_raises_on_cost_spike():
    baseline = make_trace(
        "b",
        [make_step("a", cost_usd=1.0), make_step("b", cost_usd=1.0)],
    )
    candidate = make_trace(
        "c",
        [make_step("a", cost_usd=2.0), make_step("b", cost_usd=2.0)],
    )
    report = compare(baseline, candidate)
    with pytest.raises(AssertionError) as excinfo:
        assert_no_regressions(report, max_cost_increase_pct=10.0)
    assert "Cost increase" in str(excinfo.value)


def test_assertion_raises_on_wasted_effort():
    baseline = make_trace("b", [make_step("a")])
    candidate = make_trace(
        "c",
        [
            make_step("a"),
            make_step("a", status="error", error_message="x"),
            make_step("a", status="error", error_message="y"),
        ],
    )
    report = compare(baseline, candidate)
    with pytest.raises(AssertionError) as excinfo:
        assert_no_regressions(report, max_wasted_effort=0.10)
    assert "Wasted Effort Index" in str(excinfo.value)


def test_assertion_raises_on_loops_by_default():
    trace = make_trace(
        "t",
        [make_step("a"), make_step("a"), make_step("b")],
    )
    baseline = make_trace("b", [make_step("b")])
    report = compare(baseline, trace)
    with pytest.raises(AssertionError) as excinfo:
        assert_no_regressions(report)
    assert "Detected 1 loops" in str(excinfo.value)


def test_assertion_allows_loops_when_enabled():
    trace = make_trace(
        "t",
        [make_step("a"), make_step("a"), make_step("b")],
    )
    # identical baseline+candidate keeps divergence at 0; only the loop is present
    report = compare(trace, trace)
    assert_no_regressions(report, allow_loops=True)


def test_assertion_accumulates_multiple_errors():
    baseline = make_trace("b", [make_step("a", cost_usd=0.0)])
    candidate = make_trace(
        "c",
        [
            make_step("a", cost_usd=1.0),
            make_step("a", cost_usd=1.0),
            make_step("x", cost_usd=1.0),
            make_step("x", cost_usd=1.0),
            make_step("x", status="error", error_message="boom"),
        ],
    )
    report = compare(baseline, candidate)
    with pytest.raises(AssertionError) as excinfo:
        assert_no_regressions(report, max_cost_increase_pct=0.0)
    message = str(excinfo.value)
    # cost spike always present; TDI and WEI likely also violated
    assert "Cost increase" in message
