"""Shareable card: aggregate-only data, embedded safely, written by the CLI."""

import json
import re

from typer.testing import CliRunner

from agentdiff.cli import app
from agentdiff.sessions.analyzer import analyze
from agentdiff.sessions.card import _period_label, build_card_html, card_data
from agentdiff.sessions.claude_code import load_sessions
from tests.test_sessions import Log


def _root(tmp_path):
    log = Log(session_id="s1", cwd="/home/me/secret-client-project")
    log.title("Fix billing for ACME Corp")
    for i in range(3):
        (cid,) = log.turn(
            i,
            tools=[("Bash", {"command": "pytest tests/test_acme_payments.py"})],
            output=100_000,
        )
        log.result(i + 0.1, cid, "ImportError: acme", error=True)
    log.turn(5, cache_read=700_000)
    log.write(tmp_path)
    return tmp_path


def _embedded(html: str) -> dict:
    match = re.search(r"const D = (\{.*?\});\n", html, re.S)
    assert match
    return json.loads(match.group(1).replace("<\\/", "</"))


def test_card_carries_only_aggregates(tmp_path):
    analysis = analyze(load_sessions(_root(tmp_path)))
    data = card_data(analysis, period="last 7d")
    html = build_card_html(data)

    for private in ("ACME", "acme", "secret-client-project", "pytest", "Fix billing"):
        assert private not in html
    embedded = _embedded(html)
    assert embedded["period"] == "last 7 days"
    assert embedded["sessions"] == 1
    assert embedded["total"] > 0
    assert embedded["leaks"][0]["label"] == "Stuck retries"
    assert embedded["command"] == "npx @kerrshift/agentdiff"


def test_embedded_data_cannot_close_the_script_tag():
    data = {"agent": "</script><script>alert(1)</script>", "leaks": [], "breakdown": []}
    html = build_card_html(data)
    assert "</script><script>alert(1)" not in html
    assert _embedded(html)["agent"] == data["agent"]


def test_period_labels():
    assert _period_label("last 7d") == "last 7 days"
    assert _period_label("last 1d") == "last 1 day"
    assert _period_label("last 24h") == "last 24 hours"
    assert _period_label("last 12w") == "last 12 weeks"
    assert _period_label("all time") == "all time"


def test_cli_writes_card_without_opening_browser(tmp_path):
    root = _root(tmp_path / "cc")
    out = tmp_path / "card.html"
    result = CliRunner().invoke(
        app,
        [
            "--path",
            str(root),
            "--since",
            "all",
            "--card",
            "--card-out",
            str(out),
            "--no-open",
        ],
    )
    assert result.exit_code == 0, result.output
    assert out.exists()
    assert "Card written to" in result.output
    assert _embedded(out.read_text())["period"] == "all time"


def test_report_footer_mentions_card(tmp_path):
    result = CliRunner().invoke(app, ["--path", str(_root(tmp_path)), "--since", "all"])
    assert result.exit_code == 0
    assert "agentdiff --card" in result.output
