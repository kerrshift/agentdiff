import pytest
from conftest import make_step, make_trace

from agentdiff.engine.benchmark import BenchmarkCase, run_benchmark


def _agent(trace_id, n_steps=3, latency=100.0, tokens_per_step=10):
    steps = [make_step(f"s{i}", prompt_tokens=tokens_per_step) for i in range(n_steps)]
    return make_trace(trace_id, steps, total_latency_ms=float(latency * n_steps))


def test_identical_agents_tie():
    a = _agent("a")
    suite = run_benchmark([BenchmarkCase("same", a, _agent("b"))])
    outcome = suite.outcomes[0]
    assert outcome.winner == "tie"
    assert outcome.dimensions_won_a == 0
    assert outcome.dimensions_won_b == 0
    assert suite.overall_winner == "tie"
    assert suite.wins_a == 0 and suite.wins_b == 0 and suite.ties == 1


def test_cheaper_agent_wins_majority_of_dimensions():
    lean = _agent("lean", n_steps=2, latency=50.0, tokens_per_step=5)
    heavy = _agent("heavy", n_steps=5, latency=200.0, tokens_per_step=20)
    report = run_benchmark([BenchmarkCase("case1", lean, heavy)])
    outcome = report.outcomes[0]
    # Lean wins steps, tokens, and latency; WEI is tied (both zero waste).
    assert outcome.winner == "a"
    assert outcome.dimensions_won_a == 3
    assert report.overall_winner == "a"


def test_b_side_can_win():
    lean = _agent("lean", n_steps=2, latency=50.0, tokens_per_step=5)
    heavy = _agent("heavy", n_steps=5, latency=200.0, tokens_per_step=20)
    report = run_benchmark([BenchmarkCase("flipped", heavy, lean)])
    assert report.outcomes[0].winner == "b"


def test_partial_win_counts_as_majority_verdict():
    # A wins steps+tokens; B wins latency only; WEI ties -> A majority (2-1).
    a = _agent("a", n_steps=2, latency=300.0, tokens_per_step=5)
    b = _agent("b", n_steps=4, latency=100.0, tokens_per_step=20)
    report = run_benchmark([BenchmarkCase("mixed", a, b)])
    outcome = report.outcomes[0]
    assert outcome.dimensions_won_a >= 2
    assert outcome.winner in ("a", "tie")


def test_error_case_is_contained():
    good_a = _agent("ga")
    report = run_benchmark(
        [
            BenchmarkCase("ok", good_a, _agent("gb")),
            BenchmarkCase("bad", "/nope/a.json", "/nope/b.json"),
        ]
    )
    assert report.outcomes[1].error is not None
    assert report.wins_a + report.wins_b + report.ties == len(report.outcomes)
    markdown = report.to_markdown()
    assert "| bad |" in markdown
    assert "ERROR" in markdown.split("\n")[-2] or "ERROR" in markdown


def test_summary_and_markdown_contents():
    lean = _agent("lean", n_steps=2, latency=50.0, tokens_per_step=5)
    heavy = _agent("heavy", n_steps=5, latency=200.0, tokens_per_step=20)
    report = run_benchmark([BenchmarkCase("lookup", lean, heavy)])

    text = report.summary()
    assert "AGENTDIFF A/B BENCHMARK" in text
    assert "[    A] lookup" in text
    assert "TDI(a,b)=" in text

    md = report.to_markdown()
    assert md.startswith("| Case |")
    assert "| lookup | 2 | 5 | 60 | 225 | 100ms | 1000ms |" in md
    assert "**Overall:** agent A" in md


def test_parallel_matches_sequential_and_keeps_order():
    cases = [
        BenchmarkCase(f"c{i}", _agent(f"a{i}", n_steps=2), _agent(f"b{i}", n_steps=3))
        for i in range(4)
    ]
    seq = run_benchmark(cases)
    par = run_benchmark(cases, workers=3)
    assert [o.name for o in par.outcomes] == [o.name for o in seq.outcomes]
    assert [o.winner for o in par.outcomes] == [o.winner for o in seq.outcomes]


def test_empty_and_invalid_workers():
    empty = run_benchmark([])
    assert empty.outcomes == [] and empty.overall_winner == "tie"
    with pytest.raises(ValueError):
        run_benchmark([], workers=0)


def test_cross_framework_shapes_diff_cleanly():
    """A/B across native framework artifacts (CrewAI vs LangGraph fixtures)."""
    import os

    fixtures = os.path.join(os.path.dirname(__file__), "fixtures")
    crew = os.path.join(fixtures, "crewai_output.json")
    langgraph = os.path.join(fixtures, "langgraph_state.json")

    from agentdiff.loader import load_trace

    trace_crew = load_trace(crew)
    trace_lg = load_trace(langgraph)

    report = run_benchmark([BenchmarkCase("ny_lookup", trace_crew, trace_lg)])
    outcome = report.outcomes[0]
    assert outcome.error is None
    # Both sides parsed into real step sequences.
    assert len(outcome.trace_a.steps) > 0
    assert len(outcome.trace_b.steps) > 0
    assert outcome.report.trajectory_divergence_index > 0.0
