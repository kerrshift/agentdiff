from typing import Any

import networkx as nx
from pydantic import BaseModel, Field

from agentdiff.models.step import TokenUsage, TraceStep


class AgentTrace(BaseModel):
    schema_version: str = Field(
        default="1.0.0",
        description="Semver of the canonical AgentTrace JSON schema.",
    )
    trace_id: str
    agent_name: str
    agent_version: str | None = None
    task_input: dict[str, Any]
    final_output: dict[str, Any] | None = None
    steps: list[TraceStep] = Field(default_factory=list)
    total_latency_ms: float = 0.0
    total_tokens: TokenUsage = Field(default_factory=TokenUsage)
    metadata: dict[str, Any] = Field(default_factory=dict)

    def to_networkx(self) -> nx.DiGraph:
        """Converts step sequence/parent_ids into a networkx.DiGraph."""
        graph = nx.DiGraph()

        # Add all nodes first
        for step in self.steps:
            graph.add_node(step.step_id, step=step)

        # Add edges based on parent_id relationships
        for step in self.steps:
            if step.parent_id and step.parent_id in graph:
                graph.add_edge(step.parent_id, step.step_id)

        return graph
