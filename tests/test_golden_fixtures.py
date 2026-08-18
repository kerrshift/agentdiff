"""Golden/reference trace fixtures (I4).

These committed JSON traces pin realistic engine behavior. If the diff engine
changes such that these known values move, the golden test fails loudly.
"""

from pathlib import Path

from agentdiff.engine.comparator import compare
from agentdiff.loader import load_trace

FIXTURES = Path(__file__).parent / "fixtures"


def _load(name):
    return load_trace(str(FIXTURES / f"{name}.json"))


def test_clean_baseline_has_zero_self_divergence():
    report = compare(_load("baseline_clean"), _load("baseline_clean"))
    assert report.trajectory_divergence_index == 0.0
    assert report.loops_detected == []
    assert report.passed is True


def test_loop_candidate_diverges_and_loops():
    report = compare(_load("baseline_clean"), _load("candidate_loop"))
    assert len(report.loops_detected) >= 1
    # 4 vs 6 steps, LCS 4 -> TDI = 1 - 2*4/10 = 0.2
    assert abs(report.trajectory_divergence_index - 0.2) < 1e-9


def test_error_candidate_raises_wei():
    report = compare(_load("baseline_clean"), _load("candidate_error_recovery"))
    assert report.candidate_wei > 0.0
    assert report.baseline_wei == 0.0


def test_golden_fixtures_are_self_describing():
    trace = _load("baseline_clean")
    assert trace.schema_version == "1.0.0"
    assert trace.agent_name == "mock_agent"
