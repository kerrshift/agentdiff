# Cookbooks & Examples

Standalone recipes for **AgentDiff**. Two kinds:

- **Offline (no API keys, deterministic)** — the product story and per-adapter ingestion. Safe to run anywhere, including CI.
- **Live (real SDKs, API keys + cost)** — capture a real agent run with the OpenAI / Gemini SDKs and diff it.

---

## Offline cookbooks (recommended)

These use the bundled traces in [`sample/`](sample) and need only AgentDiff installed:

| Recipe | What it shows |
| --- | --- |
| [`moat_diff_workflow.py`](moat_diff_workflow.py) | The core story: `compare` → **why** (`--explain`) → **where** (`--tree` + culprit step). |
| [`baseline_rotation.py`](baseline_rotation.py) | Baseline rotation policies (manual / auto / staged) + the drift-creep guard. |
| [`pr_markdown.py`](pr_markdown.py) | Paste-ready PR comment (gate, divergence tree, culprit) + how `--pr` posts it. |
| [`ingestion_generic.py`](ingestion_generic.py) | Ingest the canonical Generic format. |
| [`ingestion_openinference.py`](ingestion_openinference.py) | Ingest an OpenInference / OTel trace. |
| [`ingestion_langfuse.py`](ingestion_langfuse.py) | Ingest a Langfuse trace. |
| [`ingestion_langsmith.py`](ingestion_langsmith.py) | Ingest a LangSmith run tree (offline sample). |
| [`pytest_plugin_demo/`](pytest_plugin_demo) | A mini-project running the `--agentdiff` pytest plugin against a committed baseline. |

Run any of them with `uv`:

```bash
uv run cookbooks/moat_diff_workflow.py
uv run cookbooks/baseline_rotation.py
uv run cookbooks/pr_markdown.py
uv run cookbooks/ingestion_generic.py
# ... etc
```

or with a plain venv:

```bash
cd cookbooks
python3 -m venv .venv && source .venv/bin/activate
pip install agent-trajectory-diff
python moat_diff_workflow.py
```

## Live cookbooks (API keys required)

| Recipe | Requires | What it shows |
| --- | --- | --- |
| [`openai_sdk_generic.py`](openai_sdk_generic.py) | `OPENAI_API_KEY` | A live multi-turn tool loop via `gpt-4o-mini`, captured to the Generic format, then diffed. Run 2 deliberately loops → caught by AgentDiff. |
| [`gemini_sdk_generic.py`](gemini_sdk_generic.py) | `GEMINI_API_KEY` | Same live workflow with Google Gemini. |
| [`live_openai_agents.py`](live_openai_agents.py) | `OPENAI_API_KEY` | Runs the **OpenAI Agents SDK** for real and feeds its own trace straight through the `openai_agents` adapter — validates that adapter against genuine SDK output. |
| [`live_openinference.py`](live_openinference.py) | `OPENAI_API_KEY` | Instruments OpenAI with **OpenInference (OTel)**, exports real spans, normalizes them, and feeds them through the `openinference` adapter. |
| [`live_langfuse.py`](live_langfuse.py) | `LANGFUSE_HOST/PUBLIC_KEY/SECRET_KEY` | Creates a real **Langfuse** trace via the SDK, fetches it back, normalizes snake_case keys, and feeds it through the `langfuse` adapter. |

```bash
export OPENAI_API_KEY="sk-..."    # or GEMINI_API_KEY="AIza..."
uv run cookbooks/openai_sdk_generic.py
uv run cookbooks/gemini_sdk_generic.py
uv run cookbooks/live_openai_agents.py
uv run cookbooks/live_openinference.py
uv run cookbooks/live_langfuse.py
uv run cookbooks/live_gemini_cases.py   # regression, prompt-change, loop, drift
```

## Notes

- The offline cookbooks normalize the same "story" from four different telemetry
  formats (Generic, OpenInference/OTel, Langfuse, LangSmith) — that is the
  "bring your own telemetry" promise: **run it twice, we tell you how your
  agent changed and what to fix.**
- `sample/` traces are tiny synthetic fixtures for demonstration; bring your own
  real traces for actual regression gates.
