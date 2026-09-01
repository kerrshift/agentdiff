# Cookbooks & Live Examples

The [`cookbooks/`](https://github.com/kerrshift/agentdiff/tree/main/cookbooks)
directory ships standalone recipes in two flavors:

- **Offline (no API keys, deterministic)** - the product story and per-adapter
  ingestion against bundled sample traces. Safe to run anywhere, including CI.
- **Live (real SDKs, real APIs)** - capture genuine agent runs from OpenAI,
  Gemini, LangGraph, CrewAI, or the OpenAI Agents SDK and diff them through
  AgentDiff.

Run any recipe with `uv` (dependencies are declared inline via PEP 723):

```bash
uv run cookbooks/moat_diff_workflow.py
uv run cookbooks/live_langgraph.py
```

## Offline recipes

| Recipe | What it shows |
| --- | --- |
| `moat_diff_workflow.py` | The core story: `compare` -> why (`--explain`) -> where (`--tree` + culprit step). |
| `baseline_rotation.py` | Baseline rotation policies (manual / auto / staged) + the drift-creep guard. |
| `pr_markdown.py` | Paste-ready PR comment (gate, divergence tree, culprit). |
| `ingestion_*.py` | Per-adapter ingestion: Generic, OpenInference/OTel, Langfuse, LangSmith. |
| `pytest_plugin_demo/` | A mini-project running the `--agentdiff` pytest plugin against a committed baseline. |

## Live recipes

| Recipe | Requires | What it shows |
| --- | --- | --- |
| `openai_sdk_generic.py` | `OPENAI_API_KEY` | A live multi-turn tool loop via `gpt-4o-mini`, captured to the Generic format, then diffed. Run 2 deliberately loops. |
| `gemini_sdk_generic.py` | `GEMINI_API_KEY` | Same workflow with Google Gemini. |
| `live_openai_agents.py` | `OPENAI_API_KEY` | Runs the **OpenAI Agents SDK** and feeds its own trace straight through the `openai_agents` adapter. |
| `live_openinference.py` | `OPENAI_API_KEY` | Instruments OpenAI with **OpenInference (OTel)** and diffs real exported spans. |
| `live_langgraph.py` | `OPENAI_API_KEY` | Builds a real **LangGraph** ReAct agent (`create_react_agent`), instruments it with OpenInference, and diffs two live graph executions - extra tool calls raise TDI, flag loops, and block the gate. |
| `live_crewai.py` | `OPENAI_API_KEY` | Runs a real **CrewAI** crew under OpenInference instrumentation; scope creep shows up as added steps, a loop flag, and a blocked gate. |
| `live_langfuse.py` | Langfuse keys | Creates a real trace via the Langfuse v4 SDK, fetches it back, and ingests it through the `langfuse` adapter. |
| `live_gemini_cases.py` | `GEMINI_API_KEY` | Four cases: clean run, prompt-change regression, forced loop (gate blocked), baseline-rotation decisions. |

### Framework integration notes

Real frameworks needed two fixes worth knowing when you instrument your own
agents with OpenInference:

- **LangGraph**: instrument with `openinference-instrumentation-langchain`.
  Graph nodes surface as `routing` steps, chat-model calls as `llm_call`, tool
  runs as `tool_call` - AgentDiff's `openinference` adapter maps them natively.
- **CrewAI**: use `openinference-instrumentation-crewai` plus
  `openinference-instrumentation-openai` (CrewAI 1.x calls the OpenAI SDK
  directly for LLM spans). Define tools as `BaseTool` subclasses overriding
  `_run`; tools built with the `@tool` decorator override `run()` and silently
  bypass instrumentation. Disable CrewAI's own telemetry with
  `CREWAI_DISABLE_TELEMETRY=true` and pass `tracing=False` to `Crew`.

> **See it in CI:** the [`agentdiff-demo`](https://github.com/lostmartian/agentdiff-demo)
> repository wires a real Gemini agent into GitHub Actions that runs the
> `agentdiff-check` action and auto-posts the PR-ready report onto pull
> requests.
