from conftest import make_step, make_trace

from agentdiff.engine.comparator import compare
from agentdiff.models.report import StepDiffStatus
from agentdiff.reporters.markdown import generate_markdown
from agentdiff.reporters.terminal import print_report, render_diff_table


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


def test_render_diff_table_has_expected_columns():
    table = render_diff_table(_report())
    rows = table.columns
    assert len(rows) == 5
    assert rows[1].header == "Step Name"


def test_render_diff_table_contains_rows():
    table = render_diff_table(_report())
    # baseline(cost 0.01) vs candidate(cost 0.02) with an added step
    assert table.row_count >= 2


def test_render_diff_table_lists_each_diff():
    baseline = make_trace("b", [make_step("fetch"), make_step("summarize")])
    candidate = make_trace(
        "c", [make_step("fetch"), make_step("summarize"), make_step("extra")]
    )
    table = render_diff_table(compare(baseline, candidate))
    # rows correspond 1:1 to step_diffs
    assert table.row_count == 3


def test_print_report_does_not_raise(capsys):
    print_report(_report())
    out = capsys.readouterr().out
    assert "Trajectory Divergence Index" in out


def test_print_report_shows_failed_status(capsys):
    report = _report()
    report.passed = False
    print_report(report)
    out = capsys.readouterr().out
    assert "FAILED" in out


def test_markdown_reports_pass_status():
    md = generate_markdown(_report())
    assert "PASSED" in md
    assert "Trajectory Divergence (TDI)" in md
    assert "Wasted Effort Index (WEI)" in md


def test_markdown_reports_failed_status():
    report = _report()
    report.passed = False
    assert "FAILED" in generate_markdown(report)


def test_markdown_lists_step_diffs():
    md = generate_markdown(_report())
    assert "MATCHED" in md
    assert "Step-by-Step Trajectory Diff" in md


def test_markdown_lists_loops_when_detected():
    candidate = make_trace("c", [make_step("a"), make_step("a"), make_step("b")])
    baseline = make_trace("b", [make_step("b")])
    report = compare(baseline, candidate)
    md = generate_markdown(report)
    assert "Warnings: Loops Detected" in md
    assert "Loop #1" in md


def test_markdown_no_loop_section_when_clean():
    steps = [make_step("a"), make_step("b")]
    report = compare(make_trace("b", steps), make_trace("c", steps))
    assert "Warnings: Loops Detected" not in generate_markdown(report)


def test_summary_contains_counts_per_status():
    report = _report()
    summary = report.summary()
    for status in StepDiffStatus:
        assert status.value.capitalize() in summary
