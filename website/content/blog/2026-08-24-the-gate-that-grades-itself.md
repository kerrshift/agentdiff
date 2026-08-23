---
title: "Goodhart's Law in Agent Evaluation: The Gate That Grades Itself"
date: 2026-08-24
type: engineering
description: Goodhart's Law in AI agent evaluation - why trajectory thresholds drift, how green checks lose meaning when the metric becomes the target, and why naming the problem matters.
keywords: Goodhart's Law, agent evaluation, AI agents, trajectory evaluation, regression testing, evals, AgentDiff, thresholds, CI gates
---

Every agent team eventually builds the same ritual. You capture a golden trace - the agent doing the right thing - and you diff the next run against it. Some number comes out. Below the threshold, the gate opens. Above it, the PR blocks.

It feels rigorous. The number is computed deterministically, the baseline is committed next to the code, the config lives in `agentdiff.toml` and gets reviewed like anything else.

The fragility is not in the math. It is in what happens next, when the number blocks a release someone needs to ship.

## A threshold is a social contract

AgentDiff today gates on a handful of structural measures - divergence against the baseline, loop detection, cost deltas, wasted effort. Each one has a threshold. That threshold is a judgment call: how much change is acceptable before we call it a regression.

On the first day that threshold gets set, it is calibrated honestly. Someone runs a few known-good PRs, notes where the scores land, and picks a number with a little headroom. It ships, it is reviewed, it lands in `main`.

From that moment on, the threshold is not just a number. It is a contract between the team that owns the agent and the team that owns the gate. And like any contract, it can be renegotiated under pressure.

## Goodhart, in plain language

Goodhart's Law is often quoted - *when a measure becomes a target, it ceases to be a good measure* - but rarely described operationally.

There are two flavors relevant here.

**Regressional Goodhart** is slow and accidental. The threshold was chosen based on a snapshot of behavior. Over weeks, the agent drifts - new prompts, new tools, new model versions. Scores creep up. The gate still passes because the threshold had headroom. No one notices the drift until a real incident reveals how far the baseline has moved.

**Adversarial Goodhart** is fast and intentional. A PR turns the gate red. The diff is not obviously wrong - the agent still answers correctly, just through a slightly different path. Rather than chase the cause, the threshold is bumped: `0.25 → 0.40`. The gate turns green. The PR merges.

Both have the same signature from the outside: a green check.

## How it plays in AgentDiff

AgentDiff makes the transaction explicit, which also makes the failure mode explicit.

A developer compares `baseline.json` against `candidate.json`. The terminal reports divergence `0.31` against a threshold of `0.25`. The CI comment renders a collapsed tree and a red status. The signal is unambiguous.

The next action is where Goodhart enters. The developer has three options:

1. Fix the trajectory - remove the redundant tool loop, tighten the prompt, revert the change that introduced extra recovery steps.
2. Update the baseline - accept that the agent's behavior has legitimately changed and promote the candidate to the new golden trace.
3. Loosen the threshold - leave the behavior and the baseline alone, but move the line so the same diff passes.

Only the first two are evaluations of the agent. The third is an evaluation of the evaluation. In code review it looks similar - a one-line diff in `agentdiff.toml` - but it changes what every future PR is measured against.

The configuration being versioned helps. You can see *who* changed the number and *when*. You can see the diff it was changed next to, if you go looking. The question Goodhart forces is whether anyone *will* go looking, and what the system does to make that comparison unavoidable.

## What happens when gates drift

The consequence is not dramatic. That is why it is hard to catch.

No one announces that quality has been redefined. The suite still runs. The PR comment still posts its tidy report. The numbers are still precise to two decimals. The only thing that has changed is the mapping between those numbers and the decision to ship.

Over time, a few dull effects accumulate.

**Baselines age without anyone noticing.** A golden trace from three sprints ago still anchors the comparison, but the product it represented no longer exists. The diff grows not because the candidate is wrong, but because the reference is stale. Failures become noisy, which is the most effective way to make a team stop trusting a gate.

**Green checks lose information.** When thresholds have been adjusted a few times to keep the suite quiet, a passing run no longer answers `has the agent regressed?` It answers `has the agent regressed *by more than we most recently decided to tolerate?`* The check is still green. The question it answers has changed.

**Incidents look surprising in retrospect.** After a user-facing failure, the post-mortem pulls the traces and computes the scores. The regression was visible - extra recovery steps, a new loop entry - at a divergence of `0.34`. The threshold at the time was `0.40`. The gate had done exactly what it was told to do.

None of these are bugs in the diff engine. They are the normal, predictable consequences of a metric under pressure without a counter-pressure that makes its own drift visible.

## Why this is worth naming

Most evaluation tooling treats threshold selection as a setup step - something you do once and then forget. Agent evaluation makes that framing unreliable, because the artifact being measured - an agent's trajectory - changes faster than most code, and because the teams tuning the threshold are often the same teams being measured by it.

Naming Goodhart does not solve the problem. It just makes it discussable in a PR description without sounding accusatory, and measurable in a system that otherwise only measures the agent.

Naming the drift is a start - the rest is keeping it visible.
