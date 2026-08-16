import json
from typing import Any

from agentdiff.adapters import (
    DeepEvalAdapter,
    GenericAdapter,
    LangfuseAdapter,
    OpenInferenceAdapter,
)
from agentdiff.models.trace import AgentTrace


def parse_trace_data(data: Any, adapter_name: str = "auto") -> AgentTrace:
    """Parses a dictionary/list into an AgentTrace, auto-detecting the adapter if specified."""
    name = adapter_name.lower().strip()

    if name == "generic":
        return GenericAdapter.from_dict(data)
    elif name == "deepeval":
        return DeepEvalAdapter.from_dict(data)
    elif name in ("openinference", "open_inference"):
        return OpenInferenceAdapter.from_dict(data)
    elif name == "langfuse":
        return LangfuseAdapter.from_dict(data)
    elif name == "auto":
        # Auto-detect format based on structure
        if isinstance(data, list):
            if not data:
                raise ValueError("Cannot auto-detect from an empty list")
            elem = data[0]
            if isinstance(elem, dict):
                if "context" in elem or "attributes" in elem:
                    return OpenInferenceAdapter.from_dict(data)
                if "type" in elem and "input" in elem:
                    return DeepEvalAdapter.from_dict(data)
            return GenericAdapter.from_dict(data)

        elif isinstance(data, dict):
            # Langfuse check
            if "observations" in data:
                return LangfuseAdapter.from_dict(data)

            # OpenInference check
            if "spans" in data and isinstance(data["spans"], list) and data["spans"]:
                first_span = data["spans"][0]
                if "context" in first_span or "attributes" in first_span:
                    return OpenInferenceAdapter.from_dict(data)

            # DeepEval check
            if ("input" in data and "output" in data) and (
                "spans" in data or "nodes" in data
            ):
                return DeepEvalAdapter.from_dict(data)

            # Default fallback
            return GenericAdapter.from_dict(data)

        raise ValueError(f"Unsupported raw trace data type: {type(data)}")


def load_trace(filepath: str, adapter_name: str = "auto") -> AgentTrace:
    """Loads and parses a trace file from disk."""
    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)
    return parse_trace_data(data, adapter_name)
