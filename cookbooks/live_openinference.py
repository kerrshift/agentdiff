# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "agent-trajectory-diff",
#     "openai",
#     "opentelemetry-sdk",
#     "openinference-instrumentation-openai",
# ]
# ///
"""Cookbook: OpenInference (live OTel) -> real spans -> `openinference` adapter.

Instruments the OpenAI client with OpenInference, makes real calls, and exports
the resulting OTel spans in-memory. The spans are normalized to the shape the
``openinference`` adapter expects (hex span/trace ids, timestamps in seconds,
attributes as a dict), then fed straight in. Two real runs are diffed.

Why the normalization? Real OTel spans carry integer span/trace ids and
nanosecond timestamps, while the adapter expects hex-string ids and second
timestamps. The ``_otel_to_adapter`` helper is exactly the glue a real
OpenInference integration needs.

Requires:
    export OPENAI_API_KEY="sk-..."
"""

import os
import sys

from openai import OpenAI
from opentelemetry import trace as otel_trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from openinference.instrumentation.openai import OpenAIInstrumentor

from agentdiff import compare, parse_trace_data


def otel_to_adapter_dict(span):
    """Normalize an OTel ReadableSpan into the adapter's expected shape."""
    sc = span.get_span_context()
    return {
        "name": span.name,
        "context": {"trace_id": hex(sc.trace_id), "span_id": hex(sc.span_id)},
        "parent_span_id": hex(span.parent.span_id) if span.parent else None,
        "start_time": span.start_time / 1e9,  # ns -> seconds (adapter expects s)
        "end_time": span.end_time / 1e9,
        "attributes": dict(span.attributes or {}),
        "status": {"status_code": span.status.status_code.name},
    }


exporter = InMemorySpanExporter()


def run_real_call(prompt: str) -> list[dict]:
    exporter.clear()
    client = OpenAI()
    client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )
    return [otel_to_adapter_dict(s) for s in exporter.get_finished_spans()]


def main() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        print("[Error] Set OPENAI_API_KEY to run this cookbook.")
        sys.exit(1)

    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    otel_trace.set_tracer_provider(provider)
    OpenAIInstrumentor().instrument()

    baseline = run_real_call("What is the revenue for NY?")
    candidate = run_real_call(
        "What is the revenue for NY? And CA? And TX? Give me all three."
    )

    base = parse_trace_data(baseline, "openinference")
    cand = parse_trace_data(candidate, "openinference")

    print("\nNormalized traces (real OpenInference spans):")
    print("  baseline :", [f"{s.name}/{s.step_type.value}" for s in base.steps])
    print("  candidate:", [f"{s.name}/{s.step_type.value}" for s in cand.steps])
    print(f"  baseline tokens={base.total_tokens.total_tokens} "
          f"latency={base.total_latency_ms:.0f}ms")

    report = compare(base, cand)
    print(f"\nTrajectory Divergence Index: {report.trajectory_divergence_index:.3f}")
    print(f"Token delta: {report.token_delta_percentage:+.2f}%")
    print(f"Cost delta: {report.cost_delta_percentage:+.2f}%")


if __name__ == "__main__":
    main()