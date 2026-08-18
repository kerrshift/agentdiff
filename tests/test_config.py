import json

import pytest
from conftest import make_step, make_trace
from typer.testing import CliRunner

from agentdiff.cli import app
from agentdiff.config import AgentDiffConfig, find_config_file, load_config

CONFIG = """\
[compare]
detect_loops = false
strict_tool_signatures = true

[adapter]
name = "langsmith"

[cli]
format = "json"
max_loops = 2
max_divergence = 0.5
max_cost_delta = 20.0

[assertions]
max_divergence = 0.1
allow_loops = true
"""


def _write_trace(tmp_path, name, trace):
    path = tmp_path / name
    path.write_text(trace.model_dump_json())
    return str(path)


def test_load_config_defaults_when_no_file(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    cfg = load_config()
    assert cfg.adapter.name == "auto"
    assert cfg.cli.format == "terminal"
    assert cfg.cli.max_divergence == 0.3
    assert cfg.assertions.max_divergence == 0.25


def test_load_config_explicit_path(tmp_path):
    path = tmp_path / "agentdiff.toml"
    path.write_text(CONFIG)
    cfg = load_config(path)
    assert cfg.adapter.name == "langsmith"
    assert cfg.cli.format == "json"
    assert cfg.cli.max_loops == 2
    assert cfg.cli.max_divergence == 0.5
    assert cfg.cli.max_cost_delta == 20.0
    assert cfg.compare.detect_loops is False
    assert cfg.compare.strict_tool_signatures is True
    assert cfg.assertions.allow_loops is True


def test_find_config_file_walks_up(tmp_path, monkeypatch):
    nested = tmp_path / "a" / "b"
    nested.mkdir(parents=True)
    (tmp_path / "agentdiff.toml").write_text(CONFIG)
    monkeypatch.chdir(nested)
    assert find_config_file() == tmp_path / "agentdiff.toml"


def test_load_config_ignores_unknown_keys(tmp_path):
    path = tmp_path / "agentdiff.toml"
    path.write_text("[future]\nthing = 1\n")
    cfg = load_config(path)
    assert cfg.cli.format == "terminal"


def test_config_to_from_dict_roundtrip():
    base = AgentDiffConfig.from_dict(
        {"cli": {"max_divergence": 0.7}, "compare": {"detect_loops": False}}
    )
    assert base.cli.max_divergence == 0.7
    assert base.compare.detect_loops is False
    assert base.cli.format == "terminal"


def test_cli_config_applies_defaults(tmp_path):
    base = _write_trace(tmp_path, "base.json", make_trace("b", [make_step("a")]))
    cand = _write_trace(tmp_path, "cand.json", make_trace("c", [make_step("a")]))
    cfg = tmp_path / "agentdiff.toml"
    cfg.write_text(CONFIG)

    result = CliRunner().invoke(app, [base, cand, "--config", str(cfg)])

    # [cli].format = json is applied when no --format flag is given
    assert result.exit_code == 0
    payload = json.loads(result.stdout)
    assert payload["baseline_id"] == "b"


def test_cli_flag_overrides_config(tmp_path):
    base = _write_trace(tmp_path, "base.json", make_trace("b", [make_step("a")]))
    cand = _write_trace(tmp_path, "cand.json", make_trace("c", [make_step("a")]))
    cfg = tmp_path / "agentdiff.toml"
    cfg.write_text(CONFIG)

    result = CliRunner().invoke(
        app, [base, cand, "--config", str(cfg), "--format", "markdown"]
    )

    assert result.exit_code == 0
    assert "# AgentDiff Comparison Report" in result.stdout


def test_cli_config_adapter_applied(tmp_path):
    base = _write_trace(tmp_path, "base.json", make_trace("b", [make_step("a")]))
    cand = _write_trace(tmp_path, "cand.json", make_trace("c", [make_step("a")]))
    cfg = tmp_path / "agentdiff.toml"
    cfg.write_text("[adapter]\nname = 'generic'\n[cli]\nformat = 'json'\n")

    result = CliRunner().invoke(app, [base, cand, "--config", str(cfg)])

    assert result.exit_code == 0
    assert json.loads(result.stdout)["baseline_id"] == "b"


def test_invalid_config_file_raises(tmp_path):
    path = tmp_path / "agentdiff.toml"
    path.write_text("not = = valid toml [[[")

    with pytest.raises(Exception):
        load_config(path)
