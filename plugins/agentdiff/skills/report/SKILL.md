---
name: report
description: Show where Claude Code spend went and what was avoidable (long context re-sent every turn, prompt cache rebuilt after breaks, stuck retries, repeated reads), from the session logs on this machine. Use when the user asks about Claude Code cost, token usage, hitting usage limits, or why sessions are expensive.
argument-hint: "[--since 24h|7d|30d|all] [--project NAME] [--top N]"
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/report.sh *)
---

## AgentDiff report

!`${CLAUDE_SKILL_DIR}/scripts/report.sh $ARGUMENTS`

## What to do with it

1. Show the report above to the user exactly as printed, inside a code block.
2. Below it, in at most five short bullets, explain the biggest avoidable items in plain
   language, and name the one habit change that would save the most. Use only the figures
   in the report; do not estimate new ones.
3. Do not run any other commands.
4. If the report says AgentDiff could not run, show the install instructions it printed
   and stop.
