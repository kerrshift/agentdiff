from typing import Any

import networkx as nx

from agentdiff.models.report import StepDiff, StepDiffStatus
from agentdiff.models.step import TraceStep
from agentdiff.models.trace import AgentTrace


def step_signature(step: TraceStep) -> tuple:
    """Computes a unique equivalence signature for a TraceStep.
    Signature(N) = (step_type, name, tuple(sorted(input_payload.keys())))
    """
    keys = tuple(sorted(step.input_payload.keys())) if step.input_payload else ()
    return (step.step_type, step.name, keys)


def dict_diff(dict_a: dict[str, Any], dict_b: dict[str, Any]) -> dict[str, Any] | None:
    """Calculates the difference between two dictionaries."""
    diff = {}
    all_keys = set(dict_a.keys()).union(dict_b.keys())

    for k in all_keys:
        if k not in dict_a:
            diff[k] = {"status": "added", "new_value": dict_b[k]}
        elif k not in dict_b:
            diff[k] = {"status": "removed", "old_value": dict_a[k]}
        elif dict_a[k] != dict_b[k]:
            diff[k] = {
                "status": "changed",
                "old_value": dict_a[k],
                "new_value": dict_b[k],
            }

    return diff if diff else None


def _validate_unique_step_ids(trace: AgentTrace, label: str) -> None:
    """Raises if the trace contains duplicate step_ids.

    Duplicate ids silently corrupt the dependency graph and the alignment,
    so we fail loudly rather than produce a misleading diff.
    """
    seen: set[str] = set()
    for step in trace.steps:
        if step.step_id in seen:
            raise ValueError(
                f"Duplicate step_id '{step.step_id}' in {label} trace; "
                "step ids must be unique"
            )
        seen.add(step.step_id)


def align_traces(
    baseline: AgentTrace, candidate: AgentTrace, strict_tool_signatures: bool = False
) -> list[StepDiff]:
    """Aligns two AgentTrace runs using modified topological LCS alignment."""
    _validate_unique_step_ids(baseline, "baseline")
    _validate_unique_step_ids(candidate, "candidate")

    # Convert to networkx to get topological ordering
    g_a = baseline.to_networkx()
    g_b = candidate.to_networkx()

    # Get topological sort of baseline
    try:
        topo_a = list(nx.topological_sort(g_a))
        seq_a = [g_a.nodes[node_id]["step"] for node_id in topo_a]
    except nx.NetworkXUnfeasible:
        # Fall back to step_index sorting if cycles are present
        seq_a = sorted(baseline.steps, key=lambda s: s.step_index)

    # Get topological sort of candidate
    try:
        topo_b = list(nx.topological_sort(g_b))
        seq_b = [g_b.nodes[node_id]["step"] for node_id in topo_b]
    except nx.NetworkXUnfeasible:
        # Fall back to step_index sorting
        seq_b = sorted(candidate.steps, key=lambda s: s.step_index)

    m, n = len(seq_a), len(seq_b)

    # DP table for LCS length
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    def is_equivalent(sa: TraceStep, sb: TraceStep) -> bool:
        if strict_tool_signatures:
            return (
                step_signature(sa) == step_signature(sb)
                and sa.input_payload == sb.input_payload
            )
        return step_signature(sa) == step_signature(sb)

    # Compute DP table
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if is_equivalent(seq_a[i - 1], seq_b[j - 1]):
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

    # Backtrack alignment
    step_diffs = []
    i, j = m, n

    while i > 0 or j > 0:
        if i > 0 and j > 0 and is_equivalent(seq_a[i - 1], seq_b[j - 1]):
            sa = seq_a[i - 1]
            sb = seq_b[j - 1]

            arg_diff = dict_diff(sa.input_payload or {}, sb.input_payload or {})
            out_diff = dict_diff(sa.output_payload or {}, sb.output_payload or {})

            has_diff = (
                arg_diff is not None
                or out_diff is not None
                or sa.status != sb.status
                or sa.error_message != sb.error_message
            )

            diff_status = (
                StepDiffStatus.MODIFIED if has_diff else StepDiffStatus.MATCHED
            )

            step_diffs.append(
                StepDiff(
                    step_name=sa.name,
                    diff_status=diff_status,
                    baseline_step=sa,
                    candidate_step=sb,
                    argument_diff=arg_diff,
                    output_diff=out_diff,
                )
            )
            i -= 1
            j -= 1
        elif j > 0 and (i == 0 or dp[i][j - 1] >= dp[i - 1][j]):
            sb = seq_b[j - 1]
            step_diffs.append(
                StepDiff(
                    step_name=sb.name,
                    diff_status=StepDiffStatus.ADDED,
                    baseline_step=None,
                    candidate_step=sb,
                    argument_diff=None,
                    output_diff=None,
                )
            )
            j -= 1
        else:
            sa = seq_a[i - 1]
            step_diffs.append(
                StepDiff(
                    step_name=sa.name,
                    diff_status=StepDiffStatus.REMOVED,
                    baseline_step=sa,
                    candidate_step=None,
                    argument_diff=None,
                    output_diff=None,
                )
            )
            i -= 1

    step_diffs.reverse()
    return step_diffs


def _independent(graph: nx.DiGraph, u: str, v: str) -> bool:
    """True when there is no data-dependency path between u and v either way."""
    if u == v:
        return False
    if not graph.has_node(u) or not graph.has_node(v):
        return True
    return not (nx.has_path(graph, u, v) or nx.has_path(graph, v, u))


def mark_commutative_swaps(
    step_diffs: list[StepDiff], baseline: AgentTrace, candidate: AgentTrace
) -> list[StepDiff]:
    """Topological equivalence pass (Pillar 1): zero penalty for harmless reorders.

    When a step was recorded REMOVED from the baseline and an equally
    signed step ADDED to the candidate, the step may have merely moved. If
    every step matched *between* the two positions is data-independent of it
    in both traces (no parent-graph path in either direction), executing
    ``[A -> B]`` or ``[B -> A]`` is equivalent — the pair is reclassified as
    a single ``MATCHED_COMMUTATIVE`` diff with zero divergence penalty.

    Steps that DO have a dependency path are left untouched: a genuine
    reordering of dependent work is a semantic change, not a swap.
    """
    g_base = baseline.to_networkx()
    g_cand = candidate.to_networkx()

    removed_by_sig: dict[tuple, list[int]] = {}
    added_by_sig: dict[tuple, list[int]] = {}
    for idx, sd in enumerate(step_diffs):
        if sd.diff_status == StepDiffStatus.REMOVED and sd.baseline_step:
            removed_by_sig.setdefault(step_signature(sd.baseline_step), []).append(idx)
        elif sd.diff_status == StepDiffStatus.ADDED and sd.candidate_step:
            added_by_sig.setdefault(step_signature(sd.candidate_step), []).append(idx)

    merge: dict[int, int] = {}  # added index -> removed index it replaces
    drop: set[int] = set()
    for sig, added_indexes in added_by_sig.items():
        removed_indexes = removed_by_sig.get(sig, [])
        for a_idx, r_idx in zip(added_indexes, removed_indexes):
            added = step_diffs[a_idx].candidate_step
            removed = step_diffs[r_idx].baseline_step
            if added is None or removed is None:
                continue
            # A swap is *the same work in a different order*: identical inputs
            # and outcome. Changed arguments or a changed outcome is a real
            # modification, not a reorder — leave it for the diff to show.
            if (
                added.input_payload != removed.input_payload
                or added.status != removed.status
                or added.error_message != removed.error_message
            ):
                continue
            lo, hi = min(a_idx, r_idx), max(a_idx, r_idx)
            between = [
                sd
                for sd in step_diffs[lo + 1 : hi]
                if sd.diff_status in (StepDiffStatus.MATCHED, StepDiffStatus.MODIFIED)
            ]
            if not between:
                continue  # nothing between: same position, not a reorder
            independent = all(
                _independent(g_base, removed.step_id, m.baseline_step.step_id)
                and _independent(g_cand, added.step_id, m.candidate_step.step_id)
                for m in between
                if m.baseline_step and m.candidate_step
            )
            if independent:
                merge[a_idx] = r_idx
                drop.add(r_idx)

    if not merge:
        return step_diffs

    result: list[StepDiff] = []
    for idx, sd in enumerate(step_diffs):
        if idx in drop:
            continue
        if idx in merge:
            removed = step_diffs[merge[idx]].baseline_step
            result.append(
                StepDiff(
                    step_name=sd.step_name,
                    diff_status=StepDiffStatus.MATCHED_COMMUTATIVE,
                    baseline_step=removed,
                    candidate_step=sd.candidate_step,
                )
            )
            continue
        result.append(sd)
    return result
