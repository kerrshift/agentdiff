import json
import os
import shutil
import sys

import typer

from agentdiff.ci.baseline import decide_rotation
from agentdiff.ci.github import post_pr_comment
from agentdiff.engine.comparator import compare
from agentdiff.engine.explanations import format_explanations, locate_culprit
from agentdiff.engine.tree import render_tree
from agentdiff.loader import load_trace
from agentdiff.reporters.markdown import generate_markdown
from agentdiff.reporters.pr import generate_pr_markdown
from agentdiff.reporters.terminal import print_report

app = typer.Typer(
    help="AgentDiff CLI - Compare multi-turn agent execution trajectories."
)


@app.command(name="diff")
def diff(
    baseline_path: str = typer.Argument(..., help="Path to baseline trace JSON file"),
    candidate_path: str = typer.Argument(..., help="Path to candidate trace JSON file"),
    adapter: str = typer.Option(
        "auto",
        help="Telemetry adapter: auto, generic, openinference, langfuse, langsmith",
    ),
    format: str = typer.Option(
        "terminal", help="Output format: terminal, json, markdown, pr"
    ),
    output_file: str | None = typer.Option(
        None, help="Write output to specified file path"
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
    max_loops: int = typer.Option(
        0, help="Maximum allowed loop count before regression"
    ),
    max_divergence: float = typer.Option(
        0.3, help="Maximum allowed Trajectory Divergence Index (TDI) before regression"
    ),
    max_cost_delta: float = typer.Option(
        10.0, help="Maximum allowed cost increase percentage before regression"
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
):
    """Compares baseline and candidate agent trajectories."""
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
        report = compare(baseline, candidate, detect_loops=True)

        # Check regressions
        loop_count = len(report.loops_detected)
        diverged = report.trajectory_divergence_index > max_divergence
        loop_failed = loop_count > max_loops
        cost_failed = report.cost_delta_percentage > max_cost_delta

        has_regression = diverged or loop_failed or cost_failed

        if has_regression:
            report.passed = False

        # Format output
        output_content = ""
        if format.lower() == "terminal":
            # For console printing we write directly, but we can capture it or format differently if output_file is active
            if output_file:
                # If writing terminal format to file, output the text summary representation
                output_content = report.summary()
            else:
                print_report(report)
        elif format.lower() == "json":
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


if __name__ == "__main__":
    main()
