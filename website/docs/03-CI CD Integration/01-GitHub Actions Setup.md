# GitHub Actions Integration

Integrate AgentDiff directly into your GitHub Pull Request workflow to catch agent regressions automatically.

## Workflow Example

Create a workflow file under `.github/workflows/agentdiff.yml`:

```yaml
name: Agent Regression Testing

on:
  pull_request:
    branches: [ master ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Install Python and uv
        uses: astral-sh/setup-uv@v5
        with:
          python-version: "3.10"

      - name: Install Dependencies
        run: |
          uv sync

      - name: Run Code Style Checks
        run: |
          make lint

      - name: Run Test Suite
        run: |
          make test

      - name: Compare Trajectories (CLI Gate)
        run: |
          # Generate/obtain candidate trace from your test runs and compare against baseline
          uv run agentdiff diff \
            tests/traces/baseline.json \
            tests/traces/candidate.json \
            --fail-on-regression \
            --max-divergence 0.25 \
            --max-cost-delta 10.0 \
            --format markdown \
            --output-file pr_comment.md

      - name: Post PR Comment
        uses: tholander/actions-comment-pull-request@v2
        if: always()
        with:
          filePath: pr_comment.md
```

## Pull Request PR Comments
When run in markdown format, AgentDiff produces a clean report table highlighting:
- Overall pass/fail status based on thresholds.
- Divergence index and wasted effort indexes.
- Cost, latency, and token deltas.
- Side-by-side execution step difference lists.
