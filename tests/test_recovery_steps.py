import json

import pytest
from conftest import make_step, make_trace

from agentdiff.engine.comparator import compare
from agentdiff.engine.explanations import generate_explanations
from agentdiff.engine.metrics import (
    calculate_recovery_step_ratio,
    compute_recovery_steps,
)
from agentdiff.models.report import DiffReport, StepDiff, StepDiffStatus
from agentdiff.testing import assert_no_regressions


def _diff(
    name,
    diff_status,
    base_status="success",
    cand_status="success",
):
    """Builds a StepDiff with one step per side (or candidate-only for ADDED)."""
    baseline_step = None
    candidate_step = None
    if diff_status != StepDiffStatus.ADDED:
        baseline_step = make_step(name, status=base_status)
    if diff_status != StepDiffStatus.REMOVED:
        candidate_step = make_step(name, status=cand_status)
    return StepDiff(
        step_name=name,
        diff_status=diff_status,
        baseline_step=baseline_step,
        candidate_step=candidate_step,
    )


def _report(**kwargs) -> DiffReport:
    defaults = dict(
        baseline_id="b",
        candidate_id="c",
        trajectory_divergence_index=0.0,
        baseline_wei=0.0,
        candidate_wei=0.0,
        cost_delta_percentage=0.0,
        latency_delta_percentage=0.0,
        token_delta_percentage=0.0,
    )
    defaults.update(kwargs)
    return DiffReport(**defaults)


# --- compute_recovery_steps --------------------------------------------------


def test_no_errors_means_zero_recovery():
    diffs = [
        _diff("a", StepDiffStatus.MATCHED),
        _diff("b", StepDiffStatus.MATCHED),
    ]
    assert compute_recovery_steps(diffs, "candidate") == 0
    assert compute_recovery_steps(diffs, "baseline") == 0


def test_immediate_matched_retry_counts_one():
    # error -> successful retry that re-aligns: the retry is recovery effort.
    diffs = [
        _diff("fetch", StepDiffStatus.MATCHED),
        _diff("query", StepDiffStatus.MODIFIED, cand_status="error"),
        _diff("query", StepDiffStatus.MATCHED),
        _diff("synthesize", StepDiffStatus.MATCHED),
    ]
    assert compute_recovery_steps(diffs, "candidate") == 1
    assert compute_recovery_steps(diffs, "baseline") == 0  # only candidate failed


def test_wasted_cluster_then_added_steps_then_rematch():
    diffs = [
        _diff("search", StepDiffStatus.MATCHED),
        _diff("search", StepDiffStatus.ADDED, cand_status="error"),
        _diff("search", StepDiffStatus.ADDED),  # extra failed-path work
        _diff("search", StepDiffStatus.MATCHED),  # back on track
        _diff("synthesize", StepDiffStatus.MATCHED),
    ]
    # added step + realigning match = 2 recovery steps; synthesize is free.
    assert compute_recovery_steps(diffs, "candidate") == 2


def test_trailing_unrecovered_successes_all_count():
    diffs = [
        _diff("a", StepDiffStatus.MATCHED),
        _diff("b", StepDiffStatus.MATCHED, cand_status="abandoned"),
        _diff("c", StepDiffStatus.ADDED),
        _diff("d", StepDiffStatus.ADDED),
    ]
    assert compute_recovery_steps(diffs, "candidate") == 2


def test_multiple_error_clusters_sum():
    diffs = [
        _diff("a", StepDiffStatus.MATCHED),
        _diff("x", StepDiffStatus.ADDED, cand_status="retry"),
        _diff("b", StepDiffStatus.MATCHED),  # cluster 1 closed: 1 step
        _diff("y", StepDiffStatus.ADDED, cand_status="error"),
        _diff("z", StepDiffStatus.ADDED, cand_status="error"),
        _diff("c", StepDiffStatus.MATCHED),  # cluster 2 closed: 1 step
    ]
    assert compute_recovery_steps(diffs, "candidate") == 2


def test_baseline_side_counts_its_own_failures():
    diffs = [
        _diff("a", StepDiffStatus.MATCHED, base_status="error"),
        _diff("a", StepDiffStatus.MATCHED),
        _diff("b", StepDiffStatus.MATCHED),
    ]
    assert compute_recovery_steps(diffs, "baseline") == 1
    assert compute_recovery_steps(diffs, "candidate") == 0


def test_empty_diffs_and_invalid_side():
    assert compute_recovery_steps([], "candidate") == 0
    with pytest.raises(ValueError):
        compute_recovery_steps([], "both")


# --- calculate_recovery_step_ratio -------------------------------------------


def test_ratio_zero_when_both_clean():
    assert calculate_recovery_step_ratio(0, 0) == 0.0


def test_ratio_normal_case():
    assert calculate_recovery_step_ratio(4, 2) == 2.0


def test_ratio_falls_back_to_raw_count_when_baseline_clean():
    assert calculate_recovery_step_ratio(3, 0) == 3.0


# --- comparator integration ----------------------------------------------------


def test_compare_populates_recovery_fields():
    baseline = make_trace(
        "base",
        [make_step("fetch"), make_step("query"), make_step("synthesize")],
    )
    candidate = make_trace(
        "cand",
        [
            make_step("fetch"),
            make_step("query", status="error", error_message="boom"),
            make_step("extra_check"),
            make_step("query"),
            make_step("synthesize"),
        ],
    )
    report = compare(baseline, candidate)

    expected_cand = compute_recovery_steps(report.step_diffs, "candidate")
    assert report.baseline_recovery_steps == 0
    assert report.candidate_recovery_steps >= 1
    assert report.candidate_recovery_steps == expected_cand
    assert report.recovery_step_ratio == calculate_recovery_step_ratio(
        report.candidate_recovery_steps, report.baseline_recovery_steps
    )


def test_clean_comparison_has_zero_recovery():
    steps = [make_step("a"), make_step("b")]
    report = compare(make_trace("b", steps), make_trace("c", steps))
    assert report.baseline_recovery_steps == 0
    assert report.candidate_recovery_steps == 0
    assert report.recovery_step_ratio == 0.0


def test_report_json_round_trips_with_recovery_fields():
    report = _report(
        baseline_recovery_steps=2,
        candidate_recovery_steps=5,
        recovery_step_ratio=2.5,
    )
    restored = DiffReport.model_validate(json.loads(report.model_dump_json()))
    assert restored == report
    assert restored.summary() == report.summary()


def test_summary_includes_recovery_block():
    summary = _report(
        baseline_recovery_steps=1,
        candidate_recovery_steps=4,
        recovery_step_ratio=4.0,
    ).summary()
    assert "Recovery Effort:" in summary
    assert "Recovery Step Ratio (RSR): 4.0000" in summary


# --- assertion gate (opt-in) ---------------------------------------------------


def test_rsr_gate_disabled_by_default():
    report = _report(candidate_recovery_steps=9, recovery_step_ratio=99.0)
    assert_no_regressions(report)  # should not raise


def test_rsr_gate_triggers_when_enabled():
    report = _report(
        baseline_recovery_steps=1,
        candidate_recovery_steps=5,
        recovery_step_ratio=5.0,
        passed=False,
    )
    with pytest.raises(AssertionError) as excinfo:
        assert_no_regressions(report, max_recovery_step_ratio=2.0)
    message = str(excinfo.value)
    assert "Recovery Step Ratio" in message
    assert "vs\nbaseline 1" in message or "vs baseline 1" in message.replace("\n", " ")


def test_rsr_gate_passes_within_threshold():
    report = _report(
        baseline_recovery_steps=2,
        candidate_recovery_steps=3,
        recovery_step_ratio=1.5,
    )
    assert_no_regressions(report, max_recovery_step_ratio=1.5)  # not above


# --- explanations ----------------------------------------------------------------


def test_explanation_warns_when_recovery_more_expensive():
    report = _report(
        baseline_recovery_steps=1,
        candidate_recovery_steps=4,
        recovery_step_ratio=4.0,
    )
    findings = [f for f in generate_explanations(report) if f.category == "recovery"]
    assert len(findings) == 1
    assert findings[0].severity == "warning"
    assert "recover from errors vs 1" in findings[0].message


def test_explanation_info_when_within_baseline_budget():
    report = _report(
        baseline_recovery_steps=3,
        candidate_recovery_steps=2,
        recovery_step_ratio=3 / 2,
    )
    findings = [f for f in generate_explanations(report) if f.category == "recovery"]
    assert len(findings) == 1
    assert findings[0].severity == "info"


def test_no_recovery_explanation_when_candidate_clean():
    report = _report()
    findings = [f for f in generate_explanations(report) if f.category == "recovery"]
    assert findings == []


# --- config plumbing --------------------------------------------------------------


def test_config_loads_new_thresholds():
    from agentdiff.config import AgentDiffConfig

    cfg = AgentDiffConfig.from_dict(
        {
            "cli": {"max_recovery_ratio": 1.25},
            "assertions": {"max_recovery_step_ratio": 2.5},
        }
    )
    assert cfg.cli.max_recovery_ratio == 1.25
    assert cfg.assertions.max_recovery_step_ratio == 2.5


def test_config_defaults_leave_gates_opt_in():
    from agentdiff.config import AgentDiffConfig

    cfg = AgentDiffConfig()
    assert cfg.cli.max_recovery_ratio is None
    assert cfg.assertions.max_recovery_step_ratio is None
