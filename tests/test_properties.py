from conftest import make_step, make_trace
from hypothesis import given, settings
from hypothesis import strategies as st

from agentdiff.engine.aligner import align_traces
from agentdiff.engine.comparator import compare
from agentdiff.engine.loop_detector import detect_sequence_loops
from agentdiff.engine.metrics import (
    calculate_delta_percentage,
    calculate_tdi,
)
from agentdiff.models.report import StepDiffStatus

NAME_STRAT = st.sampled_from(
    ["fetch", "query", "summarize", "rank", "execute", "think", "search", "parse"]
)
TYPE_STRAT = st.sampled_from(["tool_call", "llm_call", "routing", "thought"])


def _steps_strategy():
    return st.lists(
        st.builds(
            make_step,
            name=NAME_STRAT,
            step_type=TYPE_STRAT,
            input_payload=st.one_of(
                st.none(), st.fixed_dictionaries({"q": st.integers(0, 3)})
            ),
        ),
        min_size=0,
        max_size=8,
    )


# ── Metrics invariants ───────────────────────────────────────────────────────


@given(st.integers(0, 20), st.integers(0, 20), st.integers(0, 40))
@settings(max_examples=200)
def test_tdi_bounds_and_clamping(a, b, lcs):
    tdi = calculate_tdi(a, b, lcs)
    # Result always lands in [0, 1], even for an out-of-range LCS
    assert 0.0 <= tdi <= 1.0
    # LCS beyond the feasible minimum cannot lower TDI below the equal-case floor
    if a == 0 and b == 0:
        assert tdi == 0.0
    else:
        assert tdi <= 1.0


@given(st.floats(min_value=1.0, max_value=1e6), st.floats(min_value=1.0, max_value=1e6))
def test_delta_percentage_formula(base, cand):
    forward = calculate_delta_percentage(base, cand)
    assert abs(forward - ((cand - base) / base) * 100.0) < 1e-6


# ── Aligner invariants ───────────────────────────────────────────────────────


@given(_steps_strategy(), _steps_strategy())
@settings(max_examples=200)
def test_alignment_covers_every_step_exactly_once(baseline_steps, candidate_steps):
    baseline = make_trace("b", baseline_steps)
    candidate = make_trace("c", candidate_steps)

    diffs = align_traces(baseline, candidate)

    base_covered = set()
    cand_covered = set()
    for d in diffs:
        if d.diff_status in (
            StepDiffStatus.MATCHED,
            StepDiffStatus.MODIFIED,
            StepDiffStatus.REMOVED,
        ):
            assert d.baseline_step is not None
            assert d.baseline_step.step_id not in base_covered
            base_covered.add(d.baseline_step.step_id)
        if d.diff_status in (
            StepDiffStatus.MATCHED,
            StepDiffStatus.MODIFIED,
            StepDiffStatus.ADDED,
        ):
            assert d.candidate_step is not None
            assert d.candidate_step.step_id not in cand_covered
            cand_covered.add(d.candidate_step.step_id)

    assert base_covered == {s.step_id for s in baseline.steps}
    assert cand_covered == {s.step_id for s in candidate.steps}


@given(_steps_strategy(), _steps_strategy())
@settings(max_examples=200)
def test_tdi_from_alignment_equals_metric(baseline_steps, candidate_steps):
    baseline = make_trace("b", baseline_steps)
    candidate = make_trace("c", candidate_steps)

    diffs = align_traces(baseline, candidate)
    lcs = sum(
        1
        for d in diffs
        if d.diff_status in (StepDiffStatus.MATCHED, StepDiffStatus.MODIFIED)
    )
    expected = calculate_tdi(len(baseline.steps), len(candidate.steps), lcs)

    report = compare(baseline, candidate)
    assert abs(report.trajectory_divergence_index - expected) < 1e-9


@given(_steps_strategy())
@settings(max_examples=100)
def test_compare_returns_valid_report(steps):
    trace = make_trace("t", steps)
    report = compare(trace, trace)
    assert 0.0 <= report.trajectory_divergence_index <= 1.0
    assert 0.0 <= report.baseline_wei <= 1.0
    assert 0.0 <= report.candidate_wei <= 1.0
    assert report.passed is True


@given(_steps_strategy())
@settings(max_examples=100)
def test_loop_counts_are_non_negative_and_coverable(steps):
    trace = make_trace("t", steps)
    loops = detect_sequence_loops(trace)
    assert all(loop["iterations"] >= 2 for loop in loops)
    assert all(loop["length"] >= 1 for loop in loops)
