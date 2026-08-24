"""Gate governance — detect when the gate itself changed (G6/G7).

Goodhart guard: a threshold tuned until CI goes green stops being a control.
These helpers make threshold changes visible *next to the diff they let
through*, so loosening the gate is as reviewable as the code it guards.
"""

from __future__ import annotations

from dataclasses import dataclass

from agentdiff.config import AgentDiffConfig

# The gate knobs that decide pass/fail in the CLI diff path, in display order.
_GATED_KEYS: tuple[str, ...] = (
    "max_divergence",
    "max_loops",
    "max_cost_delta",
    "max_recovery_ratio",
)

# Defaults used when neither config nor flag provides a value (mirrors cli.py).
_EFFECTIVE_DEFAULTS: dict[str, float | int | None] = {
    "max_divergence": 0.3,
    "max_loops": 0,
    "max_cost_delta": 10.0,
    "max_recovery_ratio": None,
}


@dataclass(frozen=True)
class ThresholdChange:
    """One gate knob that differs between the baseline config and this run."""

    gate: str
    old: float | int | None
    new: float | int | None

    def render(self) -> str:
        return f"{self.gate}: `{self.old}` → `{self.new}`"


def effective_gates(cfg: AgentDiffConfig) -> dict[str, float | int | None]:
    """Resolves the effective gate values from a config (config or defaults)."""
    resolved: dict[str, float | int | None] = {}
    for key in _GATED_KEYS:
        value = getattr(cfg.cli, key, None)
        if value is None:
            value = _EFFECTIVE_DEFAULTS[key]
        resolved[key] = value
    return resolved


def diff_gate_thresholds(
    baseline_cfg: AgentDiffConfig, candidate_cfg: AgentDiffConfig
) -> list[ThresholdChange]:
    """Returns gate knobs that differ between two configs, display-ordered."""
    old_gates = effective_gates(baseline_cfg)
    new_gates = effective_gates(candidate_cfg)
    return [
        ThresholdChange(gate=key, old=old_gates[key], new=new_gates[key])
        for key in _GATED_KEYS
        if old_gates[key] != new_gates[key]
    ]


def provenance_line(cfg: AgentDiffConfig, config_path: str | None) -> str:
    """G7 — one-line, self-describing gate summary for any report.

    Names the active thresholds and where they came from, so every diff
    answers "what rules judged me?" without opening the config.
    """
    gates = effective_gates(cfg)
    source = (
        f"agentdiff.toml ({config_path})"
        if config_path
        else "defaults (no agentdiff.toml found)"
    )
    parts = [
        f"max_divergence={gates['max_divergence']}",
        f"max_loops={gates['max_loops']}",
        f"max_cost_delta={gates['max_cost_delta']}%",
    ]
    if gates["max_recovery_ratio"] is not None:
        parts.append(f"max_recovery_ratio={gates['max_recovery_ratio']}")
    return f"Gate: {', '.join(parts)} — source: {source}"
