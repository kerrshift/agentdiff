# PR Comments

Send the report straight to a GitHub pull request so reviewers see the
regression without leaving their terminal.

## Generate PR-ready markdown

`--format pr` produces a clean, paste-ready report: pass/fail status, metrics,
a divergence tree, and the culprit step.

```bash
agentdiff baseline.json candidate.json --format pr
```

Or write it to a file:

```bash
agentdiff baseline.json candidate.json --format pr --output-file pr_comment.md
```

## Post it automatically

Post the markdown as a comment to a GitHub PR number:

```bash
agentdiff baseline.json candidate.json --format pr --pr 42
```

AgentDiff uses the standard `GITHUB_TOKEN` environment variable to authenticate
(no extra dependencies). The endpoint is the repository of the current git
remote.

## The Python helpers

```python
from agentdiff.reporters.pr import generate_pr_markdown
from agentdiff.ci.github import post_pr_comment

md = generate_pr_markdown(report, baseline_name="main", candidate_name="pr")
post_pr_comment(repo, pr_number, md, token)
```

## Pair with the CI gate

Post the report **and** gate the pipeline on the same run:

```bash
agentdiff baseline.json candidate.json \
  --format pr \
  --pr 42 \
  --fail-on-regression
```

If the change regresses, the pipeline fails *and* the PR comment explains why.