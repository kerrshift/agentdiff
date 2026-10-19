<div align="center">

<img src="docs/assets/logo.svg" alt="AgentDiff Logo" width="84" height="84" />

# AgentDiff

**See what your AI coding agent actually did, and what it cost.**

<p align="center">
  <a href="https://github.com/kerrshift/agentdiff/actions/workflows/ci.yml"><img src="https://github.com/kerrshift/agentdiff/actions/workflows/ci.yml/badge.svg" alt="CI Build" /></a>
  <a href="https://pypi.org/project/agent-trajectory-diff/"><img src="https://img.shields.io/pypi/v/agent-trajectory-diff.svg?color=10b981" alt="PyPI version" /></a>
  <a href="https://pypi.org/project/agent-trajectory-diff/"><img src="https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.13-blue.svg" alt="Python Versions" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
</p>

```bash
npx @kerrshift/agentdiff
```

or `uvx --from agent-trajectory-diff agentdiff` · or `/agentdiff:report` in [Claude Code](#inside-claude-code)

</div>

AgentDiff reads the session logs Claude Code already keeps on your machine and
tells you **where the money went and what was avoidable**. No config, no API
key, no account. Nothing leaves your machine.

```text
AgentDiff  ·  Claude Code  ·  last 7d
12 sessions · 7 projects · $314.61

Where the money went
  Re-reading context (cache reads)           $162.64   52%  ████████████████
  Writing context to cache                    $93.33   30%  █████████
  Model output (incl. thinking)               $51.34   16%  █████
  Background calls not in the transcript       $7.28    2%  █

Avoidable ≈ $132.08 (42% of spend, conservative estimate)
  ▸ Long context re-sent every turn  $86.64
    Start a fresh session per task; /compact before the context gets huge.
  ▸ Cache rebuilt after breaks  $45.44
    After a break of an hour or more, start a new session instead of resuming a giant one.

Biggest items
     $37.59  Long context: 434 turns re-sent >200k tokens (peak 969k)
             Refactor billing service · api
     $23.89  Cache rebuilt 7x after breaks (worst: 818k tokens after 93 min)
             Refactor billing service · api
```

*A real week from the author's own logs (session names changed).*

## Why

Your agent bill shows a total, not a reason. On real Claude Code usage, most of
the spend isn't the model writing code. It's the model **re-reading a growing
conversation on every turn**, and **rebuilding the prompt cache** when you come
back to a long session after a break. Those habits are fixable once you can see
them.

## What it finds

| Finding | What it means | What to do |
| :--- | :--- | :--- |
| **Long context** | Turns that re-sent more than 200k tokens of conversation | One session per task; `/compact` early |
| **Cache rebuilt after breaks** | The prompt cache expired and the whole context was written again at cache-write prices | After a long break, start fresh instead of resuming |
| **Stuck retries** | The same command failing the same way, again and again | Fix the setup once |
| **Repeated failures** | One kind of command failing many times in a session | Usually a missing step, wrong cwd or flaky test |
| **Unchanged files re-read** | The same file read repeatedly with identical content | Point the agent at the right section |
| **Identical repeated calls** | Same tool, same input, same output | Pure cost, no new information |
| **Expensive subagents** | Subagents that cost more than a few dollars (informational) | Narrower brief or cheaper model |

Every finding names the session and the file or command involved, with a dollar
estimate. Estimates are conservative: they count the requests that made the
redundant calls, not the extra context those calls added later.

## Usage

```bash
agentdiff                          # last 7 days (same as: agentdiff sessions)
agentdiff --since 30d              # 24h, 7d, 30d, 12w … or all
agentdiff --project api            # only projects whose name contains "api"
agentdiff --top 10                 # list more findings and sessions
agentdiff --json > spend.json      # machine-readable
agentdiff --card                   # shareable image for LinkedIn / X
agentdiff --path /other/.claude    # a different Claude Code config dir
```

### Share your numbers

`agentdiff --card` opens a page in your browser that draws your spend as an
image, sized for X and LinkedIn (landscape or portrait), with light and dark
themes and an option to hide dollar amounts. Click **Download PNG** or
**Copy image** and paste it into your post. The card shows totals and
categories only: no project names, files or commands.

## Install

Pick whatever your machine already has. Every option runs the same CLI.

| You have | Run once | Install |
| :--- | :--- | :--- |
| Node 18+ | `npx @kerrshift/agentdiff` | `npm i -g @kerrshift/agentdiff` |
| [uv](https://docs.astral.sh/uv/) | `uvx --from agent-trajectory-diff agentdiff` | `uv tool install agent-trajectory-diff` |
| pipx | `pipx run --spec agent-trajectory-diff agentdiff` | `pipx install agent-trajectory-diff` |
| Python 3.10+ | | `pip install agent-trajectory-diff` |
| Claude Code | `/agentdiff:report` | see below |

The installed command is always `agentdiff`. The npm package is a small
launcher for the same Python CLI at the same version. It uses uv if present,
else pipx, else builds a private virtualenv once with your Python 3.10+.

### Inside Claude Code

Install the AgentDiff plugin from this repository's marketplace:

```text
/plugin install agentdiff --marketplace kerrshift/agentdiff
```

On Claude Code versions before 2.1.275, add the marketplace first:
`/plugin marketplace add kerrshift/agentdiff`, then
`/plugin install agentdiff@agentdiff`.

Then run the report in any session. Claude shows it and explains the biggest
avoidable items. The plugin finds AgentDiff the same way as the npm launcher:
an installed `agentdiff`, else uv, pipx, or Python 3.10+.

```text
/agentdiff:report
/agentdiff:report --since 30d
```

Claude can also pick it up on its own when you ask things like "why is my
Claude Code usage so high?". With no Python or uv at all, it tells you what to
install.
Without the plugin, prefix the command with `!` to run it in a session:
`!uvx --from agent-trajectory-diff agentdiff`.

## How the numbers are computed

- **Source:** `~/.claude/projects/**/*.jsonl` (or `$CLAUDE_CONFIG_DIR`),
  including subagent transcripts.
- **Counted once:** Claude Code repeats usage on every content block of a
  request, and resumed or forked sessions copy their parent's history. AgentDiff
  counts each billed request exactly once.
- **Priced per model** at Anthropic list prices: input, output, cache reads, and
  cache writes for both the 5-minute and 1-hour TTLs. Fast mode is included.
- **Cross-checked:** when a session carries Claude Code's own cost counter, that
  counter is used as the total. The gap is shown as *background calls not in the
  transcript*, for example web-fetch summaries.
- **Subscriptions:** on a Pro/Max plan these are API-equivalent costs. They
  still show which sessions and habits use the most.

## Privacy

Session logs contain your source code. AgentDiff reads them locally, makes no
network calls and has no telemetry.

## Supported agents

| Agent | Status |
| :--- | :--- |
| Claude Code | ✅ |
| OpenAI Codex CLI | Next |
| Gemini CLI, Cursor | Planned |

---

<details>
<summary><b>Also included: trajectory regression gate for agents you build</b></summary>

AgentDiff started as a CI gate that compares an agent's execution path against
a committed baseline and fails the build on runaway loops or cost spikes. It is
still included and maintained:

```bash
agentdiff diff baselines/support.envelope.json traces/candidate.json --fail-on-regression
```

```python
from agentdiff import compare, load_trace
from agentdiff.testing import assert_no_regressions

report = compare(load_trace("baseline.json"), load_trace("candidate.json"))
assert_no_regressions(report, max_cost_increase_pct=5.0, allow_loops=False)
```

It ingests LangGraph, CrewAI, OpenAI Agents SDK, Langfuse, LangSmith,
OpenInference/OpenTelemetry and a generic JSON schema, and ships a GitHub Action
(`kerrshift/agentdiff/.github/actions/agentdiff-check`). See the
[cookbooks](cookbooks/) and [agentdiff.app](https://agentdiff.app) for details.

</details>

## Development

```bash
git clone https://github.com/kerrshift/agentdiff.git
cd agentdiff
uv sync
make lint
make test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [changelog](CHANGELOG.md).

## License

MIT. See [`LICENSE`](LICENSE).
