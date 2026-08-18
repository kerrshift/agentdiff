from conftest import make_step, make_trace

from agentdiff.ci.baseline import decide_rotation
from agentdiff.engine.comparator import compare


def _report(*, passed=True, tdi=0.0):
    base = make_trace("b", [make_step("a"), make_step("b")])
    cand = make_trace("c", [make_step("a"), make_step("b")])
    r = compare(base, cand)
    r.passed = passed
    r.trajectory_divergence_index = tdi
    return r


def test_manual_requires_explicit_update():
    assert not decide_rotation(_report(), "manual", explicit_update=False).rotate
    assert decide_rotation(_report(), "manual", explicit_update=True).rotate


def test_auto_rotates_on_clean_run():
    d = decide_rotation(_report(), "auto")
    assert d.rotate


def test_auto_never_rotates_on_regression():
    d = decide_rotation(_report(passed=False), "auto")
    assert not d.rotate


def test_staged_rotates_within_drift_budget():
    assert decide_rotation(_report(tdi=0.02), "staged", max_drift=0.05).rotate


def test_staged_holds_baseline_when_drifting():
    d = decide_rotation(_report(tdi=0.09), "staged", max_drift=0.05)
    assert not d.rotate
    assert "drift" in d.reason


def test_staged_regression_never_rotates():
    d = decide_rotation(_report(passed=False, tdi=0.0), "staged")
    assert not d.rotate


def test_manual_regression_never_rotates_even_with_update():
    d = decide_rotation(_report(passed=False), "manual", explicit_update=True)
    assert not d.rotate
