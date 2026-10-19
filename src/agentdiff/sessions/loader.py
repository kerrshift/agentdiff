"""Loads sessions from every supported coding agent."""

from pathlib import Path

from agentdiff.sessions import claude_code, codex
from agentdiff.sessions.models import Session

AGENTS = ("claude", "codex")
LABELS = {claude_code.SOURCE: "Claude Code", codex.SOURCE: "Codex"}


def load_sessions(
    agent: str = "all",
    *,
    claude_root: Path | None = None,
    codex_home: Path | None = None,
) -> list[Session]:
    """Sessions for ``agent`` ("all", "claude" or "codex")."""
    if agent not in ("all", *AGENTS):
        raise ValueError(f"unknown agent {agent!r}; use all, claude or codex")
    sessions: list[Session] = []
    if agent in ("all", "claude"):
        sessions.extend(claude_code.load_sessions(claude_root))
    if agent in ("all", "codex"):
        sessions.extend(codex.load_sessions(codex_home))
    return sessions


def label_for(sources: set[str]) -> str:
    names = [LABELS[s] for s in (claude_code.SOURCE, codex.SOURCE) if s in sources]
    return " + ".join(names) or "Claude Code"
