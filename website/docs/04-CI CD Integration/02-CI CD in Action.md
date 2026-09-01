# CI/CD in Action

How AgentDiff gates a real agent in a real pipeline - and posts the result
straight onto the pull request. Everything here was run against live model
calls and genuine GitHub Actions.

## The live demo

[`agentdiff-demo`](https://github.com/lostmartian/agentdiff-demo) is a small,
real project: a `gemini-3.6-flash` tool-calling agent, a committed baseline
trace, and a workflow that gates every run. It shows the whole lifecycle:

- a **clean** PR passes the gate;
- a **regressive** PR (the agent's prompt now forces a redundant call) is
  **blocked** - `TDI 0.1429`, a `get_user_database_stats` loop - and the
  failure report is posted as a comment;
- a **feature** PR auto-posts the report onto the PR that triggered it, with no
  manually supplied PR number.

## The workflow

A real workflow generated the candidate trace in CI, then gated it:

```yaml
name: Agent Gate

permissions:
  contents: read
  pull-requests: write   # lets the action post the PR comment

on:
  pull_request:
  workflow_dispatch:

jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Run live agent
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python scripts/run_agent.py --prompt "${{ github.event.inputs.prompt }}" --out run.json
      - uses: kerrshift/agentdiff/.github/actions/agentdiff-check@v0.2.2
        with:
          baseline: traces/gemini_baseline.json
          candidate: run.json
          max-divergence: "0.3"
          max-loops: "0"
          pr: ${{ github.event.pull_request.number || github.event.inputs.pr }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

On `pull_request`, `github.event.pull_request.number` is the PR being built - so
the report is posted to the right PR automatically.

## Anatomy of a posted comment

Here is a real comment from a run whose candidate **regressed** (the agent
looped a tool call). AgentDiff posted it automatically:

> **AgentDiff - Trajectory Regression Check**
>
> **Status:** ⛔ **FAILED**
>
> | Gate | Value | Threshold |
> | :--- | :--- | :--- |
> | TDI | `0.1429` | ≤ `0.3` |
> | Loops | `1` | ≤ `0` |
> | Cost delta | `+54.21%` | ≤ `10.0%` |
>
> **Root cause** - *Culprit:* `get_user_database_stats` `[loop]` - entered a
> loop repeating 'get_user_database_stats' (2 times).
>
> **Divergence tree**
>
> ```text
> baseline [3 steps] vs candidate [4 steps]
>      1 ~ gemini_tool_decision   (changed)
>      2 + get_user_database_stats   (added - absent in baseline)
>      3 · get_user_database_stats
>      4 ~ gemini_synthesis   (changed)
> ```

Three things to notice:

1. **Status + gate table** - the pass/fail verdict and the three gates (TDI,
   loops, cost) with your thresholds.
2. **Root cause** - `locate_culprit` points at the step and the kind of change
   (here a `loop`).
3. **Collapsed divergence tree** - long runs of matched steps are folded into
   `· · · N matched step(s) · · ·`; only divergent steps are shown (`+` added,
   `−` removed, `~` changed). The comment stays small even for big traces.

The comment is posted **even when the gate blocks**, so reviewers see *why* the
build is red without leaving GitHub.

## Gate + comment in one step

```bash
agentdiff baseline.json candidate.json \
  --fail-on-regression \
  --format pr \
  --pr ${{ github.event.pull_request.number }}
```

`--pr` posts the report and `--fail-on-regression` still exits `1` on a
regression - the pipeline fails *and* the PR explains itself.

## Required permission

The default `GITHUB_TOKEN` is read-only, so posting a comment needs:

```yaml
permissions:
  pull-requests: write
```

No manual token is required; this just grants the built-in token the ability to
write to the PR.

## Generating the report locally

To see the same output without GitHub:

```bash
pip install agent-trajectory-diff google-genai
export GEMINI_API_KEY=...
python scripts/run_agent.py --prompt "Retrieve the database count of active users for state NY." --out run.json
agentdiff traces/gemini_baseline.json run.json --format pr --output-file pr_comment.md
```

See [GitHub Actions Setup](01-GitHub-Actions-Setup) for the full input reference
and [PR Comments](../03-Guides/04-PR-Comments) for the CLI.