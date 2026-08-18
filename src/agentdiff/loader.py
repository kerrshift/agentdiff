import json
from typing import Any

from agentdiff.adapters import (
    GenericAdapter,
    LangfuseAdapter,
    LangSmithAdapter,
    OpenAIAgentsAdapter,
    OpenInferenceAdapter,
)
from agentdiff.models.trace import AgentTrace


def parse_trace_data(data: Any, adapter_name: str = "auto") -> AgentTrace:
    """Parses a dictionary/list into an AgentTrace, auto-detecting the adapter if specified.

    Args:
        data: Raw trace data (dict or list) in one of the supported formats.
        adapter_name: One of ``"auto"``, ``"generic"``, ``"openinference"``,
            ``"langfuse"``, ``"langsmith"``, ``"openai_agents"``. With ``"auto"``
            the format is detected from the structure.

    Returns:
        A canonical :class:`AgentTrace`.

    Raises:
        ValueError: If the data is unsupported, empty, or malformed.
    """
    name = adapter_name.lower().strip()

    if name == "generic":
        return GenericAdapter.from_dict(data)
    elif name in ("openinference", "open_inference"):
        return OpenInferenceAdapter.from_dict(data)
    elif name == "langfuse":
        return LangfuseAdapter.from_dict(data)
    elif name == "langsmith":
        return LangSmithAdapter.from_dict(data)
    elif name in ("openai_agents", "openai-agents", "openai"):
        return OpenAIAgentsAdapter.from_dict(data)
    elif name == "auto":
        # Auto-detect format based on structure
        if isinstance(data, list):
            if not data:
                raise ValueError("Cannot auto-detect from an empty list")
            elem = data[0]
            if isinstance(elem, dict):
                if "context" in elem or "attributes" in elem:
                    return OpenInferenceAdapter.from_dict(data)
                if "span_data" in elem:
                    return OpenAIAgentsAdapter.from_dict(data)
            return GenericAdapter.from_dict(data)

        elif isinstance(data, dict):
            # Langfuse check
            if "observations" in data:
                return LangfuseAdapter.from_dict(data)

            # LangSmith check: a run tree root with child_runs or run_type
            if "run_type" in data or "child_runs" in data or "runs" in data:
                return LangSmithAdapter.from_dict(data)

            # OpenAI Agents SDK check: spans carry span_data, or trace export.
            spans = data.get("spans")
            if isinstance(spans, list) and spans:
                first_span = spans[0]
                if isinstance(first_span, dict) and "span_data" in first_span:
                    return OpenAIAgentsAdapter.from_dict(data)
            if data.get("object") == "trace" or data.get("workflow_name"):
                return OpenAIAgentsAdapter.from_dict(data)

            # OpenInference check
            if "spans" in data and isinstance(data["spans"], list) and data["spans"]:
                first_span = data["spans"][0]
                if "context" in first_span or "attributes" in first_span:
                    return OpenInferenceAdapter.from_dict(data)

            # Default fallback
            return GenericAdapter.from_dict(data)

        raise ValueError(f"Unsupported raw trace data type: {type(data)}")


def load_trace(filepath: str, adapter_name: str = "auto") -> AgentTrace:
    """Loads and parses a trace JSON file from disk.

    Args:
        filepath: Path to a JSON trace file.
        adapter_name: Format hint; ``"auto"`` detects the format (see
            :func:`parse_trace_data`).

    Returns:
        A canonical :class:`AgentTrace`.
    """
    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)
    return parse_trace_data(data, adapter_name)
