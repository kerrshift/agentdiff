"""Counts each billed request once across sessions, for every agent.

Resumed and forked sessions can copy their parent's history (same request
ids) into a new file: Claude Code always does on resume/fork, Codex does on
legacy-mode forks. The earliest session keeps a request; later copies drop
it. A fork's own reported total includes inherited spend, so it is not
trusted once anything was removed.
"""

import os
from datetime import datetime, timezone

from agentdiff.sessions.models import Session

_EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)


def dedupe_forks(sessions: list[Session]) -> list[Session]:
    """Drops requests already counted in an earlier session."""
    seen: set[str] = set()
    kept = []
    for session in sorted(sessions, key=_age_key):
        if _drop_seen(session, seen):
            session.reported_cost = None
        if session.all_requests():
            kept.append(session)
    return kept


def _age_key(session: Session) -> tuple[datetime, float]:
    # Copied history carries the parent's timestamps, so break ties by which
    # file was created first.
    try:
        stat = os.stat(session.path)
        created = getattr(stat, "st_birthtime", stat.st_mtime)
    except OSError:
        created = 0.0
    return (session.started_at or _EPOCH, created)


def _drop_seen(session: Session, seen: set[str]) -> bool:
    removed = False
    fresh = []
    for request in session.requests:
        if request.request_id in seen:
            removed = True
            continue
        seen.add(request.request_id)
        fresh.append(request)
    if removed:
        live = {cid for r in fresh for cid in r.tool_call_ids}
        session.requests = fresh
        session.tool_calls = [c for c in session.tool_calls if c.call_id in live]
    for sub in session.subagents:
        removed = _drop_seen(sub, seen) or removed
    session.subagents = [s for s in session.subagents if s.requests]
    return removed
