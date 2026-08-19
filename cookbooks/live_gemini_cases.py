# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "agent-trajectory-diff",
#     "google-genai",
# ]
# ///
"""Cookbook: Gemini (live) — regression, prompt-change, loop, and drift cases.

Runs a real ``gemini-3.6-flash`` tool-calling loop and exercises four distinct
AgentDiff scenarios against genuine live model output:

- **Case A** — same prompt twice: clean run, low divergence, gate passes.
- **Case B** — a different prompt: divergence rises, a loop is flagged.
- **Case C** — a forced redundant lookup: loop detected, gate blocked.
- **Case D** — ``decide_rotation``: baseline must not advance on a regression,
  but auto-rotates on a clean run.

Needs ``GEMINI_API_KEY`` set in the environment. Output is non-deterministic
(real model), so exact numbers vary run to run.

Run::

    export GEMINI_API_KEY="your-key"
    uv run cookbooks/live_gemini_cases.py
"""

import os
import sys

from google import genai
from google.genai import types

from agentdiff import compare, decide_rotation, parse_trace_data
from agentdiff.testing import assert_no_regressions

if not os.environ.get("GEMINI_API_KEY"):
    print("[Error] Please set the GEMINI_API_KEY environment variable.")
    sys.exit(1)

client = genai.Client()
MODEL = "gemini-3.6-flash"
COST_PER_TOKEN = 0.000000075


def get_user_database_stats(state: str) -> str:
    """Gets the count of active users and revenue stats for a given US state."""
    print(f"    [Tool] get_user_database_stats({state})")
    db = {
        "NY": {"users": 1250, "revenue": 45000},
        "CA": {"users": 3400, "revenue": 128000},
        "TX": {"users": 2100, "revenue": 72000},
    }
    s = db.get(state.upper(), {"users": 0, "revenue": 0})
    return f"Active Users: {s['users']}, Total Revenue: ${s['revenue']}"


class AgentTracer:
    def __init__(self, task_input_query: str):
        self.task_input_query = task_input_query
        self.steps = []

    def log_step(self, name, step_type, input_val, output_val, pt=0, ct=0, cost=0.0):
        self.steps.append(
            {
                "step_id": f"step-{len(self.steps) + 1}",
                "step_index": len(self.steps) + 1,
                "step_type": step_type,
                "name": name,
                "input_payload": {"query": str(input_val)},
                "output_payload": {"result": str(output_val)},
                "status": "success",
                "tokens": {
                    "prompt_tokens": pt,
                    "completion_tokens": ct,
                    "total_tokens": pt + ct,
                    "estimated_cost_usd": cost,
                },
            }
        )

    def trace(self, trace_id):
        return {
            "trace_id": trace_id,
            "agent_name": "gemini_support_agent",
            "task_input": {"query": self.task_input_query},
            "steps": self.steps,
            "total_tokens": {
                "prompt_tokens": sum(s["tokens"]["prompt_tokens"] for s in self.steps),
                "completion_tokens": sum(
                    s["tokens"]["completion_tokens"] for s in self.steps
                ),
                "total_tokens": sum(s["tokens"]["total_tokens"] for s in self.steps),
                "estimated_cost_usd": sum(
                    s["tokens"]["estimated_cost_usd"] for s in self.steps
                ),
            },
        }


def run_agent(prompt: str, trace_id: str) -> dict:
    """Live multi-turn Gemini tool loop; returns a generic-format trace dict."""
    tracer = AgentTracer(task_input_query=prompt)
    contents = [types.Content(role="user", parts=[types.Part.from_text(text=prompt)])]
    for turn in range(5):
        resp = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                tools=[get_user_database_stats],
                tool_config=types.ToolConfig(
                    function_calling_config=types.FunctionCallingConfig(mode="AUTO")
                ),
                automatic_function_calling=types.AutomaticFunctionCallingConfig(
                    disable=True
                ),
                temperature=0.0,
            ),
        )
        usage = resp.usage_metadata
        pt = usage.prompt_token_count
        ct = usage.candidates_token_count
        cost = (pt + ct) * COST_PER_TOKEN
        if resp.function_calls:
            tracer.log_step(
                "gemini_tool_decision",
                "routing",
                str(contents[-1]),
                f"Suggested function call: {resp.function_calls[0].name}",
                pt,
                ct,
                cost,
            )
        else:
            tracer.log_step(
                "gemini_synthesis",
                "llm_call",
                str(contents[-1]),
                resp.text,
                pt,
                ct,
                cost,
            )
        contents.append(resp.candidates[0].content)
        if not resp.function_calls:
            print(f"    [Agent Completed] {resp.text[:60]}")
            break
        for fc in resp.function_calls:
            args = fc.args
            result = get_user_database_stats(state=args.get("state", "NY"))
            tracer.log_step(
                "get_user_database_stats",
                "tool_call",
                f"state={args.get('state')}",
                result,
                0,
                0,
                0.0,
            )
            contents.append(
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_function_response(
                            name=fc.name, response={"result": result}
                        )
                    ],
                )
            )
    return tracer.trace(trace_id)


def show(report, base, cand):
    print(f"    TDI      = {report.trajectory_divergence_index:.3f}")
    print(f"    WEI      = {report.candidate_wei:.3f}")
    print(f"    Loops    = {len(report.loops_detected)}")
    print(
        f"    Cost Δ   = {report.cost_delta_percentage:+.2f}%  ({base.total_tokens.estimated_cost_usd:.5f}$ -> {cand.total_tokens.estimated_cost_usd:.5f}$)"
    )
    print(f"    Tokens Δ = {report.token_delta_percentage:+.1f}%")
    print(f"    baseline : {[f'{s.name}/{s.step_type.value}' for s in base.steps]}")
    print(f"    candidate: {[f'{s.name}/{s.step_type.value}' for s in cand.steps]}")


def main():
    print("===== LIVE GEMINI EXPERIMENTS (real API) =====\n")

    print("[-] RUN 1 (baseline): efficient prompt")
    base = run_agent(
        "Retrieve the database count of active users for state NY.", "base"
    )
    base_t = parse_trace_data(base, "generic")
    print()

    print("[-] CASE A: candidate = same prompt (clean)")
    cand_a = parse_trace_data(
        run_agent(
            "Retrieve the database count of active users for state NY.", "cand_a"
        ),
        "generic",
    )
    r_a = compare(base_t, cand_a)
    print("    Result: clean trajectory (expect low TDI, gate passes)")
    show(r_a, base_t, cand_a)
    try:
        assert_no_regressions(
            r_a, max_divergence=0.15, allow_loops=True, max_cost_increase_pct=100.0
        )
        print("    Gate: PASSED")
    except AssertionError:
        print("    Gate: BLOCKED")
    print()

    print("[-] CASE B: candidate = different prompt (prompt-change regression)")
    cand_b = parse_trace_data(
        run_agent(
            "Report active users for NY, CA and TX and show a per-state breakdown.",
            "cand_b",
        ),
        "generic",
    )
    r_b = compare(base_t, cand_b)
    print("    Result: prompt change (expect divergence / added steps)")
    show(r_b, base_t, cand_b)
    print()

    print("[-] CASE C: candidate = forced redundant lookup (loop regression)")
    cand_c = parse_trace_data(
        run_agent(
            "Query user stats for NY. Call get_user_database_stats twice to confirm the numbers are consistent.",
            "cand_c",
        ),
        "generic",
    )
    r_c = compare(base_t, cand_c)
    print("    Result: loop (expect loops detected, gate blocked)")
    show(r_c, base_t, cand_c)
    try:
        assert_no_regressions(r_c, max_divergence=0.15, allow_loops=False)
        print("    Gate: PASSED")
    except AssertionError as e:
        print("    Gate: BLOCKED ->", str(e).splitlines()[0])
    print()

    print("[-] CASE D: baseline rotation / drift decisions")
    # decide_rotation keys off `report.passed`, set by assert_no_regressions
    # (r_a passed -> passed=True; r_c was blocked -> passed=False).
    for policy in ("manual", "auto", "staged"):
        d = decide_rotation(r_c, policy=policy, max_drift=0.05, explicit_update=False)
        print(
            f"    policy={policy:7s} on regressed run -> rotate={d.rotate}, reason={d.reason}"
        )
    for policy in ("manual", "auto", "staged"):
        d = decide_rotation(r_a, policy=policy, max_drift=0.05, explicit_update=False)
        print(
            f"    policy={policy:7s} on clean run     -> rotate={d.rotate}, reason={d.reason}"
        )
    print()
    print("===== DONE =====")


if __name__ == "__main__":
    main()
