export interface DocPage {
  slug: string;
  title: string;
  category: string;
  content: string;
}

export const docsData: DocPage[] = [
  {
    slug: "introduction",
    title: "Introduction",
    category: "Getting Started",
    content: `# Introduction to AgentDiff

AgentDiff is a specialized evaluation engine designed specifically for **autonomous tool-calling agents**. 

Traditional software testing relies on static assertions or string matching. However, autonomous agents are non-deterministic, generating complex, multi-step execution traces (graphs) rather than flat outputs. Evaluating agents with flat string metrics fails because it ignores the path taken.

AgentDiff solves this by parsing agent runs into directed acyclic graphs (DAGs) and comparing them directly in CI/CD.

## Key Capabilities

- **Trajectory Comparisons:** Graph-to-graph diffing to detect when an agent takes a completely different path to solve the same task.
- **Wasted Loop Detection:** Automatically identifies redundant tool-calling loops, infinite recursion, and inefficient tool selections.
- **Resource Regressions:** Quantifies cost, token usage, and execution duration differences compared to your main branch.
- **CI/CD Native Reports:** Runs in GitHub Actions, rendering a clean visual breakdown of agent behavior regressions on every Pull Request.`
  },
  {
    slug: "quickstart",
    title: "Quickstart Installation",
    category: "Getting Started",
    content: `# Quickstart Installation

Get AgentDiff running in your repository in under 5 minutes.

## 1. Install CLI Tool

First, install the CLI agent compiler globally or in your dev dependencies:

\`\`\`bash
npm install -g @agentdiff/cli
\`\`\`

## 2. Generate Reference Trace

Run a benchmark run on your \`main\` branch to generate the baseline execution trace:

\`\`\`bash
agentdiff record --command "node agent.js --task 'weather'" --out baseline.json
\`\`\`

## 3. Compare Trajectories

Make your modifications in a branch, run the candidate trace, and compare them:

\`\`\`bash
agentdiff record --command "node agent.js --task 'weather'" --out candidate.json
agentdiff compare baseline.json candidate.json
\`\`\`

The output will highlight nodes added, nodes modified, and any wasted tool execution cycles.`
  },
  {
    slug: "trajectory-dags",
    title: "Trajectory DAGs",
    category: "Core Concepts",
    content: `# Understanding Trajectory DAGs

AgentDiff translates sequential execution logs into Directed Acyclic Graphs (DAGs). Each node represents a tool invocation or an LLM reasoning step, and each edge represents the flow of execution.

## Graph Anatomy

- **Node Attributes:** Every tool execution node captures parameters, returned value, duration, and LLM token usage.
- **Data Flow Edges:** Traces how outputs from one tool call are passed as inputs to downstream tool calls.

\`\`\`json
{
  "node_id": "tool-call-3",
  "tool_name": "web_search",
  "arguments": { "query": "current weather" },
  "cost_delta": 0.05
}
\`\`\`

By converting linear logs into structured graphs, AgentDiff isolates the exact steps where an agent diverged or made redundant tool loops.`
  },
  {
    slug: "divergence-metrics",
    title: "Divergence Metrics",
    category: "Core Concepts",
    content: `# Divergence & Regression Metrics

AgentDiff computes three core metrics to quantify agent performance changes:

## 1. Path Divergence Ratio
Measures the topological difference between the candidate graph and the baseline graph. A ratio of \`0.0\` means execution paths are identical, while \`1.0\` represents complete path divergence.

## 2. Wasted Effort Delta
Quantifies redundant, circular loops (e.g., repeating the same search or retrying failed database queries). Redundant loop execution is highlighted in red.

## 3. Cost & Performance Delta
Measures the absolute difference in:
- LLM API Cost (USD)
- Token Usage (Input / Output)
- Wall-clock execution time (seconds)`
  },
  {
    slug: "github-actions",
    title: "GitHub Actions Setup",
    category: "CI/CD Integration",
    content: `# GitHub Actions Setup

Integrate AgentDiff directly into your GitHub pull requests.

## Workflow Example

Create a workflow file under \`.github/workflows/agentdiff.yml\`:

\`\`\`yaml
name: Agent Evaluation
on: [pull_request]

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Node
        uses: actions/setup-node@v3
      - name: Run AgentDiff
        run: |
          npm install -g @agentdiff/cli
          agentdiff compare-pr \\
            --baseline main.json \\
            --command "node agent.js" \\
            --token \${{ secrets.GITHUB_TOKEN }}
\`\`\`

On execution, AgentDiff automatically posts a PR status summary table detailing trajectory metrics.`
  }
];
