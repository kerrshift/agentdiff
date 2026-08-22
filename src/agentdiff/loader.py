import json
from typing import Any

from agentdiff.adapters import (
    GenericAdapter,
    LangfuseAdapter,
    LangSmithAdapter,
    OpenAIAgentsAdapter,
    OpenInferenceAdapter,
)
from agentdiff.adapters.registry import custom_adapters_with_detect, get_adapter
from agentdiff.models.trace import AgentTrace


def parse_trace_data(data: Any, adapter_name: str = "auto") -> AgentTrace:
    """Parses a dictionary/list into an AgentTrace, auto-detecting the adapter if specified.

    Args:
        data: Raw trace data (dict or list) in one of the supported formats.
        adapter_name: ``"auto"``, any registered adapter name (``"generic"``,
            ``"openinference"``, ``"langfuse"``, ``"langsmith"``,
            ``"openai_agents"`` — or a plugin adapter registered via
            :func:`agentdiff.adapters.register_adapter`). With ``"auto"`` the
            format is detected from the structure.

    Returns:
        A canonical :class:`AgentTrace`.

    Raises:
        ValueError: If the data is unsupported, empty, malformed, or the
            adapter name is unknown.
    """
    name = adapter_name.lower().strip()

    if name != "auto":
        return get_adapter(name).from_dict(data)

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

    if isinstance(data, dict):
        # Built-in detection first: registering custom adapters never
        # reclassifies existing telemetry.
        detected = _detect_builtin_format(data)
        if detected is not None:
            return detected.from_dict(data)

        # Then plugin adapters that opted into auto-detection.
        for cls in custom_adapters_with_detect():
            try:
                matched = cls.detect(data)
            except Exception:
                matched = False  # a broken detect hook must not break ingestion
            if matched:
                return cls.from_dict(data)

        # Default fallback
        return GenericAdapter.from_dict(data)

    raise ValueError(f"Unsupported raw trace data type: {type(data)}")


def _detect_builtin_format(data: dict[str, Any]) -> type | None:
    """Returns the built-in adapter class matching ``data``, if unambiguous."""
    # Langfuse check
    if "observations" in data:
        return LangfuseAdapter

    # LangSmith check: a run tree root with child_runs or run_type
    if "run_type" in data or "child_runs" in data or "runs" in data:
        return LangSmithAdapter

    # OpenAI Agents SDK check: spans carry span_data, or trace export.
    spans = data.get("spans")
    if isinstance(spans, list) and spans:
        first_span = spans[0]
        if isinstance(first_span, dict) and "span_data" in first_span:
            return OpenAIAgentsAdapter
    if data.get("object") == "trace" or data.get("workflow_name"):
        return OpenAIAgentsAdapter

    # OpenInference check
    if "spans" in data and isinstance(data["spans"], list) and data["spans"]:
        first_span = data["spans"][0]
        if "context" in first_span or "attributes" in first_span:
            return OpenInferenceAdapter

    return None


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
