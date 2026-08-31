"""I2 — engine performance benchmarks (pytest-benchmark).

Run with::

    make bench

These are excluded from the regular test suite; they exist to catch algorithmic
regressions and to document where the engine's real limits are (alignment, not
ingestion, dominates at scale).
"""

import pytest

from agentdiff.adapters import OpenInferenceAdapter
from agentdiff.engine.aligner import align_traces
from agentdiff.engine.comparator import compare, compare_envelope
from agentdiff.engine.loop_detector import detect_all_loops
from agentdiff.engine.metrics import calculate_wei, compute_recovery_steps
from agentdiff.models.step import TokenUsage
from agentdiff.models.trace import AgentTrace
from benchmarks.conftest import build_step, build_trace


@pytest.mark.parametrize("n_steps", [100, 500, 1000])
def test_bench_align_traces(benchmark, n_steps):
    baseline = build_trace("b", n_steps)
    candidate = build_trace("c", n_steps, error_every=25)

    diffs = benchmark(lambda: align_traces(baseline, candidate, False))
    assert len(diffs) > 0


@pytest.mark.parametrize("n_steps", [100, 500, 1000])
def test_bench_compare_end_to_end(benchmark, n_steps):
    baseline = build_trace("b", n_steps)
    candidate = build_trace("c", n_steps, error_every=25)

    report = benchmark(lambda: compare(baseline, candidate))
    assert report is not None


@pytest.mark.parametrize("n_steps", [100, 500, 1000])
def test_bench_loop_detection(benchmark, n_steps):
    trace = build_trace("t", n_steps)
    loops = benchmark(lambda: detect_all_loops(trace))
    assert isinstance(loops, list)


def test_bench_loop_detection_pathological_repeat(benchmark):
    """Worst case for sequence-loop detection: one tool repeated throughout."""
    steps = [build_step("same_tool", i) for i in range(1000)]
    trace = AgentTrace(
        trace_id="repeat",
        agent_name="a",
        task_input={},
        final_output={},
        steps=steps,
        total_latency_ms=1000.0,
        total_tokens=TokenUsage(),
    )
    loops = benchmark(lambda: detect_all_loops(trace))
    assert isinstance(loops, list)


def test_bench_metrics_recovery(benchmark):
    baseline = build_trace("b", 1000)
    candidate = build_trace("c", 1000, error_every=10)
    diffs = align_traces(baseline, candidate, False)

    def run():
        return (
            compute_recovery_steps(diffs, "candidate"),
            calculate_wei(candidate.steps),
        )

    recovery, _ = benchmark(run)
    assert recovery >= 0


def test_bench_adapter_openinference_parse(benchmark):
    """Span-dict parsing cost at OTel-export scale."""
    spans = [
        {
            "name": f"span_{i}",
            "context": {"trace_id": "1", "span_id": str(i + 1)},
            "parent_span_id": str(i) if i else None,
            "start_time": i * 1_000_000,
            "end_time": (i + 1) * 1_000_000,
            "attributes": {"openinference.span.kind": "TOOL"},
            "status": {"status_code": "OK"},
        }
        for i in range(1000)
    ]

    trace = benchmark(lambda: OpenInferenceAdapter.from_dict(spans))
    assert len(trace.steps) == 1000


def test_bench_report_serialization(benchmark):
    baseline = build_trace("b", 500)
    candidate = build_trace("c", 500, error_every=20)
    report = compare(baseline, candidate)

    payload = benchmark(lambda: report.model_dump_json())
    assert '"passed"' in payload


@pytest.mark.parametrize("n_steps", [100, 500, 1000])
def test_bench_compare_envelope_n3(benchmark, n_steps):
    """I2b — statistical compare at N=3: min-TDI-of-N alignment cost."""
    from agentdiff.models.envelope import BaselineEnvelope

    runs = [
        build_trace(f"r{i}", n_steps, error_every=50 if i else None) for i in range(3)
    ]
    envelope = BaselineEnvelope.from_runs(runs)
    candidate = build_trace("c", n_steps, error_every=25)

    def run():
        _report, gate = compare_envelope(envelope, candidate)
        assert gate is not None

    benchmark(run)


@pytest.mark.parametrize("n_steps", [100, 500, 1000])
def test_bench_compare_envelope_n5(benchmark, n_steps):
    """I2b — statistical compare at N=5 (upper end of the recommended range)."""
    from agentdiff.models.envelope import BaselineEnvelope

    runs = [build_trace(f"r{i}", n_steps) for i in range(5)]
    envelope = BaselineEnvelope.from_runs(runs)
    candidate = build_trace("c", n_steps, error_every=25)

    def run():
        _report, gate = compare_envelope(envelope, candidate)
        assert gate is not None

    benchmark(run)
