"""Finds wasted spend in coding-agent sessions.

Every finding names a session and a concrete pointer (file, command, tool) and
carries a conservative dollar estimate: the cost of the model requests that
issued the redundant calls, prorated by the number of tool calls in each
request. The extra context those results added to later turns is not counted,
so real waste is usually higher.
"""

import json
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any

from agentdiff.engine.loop_detector import detect_identical_call_loops
from agentdiff.sessions.models import Session, ToolCall
from agentdiff.sessions.pricing import price_for

READ_TOOLS = {"Read", "Grep", "Glob", "LS", "NotebookRead"}

# Context above this size is re-sent every turn; long tails here are what
# /clear or /compact between tasks would avoid.
CONTEXT_BLOAT_TOKENS = 200_000


@dataclass
class Thresholds:
    repeat_min: int = 3  # identical call + identical result, this many times
    stuck_min: int = 3  # identical failing call with the identical error
    struggle_min: int = 6  # same command failing this many times in a session
    bloat_tokens: int = CONTEXT_BLOAT_TOKENS
    bloat_min_usd: float = 1.0
    subagent_min_usd: float = 3.0
    rebuild_min_tokens: int = 50_000
    rebuild_min_gap_min: float = 5.0


def _fmt_gap(minutes: float) -> str:
    if minutes >= 120:
        return f"{minutes / 60:.0f}h"
    return f"{minutes:.0f} min"


@dataclass
class Finding:
    # stagnant_repeat | reread | stuck_retry | struggle | context_bloat |
    # cache_rebuild | subagent
    kind: str
    title: str
    detail: str
    session: Session
    usd: float
    count: int = 0
    is_waste: bool = True
    evidence: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "kind": self.kind,
            "title": self.title,
            "detail": self.detail,
            "session_id": self.session.session_id,
            "session": self.session.label,
            "project": self.session.project,
            "usd": round(self.usd, 4),
            "count": self.count,
            "is_waste": self.is_waste,
            "evidence": self.evidence,
        }


def _call_cost_index(session: Session) -> dict[str, float]:
    """Maps tool-call id -> share of its request's cost."""
    index: dict[str, float] = {}
    for request in session.requests:
        if not request.tool_call_ids:
            continue
        share = request.cost / len(request.tool_call_ids)
        for call_id in request.tool_call_ids:
            index[call_id] = share
    return index


def describe_call(call: ToolCall, width: int = 70) -> str:
    """Short human pointer for a tool call: file path, command or pattern."""
    data = call.input
    for key in (
        "file_path",
        "notebook_path",
        "path",
        "command",
        "pattern",
        "url",
        "query",
    ):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            text = " ".join(value.split())
            return text if len(text) <= width else text[: width - 1] + "…"
    # MCP tools: "mcp__server__tool" -> "tool(action=…)"
    short = call.name.rsplit("__", 1)[-1]
    if isinstance(data.get("action"), str):
        text = f"{short}(action={data['action']})"
    else:
        text = f"{short}({json.dumps(data, sort_keys=True, default=str)})"
    return text if len(text) <= width else text[: width - 1] + "…"


def _command_family(call: ToolCall) -> str:
    """Groups Bash commands by their leading words (e.g. ``npm test``)."""
    command = call.input.get("command")
    if call.name != "Bash" or not isinstance(command, str):
        return f"{call.name}:{describe_call(call, 200)}"
    words = command.strip().split()
    # Skip env assignments and `cd x &&` prefixes.
    while words and ("=" in words[0] and not words[0].startswith("-")):
        words = words[1:]
    if len(words) >= 3 and words[0] == "cd" and words[2] in ("&&", ";"):
        words = words[3:]
    return "Bash:" + " ".join(words[:2])


def analyze_session(session: Session, t: Thresholds | None = None) -> list[Finding]:
    t = t or Thresholds()
    findings: list[Finding] = []
    costs = _call_cost_index(session)
    calls_by_id = {c.call_id: c for c in session.tool_calls}

    # 1. Stagnant repeats via the trajectory engine: same tool, same input,
    #    same result. The first call is useful; the rest are waste.
    stuck_ids: set[str] = set()
    for loop in detect_identical_call_loops(session.to_trace()):
        calls = [calls_by_id[i] for i in loop["step_ids"] if i in calls_by_id]
        if not calls or not calls[0].has_result:
            continue
        first = calls[0]
        usd = sum(costs.get(c.call_id, 0.0) for c in calls[1:])
        n = len(calls)
        if first.is_error:
            if n < t.stuck_min:
                continue
            stuck_ids.update(c.call_id for c in calls)
            findings.append(
                Finding(
                    kind="stuck_retry",
                    title=f"Stuck retry: `{describe_call(first)}` failed {n}x with the same error",
                    detail="Identical command, identical error each time; nothing changed between attempts.",
                    session=session,
                    usd=usd,
                    count=n,
                    evidence={"tool": first.name, "input": describe_call(first, 200)},
                )
            )
        elif n >= t.repeat_min:
            reread = first.name in READ_TOOLS
            findings.append(
                Finding(
                    kind="reread" if reread else "stagnant_repeat",
                    title=(
                        f"Re-read unchanged: {describe_call(first)} read {n}x"
                        if reread
                        else f"Repeated `{describe_call(first)}` {n}x with identical output"
                    ),
                    detail="Same input and same result every time; only the first call added information.",
                    session=session,
                    usd=usd,
                    count=n,
                    evidence={"tool": first.name, "input": describe_call(first, 200)},
                )
            )

    # 2. Struggle: one command family failing many times (inputs may differ).
    failures: dict[str, list[ToolCall]] = defaultdict(list)
    for call in session.tool_calls:
        if call.is_error and call.call_id not in stuck_ids:
            failures[_command_family(call)].append(call)
    for family, calls in failures.items():
        if len(calls) < t.struggle_min:
            continue
        usd = sum(costs.get(c.call_id, 0.0) for c in calls)
        label = family.split(":", 1)[1]
        findings.append(
            Finding(
                kind="struggle",
                title=f"Struggled: `{label}` failed {len(calls)}x",
                detail="Many failed attempts at the same kind of command. Often a missing setup step, wrong cwd, or a flaky test worth fixing once.",
                session=session,
                usd=usd,
                count=len(calls),
                evidence={"family": family},
            )
        )

    # 3. Context bloat: cost of re-reading context above the threshold.
    bloat_usd = 0.0
    bloat_turns = 0
    for request in session.requests:
        excess = request.cache_read_tokens - t.bloat_tokens
        price = price_for(request.model)
        if excess > 0 and price is not None:
            bloat_turns += 1
            bloat_usd += excess * price.cache_read / 1_000_000
    if bloat_turns and bloat_usd >= t.bloat_min_usd:
        findings.append(
            Finding(
                kind="context_bloat",
                title=(
                    f"Long context: {bloat_turns} turns re-sent >{t.bloat_tokens // 1000}k tokens "
                    f"(peak {session.peak_context // 1000}k)"
                ),
                detail="Every turn re-reads the whole conversation. Starting a fresh session or compacting between tasks avoids paying for this.",
                session=session,
                usd=bloat_usd,
                count=bloat_turns,
                evidence={"peak_context": session.peak_context},
            )
        )

    # 4. Cache rebuilds: after an idle gap the prompt cache expires and the
    #    whole context is written again at write prices instead of read prices.
    rebuilds = []
    previous = None
    for request in session.requests:
        written = request.cache_write_5m_tokens + request.cache_write_1h_tokens
        price = price_for(request.model)
        if (
            previous is not None
            and price is not None
            and written >= t.rebuild_min_tokens
            and request.timestamp
            and previous.timestamp
        ):
            gap_min = (request.timestamp - previous.timestamp).total_seconds() / 60
            if gap_min >= t.rebuild_min_gap_min:
                extra = (
                    request.cache_write_5m_tokens * price.cache_write_5m
                    + request.cache_write_1h_tokens * price.cache_write_1h
                    - written * price.cache_read
                ) / 1_000_000
                rebuilds.append((extra, gap_min, written))
        previous = request
    if rebuilds:
        usd = sum(r[0] for r in rebuilds)
        top = max(rebuilds)
        findings.append(
            Finding(
                kind="cache_rebuild",
                title=(
                    f"Cache rebuilt {len(rebuilds)}x after breaks "
                    f"(worst: {top[2] // 1000}k tokens after {_fmt_gap(top[1])})"
                ),
                detail="Coming back to a long session after the prompt cache expired re-writes the whole context. After a break, start a fresh session or /compact first.",
                session=session,
                usd=usd,
                count=len(rebuilds),
                evidence={
                    "rebuilds": [
                        {"usd": round(e, 4), "gap_min": round(g, 1), "tokens": w}
                        for e, g, w in rebuilds
                    ]
                },
            )
        )

    # 5. Expensive subagents (informational, not counted as waste).
    for sub in session.subagents:
        if sub.cost < t.subagent_min_usd:
            continue
        findings.append(
            Finding(
                kind="subagent",
                title=f"Subagent cost ${sub.cost:.2f} over {len(sub.requests)} turns",
                detail=f"{len(sub.tool_calls)} tool calls. Consider a cheaper model or a narrower brief for this kind of task.",
                session=session,
                usd=sub.cost,
                count=len(sub.requests),
                is_waste=False,
                evidence={"agent_id": sub.agent_id},
            )
        )

    # Subagent transcripts get the same waste checks.
    for sub in session.subagents:
        for finding in analyze_session(sub, t):
            if finding.kind in ("subagent",):
                continue
            finding.session = session
            finding.title = f"[subagent] {finding.title}"
            findings.append(finding)

    return findings


@dataclass
class SpendBreakdown:
    output: float = 0.0
    cache_read: float = 0.0
    cache_write: float = 0.0
    input: float = 0.0
    background: float = 0.0  # reported by the agent but absent from the transcript
    unpriced_requests: int = 0

    @property
    def total(self) -> float:
        return (
            self.output
            + self.cache_read
            + self.cache_write
            + self.input
            + self.background
        )


@dataclass
class SessionSummary:
    session: Session
    cost: float
    reconstructed: float
    waste: float
    findings: list[Finding]


@dataclass
class Analysis:
    sessions: list[SessionSummary]
    findings: list[Finding]
    spend: SpendBreakdown

    @property
    def total(self) -> float:
        return self.spend.total

    @property
    def waste(self) -> float:
        return sum(f.usd for f in self.findings if f.is_waste)


def analyze(sessions: list[Session], t: Thresholds | None = None) -> Analysis:
    spend = SpendBreakdown()
    summaries: list[SessionSummary] = []
    all_findings: list[Finding] = []
    for session in sessions:
        for request in session.all_requests():
            if not request.priced:
                spend.unpriced_requests += 1
                continue
            parts = request.cost_breakdown()
            spend.output += parts["output"]
            spend.cache_read += parts["cache_read"]
            spend.cache_write += parts["cache_write"]
            spend.input += parts["input"]
        reconstructed = session.cost
        reported = session.reported_cost or 0.0
        cost = max(reconstructed, reported)
        spend.background += cost - reconstructed
        findings = analyze_session(session, t)
        findings.sort(key=lambda f: f.usd, reverse=True)
        all_findings.extend(findings)
        summaries.append(
            SessionSummary(
                session=session,
                cost=cost,
                reconstructed=reconstructed,
                waste=sum(f.usd for f in findings if f.is_waste),
                findings=findings,
            )
        )
    summaries.sort(key=lambda s: s.cost, reverse=True)
    all_findings.sort(key=lambda f: f.usd, reverse=True)
    return Analysis(sessions=summaries, findings=all_findings, spend=spend)
