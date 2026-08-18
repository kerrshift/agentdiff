import pytest
from conftest import make_step, make_trace

from agentdiff.engine.aligner import align_traces
from agentdiff.engine.comparator import compare
from agentdiff.engine.loop_detector import detect_graph_cycles
from agentdiff.engine.metrics import calculate_tdi
from agentdiff.models.report import StepDiffStatus

# ── Empty & trivial traces ────────────────────────────────────────────────────


def test_compare_both_empty():
    report = compare(make_trace("b", []), make_trace("c", []))
    assert report.trajectory_divergence_index == 0.0
    assert report.baseline_wei == 0.0
    assert report.candidate_wei == 0.0
    assert report.passed is True


def test_compare_empty_vs_nonempty():
    candidate = make_trace("c", [make_step("fetch"), make_step("query")])
    report = compare(make_trace("b", []), candidate)
    # Everything added -> maximal divergence
    assert report.trajectory_divergence_index == 1.0
    assert len(report.step_diffs) == 2
    assert all(d.diff_status == StepDiffStatus.ADDED for d in report.step_diffs)


def test_compare_nonempty_vs_empty():
    baseline = make_trace("b", [make_step("fetch"), make_step("query")])
    report = compare(baseline, make_trace("c", []))
    assert report.trajectory_divergence_index == 1.0
    assert all(d.diff_status == StepDiffStatus.REMOVED for d in report.step_diffs)


def test_compare_single_identical_step():
    baseline = make_trace("b", [make_step("fetch")])
    report = compare(baseline, make_trace("c", [make_step("fetch")]))
    assert report.trajectory_divergence_index == 0.0
    assert len(report.step_diffs) == 1
    assert report.step_diffs[0].diff_status == StepDiffStatus.MATCHED


# ── Metric input validation ──────────────────────────────────────────────────


@pytest.mark.parametrize("a,b,lcs", [(0, 1, -1), (1, -1, 1), (-1, 0, 0), (1, 1, -5)])
def test_tdi_rejects_negative_counts(a, b, lcs):
    with pytest.raises(ValueError):
        calculate_tdi(a, b, lcs)


def test_tdi_clamps_oversized_lcs():
    assert 0.0 <= calculate_tdi(3, 5, 100) <= 1.0


# ── Graph cycle edge cases ────────────────────────────────────────────────────


def test_self_referential_step_is_detected_as_cycle():
    trace = make_trace(
        "t",
        [make_step("fetch", step_id="node1", parent_id="node1")],
    )
    cycles = detect_graph_cycles(trace)
    assert any("node1" in cycle for cycle in cycles)


def test_no_spurious_cycles():
    trace = make_trace(
        "t",
        [
            make_step("a", parent_id="root"),
            make_step("b", parent_id="step-0"),
        ],
    )
    assert detect_graph_cycles(trace) == []


# ── Duplicate step ids are rejected, not silently dropped ────────────────────


def test_duplicate_step_id_raises_on_compare():
    baseline = make_trace(
        "b",
        [make_step("a", step_id="dup"), make_step("b", step_id="dup")],
    )
    candidate = make_trace("c", [make_step("a", step_id="dup")])
    with pytest.raises(ValueError):
        compare(baseline, candidate)


def test_duplicate_step_id_raises_on_alignment():
    trace = make_trace(
        "t",
        [make_step("a", step_id="dup"), make_step("b", step_id="dup")],
    )
    with pytest.raises(ValueError):
        align_traces(trace, trace)
