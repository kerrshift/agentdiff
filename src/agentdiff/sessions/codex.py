"""Reads OpenAI Codex CLI session logs (``~/.codex/sessions/**/rollout-*.jsonl``).

Format notes, from the openai/codex source (rust-v0.163.0). Tolerant by
design; unknown entry types are ignored:

* Each line is ``{"timestamp", "type", "payload"}`` (wrapped format, Codex
  0.33+). Older unwrapped files carry no token usage and are skipped.
* ``session_meta`` gives the thread id, cwd, and fork/subagent links
  (``forked_from_id``, ``parent_thread_id``). It has no model.
* ``turn_context`` carries the model for the turns that follow; it can change
  mid-session. ``event_msg``/``thread_settings_applied`` can also set the model
  and ``service_tier`` (``"priority"`` = Fast tier).
* Usage: ``token_usage_record`` is one record per API response (dedupe by
  ``response_id``). Older files only have ``event_msg``/``token_count`` with a
  cumulative ``total_token_usage`` and a per-response ``last_token_usage``.
  ``input_tokens`` includes ``cached_input_tokens``; ``output_tokens``
  includes reasoning tokens.
* Tools: ``response_item`` ``function_call`` / ``custom_tool_call`` /
  ``local_shell_call`` pair with ``*_output`` items by ``call_id``. Exit codes
  only appear inside the output text (``Process exited with code N`` or
  ``Exit code: N``). Paginated-mode files also record
  ``event_msg``/``item_completed`` command executions with ``exit_code``.
* Legacy-mode forks copy the parent's usage lines into the new file; shared
  request ids let :func:`dedupe_forks` count them once.
* Logs carry no cost, so all Codex figures are API-equivalent estimates.
"""

import hashlib
import json
import os
import re
from collections.abc import Iterator
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from agentdiff.sessions.dedupe import dedupe_forks
from agentdiff.sessions.models import ModelRequest, Session, ToolCall

SOURCE = "codex"
_EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)
_EXIT_RE = re.compile(r"(?:Process exited with code|Exit code:)\s*(-?\d+)")
_TOOL_ITEMS = {"function_call", "custom_tool_call", "local_shell_call"}
_TOOL_OUTPUTS = {"function_call_output", "custom_tool_call_output"}


def default_home() -> Path:
    """Codex's home dir, honouring ``CODEX_HOME``."""
    configured = os.environ.get("CODEX_HOME")
    return Path(configured).expanduser() if configured else Path.home() / ".codex"


def discover(home: Path | None = None) -> list[Path]:
    """Rollout files under ``sessions/`` and ``archived_sessions/``."""
    home = home or default_home()
    found: list[Path] = []
    for sub in ("sessions", "archived_sessions"):
        root = home / sub
        if root.is_dir():
            found.extend(p for p in root.rglob("rollout-*.jsonl*") if p.is_file())
    return sorted(p for p in found if p.suffix in (".jsonl", ".zst"))


def load_sessions(home: Path | None = None) -> list[Session]:
    sessions = [s for s in (read_session(p) for p in discover(home)) if s]
    return dedupe_forks(_attach_subagents(sessions))


def _attach_subagents(sessions: list[Session]) -> list[Session]:
    """Nests subagent threads under their parent thread when it is present."""
    by_id = {s.session_id: s for s in sessions}
    top = []
    for session in sessions:
        parent_id = session.parent_id
        parent = by_id.get(parent_id) if parent_id else None
        if parent is not None and parent is not session:
            session.agent_id = session.agent_id or session.session_id
            parent.subagents.append(session)
        else:
            top.append(session)
    return top


def _open_lines(path: Path) -> Iterator[str]:
    if path.suffix == ".zst":
        data = _decompress_zst(path)
        if data is None:
            return
        yield from data.decode("utf-8", "replace").splitlines()
        return
    with open(path, encoding="utf-8", errors="replace") as fh:
        yield from fh


def _decompress_zst(path: Path) -> bytes | None:
    """Reads a zstd-compressed rollout if a zstd module is available."""
    try:
        from compression import zstd  # Python 3.14+

        return zstd.decompress(path.read_bytes())
    except ImportError:
        pass
    try:
        import zstandard  # optional third-party

        with open(path, "rb") as fh:
            return zstandard.ZstdDecompressor().stream_reader(fh).read()
    except ImportError:
        return None
    except Exception:
        return None


def _iter_entries(path: Path) -> Iterator[dict[str, Any]]:
    for line in _open_lines(path):
        line = line.strip()
        if not line:
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(entry, dict) and "type" in entry and "payload" in entry:
            yield entry


def _parse_time(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _int(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def _output_text(output: Any) -> str:
    if isinstance(output, str):
        return output
    if isinstance(output, list):
        parts = []
        for item in output:
            if isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"])
            else:
                parts.append(json.dumps(item, sort_keys=True, default=str))
        return "\n".join(parts)
    if isinstance(output, dict):
        if isinstance(output.get("output"), str):
            return output["output"]
        return json.dumps(output, sort_keys=True, default=str)
    return "" if output is None else str(output)


def _exit_code(text: str, output: Any) -> int | None:
    match = _EXIT_RE.search(text)
    if match:
        return int(match.group(1))
    if isinstance(output, dict):  # 2025-era JSON output with metadata
        meta = output.get("metadata")
        if isinstance(meta, dict) and isinstance(meta.get("exit_code"), int):
            return meta["exit_code"]
    if isinstance(output, str) and output.startswith("{"):
        try:
            return _exit_code("", json.loads(output))
        except json.JSONDecodeError:
            return None
    return None


def _tool_input(item: dict[str, Any]) -> dict[str, Any]:
    kind = item.get("type")
    if kind == "function_call":
        raw = item.get("arguments")
        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
                return parsed if isinstance(parsed, dict) else {"arguments": parsed}
            except json.JSONDecodeError:
                return {"arguments": raw}
        return raw if isinstance(raw, dict) else {}
    if kind == "custom_tool_call":
        return {"input": item.get("input")}
    action = item.get("action")
    return action if isinstance(action, dict) else {}


class _Parser:
    def __init__(self, path: Path):
        self.path = path
        self.session_id = path.stem
        self.cwd: str | None = None
        self.branch: str | None = None
        self.parent_id: str | None = None
        self.model: str | None = None
        self.fast = False
        self.requests: list[ModelRequest] = []
        self.calls: dict[str, ToolCall] = {}
        self.pending: list[str] = []
        self.has_records = False
        self.count_requests: list[ModelRequest] = []
        self.last_total: str | None = None
        self.n = 0

    def feed(self, entry: dict[str, Any]) -> None:
        kind = entry["type"]
        payload = entry.get("payload")
        if not isinstance(payload, dict):
            return
        stamp = _parse_time(entry.get("timestamp"))
        if kind == "session_meta":
            self.session_id = str(payload.get("id") or self.session_id)
            self.cwd = payload.get("cwd") or self.cwd
            self.parent_id = payload.get("parent_thread_id") or self.parent_id
            git = payload.get("git")
            if isinstance(git, dict):
                self.branch = git.get("branch") or self.branch
        elif kind == "turn_context":
            self.model = payload.get("model") or self.model
            self.cwd = self.cwd or payload.get("cwd")
        elif kind == "token_usage_record":
            usage = payload.get("usage")
            rid = payload.get("response_id")
            if isinstance(usage, dict):
                self.has_records = True
                self._add_request(
                    f"codex:{rid}" if rid else None, usage, stamp, self.requests
                )
        elif kind == "event_msg":
            self._event(payload, stamp)
        elif kind == "response_item":
            self._response_item(payload, stamp)

    def _event(self, payload: dict[str, Any], stamp: datetime | None) -> None:
        etype = payload.get("type")
        if etype == "token_count":
            info = payload.get("info")
            if not isinstance(info, dict):
                return
            total = info.get("total_token_usage")
            last = info.get("last_token_usage")
            key = json.dumps(total, sort_keys=True)
            if not isinstance(last, dict) or key == self.last_total:
                return  # rate-limit-only or repeated event
            self.last_total = key
            digest = hashlib.sha1(key.encode()).hexdigest()[:16]
            self._add_request(f"codex-tc:{digest}", last, stamp, self.count_requests)
        elif etype == "thread_settings_applied":
            settings = payload.get("thread_settings")
            if isinstance(settings, dict):
                self.model = settings.get("model") or self.model
                tier = settings.get("service_tier")
                if tier is not None:
                    self.fast = tier == "priority"
        elif etype == "item_completed":
            item = payload.get("item")
            if isinstance(item, dict) and item.get("type") == "CommandExecution":
                self._command_execution(item, stamp)

    def _response_item(self, item: dict[str, Any], stamp: datetime | None) -> None:
        kind = item.get("type")
        if kind in _TOOL_ITEMS:
            call_id = item.get("call_id") or item.get("id")
            if not call_id or call_id in self.calls:
                return
            name = item.get("name") or ("shell" if kind == "local_shell_call" else kind)
            self.calls[call_id] = ToolCall(
                call_id=call_id,
                name=str(name),
                input=_tool_input(item),
                request_id="",
                timestamp=stamp,
            )
            self.pending.append(call_id)
        elif kind in _TOOL_OUTPUTS:
            call = self.calls.get(item.get("call_id"))
            if call is None:
                return
            output = item.get("output")
            text = _output_text(output)
            code = _exit_code(text, output)
            call.has_result = True
            call.is_error = code is not None and code != 0
            call.result_chars = len(text)
            call.result_hash = hashlib.sha1(text.encode("utf-8", "replace")).hexdigest()

    def _command_execution(self, item: dict[str, Any], stamp: datetime | None) -> None:
        """Paginated mode: a completed command with a structured exit code."""
        call_id = item.get("id")
        if not call_id or call_id in self.calls:
            return
        command = item.get("command")
        text = str(item.get("aggregated_output") or "")
        call = ToolCall(
            call_id=call_id,
            name="shell",
            input={
                "command": " ".join(command) if isinstance(command, list) else command
            },
            request_id="",
            timestamp=stamp,
            has_result=True,
            is_error=isinstance(item.get("exit_code"), int) and item["exit_code"] != 0,
            result_chars=len(text),
            result_hash=hashlib.sha1(text.encode("utf-8", "replace")).hexdigest(),
        )
        self.calls[call_id] = call
        self.pending.append(call_id)

    def _add_request(
        self,
        rid: str | None,
        usage: dict[str, Any],
        stamp: datetime | None,
        into: list[ModelRequest],
    ) -> None:
        self.n += 1
        total_in = _int(usage.get("input_tokens"))
        cached = _int(usage.get("cached_input_tokens"))
        written = _int(usage.get("cache_write_input_tokens"))
        request = ModelRequest(
            request_id=rid or f"codex:{self.session_id}:{self.n}",
            model=self.model,
            timestamp=stamp,
            input_tokens=max(0, total_in - cached - written),
            output_tokens=_int(usage.get("output_tokens")),
            cache_read_tokens=cached,
            cache_write_5m_tokens=written,
            fast=self.fast,
        )
        into.append(request)

    def build(self) -> Session | None:
        requests = self.requests if self.has_records else self.count_requests
        if not requests:
            return None
        self._assign_calls(requests)
        project = Path(self.cwd).name if self.cwd else self.path.parent.name
        session = Session(
            session_id=self.session_id,
            source=SOURCE,
            path=str(self.path),
            project=project,
            git_branch=self.branch,
            requests=requests,
            tool_calls=list(self.calls.values()),
            parent_id=self.parent_id,
        )
        return session

    def _assign_calls(self, requests: list[ModelRequest]) -> None:
        """Attributes each tool call to the first response logged after it.

        A response's usage is recorded when it completes, after the tool
        calls it emitted, so the next usage line after a call is the request
        that issued it.
        """
        ordered = sorted(requests, key=lambda r: r.timestamp or _EPOCH)
        calls = sorted(self.calls.values(), key=lambda c: c.timestamp or _EPOCH)
        i = 0
        for call in calls:
            while i < len(ordered) and (ordered[i].timestamp or _EPOCH) < (
                call.timestamp or _EPOCH
            ):
                i += 1
            target = ordered[min(i, len(ordered) - 1)]
            call.request_id = target.request_id
            target.tool_call_ids.append(call.call_id)


def read_session(path: Path) -> Session | None:
    parser = _Parser(path)
    for entry in _iter_entries(path):
        parser.feed(entry)
    return parser.build()
