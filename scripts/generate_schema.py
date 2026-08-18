"""Regenerates the canonical AgentTrace JSON Schema from the pydantic model.

Run from the repo root:

    .venv/bin/python scripts/generate_schema.py

Writes ``schema/agent_trace.schema.json`` and bumps the in-model
``schema_version`` if desired. Committing the emitted file pins the machine
contract so tooling can validate traces without importing Python.
"""

import json
from pathlib import Path

from agentdiff.models.trace import AgentTrace

OUT = Path(__file__).resolve().parent.parent / "schema" / "agent_trace.schema.json"


def main() -> None:
    schema = AgentTrace.model_json_schema()
    schema["$schema"] = "http://json-schema.org/draft-07/schema#"
    schema["$id"] = "https://agentdiff.dev/schemas/agent_trace.schema.json"
    OUT.write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()