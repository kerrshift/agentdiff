"""pytest plugin: auto-compare a committed baseline trace per test.

Enable with ``--agentdiff``. Each test records its current run via the
``agentdiff_trace`` fixture; on teardown the plugin compares it against a
committed baseline JSON stored in ``--agentdiff-baselines`` (keyed by the test
nodeid) and fails the test on regression. Use ``--agentdiff-update-baselines``
to record the current traces as the new baselines.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from agentdiff.engine.comparator import compare
from agentdiff.loader import load_trace, parse_trace_data

_SANITIZE = re.compile(r"[^0-9A-Za-z._-]+")


def pytest_addoption(parser):
    group = parser.getgroup("agentdiff")
    group.addoption(
        "--agentdiff",
        action="store_true",
        default=False,
        help="Enable AgentDiff trajectory regression checks.",
    )
    group.addoption(
        "--agentdiff-baselines",
        default="baselines",
        help="Directory of committed baseline trace JSONs (default: baselines).",
    )
    group.addoption(
        "--agentdiff-max-divergence",
        type=float,
        default=0.3,
        help="Max Trajectory Divergence Index before regression.",
    )
    group.addoption(
        "--agentdiff-max-loops",
        type=int,
        default=0,
        help="Max loop count before regression.",
    )
    group.addoption(
        "--agentdiff-max-cost-delta",
        type=float,
        default=10.0,
        help="Max cost increase percentage before regression.",
    )
    group.addoption(
        "--agentdiff-update-baselines",
        action="store_true",
        default=False,
        help="Record current traces as the new committed baselines.",
    )


def pytest_configure(config):
    config.agentdiff_enabled = bool(config.getoption("--agentdiff"))


def _baseline_path(baselines_dir: str, nodeid: str) -> Path:
    safe = _SANITIZE.sub("_", nodeid)
    return Path(baselines_dir) / f"{safe}.json"


class _Recorder:
    """Collects a single candidate trace for the active test."""

    def __init__(self, config, request):
        self._config = config
        self._request = request
        self.trace = None

    def record(self, trace):
        """Registers the current run's trace for comparison."""
        self.trace = trace
        return self.trace


@pytest.fixture
def agentdiff_trace(request):
    recorder = _Recorder(request.config, request)
    yield recorder

    if not getattr(request.config, "agentdiff_enabled", False):
        return

    if recorder.trace is None:
        return

    path = _baseline_path(
        request.config.getoption("--agentdiff-baselines"), request.node.nodeid
    )
    update = request.config.getoption("--agentdiff-update-baselines")

    if not path.exists():
        if not update:
            return  # no baseline yet; first run only establishes one via --update-baselines
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(_as_json(recorder.trace), encoding="utf-8")
        return

    baseline = load_trace(str(path))
    candidate = _as_trace(recorder.trace)
    report = compare(baseline, candidate, detect_loops=True)

    if update:
        path.write_text(_as_json(recorder.trace), encoding="utf-8")
        return

    has_regression = (
        report.trajectory_divergence_index
        > request.config.getoption("--agentdiff-max-divergence")
        or len(report.loops_detected)
        > request.config.getoption("--agentdiff-max-loops")
        or report.cost_delta_percentage
        > request.config.getoption("--agentdiff-max-cost-delta")
    )
    if has_regression:
        pytest.fail(
            f"AgentDiff regression in {request.node.nodeid}:\n"
            f"TDI={report.trajectory_divergence_index:.4f}, "
            f"loops={len(report.loops_detected)}, "
            f"cost={report.cost_delta_percentage:+.2f}%. "
            f"See --agentdiff-update-baselines to advance the baseline."
        )


def _as_trace(trace):
    if hasattr(trace, "model_dump_json"):
        return trace
    return parse_trace_data(trace)


def _as_json(trace):
    if hasattr(trace, "model_dump_json"):
        return trace.model_dump_json()
    return json.dumps(trace)
