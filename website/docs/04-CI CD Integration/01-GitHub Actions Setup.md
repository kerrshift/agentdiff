# GitHub Actions Integration

Catch agent regressions automatically on every pull request.

## The pieces

1. **Generate two traces** - one from `main`, one from the PR - in your test
   run (see the [pytest Plugin](03-Guides/03-pytest-Plugin.md) or the ingestion
   cookbooks).
2. **Compare them** with the `agentdiff` CLI.
3. **Gate** with `--fail-on-regression` and **post** the result as a PR comment.

> A working end-to-end example (a real Gemini agent, the reusable action, and
> auto-posted PR comments) lives in the
> [`agentdiff-demo`](https://github.com/lostmartian/agentdiff-demo) repository.

## Workflow example

```yaml
name: Agent Regression Testing

on:
  pull_request:
    branches: [ main ]

jobs:
  agentdiff:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up uv
        uses: astral-sh/setup-uv@v5

      - name: Install
        run: uv sync

      - name: Gate agent trajectories
        run: |
          uv run agentdiff \
            tests/traces/baseline.json \
            tests/traces/candidate.json \
            --fail-on-regression \
            --max-divergence 0.25 \
            --max-cost-delta 10.0 \
            --explain \
            --tree \
            --format pr \
            --output-file pr_comment.md

      - name: Post PR comment
        uses: actions/github-script@v7
        if: always()
        env:
          COMMENT: ${{ env.COMMENT }}
        with:
          script: |
            const fs = require('fs');
            const body = fs.readFileSync('pr_comment.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body,
            });
```

## Letting AgentDiff post the comment

Instead of a separate action step, you can have AgentDiff post the comment
directly (uses `GITHUB_TOKEN`):

```yaml
      - name: Gate and comment
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          uv run agentdiff \
            tests/traces/baseline.json \
            tests/traces/candidate.json \
            --fail-on-regression \
            --format pr \
            --pr ${{ github.event.pull_request.number }}
```

See [PR Comments](03-Guides/04-PR-Comments.md) for details.

## Reusable action

For a drop-in gate, use the composite action. It installs the package, runs
`agentdiff --fail-on-regression`, and fails the job on divergence, loops, or
cost spikes. Setting `pr` also posts the PR-ready report onto the PR (even when
the gate blocks):

```yaml
permissions:
  contents: read
  pull-requests: write   # needed to post the PR comment

jobs:
  agentdiff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - uses: lostmartian/agentdiff/.github/actions/agentdiff-check@v0.2.2
        with:
          baseline: traces/baseline.json
          candidate: traces/candidate.json
          max-divergence: "0.3"
          max-loops: "0"
          max-cost-delta: "10.0"
          pr: ${{ github.event.pull_request.number }}   # optional
          github-token: ${{ secrets.GITHUB_TOKEN }}     # required with pr
```

**Inputs:**

| Input | Default | Description |
| --- | --- | --- |
| `baseline` | *(required)* | Path to the stored baseline trace JSON. |
| `candidate` | *(required)* | Path to the candidate trace JSON. |
| `package` | `agent-trajectory-diff` | Package spec (PyPI name, `git+https://…`, or a local path). |
| `adapter` | `auto` | `auto`, `generic`, `openinference`, `langfuse`, `langsmith`, `openai_agents`. |
| `max-divergence` | `0.3` | Maximum Trajectory Divergence Index (TDI). |
| `max-loops` | `0` | Maximum loop count. |
| `max-cost-delta` | `10.0` | Maximum cost increase percentage. |
| `update-baseline` | `false` | Overwrite the stored baseline when the run is clean. |
| `pr` | *(empty)* | PR number to post the report comment to. |
| `github-token` | *(empty)* | Token for the PR comment (required when `pr` is set). |

Pin the action to a release tag (`@v0.2.2`) for reproducible gates.

## Baseline rotation in CI

For automated pipelines, pair the gate with a `staged` baseline rotation so the
baseline advances safely over time:

```bash
uv run agentdiff candidate.json \
  --baseline tests/traces/baseline.json \
  --update-baseline \
  --baseline-rotation staged \
  --max-drift 0.05
```

See [Baseline Rotation](03-Guides/02-Baseline-Rotation.md).