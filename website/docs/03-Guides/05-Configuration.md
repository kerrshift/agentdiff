# Configuration (`agentdiff.toml`)

Commit your regression thresholds, adapter, and baseline path next to your
traces instead of repeating them as CLI flags. AgentDiff auto-discovers an
`agentdiff.toml` file from the current directory upward, or you can point at it
explicitly with `--config`.

## Example

```toml
[compare]
detect_loops = true
strict_tool_signatures = false

[adapter]
name = "auto"            # auto, generic, openinference, langfuse, langsmith, openai_agents

[cli]
format = "terminal"      # terminal, json, markdown, pr
baseline = "baselines/current.json"
max_loops = 0
max_divergence = 0.3
max_cost_delta = 10.0
max_recovery_ratio = 1.5 # opt-in Recovery Step Ratio gate (omit to disable)

[assertions]             # defaults used by assert_no_regressions / pytest plugin
max_divergence = 0.25
max_cost_increase_pct = 5.0
allow_loops = false
max_wasted_effort = 0.1
max_recovery_step_ratio = 1.5
```

## Precedence

Values in the TOML are *defaults*. Any explicit CLI flag still wins over the
config file. This lets you commit sensible team-wide defaults while still
overriding them for a one-off run:

```bash
agentdiff baseline.json candidate.json --max-divergence 0.5
```

## Gate governance (Goodhart guard)

A threshold tuned until CI goes green stops being a control. Pass
`--baseline-config` to compare the gate values the *baseline* was recorded
with against the ones this run uses — any change is flagged right next to
the diff it let through:

```bash
# In CI: fetch the config the baseline was recorded against, then diff
git show origin/main:agentdiff.toml > /tmp/baseline-agentdiff.toml
agentdiff baseline.json candidate.json --baseline-config /tmp/baseline-agentdiff.toml --format pr
```

The PR comment renders a warning block above the gate table:

```text
> [!WARNING]
> Gate thresholds changed in this PR — the diff below was judged
> against this PR's rules, not the baseline's.
> - max_divergence: `0.25` → `0.4`
```

The same summary prints with `--explain`. Loosening a gate is now as
visible in review as the code it guards.

Every report also self-describes its rules: a one-line gate provenance
(`Gate: max_divergence=0.3, max_loops=0, ... - source: agentdiff.toml`)
appears in the terminal summary, the JSON (`gate_provenance` field), and
the PR comment footer - so a diff always answers "what rules judged me?".

### Stale baselines

Thresholds aren't the only thing that drifts - baselines age too. A golden
trace from three sprints ago still anchors every diff, but the behavior it
represents may be long gone. With `--explain`, AgentDiff warns when the
baseline file is older than `stale_baseline_days` (default 30):

```text
! Baseline is 47 days old (last modified 2026-07-10). Stale threshold is
  30 days - consider re-recording it if the agent's expected behavior has
  legitimately changed (agentdiff record ... --update-baseline).
```

Tune or disable per project:

```toml
[cli]
stale_baseline_days = 14   # any positive number; advisory only, never blocks
```

## From the SDK

You can load config programmatically with `load_config()`, which returns an
`AgentDiffConfig` populated with defaults overlaid with your file:

```python
from agentdiff import load_config

cfg = load_config("agentdiff.toml")
print(cfg.cli.max_divergence)   # 0.3 if unset in the file
```

`find_config_file()` walks the directory tree looking for `agentdiff.toml`, so
a config at your project root applies to runs in any subdirectory.