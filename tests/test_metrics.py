from conftest import make_step

from agentdiff.engine.metrics import (
    calculate_delta_percentage,
    calculate_tdi,
    calculate_wei,
)
from agentdiff.models.step import StepStatus


def test_tdi_identical():
    assert calculate_tdi(4, 4, 4) == 0.0


def test_tdi_completely_divergent():
    assert calculate_tdi(4, 4, 0) == 1.0


def test_tdi_partial_overlap():
    assert abs(calculate_tdi(3, 4, 2) - (1.0 - 4.0 / 7.0)) < 1e-9


def test_tdi_zero_total_steps():
    assert calculate_tdi(0, 0, 0) == 0.0


def test_tdi_asymmetric_lengths():
    assert abs(calculate_tdi(6, 2, 2) - (1.0 - 4.0 / 8.0)) < 1e-9


def test_wei_no_waste():
    steps = [make_step("a"), make_step("b")]
    assert calculate_wei(steps) == 0.0


def test_wei_all_wasted():
    steps = [
        make_step("a", status=StepStatus.ERROR),
        make_step("b", status=StepStatus.RETRY),
        make_step("c", status=StepStatus.ABANDONED),
    ]
    assert calculate_wei(steps) == 1.0


def test_wei_mixed():
    steps = [
        make_step("a", status=StepStatus.SUCCESS),
        make_step("b", status=StepStatus.ERROR),
        make_step("c", status=StepStatus.RETRY),
        make_step("d", status=StepStatus.ABANDONED),
        make_step("e", status=StepStatus.SUCCESS),
    ]
    assert calculate_wei(steps) == 3 / 5


def test_wei_empty():
    assert calculate_wei([]) == 0.0


def test_delta_percentage_increase():
    assert calculate_delta_percentage(100.0, 150.0) == 50.0


def test_delta_percentage_decrease():
    assert calculate_delta_percentage(100.0, 80.0) == -20.0


def test_delta_percentage_no_change():
    assert calculate_delta_percentage(100.0, 100.0) == 0.0


def test_delta_percentage_zero_baseline_and_candidate():
    assert calculate_delta_percentage(0.0, 0.0) == 0.0


def test_delta_percentage_zero_baseline_positive_spike():
    assert calculate_delta_percentage(0.0, 5.0) == 100.0
