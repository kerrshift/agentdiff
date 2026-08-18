"""A1: the emitted JSON Schema must match the pydantic model exactly.

If the model drifts from schema/agent_trace.schema.json, this fails loudly so
the machine contract is regenerated and re-committed.
"""

import json
from pathlib import Path

from agentdiff.models.trace import AgentTrace

SCHEMA = Path(__file__).parent.parent / "schema" / "agent_trace.schema.json"


def test_emitted_schema_matches_model():
    emitted = json.loads(SCHEMA.read_text(encoding="utf-8"))
    expected = AgentTrace.model_json_schema()
    expected["$schema"] = "http://json-schema.org/draft-07/schema#"
    expected["$id"] = "https://agentdiff.dev/schemas/agent_trace.schema.json"
    assert emitted == expected


def test_schema_self_describing_and_versioned():
    emitted = json.loads(SCHEMA.read_text(encoding="utf-8"))
    assert emitted["title"] == "AgentTrace"
    props = emitted["properties"]
    assert props["schema_version"]["default"] == "1.0.0"
    assert "steps" in props
    assert "task_input" in props
