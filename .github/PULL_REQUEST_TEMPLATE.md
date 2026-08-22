<!--
Title: <type>(<scope>): <imperative summary, <=72 chars>
One logical change per PR. Branch naming: <type>/<kebab-case-summary>.
-->

## What

<!-- One or two sentences: what changed? -->

## Why

<!-- Context / problem. Link the roadmap item: context/ROADMAP.md#... -->

## How

<!-- Key implementation points, decisions, trade-offs -->

## Testing

<!-- How this was verified. Commands run + result:
     make lint            -> pass
     uv run python -m pytest -> N passed
-->

## Checklist

- [ ] Exactly one logical change in this PR
- [ ] `make lint` passes
- [ ] `uv run python -m pytest` is green
- [ ] Docs updated if user-facing
- [ ] `CHANGELOG.md` entry added under `[Unreleased]` (if feat/fix)
- [ ] Conventional title: `type(scope): summary`
