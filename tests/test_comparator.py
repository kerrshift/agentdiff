import pytest

from agentdiff import AgentTrace, StepStatus, StepType, TokenUsage, TraceStep, compare
from agentdiff.testing import assert_no_regressions


def create_mock_trace(
    trace_id: str, steps_data: list, total_latency: float
) -> AgentTrace:
    steps = []
    total_prompt_tokens = 0
    total_completion_tokens = 0
    total_cost = 0.0

    for idx, s in enumerate(steps_data):
        prompt_t = s.get("prompt_tokens", 50)
        comp_t = s.get("completion_tokens", 25)
        cost = s.get("cost", 0.001)

        total_prompt_tokens += prompt_t
        total_completion_tokens += comp_t
        total_cost += cost

        step = TraceStep(
            step_id=f"step_{idx}",
            parent_id=s.get("parent_id"),
            step_index=idx,
            step_type=s.get("type", StepType.LLM_CALL),
            name=s["name"],
            input_payload=s.get("input", {}),
            output_payload=s.get("output", {}),
            status=s.get("status", StepStatus.SUCCESS),
            error_message=s.get("error"),
            latency_ms=s.get("latency", 500.0),
            tokens=TokenUsage(
                prompt_tokens=prompt_t,
                completion_tokens=comp_t,
                total_tokens=prompt_t + comp_t,
                estimated_cost_usd=cost,
            ),
        )
        steps.append(step)

    return AgentTrace(
        trace_id=trace_id,
        agent_name="mock_agent",
        task_input={"input": "test"},
        final_output={"output": "done"},
        steps=steps,
        total_latency_ms=total_latency,
        total_tokens=TokenUsage(
            prompt_tokens=total_prompt_tokens,
            completion_tokens=total_completion_tokens,
            total_tokens=total_prompt_tokens + total_completion_tokens,
            estimated_cost_usd=total_cost,
        ),
    )


def test_identical_traces():
    steps = [
        {"name": "fetch_user", "type": StepType.TOOL_CALL},
        {"name": "summarize", "type": StepType.LLM_CALL},
    ]
    baseline = create_mock_trace("v1", steps, 1000.0)
    candidate = create_mock_trace("v2", steps, 1000.0)

    report = compare(baseline, candidate)

    assert report.trajectory_divergence_index == 0.0
    assert report.baseline_wei == 0.0
    assert report.candidate_wei == 0.0
    assert report.cost_delta_percentage == 0.0
    assert report.latency_delta_percentage == 0.0
    assert len(report.loops_detected) == 0
    assert report.passed is True


def test_divergent_trajectory_with_errors():
    # Baseline: fetch_user -> summarize (2 steps)
    base_steps = [
        {"name": "fetch_user", "type": StepType.TOOL_CALL},
        {"name": "summarize", "type": StepType.LLM_CALL},
    ]
    baseline = create_mock_trace("v1", base_steps, 1000.0)

    # Candidate: fetch_user -> fetch_user (error) -> fetch_user (retry) -> summarize (4 steps)
    cand_steps = [
        {"name": "fetch_user", "type": StepType.TOOL_CALL},
        {
            "name": "fetch_user",
            "type": StepType.TOOL_CALL,
            "status": StepStatus.ERROR,
            "error": "timeout",
        },
        {"name": "fetch_user", "type": StepType.TOOL_CALL, "latency": 800.0},
        {
            "name": "summarize",
            "type": StepType.LLM_CALL,
            "prompt_tokens": 100,
        },  # cost increased
    ]
    candidate = create_mock_trace("v2", cand_steps, 2300.0)

    report = compare(baseline, candidate)

    # TDI calculation verification:
    # LCS is 2 steps (fetch_user, summarize)
    # TDI = 1 - 2 * 2 / (2 + 4) = 1 - 4/6 = 0.3333
    assert abs(report.trajectory_divergence_index - 0.3333) < 0.001

    # WEI verification:
    # Baseline: 0 / 2 = 0.0
    # Candidate: 1 error / 4 total = 0.25
    assert report.baseline_wei == 0.0
    assert report.candidate_wei == 0.25

    # Deltas verification:
    assert report.latency_delta_percentage == 130.0  # (2300 - 1000) / 1000 * 100

    # Ensure assertion helper raises errors on regression
    with pytest.raises(AssertionError) as excinfo:
        assert_no_regressions(
            report,
            max_divergence=0.20,
            max_cost_increase_pct=5.0,
            max_wasted_effort=0.10,
        )

    assert "Trajectory Divergence Index" in str(excinfo.value)
    assert "Wasted Effort Index" in str(excinfo.value)


def test_loop_detection():
    # Loop pattern in sequence: A -> B -> B -> C
    steps = [
        {"name": "fetch_user", "type": StepType.TOOL_CALL},
        {"name": "query_db", "type": StepType.TOOL_CALL, "input": {"q": 1}},
        {
            "name": "query_db",
            "type": StepType.TOOL_CALL,
            "input": {"q": 1},
        },  # consecutive duplicate input -> stagnant loop
        {"name": "summarize", "type": StepType.LLM_CALL},
    ]
    baseline = create_mock_trace("v1", steps[:2], 500.0)
    candidate = create_mock_trace("v2", steps, 1500.0)

    report = compare(baseline, candidate)

    assert len(report.loops_detected) == 1
    assert report.loops_detected[0]["steps"] == ["query_db"]
    assert report.loops_detected[0]["iterations"] == 2
    assert report.loops_detected[0]["stagnant"] is True

    # Assert regression helper flags loops
    with pytest.raises(AssertionError) as excinfo:
        assert_no_regressions(report, allow_loops=False)
    assert "Detected 1 loops in the candidate run" in str(excinfo.value)
