"""Tests for gate governance (G6/G7): threshold-change detection + PR warning."""

import json

from typer.testing import CliRunner

from agentdiff.config import AgentDiffConfig, load_config
from agentdiff.governance import (
    ThresholdChange,
    diff_gate_thresholds,
    effective_gates,
)
from agentdiff.recorder import record_run
from agentdiff.reporters.pr import generate_pr_markdown

runner = CliRunner()


class TestEffectiveGates:
    def test_defaults_when_config_empty(self):
        gates = effective_gates(AgentDiffConfig())
        assert gates == {
            "max_divergence": 0.3,
            "max_loops": 0,
            "max_cost_delta": 10.0,
            "max_recovery_ratio": None,
        }

    def test_config_values_win(self, tmp_path):
        cfg_file = tmp_path / "agentdiff.toml"
        cfg_file.write_text("[cli]\nmax_divergence = 0.5\nmax_loops = 2\n")
        gates = effective_gates(load_config(cfg_file))
        assert gates["max_divergence"] == 0.5
        assert gates["max_loops"] == 2
        assert gates["max_cost_delta"] == 10.0  # default


class TestDiffGateThresholds:
    def test_no_changes_returns_empty(self):
        changes = diff_gate_thresholds(AgentDiffConfig(), AgentDiffConfig())
        assert changes == []

    def test_detects_loosened_threshold(self, tmp_path):
        old = tmp_path / "old.toml"
        old.write_text("[cli]\nmax_divergence = 0.25\n")
        changes = diff_gate_thresholds(load_config(old), AgentDiffConfig())
        assert changes == [ThresholdChange("max_divergence", 0.25, 0.3)]

    def test_detects_tightened_threshold(self, tmp_path):
        new = tmp_path / "new.toml"
        new.write_text("[cli]\nmax_divergence = 0.4\nmax_cost_delta = 20.0\n")
        changes = diff_gate_thresholds(AgentDiffConfig(), load_config(new))
        by_gate = {c.gate: c for c in changes}
        assert by_gate["max_divergence"].old == 0.3
        assert by_gate["max_divergence"].new == 0.4
        assert by_gate["max_cost_delta"].old == 10.0
        assert by_gate["max_cost_delta"].new == 20.0

    def test_render_format(self):
        change = ThresholdChange("max_divergence", 0.25, 0.40)
        assert change.render() == "max_divergence: `0.25` → `0.4`"

    def test_recovery_ratio_none_to_value_detected(self, tmp_path):
        new = tmp_path / "new.toml"
        new.write_text("[cli]\nmax_recovery_ratio = 1.5\n")
        changes = diff_gate_thresholds(AgentDiffConfig(), load_config(new))
        assert ThresholdChange("max_recovery_ratio", None, 1.5) in changes


class TestPRMarkdownWarning:
    def _report(self):
        return record_run("json:loads", task_input={"s": "{}"}).model_dump()

    def test_no_warning_when_no_changes(self, tmp_path):
        base = tmp_path / "base.json"
        cand = tmp_path / "cand.json"
        base.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        cand.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        from agentdiff.engine.comparator import compare
        from agentdiff.loader import load_trace

        report = compare(load_trace(str(base)), load_trace(str(cand)))
        md = generate_pr_markdown(report)
        assert "Gate thresholds changed" not in md

    def test_warning_block_renders_changes(self, tmp_path):
        base = tmp_path / "base.json"
        cand = tmp_path / "cand.json"
        base.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        cand.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        from agentdiff.engine.comparator import compare
        from agentdiff.loader import load_trace

        report = compare(load_trace(str(base)), load_trace(str(cand)))
        md = generate_pr_markdown(
            report,
            threshold_changes=[ThresholdChange("max_divergence", 0.25, 0.4)],
        )
        assert "[!WARNING]" in md
        assert "Gate thresholds changed in this PR" in md
        assert "max_divergence: `0.25` → `0.4`" in md
        # Warning appears above the gate table
        assert md.index("[!WARNING]") < md.index("| Gate |")

    def test_warning_appears_even_when_passing(self, tmp_path):
        """A loosened gate that goes green must still be flagged — that's the point."""
        base = tmp_path / "base.json"
        cand = tmp_path / "cand.json"
        base.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        cand.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        from agentdiff.engine.comparator import compare
        from agentdiff.loader import load_trace

        report = compare(load_trace(str(base)), load_trace(str(cand)))
        md = generate_pr_markdown(
            report,
            threshold_changes=[ThresholdChange("max_divergence", 0.25, 0.6)],
        )
        assert "✅ **PASSED**" in md
        assert "Gate thresholds changed in this PR" in md


class TestCLIBaselineConfig:
    def _traces(self, tmp_path):
        base = tmp_path / "base.json"
        cand = tmp_path / "cand.json"
        base.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        cand.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        return base, cand

    def test_pr_format_includes_warning_with_baseline_config(self, tmp_path):
        base, cand = self._traces(tmp_path)
        old_cfg = tmp_path / "old.toml"
        old_cfg.write_text("[cli]\nmax_divergence = 0.2\n")
        result = runner.invoke(
            __import__("agentdiff.cli", fromlist=["app"]).app,
            [
                "diff",
                str(base),
                str(cand),
                "--format",
                "pr",
                "--baseline-config",
                str(old_cfg),
            ],
        )
        assert result.exit_code == 0, result.output
        assert "Gate thresholds changed in this PR" in result.output
        assert "max_divergence: `0.2` → `0.3`" in result.output

    def test_pr_format_no_warning_without_flag(self, tmp_path):
        base, cand = self._traces(tmp_path)
        result = runner.invoke(
            __import__("agentdiff.cli", fromlist=["app"]).app,
            ["diff", str(base), str(cand), "--format", "pr"],
        )
        assert result.exit_code == 0, result.output
        assert "Gate thresholds changed" not in result.output

    def test_explain_prints_threshold_changes(self, tmp_path):
        base, cand = self._traces(tmp_path)
        old_cfg = tmp_path / "old.toml"
        old_cfg.write_text("[cli]\nmax_cost_delta = 5.0\n")
        result = runner.invoke(
            __import__("agentdiff.cli", fromlist=["app"]).app,
            [
                "diff",
                str(base),
                str(cand),
                "--explain",
                "--baseline-config",
                str(old_cfg),
            ],
        )
        assert result.exit_code == 0, result.output
        assert "Gate thresholds changed vs baseline config:" in result.output
        assert "max_cost_delta: `5.0` → `10.0`" in result.output

    def test_missing_baseline_config_file_exits_2(self, tmp_path):
        base, cand = self._traces(tmp_path)
        result = runner.invoke(
            __import__("agentdiff.cli", fromlist=["app"]).app,
            [
                "diff",
                str(base),
                str(cand),
                "--baseline-config",
                str(tmp_path / "nope.toml"),
            ],
        )
        assert result.exit_code == 2


class TestGateProvenance:
    """G7 — every report self-describes its active thresholds + source."""

    def test_provenance_line_defaults(self):
        from agentdiff.governance import provenance_line

        line = provenance_line(AgentDiffConfig(), None)
        assert "max_divergence=0.3" in line
        assert "max_loops=0" in line
        assert "max_cost_delta=10.0%" in line
        assert "source: defaults (no agentdiff.toml found)" in line

    def test_provenance_line_with_path(self, tmp_path):
        from agentdiff.governance import provenance_line

        cfg_file = tmp_path / "agentdiff.toml"
        cfg_file.write_text("[cli]\nmax_divergence = 0.4\nmax_recovery_ratio = 1.5\n")
        line = provenance_line(load_config(cfg_file), str(cfg_file))
        assert "max_divergence=0.4" in line
        assert "max_recovery_ratio=1.5" in line  # opt-in gate appears when set
        assert f"source: agentdiff.toml ({cfg_file})" in line

    def test_terminal_format_includes_provenance(self, tmp_path):
        base, cand = TestCLIBaselineConfig()._traces(tmp_path)
        result = runner.invoke(
            __import__("agentdiff.cli", fromlist=["app"]).app,
            ["diff", str(base), str(cand)],
        )
        assert result.exit_code == 0
        assert "Gate: max_divergence=0.3" in result.output
        assert (
            "defaults" in result.output
        )  # rich wraps long lines; assert words, not phrases

    def test_json_format_includes_provenance(self, tmp_path):
        base, cand = TestCLIBaselineConfig()._traces(tmp_path)
        result = runner.invoke(
            __import__("agentdiff.cli", fromlist=["app"]).app,
            ["diff", str(base), str(cand), "--format", "json"],
        )
        assert result.exit_code == 0
        data = json.loads(result.output)
        assert "Gate: max_divergence=0.3" in data["gate_provenance"]

    def test_pr_format_includes_provenance_footer(self, tmp_path):
        base, cand = TestCLIBaselineConfig()._traces(tmp_path)
        result = runner.invoke(
            __import__("agentdiff.cli", fromlist=["app"]).app,
            ["diff", str(base), str(cand), "--format", "pr"],
        )
        assert result.exit_code == 0
        assert "<sub>Gate: max_divergence=0.3" in result.output

    def test_explicit_config_path_shown_as_source(self, tmp_path):
        base, cand = TestCLIBaselineConfig()._traces(tmp_path)
        cfg_file = tmp_path / "agentdiff.toml"
        cfg_file.write_text("[cli]\nmax_divergence = 0.45\n")
        result = runner.invoke(
            __import__("agentdiff.cli", fromlist=["app"]).app,
            ["diff", str(base), str(cand), "--config", str(cfg_file)],
        )
        assert result.exit_code == 0
        assert "max_divergence=0.45" in result.output
        assert "agentdiff.toml" in result.output  # path may wrap; filename stays whole


class TestStaleBaseline:
    """F7 — baselines age silently; --explain surfaces the age."""

    def test_old_baseline_warns_in_explain(self, tmp_path, monkeypatch):
        import os
        import time

        from agentdiff.cli import app as cli_app

        base = tmp_path / "base.json"
        cand = tmp_path / "cand.json"
        base.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        cand.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        old = time.time() - 47 * 86400
        os.utime(base, (old, old))

        result = runner.invoke(
            cli_app, ["diff", str(base), str(cand), "--explain", "--stale-days", "30"]
        )
        assert result.exit_code == 0
        assert "Baseline is 47 days old" in result.output
        assert "consider re-recording" in result.output

    def test_fresh_baseline_no_warning(self, tmp_path):
        from agentdiff.cli import app as cli_app

        base = tmp_path / "base.json"
        cand = tmp_path / "cand.json"
        base.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        cand.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )

        result = runner.invoke(cli_app, ["diff", str(base), str(cand), "--explain"])
        assert result.exit_code == 0
        assert "consider re-recording" not in result.output

    def test_stale_days_config_respected(self, tmp_path):
        import os
        import time

        from agentdiff.cli import app as cli_app

        base = tmp_path / "base.json"
        cand = tmp_path / "cand.json"
        base.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        cand.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        old = time.time() - 5 * 86400
        os.utime(base, (old, old))
        cfg = tmp_path / "agentdiff.toml"
        cfg.write_text("[cli]\nstale_baseline_days = 3\n")

        result = runner.invoke(
            cli_app,
            ["diff", str(base), str(cand), "--explain", "--config", str(cfg)],
        )
        assert result.exit_code == 0
        assert "Baseline is 5 days old" in result.output

    def test_staleness_missing_file_not_stale(self):
        from agentdiff.staleness import check_baseline_staleness

        s = check_baseline_staleness("/nonexistent/baseline.json")
        assert s.missing is True
        assert s.is_stale is False
        assert s.render() == ""

    def test_staleness_render_fresh(self, tmp_path):
        from agentdiff.staleness import check_baseline_staleness

        f = tmp_path / "fresh.json"
        f.write_text("{}")
        s = check_baseline_staleness(f)
        assert s.is_stale is False
        assert "less than a day old" in s.render()
