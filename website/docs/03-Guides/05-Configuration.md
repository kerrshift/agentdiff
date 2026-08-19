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

[assertions]             # defaults used by assert_no_regressions / pytest plugin
max_divergence = 0.25
max_cost_increase_pct = 5.0
allow_loops = false
max_wasted_effort = 0.1
```

## Precedence

Values in the TOML are *defaults*. Any explicit CLI flag still wins over the
config file. This lets you commit sensible team-wide defaults while still
overriding them for a one-off run:

```bash
agentdiff baseline.json candidate.json --max-divergence 0.5
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