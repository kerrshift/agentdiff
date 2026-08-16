import json
import sys

import typer

from agentdiff.engine.comparator import compare
from agentdiff.loader import load_trace
from agentdiff.reporters.markdown import generate_markdown
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
        help="Telemetry adapter: auto, generic, deepeval, openinference, langfuse",
    ),
    format: str = typer.Option(
        "terminal", help="Output format: terminal, json, markdown"
    ),
    output_file: str | None = typer.Option(
        None, help="Write output to specified file path"
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
):
    """Compares baseline and candidate agent trajectories."""
    try:
        # Load and parse traces
        baseline = load_trace(baseline_path, adapter)
        candidate = load_trace(candidate_path, adapter)
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
        else:
            typer.echo(f"Unsupported format: {format}", err=True)
            sys.exit(2)

        # Write to file if requested
        if output_file:
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(output_content)

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
