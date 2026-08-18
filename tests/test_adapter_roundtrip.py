"""Round-trip losslessness and fuzz-resilience tests for the adapters.

Round-trip invariant (A2): dumping a trace to canonical JSON and loading it
back via the generic adapter must preserve structure and step signatures, so
the canonical schema is lossless.

Fuzz invariant (I5): feeding adapters arbitrary malformed dicts must either
yield a valid AgentTrace or raise a clean ValueError -- never crash with an
unexpected exception or return a partially-corrupted trace.
"""

import json

import pytest
from conftest import make_step, make_trace
from hypothesis import given, settings
from hypothesis import strategies as st
from pydantic import ValidationError

from agentdiff.adapters import (
    GenericAdapter,
    LangfuseAdapter,
    LangSmithAdapter,
    OpenInferenceAdapter,
)
from agentdiff.engine.aligner import step_signature
from agentdiff.models.trace import AgentTrace

# ── A2: round-trip losslessness ──────────────────────────────────────────────


@pytest.mark.parametrize(
    "status",
    [
        ["success", "error", "retry", "abandoned"],
        ["success", "success", "error"],
        [],
    ],
)
def test_round_trip_preserves_steps_and_signatures(status):
    steps = [make_step(f"step-{i}", status=s) for i, s in enumerate(status)]
    trace = make_trace("rt", steps)

    restored = GenericAdapter.from_dict(json.loads(trace.model_dump_json()))

    assert restored.trace_id == trace.trace_id
    assert len(restored.steps) == len(trace.steps)
    for orig, back in zip(trace.steps, restored.steps):
        assert orig.step_id == back.step_id
        assert step_signature(orig) == step_signature(back)
        assert orig.input_payload == back.input_payload
        assert orig.output_payload == back.output_payload
        assert orig.status == back.status


def test_round_trip_compare_is_identical():
    trace = make_trace(
        "rt",
        [
            make_step("fetch", input_payload={"q": 1}),
            make_step("query", input_payload={"q": 2}, parent_id="step_0"),
        ],
    )
    restored = GenericAdapter.from_dict(json.loads(trace.model_dump_json()))
    # Comparing a trace against its own round-trip must report zero divergence.
    from agentdiff.engine.comparator import compare

    report = compare(trace, restored)
    assert report.trajectory_divergence_index == 0.0
    assert report.passed is True


# ── I5: fuzz resilience ──────────────────────────────────────────────────────

# A strategy that produces deeply arbitrary JSON-like structures.
SCALARS = st.one_of(st.none(), st.booleans(), st.integers(), st.floats(), st.text())
JSON = st.recursive(
    SCALARS,
    lambda children: st.lists(children) | st.dictionaries(st.text(), children),
    max_leaves=40,
)


def _accepts_or_clean_error(adapter_cls, data):
    """Either a valid trace comes back, or a clean ValueError/ValidationError."""
    try:
        trace = adapter_cls.from_dict(data)
    except (ValueError, ValidationError):
        return True
    assert isinstance(trace, AgentTrace)
    # Every produced step must itself validate (no partial corruption).
    for step in trace.steps:
        assert step.step_id and step.name
    return True


@given(JSON)
@settings(max_examples=300)
def test_generic_fuzz(data):
    _accepts_or_clean_error(GenericAdapter, data)


@given(JSON)
@settings(max_examples=300)
def test_langsmith_fuzz(data):
    _accepts_or_clean_error(LangSmithAdapter, data)


@given(JSON)
@settings(max_examples=300)
def test_langfuse_fuzz(data):
    _accepts_or_clean_error(LangfuseAdapter, data)


@given(JSON)
@settings(max_examples=300)
def test_openinference_fuzz(data):
    _accepts_or_clean_error(OpenInferenceAdapter, data)
