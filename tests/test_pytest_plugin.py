import json


def _make_trace_json(steps):
    return {
        "trace_id": "t",
        "agent_id": "a",
        "agent_name": "demo",
        "task_input": {"q": "x"},
        "schema_version": "1.0.0",
        "steps": steps,
    }


def _step(i, name, status="success"):
    return {
        "step_id": str(i),
        "name": name,
        "step_index": i,
        "step_type": "tool_call",
        "status": status,
        "input_payload": {},
        "output_payload": {},
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": 5,
            "total_tokens": 15,
            "estimated_cost_usd": 0.0001,
        },
        "latency_ms": 10,
    }


TEST_BODY = """
def test_example(agentdiff_trace):
    agentdiff_trace.record(_TRACE)
"""

_PRELUDE = """
import json
import sys
sys.path.insert(0, ".")

_TRACE = json.loads('''{trace}''')
"""


def _setup(pytester, trace):
    pytester.makepyfile(test_demo=_PRELUDE.format(trace=json.dumps(trace)) + TEST_BODY)


def _run(pytester, *args):
    base = [
        "--agentdiff",
        "--agentdiff-baselines",
        "baselines",
        "-p",
        "no:cacheprovider",
        "-p",
        "agentdiff",
    ]
    return pytester.runpytest(*base, *args)


def test_plugin_records_baseline_on_update(pytester):
    trace = _make_trace_json([_step(0, "a"), _step(1, "b")])
    _setup(pytester, trace)
    result = _run(pytester, "--agentdiff-update-baselines")
    result.assert_outcomes(passed=1)
    baseline = pytester.path / "baselines"
    assert baseline.exists()
    assert list(baseline.glob("*.json"))


def test_plugin_passes_without_regression(pytester):
    trace = _make_trace_json([_step(0, "a"), _step(1, "b")])
    _setup(pytester, trace)
    _run(pytester, "--agentdiff-update-baselines")
    result = _run(pytester)
    result.assert_outcomes(passed=1)


def test_plugin_fails_on_divergence(pytester):
    base = _make_trace_json([_step(0, "a"), _step(1, "b")])
    _setup(pytester, base)
    _run(pytester, "--agentdiff-update-baselines", "--agentdiff-max-divergence", "0.0")

    # Structurally larger trace so pytest recompiles the module (avoids stale pyc).
    regressed = _make_trace_json(
        [_step(0, "a"), _step(1, "b"), _step(2, "unexpected"), _step(3, "more")]
    )
    _setup(pytester, regressed)
    result = _run(pytester, "--agentdiff-max-divergence", "0.0")
    assert result.ret != 0
    result.stdout.fnmatch_lines(["*AgentDiff regression*"])


def test_plugin_disabled_without_flag(pytester):
    trace = _make_trace_json([_step(0, "a"), _step(1, "b")])
    _setup(pytester, trace)
    result = pytester.runpytest("-p", "no:cacheprovider", "-p", "agentdiff")
    result.assert_outcomes(passed=1)
