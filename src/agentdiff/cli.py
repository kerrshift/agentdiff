import json
import os
import shutil
import sys
from pathlib import Path

import typer

from agentdiff.ci.baseline import decide_rotation
from agentdiff.ci.github import post_pr_comment
from agentdiff.config import AgentDiffConfig, find_config_file, load_config
from agentdiff.engine.comparator import compare
from agentdiff.engine.explanations import format_explanations, locate_culprit
from agentdiff.engine.tree import render_tree
from agentdiff.governance import diff_gate_thresholds, provenance_line
from agentdiff.loader import load_trace
from agentdiff.models.step import StepStatus
from agentdiff.recorder import record_run, save_trace
from agentdiff.reporters.markdown import generate_markdown
from agentdiff.reporters.pr import generate_pr_markdown
from agentdiff.reporters.terminal import print_report

app = typer.Typer(
    help="AgentDiff CLI - Compare multi-turn agent execution trajectories."
)


@app.command(name="record")
def record(
    target: str = typer.Argument(
        ...,
        help="Callable to run, as 'module:function' or 'module:Class.method'.",
    ),
    out: str = typer.Option(
        ...,
        "--out",
        "-o",
        help="Path to write the captured trace JSON (e.g. traces/run.json).",
    ),
    input_json: str | None = typer.Option(
        None,
        "--input",
        "-i",
        help="JSON object passed to the callable as kwargs (or a single positional arg if not an object). Use '@file.json' to read from a file.",
    ),
    name: str | None = typer.Option(
        None,
        "--name",
        help="Agent name recorded in the trace (default: function name).",
    ),
):
    """Runs an agent callable once and captures its trajectory as a trace.

    Example:
        agentdiff record my_agent:run --input '{"question": "hi"}' --out traces/run.json

    The captured trace is a canonical AgentDiff JSON, ready for:

        agentdiff diff traces/baseline.json traces/run.json
    """
    task_input: dict | None = None
    if input_json:
        try:
            if input_json.startswith("@"):
                task_input = json.loads(
                    Path(input_json[1:]).read_text(encoding="utf-8")
                )
            else:
                task_input = json.loads(input_json)
        except (json.JSONDecodeError, FileNotFoundError) as e:
            typer.echo(f"Invalid --input: {e}", err=True)
            sys.exit(2)
        if not isinstance(task_input, dict):
            task_input = {"input": task_input}

    try:
        trace = record_run(target, task_input=task_input, agent_name=name)
    except ValueError as e:
        typer.echo(f"Error: {e}", err=True)
        sys.exit(2)
    except Exception as e:
        typer.echo(f"Recording failed: {e}", err=True)
        sys.exit(3)

    path = save_trace(trace, out)

    if trace.steps[0].status == StepStatus.ERROR:
        typer.echo(
            f"Recorded FAILED run → {path}\n  error: {trace.steps[0].error_message}",
            err=True,
        )
        sys.exit(1)

    typer.echo(f"Recorded run → {path}")
    typer.echo(f"  agent: {trace.agent_name} · latency: {trace.total_latency_ms:.0f}ms")
    typer.echo(f"Next: agentdiff diff <baseline> {path}")


def _resolve_cli(cfg: AgentDiffConfig, **values):
    """Returns config-provided values for any option left at its sentinel."""
    resolved = {}
    for key, val in values.items():
        if val is not None:
            resolved[key] = val
        elif key == "adapter":
            resolved[key] = cfg.adapter.name or "auto"
        else:
            resolved[key] = getattr(cfg.cli, key, None)
    return resolved


@app.command(name="diff")
def diff(
    baseline_path: str = typer.Argument(..., help="Path to baseline trace JSON file"),
    candidate_path: str = typer.Argument(..., help="Path to candidate trace JSON file"),
    adapter: str | None = typer.Option(
        None,
        help="Telemetry adapter: auto, generic, openinference, langfuse, langsmith, openai_agents (default: config or auto)",
    ),
    format: str | None = typer.Option(
        None,
        help="Output format: terminal, json, markdown, pr (default: config or terminal)",
    ),
    output_file: str | None = typer.Option(
        None, help="Write output to specified file path"
    ),
    config: str | None = typer.Option(
        None,
        "--config",
        help="Path to an agentdiff.toml config file (default: auto-discovered agentdiff.toml).",
    ),
    explain: bool = typer.Option(
        False,
        "--explain",
        help="Print human-readable explanations of why the run diverged.",
    ),
    tree: bool = typer.Option(
        False,
        "--tree",
        help="Print a collapsed, capped divergence view of the trajectories.",
    ),
    fail_on_regression: bool = typer.Option(
        False, help="Return exit code 1 if regressions are detected"
    ),
    max_loops: int | None = typer.Option(
        None, help="Maximum allowed loop count before regression (default: config or 0)"
    ),
    max_divergence: float | None = typer.Option(
        None, help="Maximum allowed TDI before regression (default: config or 0.3)"
    ),
    max_cost_delta: float | None = typer.Option(
        None,
        help="Maximum allowed cost increase %% before regression (default: config or 10.0)",
    ),
    max_recovery_ratio: float | None = typer.Option(
        None,
        help="Maximum allowed Recovery Step Ratio (RSR) before regression "
        "(candidate vs baseline post-error recovery effort; opt-in).",
    ),
    baseline_store: str | None = typer.Option(
        None,
        "--baseline",
        "-b",
        help="Path to a persistent baseline trace file. First run establishes it when --update-baseline is set.",
    ),
    update_baseline: bool = typer.Option(
        False,
        "--update-baseline",
        help="Overwrite the persistent baseline with the candidate after a clean diff.",
    ),
    pr: int | None = typer.Option(
        None,
        "--pr",
        help="Post the PR-ready markdown as a comment to this GitHub PR number.",
    ),
    baseline_rotation: str = typer.Option(
        "manual",
        "--baseline-rotation",
        help="Baseline rotation policy: manual, auto, or staged.",
    ),
    max_drift: float = typer.Option(
        0.05, help="Max TDI a clean run may have for staged auto-rotation."
    ),
    baseline_config: str | None = typer.Option(
        None,
        "--baseline-config",
        help="Path to the agentdiff.toml the BASELINE was recorded with. When gate values differ from this run's config, the report flags the change (Goodhart guard).",
    ),
):
    """Compares baseline and candidate agent trajectories."""
    cfg = load_config(config)
    config_source = config or (str(find_config_file()) if find_config_file() else None)
    threshold_changes: list = []
    if baseline_config:
        try:
            baseline_cfg = load_config(baseline_config)
        except FileNotFoundError as e:
            typer.echo(f"Baseline config not found: {e}", err=True)
            sys.exit(2)
        threshold_changes = diff_gate_thresholds(baseline_cfg, cfg)
    gate_provenance = provenance_line(cfg, config_source)
    values = _resolve_cli(
        cfg,
        adapter=adapter,
        format=format,
        max_loops=max_loops,
        max_divergence=max_divergence,
        max_cost_delta=max_cost_delta,
        max_recovery_ratio=max_recovery_ratio,
        baseline_store=baseline_store,
    )
    adapter = values["adapter"]
    format = values["format"] or "terminal"
    max_loops = values["max_loops"] or 0
    max_divergence = values["max_divergence"]
    if max_divergence is None:
        max_divergence = 0.3
    max_cost_delta = values["max_cost_delta"]
    if max_cost_delta is None:
        max_cost_delta = 10.0
    max_recovery_ratio = values["max_recovery_ratio"]
    baseline_store = values["baseline_store"]
    detect_loops = cfg.compare.detect_loops
    strict_tool_signatures = cfg.compare.strict_tool_signatures

    try:
        # Validate the candidate parses before we do anything else
        candidate = load_trace(candidate_path, adapter)

        # Resolve the baseline: either an explicit store or the positional path
        if baseline_store:
            if not os.path.exists(baseline_store):
                if update_baseline:
                    shutil.copyfile(candidate_path, baseline_store)
                    typer.echo(
                        f"Baseline established at {baseline_store} from {candidate_path}"
                    )
                    sys.exit(0)
                typer.echo(
                    f"Baseline not found at {baseline_store}. "
                    "Run with --update-baseline to establish it.",
                    err=True,
                )
                sys.exit(2)
            actual_baseline = baseline_store
        else:
            actual_baseline = baseline_path

        baseline = load_trace(actual_baseline, adapter)
    except (json.JSONDecodeError, ValueError, FileNotFoundError) as e:
        typer.echo(f"Error loading or parsing trace: {e}", err=True)
        sys.exit(2)
    except Exception as e:
        typer.echo(f"Ingestion error: {e}", err=True)
        sys.exit(2)

    try:
        # Perform comparison
        report = compare(
            baseline,
            candidate,
            detect_loops=detect_loops,
            strict_tool_signatures=strict_tool_signatures,
        )

        # Check regressions
        loop_count = len(report.loops_detected)
        diverged = report.trajectory_divergence_index > max_divergence
        loop_failed = loop_count > max_loops
        cost_failed = report.cost_delta_percentage > max_cost_delta
        recovery_failed = (
            max_recovery_ratio is not None
            and report.recovery_step_ratio > max_recovery_ratio
        )

        has_regression = diverged or loop_failed or cost_failed or recovery_failed

        if has_regression:
            report.passed = False

        # Format output
        output_content = ""
        if format.lower() == "terminal":
            # For console printing we write directly, but we can capture it or format differently if output_file is active
            if output_file:
                # If writing terminal format to file, output the text summary representation
                output_content = report.summary() + f"\n{gate_provenance}\n"
            else:
                print_report(report, gate_provenance=gate_provenance)
        elif format.lower() == "json":
            report.gate_provenance = gate_provenance
            output_content = report.model_dump_json(indent=2)
            if not output_file:
                typer.echo(output_content)
        elif format.lower() == "markdown":
            output_content = generate_markdown(report)
            if not output_file:
                typer.echo(output_content)
        elif format.lower() == "pr":
            output_content = generate_pr_markdown(
                report,
                max_divergence=max_divergence,
                max_loops=max_loops,
                max_cost_delta=max_cost_delta,
                max_recovery_ratio=max_recovery_ratio,
                threshold_changes=threshold_changes,
                gate_provenance=gate_provenance,
            )
            if not output_file:
                typer.echo(output_content)
        else:
            typer.echo(f"Unsupported format: {format}", err=True)
            sys.exit(2)

        # Print human-readable explanations when requested
        if explain:
            typer.echo("\n" + format_explanations(report))
            culprit = locate_culprit(report)
            if culprit:
                typer.echo("\n" + culprit.render())
            if threshold_changes:
                typer.echo("\nGate thresholds changed vs baseline config:")
                for change in threshold_changes:
                    typer.echo(f"  ! {change.render()}")

        # Print the collapsed divergence tree when requested
        if tree:
            typer.echo("\n" + render_tree(report))

        # Post PR-ready markdown as a GitHub PR comment when requested
        if pr is not None:
            body = generate_pr_markdown(
                report,
                max_divergence=max_divergence,
                max_loops=max_loops,
                max_cost_delta=max_cost_delta,
                max_recovery_ratio=max_recovery_ratio,
                threshold_changes=threshold_changes,
                gate_provenance=gate_provenance,
            )
            comment = post_pr_comment(body, pr)
            url = comment.get("html_url")
            typer.echo(f"Posted AgentDiff comment to PR #{pr}: {url}")

        # Write to file if requested
        if output_file:
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(output_content)

        # Update the persistent baseline per the rotation policy
        if baseline_store:
            decision = decide_rotation(
                report,
                policy=baseline_rotation,
                max_drift=max_drift,
                explicit_update=update_baseline,
            )
            if decision.rotate:
                shutil.copyfile(candidate_path, baseline_store)
                typer.echo(f"Baseline updated at {baseline_store}: {decision.reason}")
            elif update_baseline:
                typer.echo(f"Baseline not updated: {decision.reason}")

        # Enforce exit code protocol
        if fail_on_regression and has_regression:
            sys.exit(1)

        sys.exit(0)

    except SystemExit:
        raise
    except Exception as e:
        typer.echo(f"Internal comparison error: {e}", err=True)
        sys.exit(3)


def main():
    try:
        app()
    except SystemExit as e:
        sys.exit(e.code)
    except Exception as e:
        print(f"Unhandled error: {e}", file=sys.stderr)
        sys.exit(3)


def _install_diff_default() -> None:
    """E1 compat: `agentdiff base.json cand.json` (no subcommand) means `diff`.

    With two commands registered, Typer requires an explicit subcommand. We
    patch the built click.Group so a leading positional that isn't a known
    command is treated as `diff ...`. Works for the real CLI and CliRunner.
    """
    import typer.main

    original_get_command = typer.main.get_command

    def get_command_with_default(typer_app):
        group = original_get_command(typer_app)
        if not getattr(group, "_diff_default", False):
            original_parse_args = group.parse_args

            def parse_args(ctx, args):
                if (
                    args
                    and args[0] not in group.commands
                    and not args[0].startswith("-")
                ):
                    args = ["diff", *args]
                original_parse_args(ctx, args)

            group.parse_args = parse_args
            group._diff_default = True
        return group

    typer.main.get_command = get_command_with_default

    # typer.testing binds get_command at import time — patch its reference too
    import typer.testing as testing_module

    if getattr(testing_module, "_get_command", None) is original_get_command:
        testing_module._get_command = get_command_with_default


_install_diff_default()


if __name__ == "__main__":
    main()
