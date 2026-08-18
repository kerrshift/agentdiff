"""Demo of the AgentDiff pytest plugin.

The candidate run below intentionally repeats ``search_database`` (a loop).
Run with ``--agentdiff`` to compare it against the committed baseline and gate
the test on the regression.
"""

import json


def _candidate_trace():
    return {
        "schema_version": "1.0.0",
        "trace_id": "candidate",
        "agent_name": "orders_agent",
        "task_input": {"user_query": "how many orders are pending?"},
        "steps": [
            _step("c0", 0, "planner", "llm_call"),
            _step("c1", 1, "search_database", "tool_call"),
            _step("c2", 2, "search_database", "tool_call"),
            _step("c3", 3, "search_database", "tool_call"),
            _step("c4", 4, "synthesize", "llm_call"),
        ],
    }


def _step(step_id, index, name, step_type):
    return {
        "step_id": step_id,
        "step_index": index,
        "step_type": step_type,
        "name": name,
        "status": "success",
        "input_payload": {},
        "output_payload": {},
        "latency_ms": 10,
        "tokens": {
            "prompt_tokens": 10,
            "completion_tokens": 5,
            "total_tokens": 15,
            "estimated_cost_usd": 0.0001,
        },
    }


def test_returns_orders(agentdiff_trace):
    agentdiff_trace.record(_candidate_trace())
    assert json.dumps(_candidate_trace())
