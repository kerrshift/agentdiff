import json
import threading
import time

import pytest
from conftest import make_step, make_trace

from agentdiff.engine.suite import (
    GateThresholds,
    Scenario,
    run_scenario,
    run_scenarios,
)


def _trace_pair():
    """A genuinely clean pair: identical step sequences."""
    baseline = make_trace("base", [make_step("fetch"), make_step("synthesize")])
    candidate = make_trace("cand", [make_step("fetch"), make_step("synthesize")])
    return baseline, candidate


def test_all_clean_scenarios_pass():
    b, c = _trace_pair()
    suite = run_scenarios(
        [
            Scenario("one", b, c),
            Scenario("two", b, c),
        ]
    )
    assert suite.passed is True
    assert suite.counts == {"passed": 2, "failed": 0, "errors": 0}
    assert all(r.report is not None for r in suite.results)


def test_failing_scenario_does_not_abort_suite():
    b, c = _trace_pair()
    divergent = make_trace("cand2", [make_step("x"), make_step("y"), make_step("z")])
    suite = run_scenarios(
        [
            Scenario("clean_one", b, c),
            Scenario("divergent", b, divergent, GateThresholds(max_divergence=0.05)),
            Scenario("clean_two", b, c),
        ]
    )
    assert suite.passed is False
    assert suite.counts["passed"] == 2
    assert suite.counts["failed"] == 1
    assert [r.name for r in suite.results] == ["clean_one", "divergent", "clean_two"]
    failed = suite.results[1]
    assert failed.violations and "TDI" in failed.violations[0]
    assert failed.report.passed is False


def test_per_scenario_thresholds_are_independent():
    baseline = make_trace("base", [make_step("fetch"), make_step("synthesize")])
    candidate = make_trace("cand", [make_step("fetch"), make_step("summarize")])
    # TDI is 0.5 for this pair: inside the loose gate, outside the tight one.
    loose = run_scenario(
        Scenario("loose", baseline, candidate, GateThresholds(max_divergence=1.0))
    )
    tight = run_scenario(
        Scenario("tight", baseline, candidate, GateThresholds(max_divergence=0.01))
    )
    assert loose.passed is True
    assert tight.passed is False


def test_missing_trace_file_becomes_error_result(tmp_path):
    scenario = Scenario(
        "bad_path",
        str(tmp_path / "nope.json"),
        str(tmp_path / "also_nope.json"),
    )
    result = run_scenario(scenario)
    assert result.passed is False
    assert result.status == "ERROR"
    assert result.report is None
    assert "failed to load traces" in result.error

    suite = run_scenarios([scenario])
    assert suite.passed is False
    assert suite.counts["errors"] == 1


def test_malformed_json_is_an_error_not_a_crash(tmp_path):
    bad = tmp_path / "bad.json"
    bad.write_text("{not json")
    good_path = tmp_path / "good.json"
    good_path.write_text(json.dumps(make_trace("g", [make_step("a")]).model_dump()))

    suite = run_scenarios([Scenario("mixed", str(bad), str(good_path))])
    assert suite.counts["errors"] == 1
    assert "failed to load traces" in suite.results[0].error


def test_summary_lists_each_scenario_with_status():
    b, c = _trace_pair()
    divergent = make_trace("cand3", [make_step("p"), make_step("q"), make_step("r")])
    suite = run_scenarios(
        [
            Scenario("ok_flow", b, c),
            Scenario("bad_flow", b, divergent),
            Scenario("broken", "/does/not/exist.json", "/nor/does/this.json"),
        ]
    )
    text = suite.summary()
    assert "AGENTDIFF SUITE SUMMARY" in text
    assert "[PASSED] ok_flow" in text
    assert "[FAILED] bad_flow" in text
    assert "[ ERROR] broken" in text
    assert f"{suite.counts['passed']}/{len(suite.results)} passed" in text


def test_rsr_gate_flows_through_thresholds():
    from agentdiff.engine.comparator import compare as real_compare
    from agentdiff.engine.metrics import compute_recovery_steps

    baseline = make_trace(
        "b", [make_step("fetch"), make_step("query"), make_step("done")]
    )
    candidate = make_trace(
        "c",
        [
            make_step("fetch"),
            make_step("query", status="error"),
            make_step("verify"),
            make_step("query"),
            make_step("done"),
        ],
    )
    # Generous gates except RSR, so only the recovery gate can fail it.
    generous = dict(max_wasted_effort=0.5, max_cost_increase_pct=200.0)
    thresholds = GateThresholds(max_recovery_step_ratio=None, **generous)
    result = run_scenario(Scenario("rsr_off", baseline, candidate, thresholds))
    assert result.passed is True  # opt-in gate stays off

    strict = GateThresholds(max_recovery_step_ratio=0.5, **generous)
    result = run_scenario(Scenario("rsr_on", baseline, candidate, strict))
    assert result.passed is False
    assert any("Recovery Step Ratio" in v for v in result.violations)

    # sanity: the scenario genuinely has recovery effort
    report = real_compare(baseline, candidate)
    assert compute_recovery_steps(report.step_diffs, "candidate") >= 1


def test_strict_tool_signatures_flag_forwarded():
    b = make_trace("b", [make_step("fetch", input_payload={"q": "ny"})])
    c = make_trace("c", [make_step("fetch", input_payload={"q": "ca"})])
    lenient = run_scenario(Scenario("lenient", b, c))
    strict = run_scenario(Scenario("strict", b, c), strict_tool_signatures=True)
    assert lenient.report.trajectory_divergence_index == 0.0
    assert strict.report.trajectory_divergence_index > 0.0


def test_empty_suite_passes_trivially():
    suite = run_scenarios([])
    assert suite.passed is True
    assert suite.summary().count("[") == 0


# --- D4: parallel workers -------------------------------------------------------


def _numbered_scenarios(n):
    b, c = _trace_pair()
    return [Scenario(f"s{i}", b, c) for i in range(n)]


def test_parallel_results_match_sequential_results():
    scenarios = _numbered_scenarios(6)
    sequential = run_scenarios(scenarios)
    parallel = run_scenarios(scenarios, workers=3)

    assert [r.name for r in parallel.results] == [r.name for r in sequential.results]
    assert [r.passed for r in parallel.results] == [
        r.passed for r in sequential.results
    ]
    assert [r.report.model_dump() for r in parallel.results] == [
        r.report.model_dump() for r in sequential.results
    ]


def test_parallel_preserves_input_order_despite_completion_order(monkeypatch):
    import agentdiff.engine.suite as suite_mod

    real_run = suite_mod.run_scenario
    lock = threading.Lock()

    def slow_first(scenario, **kwargs):
        result = real_run(scenario, **kwargs)
        # The first scenario sleeps longest yet must still be reported first.
        if scenario.name == "s0":
            time.sleep(0.15)
        with lock:
            pass
        return result

    monkeypatch.setattr(suite_mod, "run_scenario", slow_first)
    suite = suite_mod.run_scenarios(_numbered_scenarios(4), workers=4)
    assert [r.name for r in suite.results] == ["s0", "s1", "s2", "s3"]


def test_parallel_errors_are_contained():
    b, c = _trace_pair()
    scenarios = [
        Scenario("ok", b, c),
        Scenario("bad", "/does/not/exist.json", "/nor/does/this.json"),
        Scenario("ok2", b, c),
    ]
    suite = run_scenarios(scenarios, workers=2)
    assert suite.counts == {"passed": 2, "failed": 0, "errors": 1}
    assert suite.results[1].status == "ERROR"
    assert suite.passed is False


def test_invalid_workers_raises():
    with pytest.raises(ValueError, match="workers"):
        run_scenarios(_numbered_scenarios(2), workers=0)


def test_single_scenario_with_many_workers_is_sequential_path():
    b, c = _trace_pair()
    suite = run_scenarios([Scenario("solo", b, c)], workers=8)
    assert suite.passed is True
