"""Distribution: Claude Code plugin, its report script, and the npm launcher."""

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
MARKETPLACE = ROOT / ".claude-plugin" / "marketplace.json"
PLUGIN = ROOT / "plugins" / "agentdiff"
SKILL = PLUGIN / "skills" / "report" / "SKILL.md"
SCRIPT = PLUGIN / "skills" / "report" / "scripts" / "report.sh"


def _frontmatter(text: str) -> dict[str, str]:
    match = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    assert match, "SKILL.md must start with YAML frontmatter"
    fields = {}
    for line in match.group(1).splitlines():
        key, _, value = line.partition(":")
        fields[key.strip()] = value.strip()
    return fields


def test_marketplace_entry_matches_plugin_manifest():
    market = json.loads(MARKETPLACE.read_text())
    manifest = json.loads((PLUGIN / ".claude-plugin" / "plugin.json").read_text())
    (entry,) = market["plugins"]
    assert market["owner"]["name"]
    # The install id is <entry name>@<marketplace>; it must equal the manifest name.
    assert entry["name"] == manifest["name"] == "agentdiff"
    assert entry["source"].startswith("./") and ".." not in entry["source"]
    assert (ROOT / entry["source"]).resolve() == PLUGIN.resolve()


def test_plugin_version_tracks_package_version():
    from agentdiff import __version__

    manifest = json.loads((PLUGIN / ".claude-plugin" / "plugin.json").read_text())
    assert manifest["version"] == __version__


def test_npm_launcher_version_tracks_package_version():
    from agentdiff import __version__

    package = json.loads((ROOT / "npm" / "package.json").read_text())
    assert package["name"] == "agentdiff"
    assert package["version"] == __version__
    assert package["bin"] == {"agentdiff": "bin/agentdiff.js"}
    assert os.access(ROOT / "npm" / "bin" / "agentdiff.js", os.X_OK)


def test_skill_preapproves_the_command_it_injects():
    text = SKILL.read_text()
    fields = _frontmatter(text)
    assert fields["name"] == "report"
    assert fields["description"]
    allowed = fields["allowed-tools"]
    assert allowed == "Bash(${CLAUDE_SKILL_DIR}/scripts/report.sh *)"
    # The injected command must match the allow rule, or the skill aborts.
    assert "!`${CLAUDE_SKILL_DIR}/scripts/report.sh $ARGUMENTS`" in text


def test_report_script_is_executable():
    assert os.access(SCRIPT, os.X_OK)


@pytest.mark.skipif(shutil.which("bash") is None, reason="needs bash")
def test_report_script_runs_and_never_fails(tmp_path):
    env = {
        **os.environ,
        "CLAUDE_CONFIG_DIR": str(tmp_path),
        "PATH": f"{Path(sys.executable).parent}{os.pathsep}{os.environ.get('PATH', '')}",
    }
    ok = subprocess.run(
        [str(SCRIPT), "--since", "all"], env=env, capture_output=True, text=True
    )
    assert ok.returncode == 0
    assert "No Claude Code sessions found" in ok.stdout

    bad = subprocess.run(
        [str(SCRIPT), "--since", "lots"], env=env, capture_output=True, text=True
    )
    assert bad.returncode == 0
    assert "AgentDiff exited with an error" in bad.stdout


@pytest.mark.skipif(shutil.which("bash") is None, reason="needs bash")
def test_report_script_explains_install_when_nothing_is_available(tmp_path):
    # PATH holds only `cat`: no agentdiff, uvx, pipx or Python to fall back on.
    empty = tmp_path / "bin"
    empty.mkdir()
    (empty / "cat").symlink_to(shutil.which("cat"))
    env = {"PATH": str(empty), "HOME": str(tmp_path)}
    result = subprocess.run(
        [shutil.which("bash"), str(SCRIPT)], env=env, capture_output=True, text=True
    )
    assert result.returncode == 0
    assert "AgentDiff could not run" in result.stdout
    assert "Python 3.10+" in result.stdout
