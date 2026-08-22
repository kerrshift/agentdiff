# Ingestion Adapters

AgentDiff is telemetry-agnostic: it normalizes traces from your favorite LLM
observability tools into the canonical `AgentTrace` format, so you can diff runs
from any source.

## Loading a trace

`load_trace()` auto-detects the source format:

```python
from agentdiff import load_trace

trace = load_trace("run_data.json")   # auto-detects the format
```

Force a specific adapter with `adapter_name`:

```python
trace = load_trace("run_data.json", adapter_name="openinference")
```

To parse raw dict data without a file, use `parse_trace_data`:

```python
from agentdiff.loader import parse_trace_data

trace = parse_trace_data(raw_dict, adapter_name="langfuse")
```

## Supported adapters

| Adapter name | `adapter_name` | Input |
| --- | --- | --- |
| Generic | `generic` | JSON matching the canonical `AgentTrace` schema 1-to-1. |
| OpenInference / OTel | `openinference` | Standard OTel span collections (e.g. Arize Phoenix, Traceloop). |
| Langfuse | `langfuse` | Exported Langfuse observation dumps. |
| LangSmith | `langsmith` | LangSmith run-trees (nested `run` objects). |
| OpenAI Agents SDK | `openai_agents` | OpenAI Agents SDK trace exports (a `trace` of `spans`). |
| LangGraph | `langgraph` | Native state snapshots, checkpoint dumps, and message lists - no OTel needed. |
| CrewAI | `crewai` | Native kickoff output (`CrewOutput.model_dump()`) - no OTel needed. |
| *Your own* | *(registered)* | Anything - register a custom adapter at runtime or via entry points. |

### LangGraph (`langgraph`)

Ingests what LangGraph users actually have on disk:

- **Message lists** - `result["messages"]` serialized via
  `langchain_core.messages.message_to_dict`, as LangChain constructor dumps
  (`{"lc": 1, "id": [...], "kwargs": ...}`), or plain OpenAI-style role dicts.
- **State snapshots** - `{"values": {"messages": [...]}}`.
- **Checkpoint dumps** - `{"channel_values": {"messages": [...]}}`.

Mapping mirrors real graph execution: AI tool calls become `routing` steps,
tool results become `tool_call` steps (the message's own `status` field is
honored), and the final AI answer becomes a `response` step. Token usage is
read from `usage_metadata` / `response_metadata.token_usage`.

### CrewAI (`crewai`)

Ingests `crew.kickoff()` output serialized with `model_dump()`:

- Each task's embedded message log maps to fine-grained steps prefixed by the
  agent's role (`Reporter/db_stats`), so multi-task crews stay unambiguous.
- Simplified exports without logs degrade gracefully to one step per task.
- Aggregate `token_usage` populates trace totals.

Both direct-ingestion adapters share one tested conversation-parsing engine,
so role messages are interpreted identically across frameworks. Real captured
fixtures ship as cookbooks - see `cookbooks/ingestion_langgraph.py` and
`cookbooks/ingestion_crewai.py`.

## Custom adapters & plugins

Teams with proprietary trace formats can register their own adapters:

```python
from agentdiff import BaseAdapter, register_adapter

@register_adapter("acme", aliases=("acme_tracer",))
class AcmeAdapter(BaseAdapter):
    @classmethod
    def from_dict(cls, data):
        return build_trace_from_acme(data)   # your mapping

    @classmethod
    def detect(cls, data):                   # optional: join auto-detection
        return data.get("vendor") == "acme"
```

```python
trace = load_trace("run.json", adapter_name="acme")       # explicit...
trace = load_trace("run.json")                             # ...or auto-detected
```

Third-party packages can also expose adapters through the standard Python
entry-point group so they are discovered automatically:

```toml
[project.entry-points."agentdiff.adapters"]
acme = "acme_sdk.agentdiff:AcmeAdapter"
```

Built-ins always win detection priority, and plugins can never shadow them -
registering an adapter never changes how existing telemetry is classified.
See [Custom Adapters](../05-Development/04-Custom-Adapters.md) for the full
guide.

### Generic (`generic`)

Maps your JSON directly onto `AgentTrace` / `TraceStep`. Use this when you
record your own runs (as in the live SDK cookbooks) or when your framework
exports the canonical schema.

### OpenInference / OTel (`openinference`)

Parses OTel span collections:

- Root spans are identified by an empty `parent_span_id`.
- Attributes prefixed with `openinference.span.kind`, `input.value`, and
  `output.value` are mapped to step type, input, and output.
- LLM token metrics (`llm.token_count.prompt`, `llm.token_count.completion`)
  are read into token usage.

### Langfuse (`langfuse`)

Parses exported Langfuse observation dumps:

- `type: "GENERATION"` → `llm_call`.
- `type: "SPAN"` with a name containing `tool` → `tool_call`.
- `startTime` / `endTime` ISO timestamps → duration latency.

### LangSmith (`langsmith`)

Parses LangSmith run-trees (nested `run` objects) into ordered steps:

- `run_type`: `tool`/`retriever` → `tool_call`; `llm`/`prompt`/`embedding` →
  `llm_call`; `agent`/`chain` → `routing`.
- `child_runs` are flattened recursively while preserving the hierarchy.
- Token usage comes from `usage_metadata` / `extra.metadata.usage`; errored
  runs are marked via the `error` field.

### OpenAI Agents SDK (`openai_agents`)

Parses OpenAI Agents SDK trace exports - a top-level `trace` object with a flat
list of `spans`, each carrying a `span_data.type`:

- `agent` / `guardrail` / `handoff` → `routing`.
- `generation` / `response` → `llm_call` (tokens from `usage`).
- `function` → `tool_call`.
- `custom` → `thought`.
- `task` and `turn` are internal bookkeeping wrappers and are skipped.
- Spans are ordered chronologically by `started_at`; latency comes from the
  span timestamps; errored spans are marked via the `error` field.

The `openai_agents` name also works from the CLI and is auto-detected from the
`spans`/`span_data` structure.

## Load any two runs and compare

```python
from agentdiff import load_trace, compare

baseline = load_trace("baseline.json")      # e.g. a Langfuse export
candidate = load_trace("candidate.json")    # e.g. a LangSmith run-tree

report = compare(baseline, candidate)
```

You can mix formats: the baseline and candidate are both normalized to
`AgentTrace` first, so comparing a Langfuse run against a LangSmith run "just
works." Runnable examples live in the `cookbooks/ingestion_*.py` scripts.

### `compare()` options

```python
report = compare(
    baseline,
    candidate,
    detect_loops=True,            # scan for repeating tool-calling loops
    strict_tool_signatures=False, # match steps on exact tool signatures
)
```

- `detect_loops` (default `True`): whether to search the candidate run for
  repeating tool sequences. Disable if your agent legitimately calls a tool in
  a loop.
- `strict_tool_signatures` (default `False`): when `True`, two steps only match
  if their action name *and* input payload keys are identical. `False` matches
  on step type + name only.