import json
from abc import ABC, abstractmethod
from typing import Any

from agentdiff.models.trace import AgentTrace


class BaseAdapter(ABC):
    @classmethod
    @abstractmethod
    def from_dict(cls, data: dict[str, Any]) -> AgentTrace:
        """Parses a raw dictionary input into a canonical AgentTrace."""
        pass

    @classmethod
    def from_file(cls, filepath: str) -> AgentTrace:
        """Loads a JSON file and parses it into a canonical AgentTrace."""
        with open(filepath, encoding="utf-8") as f:
            data = json.load(f)
        return cls.from_dict(data)
