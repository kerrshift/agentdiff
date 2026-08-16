# Introduction to AgentDiff

**AgentDiff** is a developer-first Python library and CLI designed to solve the hardest problem in agent engineering: **regression testing multi-turn, tool-using AI agents by comparing execution paths (trajectories) head-to-head.**

Traditional software testing relies on static assertions or string matching. However, autonomous agents are non-deterministic, generating complex, multi-step execution traces (Directed Acyclic Graphs) rather than flat outputs. Evaluating agents with flat string metrics fails because it ignores the path taken.

AgentDiff solves this by parsing agent runs into directed acyclic graphs (DAGs) and comparing them directly in local terminals, python test suites, or CI/CD pipelines.

## Key Capabilities

- **Trajectory Comparisons (DAG-LCS):** Computes sequence alignment based on Longest Common Subsequence (LCS) applied over topological node sequences to detect path divergence.
- **Wasted Loop Detection:** Automatically identifies redundant tool-calling loops, infinite recursion, and inefficient tool selections with stagnant state changes.
- **Resource Regressions:** Quantifies LLM API cost, token usage, and execution duration differences compared to your baseline.
- **Universal telemetries Support:** Integrates natively with files exported from **DeepEval**, OpenInference/OTel, Langfuse, and custom JSON formats.
- **CI/CD Native Gates:** Runs in GitHub Actions, throwing exit codes if your prompt refactor introduces infinite tool loops or spikes token waste.

## What AgentDiff is NOT

- **Not an Observability Dashboard:** AgentDiff does not store your logs or act as a real-time APM. It is purely a test-time comparison and regression engine.
- **Not an LLM-as-a-Judge Framework:** It doesn't replace frameworks like DeepEval or Ragas for semantic scoring; instead, it mathematically analyzes *how* the agent got there (structural steps, loops, and efficiency).
