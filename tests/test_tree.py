from conftest import make_step, make_trace

from agentdiff.engine.comparator import compare
from agentdiff.engine.tree import render_tree
from agentdiff.models.step import StepStatus


def _matched_trace(n: int, prefix: str = "step"):
    return make_trace(
        "t",
        [make_step(f"{prefix}_{i}", step_type="llm_call") for i in range(n)],
    )


def test_clean_run_reports_no_divergence():
    t = _matched_trace(3)
    out = render_tree(compare(t, t))
    assert "No divergence" in out
    assert "baseline [3 steps] vs candidate [3 steps]" in out


def test_long_matched_run_is_collapsed():
    baseline = _matched_trace(6)
    candidate = make_trace(
        "c",
        [
            make_step("step_0", step_type="llm_call"),
            make_step("step_1", step_type="llm_call"),
            make_step("new_action", step_type="tool_call"),
            make_step("step_2", step_type="llm_call"),
            make_step("step_3", step_type="llm_call"),
            make_step("step_4", step_type="llm_call"),
        ],
    )
    out = render_tree(compare(baseline, candidate))
    assert "· · · 3 matched step(s) · · ·" in out
    assert "new_action" in out
    assert "added — absent in baseline" in out


def test_short_matched_run_rendered_individually():
    baseline = _matched_trace(2)
    candidate = make_trace(
        "c",
        [
            make_step("step_0", step_type="llm_call"),
            make_step("other", step_type="tool_call"),
        ],
    )
    out = render_tree(compare(baseline, candidate))
    assert "· · ·" not in out
    assert "other" in out


def test_added_removed_modified_all_surface():
    baseline = make_trace(
        "b",
        [make_step("a"), make_step("b"), make_step("c", status=StepStatus.SUCCESS)],
    )
    candidate = make_trace(
        "c",
        [
            make_step("a"),
            make_step("b", status=StepStatus.ERROR, error_message="boom"),
            make_step("d"),
        ],
    )
    out = render_tree(compare(baseline, candidate))
    assert "added — absent in baseline" in out
    assert "removed — absent in candidate" in out
    assert "changed" in out


def test_output_capped_with_trailer():
    baseline = _matched_trace(30)
    candidate = make_trace(
        "c",
        [make_step(f"x_{i}", step_type="llm_call") for i in range(30)],
    )
    report = compare(baseline, candidate)
    out = render_tree(report, max_lines=10)
    lines = out.splitlines()
    assert len(lines) <= 12  # header + <=10 body lines + trailer
    assert "omitted" in lines[-1]


def test_color_flag_adds_ansi():
    baseline = _matched_trace(1)
    candidate = make_trace(
        "c",
        [make_step("a"), make_step("zzz", step_type="tool_call")],
    )
    report = compare(baseline, candidate)
    plain = render_tree(report, color=False)
    colored = render_tree(report, color=True)
    assert "\x1b[" not in plain
    assert "\x1b[" in colored
