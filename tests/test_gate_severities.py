"""Pillar 2 — decoupled failure modes: hard gates vs soft warnings."""

import json

from conftest import make_step, make_trace
from typer.testing import CliRunner

from agentdiff.cli import app
from agentdiff.config import AgentDiffConfig, InvariantsConfig, load_config
from agentdiff.engine.comparator import compare
from agentdiff.engine.loop_detector import (
    count_tool_calls,
    detect_identical_call_loops,
)
from agentdiff.governance import diff_gate_thresholds, provenance_line
from agentdiff.models.report import GateSeverity
from agentdiff.testing.assertions import evaluate_gate, evaluate_report


def _write_trace(tmp_path, name, trace):
    path = tmp_path / name
    path.write_text(trace.model_dump_json())
    return str(path)


class TestIdenticalCallLoopDetection:
    """Non-consecutive runaway loops: identical inputs + stagnant outputs."""

    def test_non_consecutive_identical_stagnant_calls_detected(self):
        trace = make_trace(
            "t",
            [
                make_step(
                    "search",
                    step_index=0,
                    input_payload={"q": "x"},
                    output_payload={"r": 1},
                ),
                make_step("other", step_index=1),
                make_step(
                    "search",
                    step_index=2,
                    input_payload={"q": "x"},
                    output_payload={"r": 1},
                ),
            ],
        )
        loops = detect_identical_call_loops(trace)
        assert len(loops) == 1
        assert loops[0]["steps"] == ["search"]
        assert loops[0]["iterations"] == 2
        assert loops[0]["stagnant"] is True

    def test_identical_inputs_fresh_outputs_not_a_loop(self):
        trace = make_trace(
            "t",
            [
                make_step(
                    "search",
                    step_index=0,
                    input_payload={"q": "x"},
                    output_payload={"r": 1},
                ),
                make_step(
                    "search",
                    step_index=1,
                    input_payload={"q": "x"},
                    output_payload={"r": 2},
                ),
            ],
        )
        assert detect_identical_call_loops(trace) == []

    def test_different_inputs_not_a_loop(self):
        trace = make_trace(
            "t",
            [
                make_step(
                    "search",
                    step_index=0,
                    input_payload={"q": "a"},
                    output_payload={"r": 1},
                ),
                make_step(
                    "search",
                    step_index=1,
                    input_payload={"q": "b"},
                    output_payload={"r": 1},
                ),
            ],
        )
        assert detect_identical_call_loops(trace) == []

    def test_single_call_never_a_loop(self):
        trace = make_trace("t", [make_step("a")])
        assert detect_identical_call_loops(trace) == []

    def test_report_records_invariant_facts(self):
        baseline = make_trace("b", [make_step("a")])
        candidate = make_trace(
            "c",
            [
                make_step("loop", step_index=0),
                make_step("mid", step_index=1),
                make_step("loop", step_index=2),
            ],
        )
        report = compare(baseline, candidate)
        assert len(report.identical_call_loops) == 1
        assert report.tool_call_counts == {"loop": 2, "mid": 1}


class TestGateSeverities:
    """evaluate_gate: hard violations block, soft warnings never do."""

    def test_tool_loop_is_hard_by_default(self):
        baseline = make_trace("b", [make_step("a")])
        candidate = make_trace(
            "c",
            [
                make_step("loop", step_index=0),
                make_step("mid", step_index=1),
                make_step("loop", step_index=2),
            ],
        )
        report = compare(baseline, candidate)
        gate = evaluate_gate(report, max_divergence=1.0, max_cost_increase_pct=1000.0)
        assert not gate.passed
        assert gate.violations[0].code == "tool_loop"
        assert gate.violations[0].severity == GateSeverity.HARD
        assert gate.warnings == []

    def test_tool_loop_tolerated_when_disabled(self):
        baseline = make_trace("b", [make_step("a")])
        candidate = make_trace(
            "c",
            [
                make_step("loop", step_index=0),
                make_step("mid", step_index=1),
                make_step("loop", step_index=2),
            ],
        )
        report = compare(baseline, candidate)
        gate = evaluate_gate(
            report,
            max_divergence=1.0,
            max_cost_increase_pct=1000.0,
            fail_on_identical_loops=False,
        )
        assert gate.passed

    def test_max_tool_repeats_cap(self):
        baseline = make_trace("b", [make_step("a")])
        candidate = make_trace(
            "c",
            [
                make_step(
                    "q", step_index=0, input_payload={"n": 1}, output_payload={"o": 1}
                ),
                make_step("other", step_index=1),
                make_step(
                    "q", step_index=2, input_payload={"n": 2}, output_payload={"o": 2}
                ),
            ],
        )
        report = compare(baseline, candidate)
        # distinct inputs → no identical-call loop, but the cap still bites
        assert report.identical_call_loops == []
        assert report.loops_detected == []
        gate = evaluate_gate(
            report,
            max_divergence=1.0,
            max_cost_increase_pct=1000.0,
            max_tool_repeats=1,
        )
        assert not gate.passed
        assert gate.violations[0].code == "tool_repeats"
        assert "called 2 time(s)" in gate.violations[0].message

    def test_max_tool_repeats_disabled_by_default(self):
        baseline = make_trace("b", [make_step("a")])
        candidate = make_trace(
            "c",
            [
                make_step(
                    "q", step_index=0, input_payload={"n": 1}, output_payload={"o": 1}
                ),
                make_step("other", step_index=1),
                make_step(
                    "q", step_index=2, input_payload={"n": 2}, output_payload={"o": 2}
                ),
                make_step("mid", step_index=3),
                make_step(
                    "q", step_index=4, input_payload={"n": 3}, output_payload={"o": 3}
                ),
            ],
        )
        report = compare(baseline, candidate)
        assert evaluate_gate(
            report, max_divergence=1.0, max_cost_increase_pct=1000.0
        ).passed

    def test_path_drift_is_soft_warning_on_pass(self):
        baseline = make_trace("b", [make_step("a"), make_step("b")])
        candidate = make_trace("c", [make_step("a"), make_step("b"), make_step("c")])
        report = compare(baseline, candidate)
        gate = evaluate_gate(report, max_divergence=0.5, max_cost_increase_pct=1000.0)
        assert gate.passed
        assert len(gate.warnings) == 1
        assert gate.warnings[0].code == "path_drift"
        assert gate.warnings[0].severity == GateSeverity.SOFT
        assert "alternate valid route" in gate.warnings[0].message

    def test_no_warning_when_no_drift(self):
        steps = [make_step("a"), make_step("b")]
        report = compare(make_trace("b", steps), make_trace("c", steps))
        gate = evaluate_gate(report)
        assert gate.passed
        assert gate.warnings == []

    def test_no_warnings_when_violations_present(self):
        baseline = make_trace("b", [make_step("a")])
        candidate = make_trace("c", [make_step("x"), make_step("y"), make_step("z")])
        report = compare(baseline, candidate)
        gate = evaluate_gate(report, max_divergence=0.1)
        assert gate.violations
        assert gate.warnings == []

    def test_violation_codes_are_stable(self):
        baseline = make_trace("b", [make_step("a", cost_usd=1.0)])
        candidate = make_trace("c", [make_step("x", cost_usd=5.0)])
        report = compare(baseline, candidate)
        gate = evaluate_gate(report, max_divergence=0.1, max_cost_increase_pct=10.0)
        codes = {v.code for v in gate.violations}
        assert codes == {"divergence", "cost_spike"}


class TestLegacyEvaluateReportCompat:
    """evaluate_report keeps its historical messages and string contract."""

    def test_legacy_loop_message_preserved(self):
        trace = make_trace("t", [make_step("a"), make_step("a"), make_step("b")])
        baseline = make_trace("b", [make_step("b")])
        report = compare(baseline, trace)
        errors = evaluate_report(report)
        assert any("Detected 1 loops" in e for e in errors)
        assert any("allow_loops is False" in e for e in errors)

    def test_allow_loops_tolerates_identical_call_loops_too(self):
        trace = make_trace("t", [make_step("a"), make_step("a"), make_step("b")])
        report = compare(trace, trace)
        assert evaluate_report(report, allow_loops=True) == []

    def test_divergence_message_unchanged(self):
        baseline = make_trace("b", [make_step("a"), make_step("b")])
        candidate = make_trace("c", [make_step("x"), make_step("y"), make_step("z")])
        report = compare(baseline, candidate)
        errors = evaluate_report(report, max_divergence=0.10)
        assert any("Trajectory Divergence Index" in e for e in errors)


class TestInvariantsConfig:
    def test_defaults(self):
        cfg = AgentDiffConfig()
        assert cfg.invariants.fail_on_identical_loops is True
        assert cfg.invariants.max_tool_repeats is None

    def test_toml_section_loads(self, tmp_path):
        cfg_file = tmp_path / "agentdiff.toml"
        cfg_file.write_text(
            "[invariants]\nfail_on_identical_loops = false\nmax_tool_repeats = 3\n"
        )
        cfg = load_config(cfg_file)
        assert cfg.invariants.fail_on_identical_loops is False
        assert cfg.invariants.max_tool_repeats == 3

    def test_unknown_keys_still_ignored(self, tmp_path):
        cfg_file = tmp_path / "agentdiff.toml"
        cfg_file.write_text("[invariants]\nfuture_key = 1\n")
        cfg = load_config(cfg_file)
        assert cfg.invariants.fail_on_identical_loops is True


class TestGovernanceCoverage:
    def test_provenance_includes_invariants(self):
        line = provenance_line(AgentDiffConfig(), None)
        assert "fail_on_identical_loops=true" in line

    def test_provenance_shows_tool_repeat_cap_when_set(self, tmp_path):
        cfg_file = tmp_path / "agentdiff.toml"
        cfg_file.write_text("[invariants]\nmax_tool_repeats = 2\n")
        line = provenance_line(load_config(cfg_file), str(cfg_file))
        assert "max_tool_repeats=2" in line

    def test_threshold_change_flags_invariant_changes(self):
        old = AgentDiffConfig(invariants=InvariantsConfig(max_tool_repeats=1))
        new = AgentDiffConfig(invariants=InvariantsConfig(max_tool_repeats=5))
        changes = diff_gate_thresholds(old, new)
        flagged = {c.gate for c in changes}
        assert "max_tool_repeats" in flagged


class TestCliExitCodes:
    def test_soft_warning_does_not_flip_exit_code(self, tmp_path):
        base = _write_trace(
            tmp_path, "base.json", make_trace("b", [make_step("a"), make_step("b")])
        )
        cand = _write_trace(
            tmp_path,
            "cand.json",
            make_trace("c", [make_step("a"), make_step("b"), make_step("c")]),
        )
        result = CliRunner().invoke(
            app,
            [
                base,
                cand,
                "--fail-on-regression",
                "--max-divergence",
                "0.5",
                "--max-cost-delta",
                "100",
            ],
        )
        assert result.exit_code == 0
        assert "PASSED" in result.stdout

    def test_path_drift_renders_in_terminal(self, tmp_path):
        base = _write_trace(
            tmp_path, "base.json", make_trace("b", [make_step("a"), make_step("b")])
        )
        cand = _write_trace(
            tmp_path,
            "cand.json",
            make_trace("c", [make_step("a"), make_step("b"), make_step("c")]),
        )
        result = CliRunner().invoke(
            app, [base, cand, "--max-divergence", "0.5", "--max-cost-delta", "100"]
        )
        assert result.exit_code == 0
        assert "Soft Warnings" in result.stdout
        assert "Path drift" in result.stdout

    def test_identical_call_loop_blocks_by_default(self, tmp_path):
        base = _write_trace(tmp_path, "base.json", make_trace("b", [make_step("a")]))
        cand = _write_trace(
            tmp_path,
            "cand.json",
            make_trace(
                "c",
                [
                    make_step("loop", step_index=0),
                    make_step("mid", step_index=1),
                    make_step("loop", step_index=2),
                ],
            ),
        )
        result = CliRunner().invoke(
            app, [base, cand, "--fail-on-regression", "--max-divergence", "1.0"]
        )
        assert result.exit_code == 1
        assert "Cyclical tool loop" in result.stdout

    def test_allow_identical_loops_flag_unblocks(self, tmp_path):
        base = _write_trace(tmp_path, "base.json", make_trace("b", [make_step("a")]))
        cand = _write_trace(
            tmp_path,
            "cand.json",
            make_trace(
                "c",
                [
                    make_step("loop", step_index=0),
                    make_step("mid", step_index=1),
                    make_step("loop", step_index=2),
                ],
            ),
        )
        result = CliRunner().invoke(
            app,
            [
                base,
                cand,
                "--fail-on-regression",
                "--max-divergence",
                "1.0",
                "--max-cost-delta",
                "1000",
                "--allow-identical-loops",
            ],
        )
        assert result.exit_code == 0

    def test_max_tool_repeats_flag_blocks(self, tmp_path):
        base = _write_trace(tmp_path, "base.json", make_trace("b", [make_step("a")]))
        cand = _write_trace(
            tmp_path,
            "cand.json",
            make_trace(
                "c",
                [
                    make_step(
                        "q",
                        step_index=0,
                        input_payload={"n": 1},
                        output_payload={"o": 1},
                    ),
                    make_step(
                        "q",
                        step_index=1,
                        input_payload={"n": 2},
                        output_payload={"o": 2},
                    ),
                ],
            ),
        )
        result = CliRunner().invoke(
            app,
            [
                base,
                cand,
                "--fail-on-regression",
                "--max-divergence",
                "1.0",
                "--max-tool-repeats",
                "1",
            ],
        )
        assert result.exit_code == 1
        assert "max_tool_repeats" in result.stdout


class TestWarningRendering:
    def test_json_format_includes_warnings(self, tmp_path):
        base = _write_trace(
            tmp_path, "base.json", make_trace("b", [make_step("a"), make_step("b")])
        )
        cand = _write_trace(
            tmp_path,
            "cand.json",
            make_trace("c", [make_step("a"), make_step("b"), make_step("c")]),
        )
        result = CliRunner().invoke(
            app,
            [
                base,
                cand,
                "--format",
                "json",
                "--max-divergence",
                "0.5",
                "--max-cost-delta",
                "100",
            ],
        )
        payload = json.loads(result.stdout)
        assert len(payload["warnings"]) == 1
        assert payload["warnings"][0]["code"] == "path_drift"
        assert payload["warnings"][0]["severity"] == "soft"

    def test_pr_format_renders_note_block(self, tmp_path):
        base = _write_trace(
            tmp_path, "base.json", make_trace("b", [make_step("a"), make_step("b")])
        )
        cand = _write_trace(
            tmp_path,
            "cand.json",
            make_trace("c", [make_step("a"), make_step("b"), make_step("c")]),
        )
        result = CliRunner().invoke(
            app,
            [
                base,
                cand,
                "--format",
                "pr",
                "--max-divergence",
                "0.5",
                "--max-cost-delta",
                "100",
            ],
        )
        assert "[!NOTE]" in result.stdout
        assert "Soft warnings" in result.stdout

    def test_markdown_format_renders_warnings_section(self, tmp_path):
        base = _write_trace(
            tmp_path, "base.json", make_trace("b", [make_step("a"), make_step("b")])
        )
        cand = _write_trace(
            tmp_path,
            "cand.json",
            make_trace("c", [make_step("a"), make_step("b"), make_step("c")]),
        )
        result = CliRunner().invoke(
            app,
            [
                base,
                cand,
                "--format",
                "markdown",
                "--max-divergence",
                "0.5",
                "--max-cost-delta",
                "100",
            ],
        )
        assert "Soft Warnings (non-blocking)" in result.stdout
        assert "Path drift" in result.stdout


def test_count_tool_calls_counts_all_names():
    trace = make_trace(
        "t",
        [
            make_step("a", step_index=0),
            make_step("a", step_index=1),
            make_step("b", step_index=2),
        ],
    )
    assert count_tool_calls(trace) == {"a": 2, "b": 1}
