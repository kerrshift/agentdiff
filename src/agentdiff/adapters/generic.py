from typing import Any

from agentdiff.adapters.base import BaseAdapter
from agentdiff.models.trace import AgentTrace


class GenericAdapter(BaseAdapter):
    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AgentTrace:
        """Parses a dictionary matching the canonical schema into AgentTrace."""
        return AgentTrace.model_validate(data)
