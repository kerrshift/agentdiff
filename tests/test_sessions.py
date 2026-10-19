"""Session flight recorder: Claude Code log reader, pricing, waste analyzer, CLI.

All fixtures are synthetic JSONL written to tmp_path — no real session data.
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from typer.testing import CliRunner

from agentdiff.cli import app
from agentdiff.sessions.analyzer import Thresholds, analyze, analyze_session
from agentdiff.sessions.claude_code import load_sessions, read_session
from agentdiff.sessions.pricing import price_for

T0 = datetime(2026, 10, 1, 9, 0, tzinfo=timezone.utc)


def _ts(minutes: float) -> str:
    return (T0 + timedelta(minutes=minutes)).isoformat().replace("+00:00", "Z")


class Log:
    """Builds a Claude Code-shaped JSONL transcript."""

    def __init__(self, session_id: str = "s1", cwd: str = "/work/demo"):
        self.session_id = session_id
        self.cwd = cwd
        self.lines: list[dict] = []
        self.n = 0

    def _base(self, kind: str, minutes: float) -> dict:
        return {
            "type": kind,
            "sessionId": self.session_id,
            "cwd": self.cwd,
            "gitBranch": "main",
            "timestamp": _ts(minutes),
        }

    def turn(
        self,
        minutes: float,
        *,
        tools: list[tuple[str, dict]] = (),
        model: str = "claude-opus-5-5",
        output: int = 100,
        cache_read: int = 0,
        write_1h: int = 0,
        write_5m: int = 0,
        request_id: str | None = None,
    ) -> list[str]:
        self.n += 1
        rid = request_id or f"{self.session_id}-req{self.n}"
        usage = {
            "input_tokens": 10,
            "output_tokens": output,
            "cache_read_input_tokens": cache_read,
            "cache_creation_input_tokens": write_1h + write_5m,
            "cache_creation": {
                "ephemeral_1h_input_tokens": write_1h,
                "ephemeral_5m_input_tokens": write_5m,
            },
        }
        blocks = [{"type": "text", "text": "ok"}]
        ids = []
        for i, (name, tool_input) in enumerate(tools):
            call_id = f"{rid}-tool{i}"
            ids.append(call_id)
            blocks.append(
                {"type": "tool_use", "id": call_id, "name": name, "input": tool_input}
            )
        # One line per content block, usage repeated on each (as Claude Code does).
        for block in blocks:
            entry = self._base("assistant", minutes)
            entry["requestId"] = rid
            entry["message"] = {
                "id": f"msg-{rid}",
                "model": model,
                "content": [block],
                "usage": usage,
            }
            self.lines.append(entry)
        return ids

    def result(self, minutes: float, call_id: str, text: str, error: bool = False):
        entry = self._base("user", minutes)
        entry["message"] = {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": call_id,
                    "content": text,
                    "is_error": error,
                }
            ],
        }
        self.lines.append(entry)

    def title(self, text: str):
        self.lines.append(
            {"type": "custom-title", "customTitle": text, "sessionId": self.session_id}
        )

    def cost_state(self, usd: float):
        self.lines.append(
            {"type": "cost-state", "sessionId": self.session_id, "totalCostUSD": usd}
        )

    def write(self, root: Path, project_dir: str = "-work-demo") -> Path:
        folder = root / "projects" / project_dir
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / f"{self.session_id}.jsonl"
        path.write_text("\n".join(json.dumps(x) for x in self.lines) + "\n")
        return path


# --- pricing ---------------------------------------------------------------


def test_price_lookup_prefers_most_specific_prefix():
    assert price_for("claude-opus-5-5").input == 4.0
    assert price_for("claude-opus-5").input == 5.0
    assert price_for("claude-opus-4-1-20250805").input == 15.0
    assert price_for("anthropic.claude-sonnet-5-5").output == 10.0
    assert price_for("gpt-5") is None
    assert price_for(None) is None


# --- reader ----------------------------------------------------------------


def test_usage_counted_once_per_request(tmp_path):
    log = Log()
    ids = log.turn(
        0,
        tools=[("Read", {"file_path": "a.py"}), ("Bash", {"command": "ls"})],
        output=1_000_000,
    )
    log.result(1, ids[0], "content")
    log.result(1, ids[1], "files")
    session = read_session(log.write(tmp_path))

    assert len(session.requests) == 1
    # 1M output tokens on Opus 5.5 = $20, despite three log lines for the request
    assert session.requests[0].cost == pytest.approx(20.0 + 10 * 4 / 1e6)
    assert [c.name for c in session.tool_calls] == ["Read", "Bash"]
    assert all(c.has_result for c in session.tool_calls)


def test_cache_write_ttl_priced_separately(tmp_path):
    log = Log()
    log.turn(0, output=0, write_1h=1_000_000, write_5m=1_000_000, cache_read=1_000_000)
    session = read_session(log.write(tmp_path))
    parts = session.requests[0].cost_breakdown()
    assert parts["cache_write"] == pytest.approx(8.0 + 5.0)
    assert parts["cache_read"] == pytest.approx(0.20)


def test_title_project_and_reported_cost(tmp_path):
    log = Log(cwd="/home/me/shop")
    log.turn(0)
    log.title("Fix checkout bug")
    log.cost_state(1.23)
    session = read_session(log.write(tmp_path))
    assert session.title == "Fix checkout bug"
    assert session.project == "shop"
    assert session.reported_cost == 1.23


def test_subagents_are_attached_and_costed(tmp_path):
    parent = Log("parent")
    parent.turn(0, output=1000)
    path = parent.write(tmp_path)
    sub = Log("parent")
    sub.turn(1, output=1_000_000, request_id="sub-req")
    sub_dir = path.with_suffix("") / "subagents"
    sub_dir.mkdir(parents=True)
    (sub_dir / "agent-abc.jsonl").write_text(
        "\n".join(json.dumps(x) for x in sub.lines)
    )

    session = read_session(path)
    assert len(session.subagents) == 1
    assert session.subagents[0].agent_id == "abc"
    assert session.cost == pytest.approx(session.own_cost + 20.0, rel=1e-3)


def test_forked_sessions_do_not_double_count(tmp_path):
    original = Log("orig")
    original.turn(0, output=1_000_000, request_id="shared-1")
    original.write(tmp_path)

    fork = Log("fork")
    fork.turn(0, output=1_000_000, request_id="shared-1")  # copied history
    fork.turn(30, output=1_000_000, request_id="fork-own")
    fork.cost_state(40.0)  # includes inherited spend
    fork.write(tmp_path)

    sessions = load_sessions(tmp_path)
    total = sum(s.cost for s in sessions)
    assert total == pytest.approx(40.0, rel=1e-3)
    fork_session = next(s for s in sessions if s.session_id == "fork")
    assert fork_session.reported_cost is None
    assert [r.request_id for r in fork_session.requests] == ["fork-own"]


def test_malformed_lines_are_skipped(tmp_path):
    log = Log()
    log.turn(0)
    path = log.write(tmp_path)
    with open(path, "a") as fh:
        fh.write("{not json\n\n[1,2]\n")
    assert read_session(path) is not None


# --- analyzer --------------------------------------------------------------


def test_stuck_retry_detected(tmp_path):
    log = Log()
    for i in range(4):
        (cid,) = log.turn(i, tools=[("Bash", {"command": "pytest tests/api"})])
        log.result(i + 0.5, cid, "ImportError: no module named app", error=True)
    session = read_session(log.write(tmp_path))
    findings = analyze_session(session)
    stuck = [f for f in findings if f.kind == "stuck_retry"]
    assert len(stuck) == 1
    assert stuck[0].count == 4
    assert "pytest tests/api" in stuck[0].title
    assert stuck[0].usd > 0


def test_reread_unchanged_file_detected_but_changed_file_is_not(tmp_path):
    log = Log()
    for i in range(3):
        (cid,) = log.turn(i, tools=[("Read", {"file_path": "src/big.py"})])
        log.result(i + 0.1, cid, "same content")
    for i in range(3):
        (cid,) = log.turn(10 + i, tools=[("Read", {"file_path": "src/edited.py"})])
        log.result(10 + i + 0.1, cid, f"version {i}")
    session = read_session(log.write(tmp_path))
    rereads = [f for f in analyze_session(session) if f.kind == "reread"]
    assert len(rereads) == 1
    assert "src/big.py" in rereads[0].title


def test_cache_rebuild_after_break(tmp_path):
    log = Log()
    log.turn(0, cache_read=0, write_1h=300_000)
    log.turn(1, cache_read=300_000, write_1h=1_000)
    log.turn(121, cache_read=0, write_1h=301_000)  # back after 2h: cache expired
    session = read_session(log.write(tmp_path))
    rebuilds = [f for f in analyze_session(session) if f.kind == "cache_rebuild"]
    assert len(rebuilds) == 1
    assert rebuilds[0].count == 1
    # paid 1h-write price instead of read price on 301k tokens
    assert rebuilds[0].usd == pytest.approx(301_000 * (8.0 - 0.20) / 1e6)
    assert "2h" in rebuilds[0].title


def test_context_bloat_counts_only_excess(tmp_path):
    log = Log()
    for i in range(20):
        log.turn(i, cache_read=700_000)
    session = read_session(log.write(tmp_path))
    bloat = [f for f in analyze_session(session) if f.kind == "context_bloat"]
    assert len(bloat) == 1
    assert bloat[0].usd == pytest.approx(20 * 500_000 * 0.20 / 1e6)


def test_iteration_with_different_inputs_is_not_waste(tmp_path):
    log = Log()
    for i, state in enumerate(["NY", "CA", "TX", "WA"]):
        (cid,) = log.turn(i, tools=[("Bash", {"command": f"curl api/{state}"})])
        log.result(i + 0.1, cid, f"data for {state}")
    session = read_session(log.write(tmp_path))
    assert analyze_session(session, Thresholds(bloat_min_usd=0)) == []


def test_analysis_totals_use_reported_cost_when_higher(tmp_path):
    log = Log()
    log.turn(0, output=1_000_000)  # $20 visible in transcript
    log.cost_state(25.0)  # agent's own counter includes background calls
    log.write(tmp_path)
    analysis = analyze(load_sessions(tmp_path))
    assert analysis.total == pytest.approx(25.0, rel=1e-3)
    assert analysis.spend.background == pytest.approx(5.0, rel=1e-2)


# --- CLI -------------------------------------------------------------------


def _demo_root(tmp_path: Path) -> Path:
    log = Log()
    log.title("Demo task")
    for i in range(3):
        (cid,) = log.turn(
            i, tools=[("Bash", {"command": "make build"})], output=100_000
        )
        log.result(i + 0.1, cid, "error: missing toolchain", error=True)
    log.write(tmp_path)
    return tmp_path


def test_cli_sessions_json(tmp_path):
    root = _demo_root(tmp_path)
    result = CliRunner().invoke(
        app, ["sessions", "--path", str(root), "--since", "all", "--json"]
    )
    assert result.exit_code == 0, result.output
    data = json.loads(result.output)
    assert data["period"] == "all time"
    assert data["sessions"][0]["title"] == "Demo task"
    assert data["findings"][0]["kind"] == "stuck_retry"


def test_bare_agentdiff_runs_session_report(tmp_path, monkeypatch):
    monkeypatch.setenv("CLAUDE_CONFIG_DIR", str(_demo_root(tmp_path)))
    result = CliRunner().invoke(app, ["--since", "all"])
    assert result.exit_code == 0, result.output
    assert "Where the money went" in result.output
    assert "Stuck retry" in result.output


def test_cli_since_filters_old_sessions(tmp_path):
    root = _demo_root(tmp_path)
    result = CliRunner().invoke(app, ["sessions", "--path", str(root), "--since", "1d"])
    assert result.exit_code == 0
    assert "No Claude Code sessions found" in result.output


def test_cli_rejects_bad_since(tmp_path):
    result = CliRunner().invoke(
        app, ["sessions", "--path", str(tmp_path), "--since", "lots"]
    )
    assert result.exit_code != 0
