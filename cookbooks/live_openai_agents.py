# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "agent-trajectory-diff",
#     "openai-agents",
# ]
# ///
"""Cookbook: OpenAI Agents SDK (live) -> real trace -> `openai_agents` adapter.

Runs a real OpenAI Agents agent with a function tool, captures the SDK's own
trace via a collecting ``TracingProcessor``, and feeds it straight into the
``openai_agents`` adapter. Two runs are diffed so you can see how the adapter
ingests genuine SDK output (span types, tokens, latency) and how AgentDiff
flags any divergence.

Requires:
    export OPENAI_API_KEY="sk-..."
"""

import json
import os
import sys

from agents import Agent, Runner, function_tool
from agents.tracing import flush_traces, set_trace_processors
from agents.tracing.processors import TracingProcessor

from agentdiff import compare, parse_trace_data


class CollectingProcessor(TracingProcessor):
    """Accumulates real trace header + spans emitted by the Agents SDK."""

    def __init__(self):
        self.headers: dict[str, dict] = {}
        self.spans: dict[str, list[dict]] = {}
        self._current: dict[str, list[dict]] = {}

    def on_trace_start(self, trace) -> None:
        self._current[trace.trace_id] = []

    def on_span_start(self, span) -> None:
        pass

    def on_span_end(self, span) -> None:
        data = span.export()
        if isinstance(data, dict):
            self._current.setdefault(span.trace_id, []).append(data)

    def on_trace_end(self, trace) -> None:
        self.headers[trace.trace_id] = dict(trace.export())
        self.spans[trace.trace_id] = self._current.pop(trace.trace_id, [])

    def force_flush(self) -> None:
        pass

    def shutdown(self) -> None:
        pass


@function_tool
def get_user_database_stats(state: str) -> str:
    """Active users + revenue for a US state."""
    print(f"    [Tool] get_user_database_stats({state})")
    db = {
        "NY": {"users": 1250, "revenue": 45000},
        "CA": {"users": 3400, "revenue": 128000},
        "TX": {"users": 2100, "revenue": 72000},
    }
    stats = db.get(state.upper(), {"users": 0, "revenue": 0})
    return f"Active Users: {stats['users']}, Total Revenue: ${stats['revenue']}"


def run_agent(prompt: str) -> dict:
    agent = Agent(
        name="support_agent",
        instructions="You are a helpful support agent.",
        tools=[get_user_database_stats],
    )
    Runner.run_sync(agent, prompt)
    flush_traces()
    latest = list(collector.headers.keys())[-1]
    return {**collector.headers[latest], "spans": collector.spans[latest]}


collector = CollectingProcessor()


def main() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        print("[Error] Set OPENAI_API_KEY to run this cookbook.")
        sys.exit(1)

    set_trace_processors([collector])

    baseline = run_agent("What is the revenue for NY?")
    candidate = run_agent(
        "What is the revenue for NY? Look it up, then double-check by looking it up again and again until you are sure."
    )

    # --- Feed the REAL traces through the openai_agents adapter ---
    base = parse_trace_data(baseline, "openai_agents")
    cand = parse_trace_data(candidate, "openai_agents")

    print("\nNormalized traces (real SDK output):")
    print("  baseline :", [f"{s.name}/{s.step_type.value}" for s in base.steps])
    print("  candidate:", [f"{s.name}/{s.step_type.value}" for s in cand.steps])
    print(f"  baseline tokens={base.total_tokens.total_tokens} "
          f"latency={base.total_latency_ms:.0f}ms")

    report = compare(base, cand)
    print(f"\nTrajectory Divergence Index: {report.trajectory_divergence_index:.3f}")
    print(f"Cost delta: {report.cost_delta_percentage:+.2f}%")
    if report.loops_detected:
        for loop in report.loops_detected:
            print(f"Loop detected: {loop['steps']} repeated {loop['iterations']}x")
    else:
        print("No loops detected.")


if __name__ == "__main__":
    main()
