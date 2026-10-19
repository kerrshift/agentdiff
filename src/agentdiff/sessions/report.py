"""Terminal and JSON rendering for the session spend report."""

from datetime import datetime
from typing import Any

from rich.console import Console
from rich.table import Table
from rich.text import Text

from agentdiff.sessions.analyzer import Analysis, Finding

ADVICE = {
    "context_bloat": "Start a fresh session per task; /compact before the context gets huge.",
    "cache_rebuild": "After a break of an hour or more, start a new session instead of resuming a giant one.",
    "stuck_retry": "When the same command fails the same way twice, stop and fix the setup once.",
    "struggle": "A recurring failure is worth a one-time fix (setup step, cwd, flaky test).",
    "reread": "Large files re-read unchanged: point the agent at the relevant section, or keep notes in CLAUDE.md.",
    "stagnant_repeat": "Identical calls returning identical output add cost but no information.",
}

KIND_LABEL = {
    "context_bloat": "Long context re-sent every turn",
    "cache_rebuild": "Cache rebuilt after breaks",
    "stuck_retry": "Stuck retries",
    "struggle": "Repeated failures",
    "reread": "Unchanged files re-read",
    "stagnant_repeat": "Identical repeated calls",
}


def _usd(value: float) -> str:
    return f"${value:,.2f}"


def _pct(part: float, whole: float) -> str:
    return f"{(part / whole * 100):.0f}%" if whole else "0%"


def render(
    analysis: Analysis,
    *,
    period: str,
    top: int = 5,
    console: Console | None = None,
) -> None:
    console = console or Console()
    total = analysis.total
    sessions = analysis.sessions
    if not sessions:
        console.print(
            "[yellow]No Claude Code sessions found[/yellow] in this period. "
            "Logs are read from ~/.claude/projects (or $CLAUDE_CONFIG_DIR)."
        )
        return

    projects = {s.session.project for s in sessions}
    console.print()
    console.print(
        Text.assemble(
            ("AgentDiff", "bold"),
            ("  ·  Claude Code  ·  ", "dim"),
            (period, "bold"),
        )
    )
    console.print(
        f"{len(sessions)} sessions · {len(projects)} projects · "
        f"[bold]{_usd(total)}[/bold]"
    )

    # Where the money went
    spend = analysis.spend
    console.print()
    console.print("[bold]Where the money went[/bold]")
    rows = [
        ("Re-reading context (cache reads)", spend.cache_read),
        ("Writing context to cache", spend.cache_write),
        ("Model output (incl. thinking)", spend.output),
        ("Background calls not in the transcript", spend.background),
        ("Fresh input", spend.input),
    ]
    width = max(len(r[0]) for r in rows)
    for label, value in rows:
        if value < 0.005:
            continue
        bar = "█" * round(value / total * 30) if total else ""
        console.print(
            f"  {label.ljust(width)}  {_usd(value).rjust(10)}  "
            f"{_pct(value, total).rjust(4)}  [cyan]{bar}[/cyan]"
        )

    # Avoidable spend by kind
    waste = analysis.waste
    by_kind: dict[str, float] = {}
    for finding in analysis.findings:
        if finding.is_waste:
            by_kind[finding.kind] = by_kind.get(finding.kind, 0.0) + finding.usd
    console.print()
    if waste < 0.01:
        console.print("[green]No avoidable spend found.[/green]")
    else:
        console.print(
            f"[bold]Avoidable ≈ {_usd(waste)}[/bold] "
            f"[dim]({_pct(waste, total)} of spend, conservative estimate)[/dim]"
        )
        for kind, value in sorted(by_kind.items(), key=lambda kv: -kv[1]):
            if value < 0.01:
                continue
            console.print(
                f"  [red]▸[/red] {KIND_LABEL.get(kind, kind)}  [bold]{_usd(value)}[/bold]"
            )
            if kind in ADVICE:
                console.print(f"    [dim]{ADVICE[kind]}[/dim]")

    # Top findings
    shown = [f for f in analysis.findings if f.usd >= 0.05][:top]
    if shown:
        console.print()
        console.print("[bold]Biggest items[/bold]")
        for finding in shown:
            _print_finding(console, finding)

    # Top sessions
    console.print()
    table = Table(title=None, show_edge=False, header_style="bold", pad_edge=False)
    table.add_column("Session", no_wrap=True, overflow="ellipsis", max_width=34)
    table.add_column(
        "Project", style="dim", no_wrap=True, overflow="ellipsis", max_width=16
    )
    table.add_column("When", style="dim")
    table.add_column("Cost", justify="right")
    table.add_column("Avoidable", justify="right")
    table.add_column("Turns", justify="right")
    table.add_column("Peak ctx", justify="right")
    for summary in sessions[:top]:
        session = summary.session
        when = session.started_at.strftime("%b %d") if session.started_at else "?"
        label = session.title or session.session_id[:8]
        table.add_row(
            label,
            session.project,
            when,
            _usd(summary.cost),
            _usd(summary.waste) if summary.waste >= 0.01 else "-",
            str(len(session.all_requests())),
            f"{session.peak_context // 1000}k",
        )
    console.print(table)

    reported = [s for s in sessions if s.session.reported_cost is not None]
    if reported:
        console.print(
            f"\n[dim]Costs rebuilt from logged token usage at list prices; "
            f"{len(reported)} sessions cross-checked against Claude Code's own counter. "
            f"Nothing left your machine.[/dim]"
        )
    console.print(
        "[dim]Share it:[/dim] [bold]agentdiff --card[/bold] "
        "[dim]makes an image for LinkedIn or X (totals only, no project names).[/dim]"
    )
    console.print()


def _print_finding(console: Console, finding: Finding) -> None:
    session = finding.session
    tag = "" if finding.is_waste else " [dim](info)[/dim]"
    console.print(f"  [bold]{_usd(finding.usd).rjust(9)}[/bold]  {finding.title}{tag}")
    console.print(f"             [dim]{session.label} · {session.project}[/dim]")


def to_json(analysis: Analysis, *, period: str) -> dict[str, Any]:
    spend = analysis.spend

    def iso(value: datetime | None) -> str | None:
        return value.isoformat() if value else None

    return {
        "period": period,
        "total_usd": round(analysis.total, 4),
        "avoidable_usd": round(analysis.waste, 4),
        "spend": {
            "cache_read_usd": round(spend.cache_read, 4),
            "cache_write_usd": round(spend.cache_write, 4),
            "output_usd": round(spend.output, 4),
            "input_usd": round(spend.input, 4),
            "background_usd": round(spend.background, 4),
            "unpriced_requests": spend.unpriced_requests,
        },
        "sessions": [
            {
                "session_id": s.session.session_id,
                "title": s.session.title,
                "project": s.session.project,
                "started_at": iso(s.session.started_at),
                "ended_at": iso(s.session.ended_at),
                "cost_usd": round(s.cost, 4),
                "reconstructed_usd": round(s.reconstructed, 4),
                "reported_usd": s.session.reported_cost,
                "avoidable_usd": round(s.waste, 4),
                "turns": len(s.session.all_requests()),
                "tool_calls": len(s.session.all_tool_calls()),
                "subagents": len(s.session.subagents),
                "peak_context_tokens": s.session.peak_context,
            }
            for s in analysis.sessions
        ],
        "findings": [f.to_dict() for f in analysis.findings],
    }
