# @kerrshift/agentdiff

**See what your AI coding agent actually did, and what it cost.**

```bash
npx @kerrshift/agentdiff
```

Reads the Claude Code session logs already on your machine and shows where the
money went and what was avoidable: long context re-sent every turn, prompt
caches rebuilt after breaks, stuck retries. No config, no API key, nothing
uploaded.

```bash
npx @kerrshift/agentdiff --since 30d        # 24h, 7d, 30d, 12w … or all
npx @kerrshift/agentdiff --project api      # only projects whose name contains "api"
npx @kerrshift/agentdiff --json             # machine-readable
```

Install it with `npm i -g @kerrshift/agentdiff`; the command is `agentdiff`.

This npm package is a thin launcher for the Python CLI
([`agent-trajectory-diff`](https://pypi.org/project/agent-trajectory-diff/))
at the same version. It uses `uvx` if you have uv, else `pipx`, else builds a
private virtualenv once with any Python 3.10+.

Docs and the Claude Code plugin: [agentdiff.app](https://agentdiff.app) ·
[GitHub](https://github.com/kerrshift/agentdiff). MIT licensed.
