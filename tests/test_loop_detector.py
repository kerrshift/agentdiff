from conftest import make_step, make_trace

from agentdiff.engine.loop_detector import (
    detect_all_loops,
    detect_graph_cycles,
    detect_sequence_loops,
)


def test_no_loop_when_no_repetition():
    trace = make_trace("t", [make_step("a"), make_step("b"), make_step("c")])
    assert detect_sequence_loops(trace) == []


def test_single_step_stagnant_loop():
    trace = make_trace(
        "t",
        [
            make_step("query_db", input_payload={"q": 1}),
            make_step("query_db", input_payload={"q": 1}),
            make_step("summarize"),
        ],
    )
    loops = detect_sequence_loops(trace)
    assert len(loops) == 1
    assert loops[0]["steps"] == ["query_db"]
    assert loops[0]["iterations"] == 2
    assert loops[0]["stagnant"] is True


def test_non_stagnant_loop():
    trace = make_trace(
        "t",
        [
            make_step("query_db", input_payload={"q": 1}),
            make_step("query_db", input_payload={"q": 2}),
        ],
    )
    loops = detect_sequence_loops(trace)
    assert len(loops) == 1
    assert loops[0]["stagnant"] is False


def test_multi_step_repeating_pattern():
    trace = make_trace(
        "t",
        [
            make_step("retrieve"),
            make_step("rerank"),
            make_step("retrieve"),
            make_step("rerank"),
        ],
    )
    loops = detect_sequence_loops(trace)
    assert len(loops) == 1
    assert loops[0]["steps"] == ["retrieve", "rerank"]
    assert loops[0]["iterations"] == 2


def test_multiple_loops_detected():
    trace = make_trace(
        "t",
        [
            make_step("a"),
            make_step("a"),
            make_step("b"),
            make_step("b"),
            make_step("b"),
            make_step("c"),
        ],
    )
    loops = detect_sequence_loops(trace)
    assert len(loops) == 2


def test_triple_iteration_loop():
    trace = make_trace(
        "t", [make_step("a"), make_step("a"), make_step("a"), make_step("b")]
    )
    loops = detect_sequence_loops(trace)
    assert loops[0]["iterations"] == 3


def test_graph_cycle_detection():
    # A -> B and B -> A forms a 2-node cycle
    steps = [
        make_step("a", step_id="A", parent_id="B"),
        make_step("b", step_id="B", parent_id="A"),
    ]
    trace = make_trace("t", steps)
    cycles = detect_graph_cycles(trace)
    assert len(cycles) >= 1


def test_no_graph_cycle():
    trace = make_trace("t", [make_step("a"), make_step("b")])
    assert detect_graph_cycles(trace) == []


def test_detect_all_loops_combines_sequence_and_graph():
    steps = [
        make_step("query_db", step_id="s0"),
        make_step("query_db", step_id="s1", parent_id="s0"),
    ]
    trace = make_trace("t", steps)
    loops = detect_all_loops(trace)
    assert len(loops) >= 1
