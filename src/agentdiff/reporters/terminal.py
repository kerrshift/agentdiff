from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from agentdiff.models.report import DiffReport, StepDiffStatus
from agentdiff.models.step import StepStatus


def render_diff_table(report: DiffReport) -> Table:
    """Renders the step-by-step diff as a Rich Table."""
    table = Table(
        title="Trajectory Comparison Details",
        show_header=True,
        header_style="bold magenta",
    )
    table.add_column("Index", style="dim", width=6)
    table.add_column("Step Name", width=25)
    table.add_column("Status", width=12)
    table.add_column("Baseline (Lat/Tkn/Cost)", width=28)
    table.add_column("Candidate (Lat/Tkn/Cost)", width=28)

    for idx, sd in enumerate(report.step_diffs):
        status_text = Text(sd.diff_status.value.upper())
        row_style = ""

        if sd.diff_status == StepDiffStatus.MATCHED:
            status_text.stylize("dim green")
            row_style = "dim"
        elif sd.diff_status == StepDiffStatus.MATCHED_COMMUTATIVE:
            status_text.stylize("dim cyan")
            row_style = "dim"
        elif sd.diff_status == StepDiffStatus.ADDED:
            status_text.stylize("bold cyan")
            row_style = "bold cyan"
        elif sd.diff_status == StepDiffStatus.REMOVED:
            status_text.stylize("bold red")
            row_style = "bold red"
        elif sd.diff_status == StepDiffStatus.MODIFIED:
            status_text.stylize("bold yellow")
            row_style = "bold yellow"

        base_info = "-"
        if sd.baseline_step:
            s = sd.baseline_step
            base_info = f"{s.latency_ms:.0f}ms / {s.tokens.total_tokens}t / ${s.tokens.estimated_cost_usd:.4f}"
            if s.status != StepStatus.SUCCESS:
                base_info += f" ({s.status.value.upper()})"

        cand_info = "-"
        if sd.candidate_step:
            s = sd.candidate_step
            cand_info = f"{s.latency_ms:.0f}ms / {s.tokens.total_tokens}t / ${s.tokens.estimated_cost_usd:.4f}"
            if s.status != StepStatus.SUCCESS:
                cand_info += f" ({s.status.value.upper()})"

        table.add_row(
            str(idx + 1),
            sd.step_name,
            status_text,
            base_info,
            cand_info,
            style=row_style,
        )

    return table


def print_report(report: DiffReport, gate_provenance: str | None = None):
    """Outputs the complete DiffReport to the terminal.

    ``gate_provenance`` (G7) appends a one-line, self-describing gate summary
    — active thresholds and their source — so the report answers "what rules
    judged me?" without opening the config.
    """
    console = Console()

    status_str = (
        "[bold green]PASSED[/bold green]"
        if report.passed
        else "[bold red]FAILED[/bold red]"
    )
    summary_text = (
        f"[bold]Baseline Trace:[/bold]  {report.baseline_id}\n"
        f"[bold]Candidate Trace:[/bold] {report.candidate_id}\n"
        f"[bold]Comparison Status:[/bold] {status_str}\n\n"
        f"[bold]Trajectory Divergence Index (TDI):[/bold] {report.trajectory_divergence_index:.4f}\n"
        f"[bold]Baseline Wasted Effort (WEI):[/bold]  {report.baseline_wei:.4f}\n"
        f"[bold]Candidate Wasted Effort (WEI):[/bold] {report.candidate_wei:.4f}\n"
        f"[bold]Recovery Steps (base/cand):[/bold]  "
        f"{report.baseline_recovery_steps} / {report.candidate_recovery_steps} "
        f"(RSR {report.recovery_step_ratio:.2f})\n\n"
        f"[bold]Resource Deltas:[/bold]\n"
        f"  • Latency Delta: {report.latency_delta_percentage:+.2f}%\n"
        f"  • Token Delta:   {report.token_delta_percentage:+.2f}%\n"
        f"  • Cost Delta:    {report.cost_delta_percentage:+.2f}%"
    )
    if gate_provenance:
        summary_text += f"\n\n[dim]{gate_provenance}[/dim]"

    panel = Panel(
        summary_text,
        title="[bold cyan]AgentDiff Comparison Summary[/bold cyan]",
        border_style="cyan",
    )
    console.print(panel)

    if report.loops_detected:
        loop_text = ""
        for idx, loop in enumerate(report.loops_detected):
            stagnant_str = " (Stagnant state changes)" if loop.get("stagnant") else ""
            loop_text += f"[bold red]Loop #{idx + 1}:[/bold red] Repeated {loop['steps']} {loop['iterations']} times{stagnant_str}\n"
        loop_panel = Panel(
            loop_text.strip(),
            title="[bold red]Warnings: Loops Detected[/bold red]",
            border_style="red",
        )
        console.print(loop_panel)

    if report.violations:
        violation_text = ""
        for finding in report.violations:
            violation_text += f"[bold red]✖ {finding.message}[/bold red]\n"
        violation_panel = Panel(
            violation_text.strip(),
            title="[bold red]Hard Violations (blocking)[/bold red]",
            border_style="red",
        )
        console.print(violation_panel)

    if report.warnings:
        warning_text = ""
        for finding in report.warnings:
            warning_text += f"[bold yellow]⚠ {finding.message}[/bold yellow]\n"
        warning_panel = Panel(
            warning_text.strip(),
            title="[bold yellow]Soft Warnings (non-blocking)[/bold yellow]",
            border_style="yellow",
        )
        console.print(warning_panel)

    console.print(render_diff_table(report))
