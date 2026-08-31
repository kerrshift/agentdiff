"""Baseline envelope: N >= 2 recorded runs capturing normal agent variance.

A *statistical baseline* (Pillar 1 of 0.5.0) replaces the single static
``baseline.json`` with an envelope over N runs. A candidate run passes when
*some* recorded run explains it (min-TDI-of-N) and its resource profile sits
within the envelope's variance bands (mean ± k·sigma).

The envelope is an additive artifact — it *wraps* AgentTraces and never
alters them (decision D2): ``schema/agent_trace.schema.json`` stays at 1.0.0;
the envelope starts at schema_version 2.0.0.
"""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, Field

from agentdiff.models.trace import AgentTrace

ENVELOPE_KIND = "agentdiff_baseline_envelope"
ENVELOPE_SCHEMA_VERSION = "2.0.0"


class StatBand(BaseModel):
    """Mean and standard deviation of one metric across the recorded runs."""

    mean: float = 0.0
    std_dev: float = 0.0

    def ceiling(self, k: float = 2.0) -> float:
        """Upper variance bound: mean + k·sigma."""
        return self.mean + k * self.std_dev


def _band(values: list[float]) -> StatBand:
    n = len(values)
    mean = sum(values) / n
    if n < 2:
        return StatBand(mean=mean, std_dev=0.0)
    variance = sum((v - mean) ** 2 for v in values) / (n - 1)
    return StatBand(mean=mean, std_dev=variance**0.5)


def compute_bands(runs: list[AgentTrace]) -> dict[str, StatBand]:
    """Computes variance bands for step count, resources, and per-tool counts.

    Per-tool bands are keyed ``tool:<name>`` so the ``max_tool_repeats``
    invariant can be evaluated against normal per-run variance instead of a
    flat cap when a scenario prefers it.
    """
    if not runs:
        return {}

    names: set[str] = set()
    for run in runs:
        for step in run.steps:
            names.add(step.name)

    bands: dict[str, StatBand] = {
        "step_count": _band([float(len(r.steps)) for r in runs]),
        "total_tokens": _band([float(r.total_tokens.total_tokens) for r in runs]),
        "estimated_cost_usd": _band([r.total_tokens.estimated_cost_usd for r in runs]),
        "latency_ms": _band([float(r.total_latency_ms) for r in runs]),
    }
    for name in sorted(names):
        bands[f"tool:{name}"] = _band(
            [float(sum(1 for s in r.steps if s.name == name)) for r in runs]
        )
    return bands


class BaselineEnvelope(BaseModel):
    """Versioned container for N recorded runs + cached variance bands."""

    schema_version: str = Field(default=ENVELOPE_SCHEMA_VERSION)
    kind: str = Field(default=ENVELOPE_KIND)
    scenario: str = Field(
        default="default", description="Scenario name from agentdiff.toml."
    )
    mode: str = Field(
        default="statistical", description="statistical or strict comparison."
    )
    recorded_at: str | None = Field(
        default=None, description="ISO-8601 UTC timestamp of the last rotation."
    )
    generator_version: str | None = None
    runs: list[AgentTrace] = Field(default_factory=list)
    envelope: dict[str, StatBand] = Field(default_factory=dict)

    @property
    def n_runs(self) -> int:
        return len(self.runs)

    @classmethod
    def from_runs(
        cls,
        runs: list[AgentTrace],
        scenario: str = "default",
        mode: str = "statistical",
        generator_version: str | None = None,
    ) -> BaselineEnvelope:
        """Builds an envelope from runs and computes its variance bands."""
        return cls(
            scenario=scenario,
            mode=mode,
            recorded_at=datetime.now(timezone.utc).isoformat(),
            generator_version=generator_version,
            runs=runs,
            envelope=compute_bands(runs),
        )

    def refresh(self) -> None:
        """Recomputes bands from runs (authoritative) and stamps rotation."""
        self.envelope = compute_bands(self.runs)
        self.recorded_at = datetime.now(timezone.utc).isoformat()
