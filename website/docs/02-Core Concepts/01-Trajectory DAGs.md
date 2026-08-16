# Understanding Trajectory DAGs

AgentDiff translates multi-turn execution step sequences into Directed Acyclic Graphs (DAGs) using **NetworkX**. 

Each node in the DAG represents a specific step (such as a tool execution, LLM call, or thought block), and the edges reflect the parent-child flow of execution (either defined sequentially or by parent span identifiers).

## Canonical Data Models

AgentDiff uses Pydantic (v2+) to define trace schemas strongly:

### 1. Step Node Schema (`TraceStep`)
Captures step details, parameters, outputs, errors, latency, and token usages:
* `step_id` (str): Unique identifier.
* `parent_id` (str, optional): ID of the calling/parent step.
* `step_index` (int): Sequential index.
* `step_type` (StepType): One of `tool_call`, `llm_call`, `routing`, or `thought`.
* `name` (str): Action name (e.g. `web_search`, `sql_query`).
* `input_payload` (dict): Argument parameters.
* `output_payload` (dict, optional): Return values.
* `status` (StepStatus): `success`, `error`, `retry`, `abandoned`.
* `latency_ms` (float): Duration in milliseconds.
* `tokens` (TokenUsage): prompt, completion, total counts, and estimated cost.

### 2. Execution Graph (`AgentTrace`)
The container for a full trajectory run:
* `trace_id` (str): Unique trace ID.
* `agent_name` (str): Name of the agent.
* `steps` (List[TraceStep]): Linear list of steps.
* `total_latency_ms` (float): Full trace duration.
* `total_tokens` (TokenUsage): Aggregated token and cost metadata.

## Converting to NetworkX

You can convert any `AgentTrace` into a NetworkX directed graph by calling `.to_networkx()`:

```python
import networkx as nx
from agentdiff import load_trace

trace = load_trace("run.json")
digraph: nx.DiGraph = trace.to_networkx()

# You can now analyze topology, paths, or visual layouts using NetworkX:
print(list(nx.topological_sort(digraph)))
```

## Canonical JSON Schema Example
If you are not using telemetry adapters, you can output your agent runs matching this canonical schema directly:

```json
{
  "trace_id": "run-101",
  "agent_name": "WeatherAgent",
  "task_input": { "query": "weather in NYC" },
  "final_output": { "answer": "It is sunny and 75°F in NYC." },
  "steps": [
    {
      "step_id": "step-1",
      "step_index": 0,
      "step_type": "tool_call",
      "name": "geocode_city",
      "input_payload": { "city": "NYC" },
      "output_payload": { "lat": 40.71, "lng": -74.00 },
      "status": "success",
      "latency_ms": 120.0
    },
    {
      "step_id": "step-2",
      "parent_id": "step-1",
      "step_index": 1,
      "step_type": "llm_call",
      "name": "generate_report",
      "input_payload": { "lat": 40.71, "lng": -74.00 },
      "output_payload": { "report": "sunny, 75 degrees" },
      "status": "success",
      "latency_ms": 1100.0,
      "tokens": {
        "prompt_tokens": 150,
        "completion_tokens": 80,
        "total_tokens": 230,
        "estimated_cost_usd": 0.0035
      }
    }
  ],
  "total_latency_ms": 1220.0,
  "total_tokens": {
    "prompt_tokens": 150,
    "completion_tokens": 80,
    "total_tokens": 230,
    "estimated_cost_usd": 0.0035
  }
}
```
