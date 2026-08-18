# Trajectory DAGs

AgentDiff translates a multi-turn execution sequence into a **directed acyclic graph (DAG)** of steps. Each node is a step (a tool call, an LLM call, a routing decision, or a thought); edges follow the parent-child flow of execution.

## Canonical data model

AgentDiff uses Pydantic (v2+) for strongly-typed trace schemas.

### `AgentTrace` — one run

| Field | Type | Notes |
| --- | --- | --- |
| `schema_version` | `str` | Format version (`"1.0.0"`). |
| `trace_id` | `str` | Unique ID for the run. |
| `agent_name` | `str` | Name of the agent. |
| `agent_version` | `str?` | Optional agent version. |
| `task_input` | `dict` | The task given to the agent. |
| `final_output` | `dict?` | The agent's final answer. |
| `steps` | `list[TraceStep]` | Ordered execution steps. |
| `total_latency_ms` | `float?` | Total duration in ms. |
| `total_tokens` | `TokenUsage?` | Aggregated token/cost metadata. |
| `metadata` | `dict?` | Free-form extra data. |

### `TraceStep` — one node

| Field | Type | Notes |
| --- | --- | --- |
| `step_id` | `str` | Unique identifier. |
| `parent_id` | `str?` | Parent step id (defines hierarchy). |
| `step_index` | `int` | Sequential position in the run. |
| `step_type` | `StepType` | `tool_call`, `llm_call`, `routing`, or `thought`. |
| `name` | `str` | Action name, e.g. `web_search`. |
| `input_payload` | `dict` | Arguments to the step. |
| `output_payload` | `dict?` | Return values. |
| `status` | `StepStatus` | `success`, `error`, `retry`, or `abandoned`. |
| `error_message` | `str?` | Set when the step errored. |
| `latency_ms` | `float?` | Duration in ms. |
| `tokens` | `TokenUsage?` | Token counts and cost. |
| `metadata` | `dict?` | Free-form extra data. |

### `TokenUsage`

`prompt_tokens`, `completion_tokens`, `total_tokens`, `estimated_cost_usd`.

## Example (Generic format)

```json
{
  "schema_version": "1.0.0",
  "trace_id": "run-101",
  "agent_name": "WeatherAgent",
  "task_input": { "query": "weather in NYC" },
  "final_output": { "answer": "It is sunny and 75F in NYC." },
  "steps": [
    {
      "step_id": "step-1",
      "step_index": 0,
      "step_type": "tool_call",
      "name": "geocode_city",
      "input_payload": { "city": "NYC" },
      "output_payload": { "lat": 40.71, "lng": -74.0 },
      "status": "success",
      "latency_ms": 120.0,
      "tokens": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "estimated_cost_usd": 0.0 }
    },
    {
      "step_id": "step-2",
      "parent_id": "step-1",
      "step_index": 1,
      "step_type": "llm_call",
      "name": "generate_report",
      "input_payload": { "lat": 40.71, "lng": -74.0 },
      "output_payload": { "report": "sunny, 75 degrees" },
      "status": "success",
      "latency_ms": 1100.0,
      "tokens": { "prompt_tokens": 150, "completion_tokens": 80, "total_tokens": 230, "estimated_cost_usd": 0.0035 }
    }
  ],
  "total_latency_ms": 1220.0,
  "total_tokens": { "prompt_tokens": 150, "completion_tokens": 80, "total_tokens": 230, "estimated_cost_usd": 0.0035 }
}
```

## Working with the graph in Python

Load a trace and inspect it as a NetworkX graph:

```python
import networkx as nx
from agentdiff import load_trace

trace = load_trace("run.json")           # auto-detects the format
digraph: nx.DiGraph = trace.to_networkx()

print(list(nx.topological_sort(digraph)))
```

You can also parse raw dict data without a file:

```python
from agentdiff.loader import parse_trace_data

trace = parse_trace_data(raw_dict, adapter_name="generic")
```

See [Ingestion Adapters](03-Ingestion-Adapters.md) for the supported formats.