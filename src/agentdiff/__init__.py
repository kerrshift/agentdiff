"""AgentDiff — regression testing for multi-turn, tool-using AI agents.

Compare two agent execution trajectories (the DAG of tool calls, LLM calls, and
decisions) head-to-head to catch regressions in CI.

Public API
----------
- ``compare(baseline, candidate)`` -> ``DiffReport``
    Structural diff (alignment + TDI/WEI + resource deltas + loop detection).
- ``assert_no_regressions(report, ...)``
    Threshold gates (divergence, cost, loops, wasted effort) for pytest.
- ``load_trace(path, adapter="auto")`` -> ``AgentTrace``
    Load a trace from JSON, auto-detecting the telemetry format.
- ``parse_trace_data(data, adapter="auto")`` -> ``AgentTrace``
    Parse an in-memory dict instead of a file.
- Adapters: ``GenericAdapter``, ``LangfuseAdapter``, ``LangSmithAdapter``,
    ``OpenInferenceAdapter``, ``OpenAIAgentsAdapter`` (all expose
    ``from_dict`` / ``from_file``).
- ``register_adapter(name, cls)`` / ``available_adapters()``
    Extend ingestion with custom or entry-point plugin adapters
    (entry-point group ``agentdiff.adapters``).
- ``load_config(path=None)`` -> ``AgentDiffConfig``
    Load defaults from ``agentdiff.toml`` (thresholds, adapter, baseline).
- Models: ``AgentTrace`` (canonical, ``schema_version``-ed), ``DiffReport``,
    ``StepDiff``/``StepDiffStatus``, ``TraceStep``/``StepStatus``/``StepType``.

Typical flow::

    baseline = load_trace("baseline.json")
    candidate = load_trace("candidate.json")
    report = compare(baseline, candidate)
    assert_no_regressions(report)
"""

__version__ = "0.3.0"

from agentdiff.adapters import (
    BaseAdapter,
    GenericAdapter,
    LangfuseAdapter,
    LangSmithAdapter,
    OpenAIAgentsAdapter,
    OpenInferenceAdapter,
)
from agentdiff.adapters.registry import (
    available_adapters,
    register_adapter,
)
from agentdiff.ci.baseline import decide_rotation
from agentdiff.config import AgentDiffConfig, load_config
from agentdiff.engine import compare
from agentdiff.engine.benchmark import BenchmarkCase, BenchmarkReport, run_benchmark
from agentdiff.engine.explanations import (
    format_explanations,
    generate_explanations,
    locate_culprit,
)
from agentdiff.engine.suite import (
    GateThresholds,
    Scenario,
    ScenarioResult,
    SuiteReport,
    run_scenario,
    run_scenarios,
)
from agentdiff.engine.tree import render_tree
from agentdiff.loader import load_trace, parse_trace_data
from agentdiff.models import (
    AgentTrace,
    DiffReport,
    StepDiff,
    StepDiffStatus,
    StepStatus,
    StepType,
    TokenUsage,
    TraceStep,
)
from agentdiff.reporters.pr import generate_pr_markdown
from agentdiff.testing import assert_no_regressions

__all__ = [
    "AgentDiffConfig",
    "AgentTrace",
    "BaseAdapter",
    "BenchmarkCase",
    "BenchmarkReport",
    "DiffReport",
    "GateThresholds",
    "GenericAdapter",
    "LangSmithAdapter",
    "LangfuseAdapter",
    "OpenAIAgentsAdapter",
    "OpenInferenceAdapter",
    "Scenario",
    "ScenarioResult",
    "StepDiff",
    "StepDiffStatus",
    "StepStatus",
    "StepType",
    "SuiteReport",
    "TokenUsage",
    "TraceStep",
    "__version__",
    "assert_no_regressions",
    "available_adapters",
    "compare",
    "decide_rotation",
    "format_explanations",
    "generate_explanations",
    "generate_pr_markdown",
    "load_config",
    "load_trace",
    "locate_culprit",
    "parse_trace_data",
    "register_adapter",
    "render_tree",
    "run_benchmark",
    "run_scenario",
    "run_scenarios",
]
