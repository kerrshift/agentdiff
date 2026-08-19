# Introduction

**AgentDiff** is a developer-first Python library and CLI for **regression-testing multi-turn, tool-using AI agents** by comparing execution paths (trajectories) head-to-head.

AI agents are non-deterministic. They plan, call tools, retry, and loop — producing a **path** (a trace of steps) rather than a flat output. Traditional tests compare strings or use an LLM as a judge; neither can tell you *how* the agent got to an answer, or whether it got there wastefully. AgentDiff instead:

1. **Parses** each run into a directed acyclic graph (DAG) of steps — from your own JSON, OpenInference/OTel, Langfuse, or LangSmith.
2. **Compares** a baseline run and a candidate run, computing how structurally different the two paths are.
3. **Explains** *why* they diverged and points at the **culprit step**.
4. **Gates** the change in CI/CD so regressions can't merge.

You feed AgentDiff two runs of the same task — say, one from your `main` branch and one from a pull request — and it tells you what changed, why it matters, and whether to block the merge.

## What it does

- **Trajectory comparison (TDI).** A deterministic measure of how far the candidate's path diverged from the baseline's — independent of the exact words the model produced.
- **Loop detection.** Flags redundant, repeating tool-calling sequences and wasteful retries.
- **Resource deltas.** Quantifies changes in cost, token usage, and latency.
- **Explanations & culprit location.** Human-readable "why" plus the specific step responsible.
- **Bring-your-own-telemetry.** Native adapters for the Generic format, OpenInference/OTel, Langfuse, LangSmith, and the OpenAI Agents SDK.
- **CI/CD native gates.** A CLI gate, a **pytest plugin**, baseline rotation, and one-command **PR comments**.

## What it is not

- **Not an observability dashboard.** AgentDiff doesn't store logs or act as a real-time APM. It's a test-time comparison and regression engine.
- **Not an LLM-as-a-judge framework.** It doesn't score semantic quality. It mathematically analyzes *how* the agent reached its answer — the structure, loops, and efficiency.

## Where it fits

```text
baseline run  ──┐
                ├──> AgentDiff compare ──> report (TDI, loops, cost) ──> gate / PR comment
candidate run ──┘
```

Give it two runs, get an answer you can act on in CI.