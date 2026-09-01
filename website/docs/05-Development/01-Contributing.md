# Contributing

Thanks for helping build AgentDiff. These rules keep the history clean and
every PR reviewable in minutes. They are non-negotiable - PRs that ignore them
get sent back. The same rules live in [`CONTRIBUTING.md`](https://github.com/kerrshift/agentdiff/blob/main/CONTRIBUTING.md)
and are mirrored for coding agents in `AGENTS.md` at the repo root.

## Ground rules

1. **Never commit directly to `main`.** Every change lands through a branch + PR.
2. **One change per branch, one branch per PR.** Spot an unrelated issue? Open
   a separate branch - never ride it along.
3. **Product and website don't mix.** Changes to `website/` get their own
   branch/PR, separate from product (`src/`, `tests/`, `cookbooks/`) changes.
4. **Branch off the latest `main`:**

   ```bash
   git checkout main && git pull origin main
   git checkout -b <type>/<short-desc>
   ```

5. **Green before you open.** A red PR is a rejected PR:

   ```bash
   make lint                  # ruff check + format check
   uv run python -m pytest    # full suite (must stay green)
   ```

## Branch naming

`<type>/<kebab-case-summary>` - short, lowercase, hyphenated:

| Type | Use for | Example |
| --- | --- | --- |
| `feat/` | New functionality | `feat/recovery-step-ratio` |
| `fix/` | Bug fixes | `fix/langfuse-v4-types` |
| `docs/` | Documentation only | `docs/readme-faq` |
| `chore/` | Tooling, housekeeping, release prep | `chore/release-0.3.0` |
| `test/` | Test-only changes | `test/aligner-property-cases` |
| `refactor/` | No-behavior-change restructuring | `refactor/split-reporters` |

## Commits & PR titles

[Conventional Commits](https://www.conventionalcommits.org/) for both commits
and PR titles - imperative mood, at most 72 characters:

```text
feat(cli): add --explain flag for divergence explanations
fix(langfuse): sort v4 observations chronologically
docs(readme): add FAQ and non-goals
```

## PR description

Every PR uses the repository's pull-request template with five sections -
**What / Why / How / Testing / Checklist** - and links the roadmap item the
change belongs to.

## PR lifecycle

1. Push the branch to `origin` and open the PR against `main`.
2. CI must pass: lint, format, tests on Python 3.10-3.13, build.
3. Squash-merge (one logical commit per PR), then delete the branch.
4. Start the next piece of work from freshly pulled `main`.

## Quality bar

- Any behavior change ships with tests; coverage must not drop.
- New adapters need round-trip losslessness + fuzz-input tests.
- Public API changes update `src/agentdiff/__init__.py` docstring surface, the
  docs site, and the README.

## Releases

- Every user-facing change adds a `CHANGELOG.md` entry under `[Unreleased]`
  (Keep a Changelog format, SemVer).
- Version bumps + changelog finalization happen in their own `chore/release-*`
  branch; tagging triggers the publish pipeline - see
  [Releasing](03-Releasing.md).
