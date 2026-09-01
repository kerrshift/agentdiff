"""Gate governance — detect when the gate itself changed (G6/G7).

Goodhart guard: a threshold tuned until CI goes green stops being a control.
These helpers make threshold changes visible *next to the diff they let
through*, so loosening the gate is as reviewable as the code it guards.
"""

from __future__ import annotations

from dataclasses import dataclass

from agentdiff.config import AgentDiffConfig, ScenarioConfig
from agentdiff.models.envelope import BaselineEnvelope

# The gate knobs that decide pass/fail in the CLI diff path, in display order.
_GATED_KEYS: tuple[str, ...] = (
    "max_divergence",
    "max_loops",
    "max_cost_delta",
    "max_recovery_ratio",
)

# Hard-invariant knobs (Pillar 2) — also Goodhart-guarded and self-described.
_INVARIANT_KEYS: tuple[str, ...] = (
    "fail_on_identical_loops",
    "max_tool_repeats",
)

# Defaults used when neither config nor flag provides a value (mirrors cli.py).
_EFFECTIVE_DEFAULTS: dict[str, float | int | bool | None] = {
    "max_divergence": 0.3,
    "max_loops": 0,
    "max_cost_delta": 10.0,
    "max_recovery_ratio": None,
    "fail_on_identical_loops": True,
    "max_tool_repeats": None,
}


@dataclass(frozen=True)
class ThresholdChange:
    """One gate knob that differs between the baseline config and this run."""

    gate: str
    old: float | int | bool | None
    new: float | int | bool | None

    def render(self) -> str:
        return f"{self.gate}: `{self.old}` → `{self.new}`"


def effective_gates(cfg: AgentDiffConfig) -> dict[str, float | int | bool | None]:
    """Resolves the effective gate values from a config (config or defaults)."""
    resolved: dict[str, float | int | bool | None] = {}
    for key in _GATED_KEYS:
        value = getattr(cfg.cli, key, None)
        if value is None:
            value = _EFFECTIVE_DEFAULTS[key]
        resolved[key] = value
    for key in _INVARIANT_KEYS:
        value = getattr(cfg.invariants, key, None)
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
    keys = (*_GATED_KEYS, *_INVARIANT_KEYS)
    return [
        ThresholdChange(gate=key, old=old_gates[key], new=new_gates[key])
        for key in keys
        if old_gates[key] != new_gates[key]
    ]


def provenance_line(
    cfg: AgentDiffConfig,
    config_path: str | None,
    *,
    scenario_cfg: ScenarioConfig | None = None,
    envelope: BaselineEnvelope | None = None,
) -> str:
    """G7 — one-line, self-describing gate summary for any report.

    Names the active thresholds and where they came from, so every diff
    answers "what rules judged me?" without opening the config.

    When a statistical envelope is being judged (mode ``statistical`` with
    N >= 2 runs), the line must describe the *actual* statistical gate —
    the scenario tolerances that ``compare_envelope`` applied — not the
    legacy single-run knobs.
    """
    statistical = (
        envelope is not None and envelope.mode == "statistical" and envelope.n_runs >= 2
    )
    source = (
        f"agentdiff.toml ({config_path})"
        if config_path
        else "defaults (no agentdiff.toml found)"
    )
    gates = effective_gates(cfg)
    invariant_parts = [
        f"fail_on_identical_loops={str(gates['fail_on_identical_loops']).lower()}"
    ]
    if gates["max_tool_repeats"] is not None:
        invariant_parts.append(f"max_tool_repeats={gates['max_tool_repeats']}")
    if statistical:
        tol = getattr(scenario_cfg, "tolerances", None)
        parts = [
            f"divergence_ceiling={tol.divergence_ceiling if tol else 0.35}",
            "max_cost_increase_pct="
            f"{scenario_cfg.max_cost_increase_pct if scenario_cfg else 20.0}%",
            f"step_count_std_dev={tol.step_count_std_dev if tol else 2.0}",
            *invariant_parts,
        ]
        prefix = (
            f"Gate [statistical envelope: {envelope.scenario}, N={envelope.n_runs}]"
        )
        return f"{prefix}: {', '.join(parts)} — source: {source}"

    parts = [
        f"max_divergence={gates['max_divergence']}",
        f"max_loops={gates['max_loops']}",
        f"max_cost_delta={gates['max_cost_delta']}%",
    ]
    if gates["max_recovery_ratio"] is not None:
        parts.append(f"max_recovery_ratio={gates['max_recovery_ratio']}")
    parts.extend(invariant_parts)
    return f"Gate: {', '.join(parts)} — source: {source}"
