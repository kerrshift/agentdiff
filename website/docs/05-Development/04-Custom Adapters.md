# Custom Adapters

AgentDiff ships adapters for the major telemetry sources, but teams often have
proprietary trace formats - an internal tracing SDK, a vendor export, a
bespoke event log. The adapter registry lets you teach AgentDiff your format
without forking anything.

## Registering at runtime

```python
from agentdiff import BaseAdapter, register_adapter, load_trace
from agentdiff.models import AgentTrace


@register_adapter("acme", aliases=("acme_tracer",))
class AcmeAdapter(BaseAdapter):
    @classmethod
    def from_dict(cls, data: dict) -> AgentTrace:
        steps = [
            build_step(span) for span in data["spans"]  # your mapping
        ]
        return AgentTrace(trace_id=..., agent_name=..., steps=steps, ...)

    @classmethod
    def detect(cls, data: dict) -> bool:
        # Optional: lets load_trace(path) auto-detect this format.
        return isinstance(data, dict) and data.get("vendor") == "acme"
```

After registration the adapter resolves everywhere by name:

```python
trace = load_trace("run.json", adapter_name="acme")   # explicit
trace = load_trace("run.json")                         # auto-detected via detect()
```

It also flows through configuration - `[adapter] name = "acme"` in
`agentdiff.toml` works with zero extra wiring.

## Entry-point plugins (third-party packages)

If you maintain a separate package, expose adapters through the standard
Python entry-point group and they are discovered automatically on first use -
no registration call required in user code:

```toml
# acme-sdk's pyproject.toml
[project.entry-points."agentdiff.adapters"]
acme = "acme_sdk.agentdiff:AcmeAdapter"
```

Discovery is lazy and failure-tolerant: a broken plugin is skipped silently,
and built-ins can never be shadowed.

## Rules of the registry

- Names are normalized (case-insensitive; `-` and spaces fold to `_`).
- Re-registering a name requires `override=True`.
- `detect()` hooks are dict-only and consulted **after** all built-ins, so
  registering an adapter never changes how existing telemetry is classified.
- A broken `detect()` hook is swallowed by contract - ingestion never crashes
  because of plugin code.
- Inspect what's available with `agentdiff.available_adapters()`; tests can
  reset state between cases with `agentdiff.adapters.reset_registry()`.

## Building a good adapter

- Map tool executions to `tool_call`, model calls to `llm_call`, and
  decisions/handoffs to `routing` steps - that vocabulary drives loop
  detection, explanations, and the culprit locator.
- Populate token usage when the source has it; cost deltas and resource gates
  depend on it.
- Honor error/retry/abandoned statuses in the source so WEI and the Recovery
  Step Ratio stay meaningful.
- Ship round-trip and fuzz tests like the built-in adapters do (see
  `tests/test_adapter_roundtrip.py` for the pattern).
