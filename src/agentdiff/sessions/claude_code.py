"""Reads Claude Code session logs (``~/.claude/projects/**/*.jsonl``).

Format notes (tolerant by design; unknown entry types are ignored):

* ``assistant`` entries carry one content block each. Blocks of the same API
  request share ``requestId`` and repeat the same ``usage`` — usage must be
  counted once per request, not once per line.
* ``tool_use`` blocks (assistant) pair with ``tool_result`` blocks (user) via
  ``tool_use_id``.
* ``custom-title`` gives the session title; ``cost-state`` carries Claude
  Code's own running cost counter (used to cross-check our pricing).
* Subagent transcripts live in ``<session-id>/subagents/agent-*.jsonl``.
"""

import hashlib
import json
import os
from collections.abc import Iterator
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from agentdiff.sessions.dedupe import dedupe_forks
from agentdiff.sessions.models import ModelRequest, Session, ToolCall

SOURCE = "claude_code"
_EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)

__all__ = ["dedupe_forks", "discover", "load_sessions", "read_session"]


def default_root() -> Path:
    """Claude Code's config dir, honouring ``CLAUDE_CONFIG_DIR``."""
    configured = os.environ.get("CLAUDE_CONFIG_DIR")
    return Path(configured).expanduser() if configured else Path.home() / ".claude"


def discover(root: Path | None = None) -> list[Path]:
    """Returns top-level session files (subagent files are attached later)."""
    projects = (root or default_root()) / "projects"
    if not projects.is_dir():
        return []
    return sorted(p for p in projects.glob("*/*.jsonl") if p.is_file())


def load_sessions(root: Path | None = None) -> list[Session]:
    sessions = []
    for path in discover(root):
        session = read_session(path)
        if session is not None:
            sessions.append(session)
    return dedupe_forks(sessions)


def read_session(path: Path) -> Session | None:
    """Parses one session file plus its subagent transcripts."""
    session = _parse_file(path)
    if session is None:
        return None
    sub_dir = path.with_suffix("") / "subagents"
    if sub_dir.is_dir():
        for sub_path in sorted(sub_dir.glob("*.jsonl")):
            sub = _parse_file(sub_path)
            if sub is not None and sub.requests:
                sub.agent_id = sub.agent_id or sub_path.stem.removeprefix("agent-")
                session.subagents.append(sub)
    return session


def _iter_entries(path: Path) -> Iterator[dict[str, Any]]:
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(entry, dict):
                yield entry


def _parse_time(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _result_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                if block.get("type") == "text":
                    parts.append(str(block.get("text", "")))
                else:
                    parts.append(json.dumps(block, sort_keys=True, default=str))
        return "\n".join(parts)
    return "" if content is None else json.dumps(content, sort_keys=True, default=str)


def _parse_file(path: Path) -> Session | None:
    requests: dict[str, ModelRequest] = {}
    calls: dict[str, ToolCall] = {}
    title = None
    cwd = None
    branch = None
    agent_id = None
    reported = None
    session_id = path.stem

    for entry in _iter_entries(path):
        kind = entry.get("type")
        cwd = cwd or entry.get("cwd")
        branch = branch or entry.get("gitBranch")
        agent_id = agent_id or entry.get("agentId")
        if entry.get("sessionId") and not path.parent.name == "subagents":
            session_id = entry["sessionId"]

        if kind == "custom-title" and entry.get("customTitle"):
            title = str(entry["customTitle"])
        elif kind == "cost-state":
            value = entry.get("totalCostUSD")
            if isinstance(value, (int, float)):
                reported = float(value)
        elif kind == "assistant":
            _read_assistant(entry, requests, calls)
        elif kind == "user":
            _read_user(entry, calls)

    if not requests:
        return None
    project = Path(cwd).name if cwd else path.parent.name
    return Session(
        session_id=session_id,
        source=SOURCE,
        path=str(path),
        project=project,
        title=title,
        git_branch=branch,
        requests=sorted(requests.values(), key=lambda r: r.timestamp or _EPOCH),
        tool_calls=list(calls.values()),
        reported_cost=reported,
        agent_id=agent_id,
    )


def _read_assistant(
    entry: dict[str, Any],
    requests: dict[str, ModelRequest],
    calls: dict[str, ToolCall],
) -> None:
    message = entry.get("message")
    if not isinstance(message, dict):
        return
    model = message.get("model")
    if model == "<synthetic>":
        return
    request_id = entry.get("requestId") or message.get("id") or entry.get("uuid")
    if not request_id:
        return
    usage = message.get("usage") if isinstance(message.get("usage"), dict) else {}
    split = usage.get("cache_creation") if isinstance(usage, dict) else None
    write_total = int(usage.get("cache_creation_input_tokens") or 0)
    if isinstance(split, dict):
        write_1h = int(split.get("ephemeral_1h_input_tokens") or 0)
        write_5m = int(split.get("ephemeral_5m_input_tokens") or 0)
        if write_1h + write_5m == 0:
            write_5m = write_total
    else:
        write_1h, write_5m = 0, write_total

    request = requests.get(request_id)
    if request is None:
        request = ModelRequest(
            request_id=request_id,
            model=model,
            timestamp=_parse_time(entry.get("timestamp")),
        )
        requests[request_id] = request
    # Usage repeats on every block of a request; the last copy is final.
    request.input_tokens = int(usage.get("input_tokens") or 0)
    request.output_tokens = int(usage.get("output_tokens") or 0)
    request.cache_read_tokens = int(usage.get("cache_read_input_tokens") or 0)
    request.cache_write_5m_tokens = write_5m
    request.cache_write_1h_tokens = write_1h
    request.fast = usage.get("speed") == "fast"

    content = message.get("content")
    if not isinstance(content, list):
        return
    for block in content:
        if not isinstance(block, dict) or block.get("type") != "tool_use":
            continue
        call_id = block.get("id")
        if not call_id or call_id in calls:
            continue
        tool_input = block.get("input")
        calls[call_id] = ToolCall(
            call_id=call_id,
            name=str(block.get("name") or "unknown"),
            input=tool_input if isinstance(tool_input, dict) else {},
            request_id=request_id,
            timestamp=request.timestamp,
        )
        request.tool_call_ids.append(call_id)


def _read_user(entry: dict[str, Any], calls: dict[str, ToolCall]) -> None:
    message = entry.get("message")
    content = message.get("content") if isinstance(message, dict) else None
    if not isinstance(content, list):
        return
    for block in content:
        if not isinstance(block, dict) or block.get("type") != "tool_result":
            continue
        call = calls.get(block.get("tool_use_id"))
        if call is None:
            continue
        text = _result_text(block.get("content"))
        call.has_result = True
        call.is_error = bool(block.get("is_error"))
        call.result_chars = len(text)
        call.result_hash = hashlib.sha1(text.encode("utf-8", "replace")).hexdigest()
