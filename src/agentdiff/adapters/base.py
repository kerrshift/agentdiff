import json
from abc import ABC, abstractmethod
from typing import Any

from agentdiff.models.trace import AgentTrace


class BaseAdapter(ABC):
    """Converts a provider-specific trace format into a canonical :class:`AgentTrace`.

    Subclasses implement :meth:`from_dict`, mapping a raw provider payload into
    the normalized schema. :meth:`from_file` loads a JSON file and delegates.
    """

    @classmethod
    @abstractmethod
    def from_dict(cls, data: dict[str, Any]) -> AgentTrace:
        """Parses a raw dictionary input into a canonical AgentTrace."""
        pass

    @classmethod
    def _as_float(cls, value: Any, default: float = 0.0) -> float:
        """Coerces an arbitrary value to float, falling back on malformed input."""
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    @classmethod
    def _as_int(cls, value: Any, default: int = 0) -> int:
        """Coerces an arbitrary value to int, falling back on malformed input."""
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    @classmethod
    def from_file(cls, filepath: str) -> AgentTrace:
        """Loads a JSON file and parses it into a canonical AgentTrace."""
        with open(filepath, encoding="utf-8") as f:
            data = json.load(f)
        return cls.from_dict(data)
