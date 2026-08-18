# Testing Scenarios with AgentDiff

This guide explains how to use **AgentDiff** to test and isolate regressions across different dimensions of agent engineering.

---

## 1. Prompt vs. Prompt Changes
Changing the system instructions or user prompts is the most common cause of unexpected agent behavior.

### The Scenario
* **Prompt 1 (Optimal Prompt)**: Uses concise guidelines. The agent completes the task in 1 step.
* **Prompt 2 (Refactored Prompt)**: Overly cautious instructions (e.g., *"Make sure to double check database queries to verify stability"*). This causes the agent to make redundant tool calls.

### How to Test It
You can run this scenario directly in the **Gemini** (`gemini_sdk_generic.py`) or **OpenAI** (`openai_sdk_generic.py`) cookbooks. The script runs these two prompts live and compares the results:

* **Baseline query**: `"Retrieve the database count of active users for state NY."`
* **Candidate query**: `"Query the database user stats for state NY. Please call the get_user_database_stats function twice to ensure the statistics are consistent before summarizing."`

**AgentDiff Output:**
```
Loops Detected:                   1
Cost Delta:                       +84.5%
```
*Verdict: Regression caught. The loop buster checks and cost delta thresholds block the deployment of the new prompt.*

---

## 2. Model vs. Model Upgrades (or Downgrades)
Changing the underlying foundation model (e.g., upgrading from `gpt-3.5-turbo` to `gpt-4o-mini`, or switching from OpenAI to Gemini) changes planning capabilities and tool-calling consistency.

### The Scenario
* **Baseline Run**: Using a highly capable model (`gemini-3.6-flash` or `gpt-4o-mini`). It plans efficiently and matches tools on the first try.
* **Candidate Run**: Downgrading to a smaller/older model (or a cheaper open-source model). The model gets confused by tool signatures, makes incorrect arguments, hits exception errors, and retries.

### How to Test It
Modify the model parameter inside the runner loop:

```python
# Baseline using the Capable Model
response_baseline = client.chat.completions.create(
    model="gpt-4o-mini",  # Highly capable planner
    messages=messages,
    tools=tools,
)

# Candidate using the Cheaper Model
response_candidate = client.chat.completions.create(
    model="gpt-3.5-turbo",  # Less capable at tool parameter matching
    messages=messages,
    tools=tools,
)
```

**AgentDiff Output:**
* **WEI (Wasted Effort Index)**: The candidate run shows a WEI > 0.00 because of retries and tool exceptions.
* **TDI (Trajectory Divergence Index)**: High TDI due to error recovery nodes and modified execution paths.

---

## 3. Tool Additions or Deletions (System Architecture Changes)
When you add new capabilities to your agent (e.g., adding a `web_search` tool to support a `database_query` agent), you want to ensure the agent only uses the new tool when necessary.

### The Scenario
* **Baseline Run (Only DB Tool)**: The agent has access to `database_query`. It resolves queries directly.
* **Candidate Run (DB + Search Tools)**: You add `web_search`. Due to prompt instructions, the model starts calling `web_search` for query tasks that it could have resolved directly from the database, inflating costs.

### How to Test It
You can run this scenario using the OpenInference cookbook (`ingestion_openinference.py`):
* **Baseline** contains: `[rag_agent (CHAIN) -> vector_search (RETRIEVER) -> synthesis (LLM)]`
* **Candidate** contains: `[rag_agent (CHAIN) -> vector_search (RETRIEVER) -> web_search (TOOL) -> synthesis (LLM)]`

**AgentDiff Output:**
```
Trajectory Divergence Index (TDI): 0.143
Cost Increase Delta:              +25.0%
```
*Verdict: Gates block the change because the structural trajectory diverged due to the unnecessary tool usage.*
