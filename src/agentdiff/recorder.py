"""Record an agent run and capture its trajectory as an AgentDiff trace.

E3 — the ``record`` subcommand closes the biggest onboarding gap: "how do I
get a trace?". Point it at any callable that returns a dict (or a string,
which is wrapped as ``{"output": ...}``), and AgentDiff:

1. imports the callable (``module:function`` or ``module.Class.method``),
2. times its execution,
3. captures the return value as the final output,
4. writes a canonical Generic-format trace JSON ready for ``agentdiff diff``.

The callable's *internal* steps (tool calls, LLM turns) are opaque to us —
frameworks that expose those should export their native traces through the
adapters instead. ``record`` is for agents (and plain functions) with no
telemetry: one deterministic step per run, so diffs catch output/behavior
changes, loops and cost deltas come from repeated runs, and the pytest
plugin works unchanged.
"""

from __future__ import annotations

import importlib
import json
import sys
import time
from collections.abc import Callable
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from agentdiff.models.step import StepStatus, StepType, TokenUsage, TraceStep
from agentdiff.models.trace import AgentTrace

_RECORD_STEP_ID = "recorded-run"


def resolve_callable(target: str) -> Callable[..., Any]:
    """Imports and returns the callable described by ``module:function``.

    Also accepts ``module:Class.method`` (unbound — called with no args only
    if it does not require self, e.g. a ``@staticmethod``) and ``module:function``
    where ``function`` is any zero-arg callable object.
    """
    if ":" not in target:
        raise ValueError(
            f"Invalid target {target!r}. Use 'module:function' or 'module:Class.method'."
        )
    module_path, _, attr_path = target.partition(":")

    # The user runs this from their project root; their agent module lives there.
    # pytest does the same thing with rootdir insertion.
    cwd = str(Path.cwd())
    if cwd not in sys.path:
        sys.path.insert(0, cwd)

    try:
        module = importlib.import_module(module_path)
    except ImportError as e:
        raise ValueError(f"Cannot import module {module_path!r}: {e}") from e

    obj: Any = module
    for part in attr_path.split("."):
        try:
            obj = getattr(obj, part)
        except AttributeError as e:
            raise ValueError(
                f"Cannot resolve {attr_path!r} in module {module_path!r}: {e}"
            ) from e

    if not callable(obj):
        raise ValueError(
            f"Target {target!r} resolved to a non-callable ({type(obj).__name__})."
        )
    return obj


def record_run(
    target: str,
    task_input: dict[str, Any] | None = None,
    agent_name: str | None = None,
) -> AgentTrace:
    """Runs ``target`` once and captures the execution as an :class:`AgentTrace`.

    The callable is invoked with ``task_input`` unpacked as keyword arguments
    when it is a dict, or as a single positional argument otherwise.
    """
    fn = resolve_callable(target)
    task = task_input if task_input is not None else {}
    name = agent_name or target.split(":")[-1]

    started = time.perf_counter()
    error_message: str | None = None
    status = StepStatus.SUCCESS
    result: Any = None
    try:
        if isinstance(task, dict) and task:
            result = fn(**task)
        elif isinstance(task, dict):
            result = fn()
        else:
            result = fn(task)
    except Exception as e:
        status = StepStatus.ERROR
        error_message = f"{type(e).__name__}: {e}"
    latency_ms = (time.perf_counter() - started) * 1000.0

    if result is None or isinstance(result, dict):
        output: dict[str, Any] | None = result if isinstance(result, dict) else None
        if result is not None and not isinstance(result, dict):
            output = {"output": result}
    elif isinstance(result, str):
        output = {"output": result}
    else:
        output = {"output": _safe_serialize(result)}

    step = TraceStep(
        step_id=_RECORD_STEP_ID,
        parent_id=None,
        step_index=0,
        step_type=StepType.TOOL_CALL,
        name=name,
        input_payload=task
        if isinstance(task, dict)
        else {"input": _safe_serialize(task)},
        output_payload=output,
        status=status,
        error_message=error_message,
        latency_ms=latency_ms,
        tokens=TokenUsage(),
    )

    trace = AgentTrace(
        trace_id=f"recorded-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}-{abs(hash(target)) % 10000:04d}",
        agent_name=name,
        task_input=task if isinstance(task, dict) else {"input": _safe_serialize(task)},
        final_output=output if status == StepStatus.SUCCESS else None,
        steps=[step],
        total_latency_ms=latency_ms,
        metadata={"recorded_from": target, "recorder": "agentdiff record"},
    )
    return trace


def _safe_serialize(value: Any) -> Any:
    """Best-effort JSON-safe conversion for arbitrary return values."""
    try:
        json.dumps(value)
        return value
    except (TypeError, ValueError):
        return repr(value)


def save_trace(trace: AgentTrace, out_path: str | Path) -> Path:
    """Writes the trace as canonical AgentDiff JSON; returns the resolved path."""
    path = Path(out_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(trace.model_dump_json(indent=2), encoding="utf-8")
    return path
