"""Output parity (E2) + stable DiffReport JSON contract (C1).

All three output formats (terminal, markdown, JSON) must convey the same core
facts, and the JSON contract must round-trip losslessly through the model.
"""

import json

from conftest import make_step, make_trace

from agentdiff.engine.comparator import compare
from agentdiff.models.report import DiffReport
from agentdiff.reporters.markdown import generate_markdown
from agentdiff.reporters.terminal import print_report


def _report():
    baseline = make_trace(
        "b",
        [
            make_step("fetch"),
            make_step("summarize", cost_usd=0.01),
        ],
    )
    candidate = make_trace(
        "c",
        [
            make_step("fetch"),
            make_step("summarize", cost_usd=0.02),
            make_step("extra"),
        ],
    )
    return compare(baseline, candidate)


def test_formats_agree_on_tdi(capsys):
    report = _report()
    print_report(report)
    terminal = capsys.readouterr().out
    md = generate_markdown(report)
    j = json.loads(report.model_dump_json())

    assert f"{report.trajectory_divergence_index:.4f}" in terminal
    assert f"{report.trajectory_divergence_index:.4f}" in md
    assert (
        abs(j["trajectory_divergence_index"] - report.trajectory_divergence_index)
        < 1e-9
    )


def test_formats_agree_on_pass_status(capsys):
    report = _report()
    report.passed = False
    print_report(report)
    terminal = capsys.readouterr().out
    assert "FAILED" in terminal
    assert "FAILED" in generate_markdown(report)
    assert json.loads(report.model_dump_json())["passed"] is False


def test_report_json_round_trips_losslessly():
    report = _report()
    restored = DiffReport.model_validate(json.loads(report.model_dump_json()))
    assert restored == report
    assert restored.summary() == report.summary()


def test_report_json_contract_shape_is_stable():
    data = json.loads(_report().model_dump_json())
    assert set(data) >= {
        "baseline_id",
        "candidate_id",
        "trajectory_divergence_index",
        "baseline_wei",
        "candidate_wei",
        "loops_detected",
        "cost_delta_percentage",
        "latency_delta_percentage",
        "token_delta_percentage",
        "step_diffs",
        "passed",
    }


def test_trace_json_round_trips_with_schema_version():
    from agentdiff.adapters import GenericAdapter

    trace = make_trace("t", [make_step("fetch"), make_step("query")])
    restored = GenericAdapter.from_dict(json.loads(trace.model_dump_json()))
    assert restored.schema_version == trace.schema_version
    assert restored.schema_version == "1.0.0"
    assert restored == trace
