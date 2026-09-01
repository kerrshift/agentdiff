"""Pillar 4 — zero-config CLI wizard (`agentdiff init`)."""

from pathlib import Path

import pytest
from typer.testing import CliRunner

from agentdiff.cli import app
from agentdiff.config import load_config
from agentdiff.init_wizard import (
    FRAMEWORKS,
    GENERIC,
    detect_framework,
    write_config,
)


class TestDetection:
    def test_falls_back_to_generic_when_nothing_installed(self, monkeypatch):
        monkeypatch.setattr(
            "agentdiff.init_wizard.importlib.util.find_spec", lambda name: None
        )
        assert detect_framework() is GENERIC

    def test_detects_first_installed_framework_in_priority_order(self, monkeypatch):
        def fake_find_spec(name):
            return object() if name == "crewai" else None

        monkeypatch.setattr(
            "agentdiff.init_wizard.importlib.util.find_spec", fake_find_spec
        )
        assert detect_framework().key == "crewai"

    def test_priority_order_is_langgraph_first(self):
        assert FRAMEWORKS[0].key == "langgraph"


class TestWriteConfig:
    def test_writes_toml_and_workflow(self, tmp_path):
        created = write_config(tmp_path, framework=GENERIC, scenario="refund", runs=5)
        names = {p.name for p in created}
        assert names == {"agentdiff.toml", "agentdiff.yml"}

        cfg = load_config(tmp_path / "agentdiff.toml")
        sc = cfg.scenario("refund")
        assert sc is not None
        assert sc.mode == "statistical"
        assert sc.sample_runs == 5
        assert sc.hard_invariants.fail_on_identical_loops is True
        assert sc.tolerances.divergence_ceiling == 0.35
        assert cfg.adapter.name == GENERIC.adapter

    def test_workflow_is_valid_action_yaml(self, tmp_path):
        write_config(tmp_path, framework=GENERIC)
        text = (tmp_path / ".github/workflows/agentdiff.yml").read_text()
        assert "name: AgentDiff Check" in text
        assert "pull_request:" in text
        assert "agent-trajectory-diff" in text
        assert "--runs 3" in text
        # GitHub expression braces survive str.format
        assert "${{ github.event.number }}" in text
        # record target placeholder is explicitly marked
        assert "EDIT ME" in text

    def test_workflow_invokes_diff_with_valid_cli_form(self, tmp_path):
        """Regression: generated workflows must call `agentdiff diff BASELINE
        CANDIDATE`. The bare form (`agentdiff candidate --baseline …`) hits
        the E1 diff-default patch and fails with a missing positional, since
        `--baseline` is the baseline-*store* option, not the first positional.
        """
        write_config(tmp_path, framework=GENERIC, scenario="refund")
        text = (tmp_path / ".github/workflows/agentdiff.yml").read_text()
        assert (
            "agentdiff diff baselines/refund.envelope.json traces/candidate.json"
            in text
        )
        assert "--baseline " not in text

    def test_approve_workflow_filters_bots_without_template_if(self, tmp_path):
        """The approve trigger must use native `if` expressions (no `${{ }}`
        wrapper — GitHub re-evaluates the substituted string, which lets
        `!= null`-style interpolations misbehave) and must exclude bot
        identities both by type and by the `[bot]` login suffix, so the
        bot's own approval comment can never re-trigger itself.
        """
        write_config(tmp_path, framework=GENERIC, with_approve=True)
        text = (tmp_path / ".github/workflows/agentdiff-approve.yml").read_text()
        assert "github.event.issue.pull_request != null" in text
        assert "${{ github.event.issue.pull_request" not in text
        assert "github.event.comment.user.type != 'Bot'" in text
        assert "!endsWith(github.event.comment.user.login, '[bot]')" in text
        # pre-checkout gh calls must resolve the repo explicitly
        assert (
            "gh pr view ${{ github.event.issue.number }} -R ${{ github.repository }}"
            in text
        )
        assert (
            'gh run list --workflow "AgentDiff Check" --branch "${{ steps.pr.outputs.ref }}" -R ${{ github.repository }}'
            in text
        )

    def test_gate_workflow_brands_pr_report_via_hosted_identity(self, tmp_path):
        """The generated gate workflow mints an agentdiff[bot] token from the
        hosted identity service for the PR report, falling back to the
        workflow's own GITHUB_TOKEN when the App isn't installed.
        """
        write_config(tmp_path, framework=GENERIC, scenario="refund")
        text = (tmp_path / ".github/workflows/agentdiff.yml").read_text()
        assert "https://token.agentdiff.app" in text
        assert "${{ steps.bot_token.outputs.token || secrets.GITHUB_TOKEN }}" in text
        assert "AgentDiff bot token (hosted service, optional)" in text

    def test_refuses_to_clobber_without_force(self, tmp_path):
        write_config(tmp_path, framework=GENERIC)
        with pytest.raises(FileExistsError):
            write_config(tmp_path, framework=GENERIC)

    def test_force_overwrites(self, tmp_path):
        write_config(tmp_path, framework=GENERIC, runs=3)
        write_config(tmp_path, framework=GENERIC, runs=7, force=True)
        cfg = load_config(tmp_path / "agentdiff.toml")
        assert cfg.scenario("default").sample_runs == 7

    def test_toml_parses_as_valid_toml(self, tmp_path):
        write_config(tmp_path, framework=FRAMEWORKS[0])
        try:  # Python 3.11+
            import tomllib
        except ImportError:  # Python 3.10
            import tomli as tomllib

        raw = tomllib.loads((tmp_path / "agentdiff.toml").read_text())
        assert "scenario" in raw
        assert raw["adapter"]["name"] == "langgraph"


class TestCliInit:
    def test_init_creates_files_and_prints_next_steps(self, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        monkeypatch.setattr(
            "agentdiff.init_wizard.importlib.util.find_spec", lambda name: None
        )
        result = CliRunner().invoke(app, ["init", "--scenario", "refund"])
        assert result.exit_code == 0, result.output
        assert "Detected framework: Generic" in result.output
        assert (tmp_path / "agentdiff.toml").exists()
        assert (tmp_path / ".github/workflows/agentdiff.yml").exists()
        assert "Next steps" in result.output
        assert "baselines/refund.envelope.json" in result.output

    def test_init_refuses_existing_without_force(self, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        monkeypatch.setattr(
            "agentdiff.init_wizard.importlib.util.find_spec", lambda name: None
        )
        first = CliRunner().invoke(app, ["init"])
        assert first.exit_code == 0
        second = CliRunner().invoke(app, ["init"])
        assert second.exit_code == 2
        assert "--force" in second.output

    def test_init_force_overwrites(self, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        monkeypatch.setattr(
            "agentdiff.init_wizard.importlib.util.find_spec", lambda name: None
        )
        assert CliRunner().invoke(app, ["init"]).exit_code == 0
        again = CliRunner().invoke(app, ["init", "--force", "--runs", "5"])
        assert again.exit_code == 0
        assert "--runs 5" in (tmp_path / ".github/workflows/agentdiff.yml").read_text()

    def test_init_unknown_adapter_exits_2(self, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        result = CliRunner().invoke(app, ["init", "--adapter", "bogus"])
        assert result.exit_code == 2

    def test_init_adapter_override(self, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        result = CliRunner().invoke(app, ["init", "--adapter", "openai_agents"])
        assert result.exit_code == 0, result.output
        cfg = load_config(tmp_path / "agentdiff.toml")
        assert cfg.adapter.name == "openai_agents"

    def test_workflow_path_constant_is_github_standard(self):
        assert GENERIC.key == "generic"
        assert Path(".github/workflows/agentdiff.yml").as_posix() == str(
            Path(".github") / "workflows" / "agentdiff.yml"
        )
