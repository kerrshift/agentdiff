"""Config-as-code: load defaults from an ``agentdiff.toml`` file.

Config lets you commit your regression thresholds, adapter, and baseline path
next to your traces instead of repeating them as CLI flags. Values in the TOML
are *defaults* — any explicit CLI flag still wins.

Example ``agentdiff.toml``::

    [compare]
    detect_loops = true
    strict_tool_signatures = false

    [adapter]
    name = "auto"

    [cli]
    format = "terminal"
    baseline = "baselines/current.json"
    max_loops = 0
    max_divergence = 0.3
    max_cost_delta = 10.0
    max_recovery_ratio = 1.5

    [assertions]
    max_divergence = 0.25
    max_cost_increase_pct = 5.0
    allow_loops = false
    max_wasted_effort = 0.1
    max_recovery_step_ratio = 1.5

    [invariants]
    fail_on_identical_loops = true   # hard block: identical inputs + stagnant outputs
    max_tool_repeats = 5             # hard cap per endpoint; omit to disable

Configuration is discovered by looking for ``agentdiff.toml`` in the current
directory (or an explicit path). ``load_config`` returns an
:class:`AgentDiffConfig` populated with defaults, then overlaid with whatever
sections are present in the file.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

try:  # Python 3.11+
    import tomllib
except ImportError:  # pragma: no cover - Python 3.10
    import tomli as tomllib  # type: ignore[no-redef]

CONFIG_FILENAME = "agentdiff.toml"


def _filter_known(cls, data: dict[str, Any]) -> dict[str, Any]:
    """Drops keys that are not fields of ``cls`` (forward-compatible configs)."""
    known = {f for f in cls.__dataclass_fields__}  # type: ignore[attr-defined]
    return {k: v for k, v in data.items() if k in known}


@dataclass
class CompareConfig:
    detect_loops: bool = True
    strict_tool_signatures: bool = False


@dataclass
class AdapterConfig:
    name: str = "auto"


@dataclass
class CliConfig:
    format: str = "terminal"
    baseline: str | None = None
    max_loops: int = 0
    max_divergence: float = 0.3
    max_cost_delta: float = 10.0
    max_wasted_effort: float = 0.1
    max_recovery_ratio: float | None = None
    stale_baseline_days: int = 30


@dataclass
class AssertionsConfig:
    max_divergence: float = 0.25
    max_cost_increase_pct: float = 5.0
    allow_loops: bool = False
    max_wasted_effort: float = 0.1
    max_recovery_step_ratio: float | None = None


@dataclass
class InvariantsConfig:
    """Hard invariants (Pillar 2): violations always block, tolerances can't.

    ``fail_on_identical_loops``: same endpoint called >= 2 times with identical
    inputs and stagnant output state is a runaway loop — hard block.
    ``max_tool_repeats``: hard cap on calls to any single endpoint;
    ``None`` disables the cap.
    """

    fail_on_identical_loops: bool = True
    max_tool_repeats: int | None = None


@dataclass
class AgentDiffConfig:
    compare: CompareConfig = field(default_factory=CompareConfig)
    adapter: AdapterConfig = field(default_factory=AdapterConfig)
    cli: CliConfig = field(default_factory=CliConfig)
    assertions: AssertionsConfig = field(default_factory=AssertionsConfig)
    invariants: InvariantsConfig = field(default_factory=InvariantsConfig)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AgentDiffConfig:
        cfg = cls()
        if isinstance(data.get("compare"), dict):
            cfg.compare = CompareConfig(**_filter_known(CompareConfig, data["compare"]))
        if isinstance(data.get("adapter"), dict):
            cfg.adapter = AdapterConfig(**_filter_known(AdapterConfig, data["adapter"]))
        if isinstance(data.get("cli"), dict):
            cfg.cli = CliConfig(**_filter_known(CliConfig, data["cli"]))
        if isinstance(data.get("assertions"), dict):
            cfg.assertions = AssertionsConfig(
                **_filter_known(AssertionsConfig, data["assertions"])
            )
        if isinstance(data.get("invariants"), dict):
            cfg.invariants = InvariantsConfig(
                **_filter_known(InvariantsConfig, data["invariants"])
            )
        return cfg


def find_config_file(start: Path | None = None) -> Path | None:
    """Locates the nearest ``agentdiff.toml`` by walking up the directory tree."""
    current = (start or Path.cwd()).resolve()
    for directory in (current, *current.parents):
        candidate = directory / CONFIG_FILENAME
        if candidate.is_file():
            return candidate
    return None


def load_config(path: str | Path | None = None) -> AgentDiffConfig:
    """Loads config from an explicit path, or auto-discovers ``agentdiff.toml``.

    If no config file is found, returns a config populated with defaults only.
    """
    if path is not None:
        config_path = Path(path)
    else:
        found = find_config_file()
        if found is None:
            return AgentDiffConfig()
        config_path = found

    with open(config_path, "rb") as fh:
        raw = tomllib.load(fh)

    # Unknown keys are ignored so forward-compatible configs still load.
    return AgentDiffConfig.from_dict(raw)


def write_config(path: str | Path, cfg: AgentDiffConfig) -> None:
    """Serializes a config to JSON. (TOML writing not required for CI use.)"""
    Path(path).write_text(json.dumps(cfg.to_dict(), indent=2), encoding="utf-8")
