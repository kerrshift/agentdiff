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

Parses OpenAI Agents SDK trace exports — a top-level `trace` object with a flat
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