# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "agent-trajectory-diff",
#     "openai",
# ]
# ///
"""
Cookbook: Integrating OpenAI SDK and AgentDiff using the Generic JSON Format

This script demonstrates a real, live end-to-end integration:
1. It initializes the OpenAI SDK.
2. It registers a Python function as a tool.
3. It makes actual tool-calling requests to the OpenAI API (gpt-4o-mini).
4. It executes a multi-turn tool loop agent dynamically.
5. In Run 2 (Candidate), we instruct the model to perform redundant lookups, causing
   a live trajectory regression that is caught and blocked by AgentDiff.

To run this script, make sure you have your OpenAI API key set:
export OPENAI_API_KEY="your-api-key"
"""

import json
import os
import sys

from openai import OpenAI

from agentdiff import compare, load_trace
from agentdiff.testing import assert_no_regressions

# Ensure API key is set
if not os.environ.get("OPENAI_API_KEY"):
    print(
        "[Error] Please set the OPENAI_API_KEY environment variable to run this cookbook."
    )
    sys.exit(1)

client = OpenAI()


# Define a real tool function that the model can call
def get_user_database_stats(state: str) -> str:
    """Gets the count of active users and revenue stats for a given US state."""
    print(f"    [Tool Execution] get_user_database_stats for state={state}")
    db = {
        "NY": {"users": 1250, "revenue": 45000},
        "CA": {"users": 3400, "revenue": 128000},
        "TX": {"users": 2100, "revenue": 72000},
    }
    stats = db.get(state.upper(), {"users": 0, "revenue": 0})
    return f"Active Users: {stats['users']}, Total Revenue: ${stats['revenue']}"


class AgentTracer:
    def __init__(self, task_input_query: str):
        self.task_input_query = task_input_query
        self.steps = []

    def log_step(
        self,
        name,
        step_type,
        input_val,
        output_val,
        prompt_tokens=0,
        completion_tokens=0,
        cost=0.0,
    ):
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
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": prompt_tokens + completion_tokens,
                    "estimated_cost_usd": cost,
                },
            }
        )

    def save(self, filepath):
        trace_data = {
            "trace_id": filepath.split(".")[0],
            "agent_name": "openai_support_agent",
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
        with open(filepath, "w") as f:
            json.dump(trace_data, f, indent=2)


def run_agent_loop(prompt: str, tracer: AgentTracer):
    """
    A live multi-turn agent execution loop. It calls OpenAI chat completion, parses
    suggested function tool calls, runs them locally, and repeats until the final
    answer is synthesized.
    """
    messages = [{"role": "user", "content": prompt}]

    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_user_database_stats",
                "description": "Gets the count of active users and revenue stats for a given US state.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "state": {
                            "type": "string",
                            "description": "The 2-letter state code.",
                        }
                    },
                    "required": ["state"],
                },
            },
        }
    ]

    for turn in range(5):  # Safety breaker
        response = client.chat.completions.create(
            model="gpt-4o-mini", messages=messages, tools=tools, temperature=0.0
        )

        message = response.choices[0].message
        usage = response.usage
        prompt_tokens = usage.prompt_tokens
        completion_tokens = usage.completion_tokens
        cost = (prompt_tokens * 0.00000015) + (completion_tokens * 0.00000060)

        if message.tool_calls:
            step_name = "openai_tool_decision"
            step_type = "routing"
            output_val = (
                f"Suggested function call: {message.tool_calls[0].function.name}"
            )
        else:
            step_name = "openai_synthesis"
            step_type = "llm_call"
            output_val = message.content

        tracer.log_step(
            name=step_name,
            step_type=step_type,
            input_val=str(messages[-1]["content"]),
            output_val=output_val,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost=cost,
        )

        messages.append(message)

        if not message.tool_calls:
            # Final text answer reached, complete loop
            print(f"    [Agent Completed] Output: {message.content}")
            break

        # Execute tool calls
        for tool_call in message.tool_calls:
            if tool_call.function.name == "get_user_database_stats":
                args = json.loads(tool_call.function.arguments)
                tool_result = get_user_database_stats(state=args.get("state", "NY"))

                # Log tool execution step
                tracer.log_step(
                    name="get_user_database_stats",
                    step_type="tool_call",
                    input_val=f"state={args.get('state')}",
                    output_val=tool_result,
                    prompt_tokens=0,
                    completion_tokens=0,
                    cost=0.0,
                )

                # Feed tool result back to the model history
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": tool_call.function.name,
                        "content": tool_result,
                    }
                )


# --- RUN 1: BASELINE (Efficient Path) ---
print("[-] Executing Baseline Run (Querying OpenAI live)...")
prompt_1 = "Retrieve the database count of active users for state NY."
baseline_tracer = AgentTracer(task_input_query=prompt_1)
run_agent_loop(prompt_1, baseline_tracer)
baseline_tracer.save("openai_baseline.json")

# --- RUN 2: CANDIDATE (Query with Forced Redundant Lookup) ---
# We use a prompt instructing the agent to run the lookup tool twice.
# This results in actual, live tool calls executing multiple times over the API.
print(
    "\n[-] Executing Candidate Run (Querying OpenAI live with instruction to double check)..."
)
prompt_2 = "Query the database user stats for state NY. Please call the get_user_database_stats function twice to ensure the statistics are consistent before summarizing."
candidate_tracer = AgentTracer(task_input_query=prompt_2)
run_agent_loop(prompt_2, candidate_tracer)
candidate_tracer.save("openai_candidate.json")

# --- RUN COMPARISON ---
print("\n[-] Evaluating Trajectories in AgentDiff...")
baseline_trace = load_trace("openai_baseline.json", adapter_name="generic")
candidate_trace = load_trace("openai_candidate.json", adapter_name="generic")

report = compare(baseline_trace, candidate_trace)

print(
    f"    - Trajectory Divergence Index (TDI): {report.trajectory_divergence_index:.3f}"
)
print(f"    - Candidate WEI:                    {report.candidate_wei:.3f}")
print(f"    - Loops Detected:                   {len(report.loops_detected)}")
print(
    f"    - Baseline Cost:                    ${baseline_trace.total_tokens.estimated_cost_usd:.6f} ({baseline_trace.total_tokens.total_tokens} tokens)"
)
print(
    f"    - Candidate Cost:                   ${candidate_trace.total_tokens.estimated_cost_usd:.6f} ({candidate_trace.total_tokens.total_tokens} tokens)"
)
print(f"    - Cost Delta:                       {report.cost_delta_percentage:+.1f}%")

try:
    print("\n[-] Checking regression gates...")
    assert_no_regressions(report, max_divergence=0.15, allow_loops=False)
except AssertionError as e:
    print("\n❌ CI/CD GATE BLOCKED:")
    print(e)

# Clean up files
os.remove("openai_baseline.json")
os.remove("openai_candidate.json")
