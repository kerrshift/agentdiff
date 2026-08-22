# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "agent-trajectory-diff",
#     "langgraph",
#     "langchain-openai",
#     "openinference-instrumentation-langchain",
#     "opentelemetry-sdk",
# ]
# ///
"""Cookbook: LangGraph (live) -> OpenInference OTel spans -> `openinference` adapter.

Builds a real **LangGraph** ReAct agent (`create_react_agent`) on `gpt-4o-mini`,
instruments it with **OpenInference** (`openinference-instrumentation-langchain`),
and exports genuine OTel spans in-memory. The spans are sorted chronologically,
projected to plain dicts, and fed straight into AgentDiff's ``openinference``
adapter — no manual reshaping. Two real graph executions are diffed:

    Run 1 (baseline): one efficient database lookup.
    Run 2 (candidate): the same task, prompted to check NY, CA, and TX —
                       extra tool calls => divergence, loop flag, cost spike.

Requires:
    export OPENAI_API_KEY="sk-..."
"""

import os
import sys

from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from openinference.instrumentation.langchain import LangChainInstrumentor
from opentelemetry import trace as otel_trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from agentdiff import compare, parse_trace_data
from agentdiff.testing import assert_no_regressions


def get_user_database_stats(state: str) -> str:
    """Gets the count of active users and revenue stats for a given US state."""
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


def run_graph(agent, prompt: str):
    """Run the LangGraph agent once and return its real spans, oldest first."""
    exporter.clear()
    agent.invoke({"messages": [{"role": "user", "content": prompt}]})
    spans = sorted(exporter.get_finished_spans(), key=lambda s: s.start_time)
    return [otel_to_adapter_dict(s) for s in spans]


def main() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        print("[Error] Set OPENAI_API_KEY to run this cookbook.")
        sys.exit(1)

    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    otel_trace.set_tracer_provider(provider)
    LangChainInstrumentor().instrument()

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    agent = create_react_agent(llm, tools=[get_user_database_stats])

    # --- Run 1: BASELINE (efficient path) -------------------------------
    print("[-] Baseline run: real LangGraph execution (gpt-4o-mini)")
    baseline = run_graph(
        agent, "Retrieve the database count of active users for state NY."
    )

    # --- Run 2: CANDIDATE (prompt change -> extra tool calls) ------------
    print("\n[-] Candidate run: same task, expanded scope (NY + CA + TX)")
    candidate = run_graph(
        agent,
        "Retrieve the database count of active users for states NY, CA and TX. "
        "Call the tool once per state.",
    )

    # --- Normalize + diff -------------------------------------------------
    base = parse_trace_data(baseline, "openinference")
    cand = parse_trace_data(candidate, "openinference")

    print("\nNormalized traces (real LangGraph / OTel spans):")
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
