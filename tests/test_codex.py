"""Codex CLI reader: synthetic rollouts built from the openai/codex schema.

No real Codex sessions are used; every line follows the wrapped
``{"timestamp", "type", "payload"}`` format of Codex 0.33+ (checked against
the rust-v0.163.0 source).
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from typer.testing import CliRunner

from agentdiff.cli import app
from agentdiff.sessions import codex
from agentdiff.sessions.analyzer import analyze, analyze_session
from agentdiff.sessions.loader import label_for, load_sessions

T0 = datetime(2026, 10, 1, 9, 0, tzinfo=timezone.utc)


def _ts(minutes: float) -> str:
    return (
        (T0 + timedelta(minutes=minutes))
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


class Rollout:
    def __init__(self, thread_id="th-1", cwd="/work/shop", **meta):
        self.thread_id = thread_id
        self.lines: list[dict] = []
        self.add(
            0, "session_meta", {"id": thread_id, "cwd": cwd, "source": "cli", **meta}
        )
        self.n = 0

    def add(self, minutes, kind, payload):
        self.lines.append({"timestamp": _ts(minutes), "type": kind, "payload": payload})

    def turn(self, minutes, model):
        self.add(
            minutes,
            "turn_context",
            {"turn_id": f"t{minutes}", "cwd": "/work/shop", "model": model},
        )

    def tool(self, minutes, cmd, output, call_id=None):
        self.n += 1
        call_id = call_id or f"call_{self.n}"
        self.add(
            minutes,
            "response_item",
            {
                "type": "function_call",
                "name": "exec_command",
                "arguments": json.dumps({"cmd": cmd}),
                "call_id": call_id,
            },
        )
        self.add(
            minutes + 0.01,
            "response_item",
            {"type": "function_call_output", "call_id": call_id, "output": output},
        )
        return call_id

    def usage(self, minutes, rid, input_tokens=0, cached=0, output=0, reasoning=0):
        self.add(
            minutes,
            "token_usage_record",
            {
                "thread_id": self.thread_id,
                "turn_id": "t",
                "response_id": rid,
                "usage": {
                    "input_tokens": input_tokens,
                    "cached_input_tokens": cached,
                    "cache_write_input_tokens": 0,
                    "output_tokens": output,
                    "reasoning_output_tokens": reasoning,
                    "total_tokens": input_tokens + output,
                },
            },
        )

    def token_count(self, minutes, total, last):
        self.add(
            minutes,
            "event_msg",
            {
                "type": "token_count",
                "info": None
                if total is None
                else {
                    "total_token_usage": total,
                    "last_token_usage": last,
                    "model_context_window": 272000,
                },
            },
        )

    def write(self, home: Path, sub="sessions", day="2026/10/01") -> Path:
        folder = home / sub / day
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / f"rollout-2026-10-01T09-00-00-{self.thread_id}.jsonl"
        path.write_text("\n".join(json.dumps(x) for x in self.lines) + "\n")
        return path


def _usage(i, c, o):
    return {
        "input_tokens": i,
        "cached_input_tokens": c,
        "output_tokens": o,
        "reasoning_output_tokens": 0,
        "total_tokens": i + o,
    }


# --- reading & pricing ---------------------------------------------------------


def test_usage_records_are_priced_per_model(tmp_path):
    r = Rollout()
    r.turn(0, "gpt-6.1-sol")
    r.usage(
        1, "resp_1", input_tokens=100_000, cached=80_000, output=10_000, reasoning=4_000
    )
    session = codex.read_session(r.write(tmp_path))

    assert session.source == "codex"
    assert session.project == "shop"
    (req,) = session.requests
    assert req.input_tokens == 20_000  # input includes cached
    assert req.cache_read_tokens == 80_000
    assert req.output_tokens == 10_000  # output includes reasoning
    assert req.cost == pytest.approx(
        (20_000 * 2.0 + 80_000 * 0.10 + 10_000 * 10.0) / 1e6
    )


def test_model_can_change_mid_session(tmp_path):
    r = Rollout()
    r.turn(0, "gpt-5")
    r.usage(1, "resp_a", input_tokens=200_000)
    r.turn(2, "gpt-6.1-sol")
    r.usage(3, "resp_b", input_tokens=200_000)
    session = codex.read_session(r.write(tmp_path))
    assert [q.model for q in session.requests] == ["gpt-5", "gpt-6.1-sol"]
    assert [round(q.cost, 4) for q in session.requests] == [0.25, 0.4]


def test_long_context_tier_and_fast_tier(tmp_path):
    r = Rollout()
    r.turn(0, "gpt-6.1-sol")
    r.usage(1, "resp_short", input_tokens=200_000, output=1_000_000)
    r.usage(2, "resp_long", input_tokens=300_000, output=1_000_000)
    r.add(
        3,
        "event_msg",
        {
            "type": "thread_settings_applied",
            "thread_settings": {"model": "gpt-6.1-sol", "service_tier": "priority"},
        },
    )
    r.usage(4, "resp_fast", output=1_000_000)
    short, long_, fast = codex.read_session(r.write(tmp_path)).requests
    assert short.cost == pytest.approx(0.2 * 2.0 + 10.0)
    assert long_.cost == pytest.approx(0.3 * 2.0 * 2 + 10.0 * 1.5)  # >272K tier
    assert fast.fast and fast.cost == pytest.approx(20.0)


def test_token_count_fallback_skips_repeats_and_rate_limit_events(tmp_path):
    r = Rollout()
    r.turn(0, "gpt-5")
    r.token_count(1, _usage(1000, 0, 100), _usage(1000, 0, 100))
    r.token_count(1.5, _usage(1000, 0, 100), _usage(1000, 0, 100))  # repeat
    r.token_count(2, None, None)  # rate-limit only
    r.token_count(3, _usage(3000, 500, 300), _usage(2000, 500, 200))
    session = codex.read_session(r.write(tmp_path))
    assert len(session.requests) == 2
    assert sum(q.output_tokens for q in session.requests) == 300


def test_usage_records_win_over_token_count(tmp_path):
    r = Rollout()
    r.turn(0, "gpt-5")
    r.token_count(1, _usage(1000, 0, 100), _usage(1000, 0, 100))
    r.usage(1, "resp_1", input_tokens=1000, output=100)
    assert len(codex.read_session(r.write(tmp_path)).requests) == 1


def test_files_without_usage_or_wrapper_are_skipped(tmp_path):
    folder = tmp_path / "sessions" / "2025" / "08" / "01"
    folder.mkdir(parents=True)
    (folder / "rollout-old.jsonl").write_text(
        json.dumps({"id": "x", "timestamp": "2025-08-01T00:00:00Z"}) + "\n{broken\n"
    )
    assert codex.load_sessions(tmp_path) == []


def test_discovers_nested_and_archived_rollouts(tmp_path):
    for i, sub in enumerate(("sessions", "archived_sessions")):
        r = Rollout(thread_id=f"th-{i}")
        r.turn(0, "gpt-5")
        r.usage(1, f"resp_{i}", input_tokens=10)
        r.write(tmp_path, sub=sub)
    assert len(codex.load_sessions(tmp_path)) == 2


# --- forks & subagents ------------------------------------------------------


def test_legacy_fork_copies_are_counted_once(tmp_path):
    parent = Rollout(thread_id="parent")
    parent.turn(0, "gpt-5")
    parent.usage(1, "resp_1", input_tokens=1_000_000)
    parent.write(tmp_path)
    child = Rollout(thread_id="child", forked_from_id="parent")
    child.turn(0, "gpt-5")
    child.usage(1, "resp_1", input_tokens=1_000_000)  # copied line
    child.usage(5, "resp_2", input_tokens=1_000_000)
    child.write(tmp_path, day="2026/10/02")

    sessions = codex.load_sessions(tmp_path)
    assert sum(s.cost for s in sessions) == pytest.approx(2.5)


def test_subagent_threads_nest_under_parent(tmp_path):
    parent = Rollout(thread_id="root")
    parent.turn(0, "gpt-5")
    parent.usage(1, "resp_p", input_tokens=1_000_000)
    parent.write(tmp_path)
    sub = Rollout(thread_id="worker", parent_thread_id="root")
    sub.turn(0, "gpt-5-mini")
    sub.usage(1, "resp_s", input_tokens=1_000_000)
    sub.write(tmp_path, day="2026/10/02")

    (session,) = codex.load_sessions(tmp_path)
    assert session.session_id == "root"
    assert [s.session_id for s in session.subagents] == ["worker"]
    assert session.cost == pytest.approx(1.25 + 0.25)


# --- tool calls & findings -------------------------------------------------


def test_exit_codes_mark_errors_and_feed_stuck_retry(tmp_path):
    r = Rollout()
    r.turn(0, "gpt-6.1-sol")
    for i in range(3):
        r.tool(
            i,
            "pytest tests/api",
            "Chunk ID: 1\nWall time: 0.4 seconds\nProcess exited with code 1\nOutput:\nE ImportError",
        )
        r.usage(i + 0.5, f"resp_{i}", input_tokens=10_000, output=50_000)
    r.tool(5, "ls", "Exit code: 0\nWall time: 0.0 seconds\nOutput:\nsrc")
    r.usage(5.5, "resp_ok", input_tokens=1_000, output=100)
    session = codex.read_session(r.write(tmp_path))

    errors = [c.is_error for c in session.tool_calls]
    assert errors == [True, True, True, False]
    assert all(c.request_id for c in session.tool_calls)
    stuck = [f for f in analyze_session(session) if f.kind == "stuck_retry"]
    assert len(stuck) == 1 and "pytest tests/api" in stuck[0].title
    assert stuck[0].usd > 0


def test_paginated_command_executions_carry_exit_codes(tmp_path):
    r = Rollout(history_mode="paginated")
    r.turn(0, "gpt-6.1-sol")
    r.add(
        1,
        "event_msg",
        {
            "type": "item_completed",
            "thread_id": "th-1",
            "turn_id": "t",
            "item": {
                "type": "CommandExecution",
                "id": "item_1",
                "command": ["bash", "-lc", "npm test"],
                "cwd": "/work/shop",
                "status": "failed",
                "aggregated_output": "1 failing",
                "exit_code": 1,
                "duration": 2.0,
            },
        },
    )
    r.usage(2, "resp_1", input_tokens=100)
    (call,) = codex.read_session(r.write(tmp_path)).tool_calls
    assert call.is_error and call.input["command"] == "bash -lc npm test"


# --- multi-agent loading & CLI --------------------------------------------------


def test_labels_and_agent_filter(tmp_path):
    r = Rollout()
    r.turn(0, "gpt-5")
    r.usage(1, "resp_1", input_tokens=10)
    r.write(tmp_path)
    assert label_for({"codex"}) == "Codex"
    assert label_for({"claude_code", "codex"}) == "Claude Code + Codex"
    assert len(load_sessions("codex", codex_home=tmp_path)) == 1
    assert load_sessions("claude", codex_home=tmp_path) == []
    with pytest.raises(ValueError):
        load_sessions("cursor")


def test_cli_codex_report_and_json(tmp_path):
    r = Rollout()
    r.turn(0, "gpt-6.1-sol")
    r.usage(1, "resp_1", input_tokens=500_000, cached=400_000, output=20_000)
    r.write(tmp_path)

    shown = CliRunner().invoke(
        app, ["--agent", "codex", "--codex-home", str(tmp_path), "--since", "all"]
    )
    assert shown.exit_code == 0, shown.output
    assert "Codex" in shown.output
    assert "API-equivalent estimates" in shown.output

    data = json.loads(
        CliRunner()
        .invoke(app, ["--codex-home", str(tmp_path), "--since", "all", "--json"])
        .output
    )
    assert [s["agent"] for s in data["sessions"]] == ["codex"]
    assert data["total_usd"] > 0

    bad = CliRunner().invoke(app, ["--agent", "cursor"])
    assert bad.exit_code != 0


def test_whole_analysis_runs_on_codex_sessions(tmp_path):
    r = Rollout()
    r.turn(0, "gpt-6.1-sol")
    for i in range(30):
        r.usage(i, f"resp_{i}", input_tokens=700_000, cached=650_000, output=2_000)
    r.write(tmp_path)
    analysis = analyze(codex.load_sessions(tmp_path))
    assert analysis.total > 0
    assert any(f.kind == "context_bloat" for f in analysis.findings)
