# `agentdiff init` — Zero-Config Setup Wizard

`agentdiff init` is the fastest way to add AgentDiff to an existing AI agent codebase. It inspects your project, auto-detects which agent framework or telemetry format you use, and generates a tailored `agentdiff.toml` policy file alongside a production-ready GitHub Actions regression gate workflow.

---

## 1. Quick Usage

Run in your project root:

```bash
agentdiff init
```

The wizard scans your environment, identifies installed packages, and outputs:

```text
Detected framework: LangGraph (StateGraph checkpoint parser)
Wrote agentdiff.toml
Wrote .github/workflows/agentdiff.yml

Next steps:
  1. Record a baseline envelope:
       agentdiff record <your_agent:run> --runs 3 --out baselines/default.envelope.json
  2. Commit agentdiff.toml, the workflow(s), and the baseline.
  3. Open a PR — AgentDiff gates it automatically.
  4. Reviewers bless accepted drift with: /agentdiff approve
```

---

## 2. Auto-Detection Matrix

`agentdiff init` automatically detects the following frameworks by checking installed packages in your virtual environment:

| Framework / Adapter | Package Checked | Generated Config Adapter | Generated Workflow Step |
|---|---|---|---|
| **LangGraph** | `langgraph` | `adapter.name = "langgraph"` | Ingests native LangGraph StateGraph snapshots |
| **CrewAI** | `crewai` | `adapter.name = "crewai"` | Ingests multi-agent task hierarchy & CrewOutput dumps |
| **OpenAI Agents SDK** | `agents` | `adapter.name = "openai_agents"` | Ingests official OpenAI Agents SDK run trees |
| **OpenTelemetry / OpenInference** | `opentelemetry-api` | `adapter.name = "openinference"` | Standard GenAI span ingestion |
| **Generic Python** | *(fallback)* | `adapter.name = "auto"` | Ingests canonical AgentTrace JSON |

### Overriding Detection with `--adapter`

If you are using multiple frameworks or want to specify an adapter explicitly, pass `--adapter`:

```bash
agentdiff init --adapter crewai
```

---

## 3. CLI Flags & Options

```bash
agentdiff init [OPTIONS]
```

| Flag | Default | Description |
|---|---|---|
| `--scenario <name>` | `default` | Scenario name written into `agentdiff.toml` and workflow files. |
| `--runs <int>` | `3` | Number of sample runs configured for statistical baseline envelopes. |
| `--adapter <name>` | *(auto-detected)* | Override framework detection (`langgraph`, `crewai`, `openai_agents`, `openinference`, `generic`). |
| `--with-approve` | `false` | Also generate `.github/workflows/agentdiff-approve.yml` for in-PR `/agentdiff approve` re-baselining. |
| `--force` | `false` | Overwrite existing `agentdiff.toml` or workflow files if they already exist. |

---

## 4. Generated Artifacts

### 1. `agentdiff.toml` (v0.5 Spec)

```toml
[scenario.customer_support]
mode = "statistical"
sample_runs = 3
max_cost_increase_pct = 5.0

[scenario.customer_support.hard_invariants]
fail_on_identical_loops = true
max_tool_repeats = 3

[scenario.customer_support.tolerances]
step_count_std_dev = 2.0
divergence_ceiling = 0.35
```

### 2. `.github/workflows/agentdiff.yml`

```yaml
name: AgentDiff Gate

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install agent-trajectory-diff

      - name: Record Candidate Run
        run: |
          agentdiff record my_agent:run \
            --input '{"query": "sample query"}' \
            --out traces/candidate.json

      - name: Run AgentDiff Gate
        uses: kerrshift/agentdiff/.github/actions/agentdiff-check@v0.5.0
        with:
          baseline: baselines/customer_support.envelope.json
          candidate: traces/candidate.json
          pr: ${{ github.event.number }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 3. `.github/workflows/agentdiff-approve.yml` (when `--with-approve` is used)

Writes the command listener workflow that reacts to `/agentdiff approve` comments by repository maintainers, authenticating with the hosted `token.agentdiff.app` identity service and flipping the Checks API result.

---

## Next Steps

- Learn how [Statistical Baselines](08-Statistical%20Baselines.md) prevent flaking on non-deterministic agents.
- Explore the interactive [Approve Bot](09-Approve%20Bot.md) workflow.
- Review [Regression Gates](../02-Core%20Concepts/04-Regression%20Gates.md) for hard invariant details.
