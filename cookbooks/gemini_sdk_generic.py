# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "agent-trajectory-diff",
#     "google-genai",
# ]
# ///
"""
Cookbook: Integrating Gemini SDK and AgentDiff using the Generic JSON Format

This script demonstrates a real, live end-to-end integration:
1. It initializes the Google GenAI SDK.
2. It registers a Python function as a tool.
3. It makes actual tool-calling requests to the Gemini API (gemini-3.6-flash).
4. It executes a multi-turn tool loop agent dynamically.
5. In Run 2 (Candidate), we instruct the model to perform redundant lookups, causing
   a live trajectory regression that is caught and blocked by AgentDiff.

To run this script, make sure you have your Gemini API key set:
export GEMINI_API_KEY="your-api-key"
"""

import json
import os
import sys

from google import genai
from google.genai import types

from agentdiff import compare, load_trace
from agentdiff.testing import assert_no_regressions

# Ensure API key is set
if not os.environ.get("GEMINI_API_KEY"):
    print(
        "[Error] Please set the GEMINI_API_KEY environment variable to run this cookbook."
    )
    sys.exit(1)

# Initialize the Gemini SDK client
client = genai.Client()


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
        with open(filepath, "w") as f:
            json.dump(trace_data, f, indent=2)


def run_agent_loop(prompt: str, tracer: AgentTracer):
    """
    A live multi-turn agent execution loop. It calls Gemini, parses any predicted
    function calls, executes them locally, feeds the results back, and continues
    until Gemini synthesizes a final text answer.
    """
    contents = [types.Content(role="user", parts=[types.Part.from_text(text=prompt)])]

    # Track the chat turns in memory
    for turn in range(5):  # Avoid infinite loops
        response = client.models.generate_content(
            model="gemini-3.6-flash",
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

        # Log LLM generation step
        usage = response.usage_metadata
        prompt_tokens = usage.prompt_token_count
        completion_tokens = usage.candidates_token_count
        cost = (prompt_tokens + completion_tokens) * 0.000000075

        # Determine step type based on model action
        if response.function_calls:
            step_name = "gemini_tool_decision"
            step_type = "routing"
            output_val = f"Suggested function call: {response.function_calls[0].name}"
        else:
            step_name = "gemini_synthesis"
            step_type = "llm_call"
            output_val = response.text

        tracer.log_step(
            name=step_name,
            step_type=step_type,
            input_val=str(contents[-1]),
            output_val=output_val,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost=cost,
        )

        # Append assistant response to history
        contents.append(response.candidates[0].content)

        if not response.function_calls:
            # Model returned a text response (final answer); we are finished!
            print(f"    [Agent Completed] Output: {response.text}")
            break

        # Execute tool calls
        for function_call in response.function_calls:
            if function_call.name == "get_user_database_stats":
                args = function_call.args
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
                contents.append(
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_function_response(
                                name=function_call.name,
                                response={"result": tool_result},
                            )
                        ],
                    )
                )


# --- RUN 1: BASELINE (Efficient Path) ---
print("[-] Executing Baseline Run (Querying Gemini live)...")
prompt_1 = "Retrieve the database count of active users for state NY."
baseline_tracer = AgentTracer(task_input_query=prompt_1)
run_agent_loop(prompt_1, baseline_tracer)
baseline_tracer.save("gemini_baseline.json")

# --- RUN 2: CANDIDATE (Query with Forced Redundant Lookup) ---
# We use a prompt instructing the agent to run the lookup tool twice.
# This results in actual, live tool calls executing multiple times over the API.
print(
    "\n[-] Executing Candidate Run (Querying Gemini live with instruction to double check)..."
)
prompt_2 = "Query the database user stats for state NY. Please call the get_user_database_stats function twice to ensure the statistics are consistent before summarizing."
candidate_tracer = AgentTracer(task_input_query=prompt_2)
run_agent_loop(prompt_2, candidate_tracer)
candidate_tracer.save("gemini_candidate.json")

# --- RUN COMPARISON ---
print("\n[-] Evaluating Trajectories in AgentDiff...")
baseline_trace = load_trace("gemini_baseline.json", adapter_name="generic")
candidate_trace = load_trace("gemini_candidate.json", adapter_name="generic")

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
os.remove("gemini_baseline.json")
os.remove("gemini_candidate.json")
