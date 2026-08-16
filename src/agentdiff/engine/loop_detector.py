from typing import Any

import networkx as nx

from agentdiff.models.trace import AgentTrace


def detect_graph_cycles(trace: AgentTrace) -> list[list[str]]:
    """Detects cycles in the parent-id dependency graph of the trace."""
    graph = trace.to_networkx()
    try:
        cycles = list(nx.simple_cycles(graph))
        return cycles
    except Exception:
        return []


def detect_sequence_loops(trace: AgentTrace) -> list[dict[str, Any]]:
    """Detects consecutive repeating sub-sequences of steps (e.g., A -> B -> A -> B).

    A loop is defined as a sequence of step names of length k repeating consecutively
    2 or more times.
    """
    steps = sorted(trace.steps, key=lambda s: s.step_index)
    names = [s.name for s in steps]
    n = len(names)
    loops = []

    i = 0
    while i < n:
        found_loop = False
        # Try different pattern lengths up to half the remaining sequence length
        for k in range(1, (n - i) // 2 + 1):
            pattern = names[i : i + k]

            # Count consecutive repetitions of the pattern
            count = 1
            while i + (count + 1) * k <= n:
                next_segment = names[i + count * k : i + (count + 1) * k]
                if next_segment == pattern:
                    count += 1
                else:
                    break

            if count >= 2:
                # Loop detected!
                loop_step_ids = [s.step_id for s in steps[i : i + k]]

                # Check for stagnant state (whether input payloads or outputs are unchanged)
                # Let's compare first iteration payloads with subsequent ones
                stagnant = True
                for step_idx in range(k):
                    base_step = steps[i + step_idx]
                    for iter_idx in range(1, count):
                        compare_step = steps[i + iter_idx * k + step_idx]
                        if (
                            base_step.input_payload != compare_step.input_payload
                            or base_step.output_payload != compare_step.output_payload
                        ):
                            stagnant = False
                            break
                    if not stagnant:
                        break

                loops.append(
                    {
                        "steps": pattern,
                        "step_ids": loop_step_ids,
                        "iterations": count,
                        "start_index": i,
                        "length": k,
                        "stagnant": stagnant,
                    }
                )

                # Advance pointer past the repeated patterns
                i += count * k
                found_loop = True
                break

        if not found_loop:
            i += 1

    return loops


def detect_all_loops(trace: AgentTrace) -> list[dict[str, Any]]:
    """Runs all loop detection algorithms on the trace and returns detected loops."""
    loops = detect_sequence_loops(trace)

    # Add graph cycles if any
    cycles = detect_graph_cycles(trace)
    for cycle in cycles:
        loops.append(
            {
                "steps": [
                    trace.steps[idx].name
                    for idx in range(len(trace.steps))
                    if trace.steps[idx].step_id in cycle
                ],
                "step_ids": cycle,
                "iterations": 2,  # cycle implies a recurring path
                "start_index": -1,
                "length": len(cycle),
                "stagnant": True,
                "type": "graph_cycle",
            }
        )

    return loops
