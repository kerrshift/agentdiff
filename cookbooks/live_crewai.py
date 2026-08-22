# /// script
# requires-python = ">=3.10,<3.14"
# dependencies = [
#     "agent-trajectory-diff",
#     "crewai",
#     "openinference-instrumentation-crewai[instruments]",
#     "openinference-instrumentation-openai",
#     "opentelemetry-sdk",
# ]
# ///
"""Cookbook: CrewAI (live) -> OpenInference OTel spans -> `openinference` adapter.

Runs a real **CrewAI** crew (one agent, one custom tool, `gpt-4o-mini`),
instruments it with **OpenInference** (`openinference-instrumentation-crewai`
for the crew/agent/task structure plus `openinference-instrumentation-openai`
for the underlying ChatCompletion calls), and exports genuine OTel spans
in-memory. The spans are sorted chronologically, projected to plain dicts, and
fed straight into AgentDiff's ``openinference`` adapter — no manual reshaping.
Two real crew executions are diffed:

    Run 1 (baseline): one efficient database lookup.
    Run 2 (candidate): the same task covering NY, CA, and TX —
                       extra tool calls => divergence, loop flags, cost spike.

Notes for reproducing:
    - The tool must be a ``BaseTool`` subclass implementing ``_run``.
      Tools built with the ``@tool`` decorator override ``run()``, which
      bypasses the instrumentor's ``BaseTool.run`` patch and loses tool spans.
    - CrewAI's own product telemetry and interactive trace prompt are disabled,
      so nothing leaves the machine except your own LLM calls.

Requires:
    export OPENAI_API_KEY="sk-..."
"""

import os
import sys

os.environ.setdefault("CREWAI_DISABLE_TELEMETRY", "true")
os.environ.setdefault("CREWAI_TRACING_ENABLED", "false")

from crewai import Agent, Crew, LLM, Task  # noqa: E402
from crewai.tools import BaseTool  # noqa: E402
from openinference.instrumentation.crewai import CrewAIInstrumentor  # noqa: E402
from openinference.instrumentation.openai import OpenAIInstrumentor  # noqa: E402
from opentelemetry import trace as otel_trace  # noqa: E402
from opentelemetry.sdk.trace import TracerProvider  # noqa: E402
from opentelemetry.sdk.trace.export import SimpleSpanProcessor  # noqa: E402
from opentelemetry.sdk.trace.export.in_memory_span_exporter import (  # noqa: E402
    InMemorySpanExporter,
)

from agentdiff import compare, parse_trace_data  # noqa: E402
from agentdiff.testing import assert_no_regressions  # noqa: E402


class UserDatabaseStatsTool(BaseTool):
    name: str = "get_user_database_stats"
    description: str = "Gets active user count and revenue stats for a US state."

    def _run(self, state: str) -> str:
        print(f"    [Tool] get_user_database_stats({state})")
        db = {
            "NY": {"users": 1250, "revenue": 45000},
            "CA": {"users": 3400, "revenue": 128000},
            "TX": {"users": 2100, "revenue": 72000},
        }
        stats = db.get(state.upper(), {"users": 0, "revenue": 0})
        return f"Active Users: {stats['users']}, Total Revenue: ${stats['revenue']}"


exporter = InMemorySpanExporter()


def otel_to_adapter_dict(span):
    """Project an OTel ReadableSpan into a plain dict for the adapter."""
    sc = span.get_span_context()
    return {
        "name": span.name,
        "context": {"trace_id": sc.trace_id, "span_id": sc.span_id},
        "parent_span_id": span.parent.span_id if span.parent else None,
        "start_time": span.start_time,
        "end_time": span.end_time,
        "attributes": dict(span.attributes or {}),
        "status": {"status_code": span.status.status_code.name},
    }


def run_crew(query: str):
    """Build and run a fresh one-agent crew; return its real spans, oldest first."""
    analyst = Agent(
        role="User Analytics Reporter",
        goal="Report accurate user database statistics using the provided tool.",
        backstory="A meticulous data analyst who always verifies numbers via tools.",
        tools=[UserDatabaseStatsTool()],
        llm=LLM(model="openai/gpt-4o-mini", temperature=0),
        verbose=False,
    )
    task = Task(
        description=query,
        expected_output="A short factual summary of the requested statistics.",
        agent=analyst,
    )
    exporter.clear()
    Crew(agents=[analyst], tasks=[task], verbose=False, tracing=False).kickoff()
    spans = sorted(exporter.get_finished_spans(), key=lambda s: s.start_time)
    return [otel_to_adapter_dict(s) for s in spans]


def main() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        print("[Error] Set OPENAI_API_KEY to run this cookbook.")
        sys.exit(1)

    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    otel_trace.set_tracer_provider(provider)
    OpenAIInstrumentor().instrument()
    CrewAIInstrumentor().instrument()

    # --- Run 1: BASELINE (efficient path) -------------------------------
    print("[-] Baseline run: real CrewAI execution (gpt-4o-mini)")
    baseline = run_crew(
        "Retrieve the database count of active users for state NY "
        "and summarize it."
    )

    # --- Run 2: CANDIDATE (expanded scope -> more tool calls) ------------
    print("\n[-] Candidate run: same report, expanded scope (NY + CA + TX)")
    candidate = run_crew(
        "Retrieve the database count of active users for states NY, CA and TX "
        "(call the get_user_database_stats tool once per state) and summarize "
        "them."
    )

    # --- Normalize + diff -------------------------------------------------
    base = parse_trace_data(baseline, "openinference")
    cand = parse_trace_data(candidate, "openinference")

    print("\nNormalized traces (real CrewAI / OTel spans):")
    print("  baseline :", [f"{s.name}/{s.step_type.value}" for s in base.steps])
    print("  candidate:", [f"{s.name}/{s.step_type.value}" for s in cand.steps])
    print(f"  baseline tokens={base.total_tokens.total_tokens}")
    print(f"  candidate tokens={cand.total_tokens.total_tokens}")

    report = compare(base, cand)
    print(f"\nTrajectory Divergence Index: {report.trajectory_divergence_index:.3f}")
    print(f"Candidate WEI:               {report.candidate_wei:.3f}")
    print(f"Loops detected:              {len(report.loops_detected)}")
    print(f"Token delta:                 {report.token_delta_percentage:+.2f}%")
    print(f"Cost delta:                  {report.cost_delta_percentage:+.2f}%")

    try:
        print("\n[-] Checking regression gates...")
        assert_no_regressions(report, max_divergence=0.15, allow_loops=False)
        print("Gate: PASSED")
    except AssertionError as e:
        print("\nCI/CD GATE BLOCKED:")
        print(e)


if __name__ == "__main__":
    main()
