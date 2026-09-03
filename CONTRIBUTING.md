# Contributing to AgentDiff

Thanks for helping build AgentDiff. These rules keep the history clean and every
PR reviewable in minutes. They are **non-negotiable** — PRs that ignore them get
sent back.

---

## Ground rules

1. **Never commit directly to `main`.** Every change lands through a branch + PR.
2. **One change per branch, one branch per PR.** If you spot an unrelated issue,
   open a separate branch/PR — never ride it along.
3. **This repo is product-only (Python).** The website lives in
   [`kerrshift/agentdiff-website`](https://github.com/kerrshift/agentdiff-website)
   with its own CI/CD — site changes never land here.
4. **Branch off the latest `main`:**
   ```bash
   git checkout main && git pull origin main
   git checkout -b <type>/<short-desc>
   ```
5. **Green before you open.** Run the full check suite; a red PR is a rejected PR:
   ```bash
   make lint
   uv run python -m pytest
   ```

## Branch naming

`<type>/<kebab-case-summary>` — short, lowercase, hyphenated:

| Type | Use for | Example |
|---|---|---|
| `feat/` | New functionality | `feat/recovery-step-ratio` |
| `fix/` | Bug fixes | `fix/langfuse-v4-types` |
| `docs/` | Documentation only | `docs/readme-faq` |
| `chore/` | Tooling, housekeeping, release prep | `chore/contribution-guidelines` |
| `test/` | Test-only changes | `test/aligner-property-cases` |
| `refactor/` | No-behavior-change restructuring | `refactor/split-reporters` |

## Commits & PR titles

[Conventional Commits](https://www.conventionalcommits.org/) for both commits and
PR titles — imperative mood, ≤ 72 characters:

```
feat(cli): add --explain flag for divergence explanations
fix(langfuse): sort v4 observations chronologically
docs(readme): add FAQ and non-goals
chore(release): bump version to 0.2.2
```

## PR description

The PR body must follow [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md):
**What / Why / How / Testing / Checklist.** Link the roadmap item
(`context/ROADMAP.md`) the change belongs to.

## PR lifecycle

1. Push the branch to `origin` and open the PR against `main`.
2. CI must pass (lint, format, tests on Python 3.10–3.13, build).
3. Squash-merge (one logical commit per PR), then delete the branch.
4. Start the next piece of work from freshly pulled `main`.

## Tests & quality bar

- Any behavior change ships with tests; coverage must not drop.
- New adapters need round-trip losslessness + fuzz-input tests (see `tests/`).
- Public API changes update `src/agentdiff/__init__.py` docstring surface and docs.

## Releases

- Every user-facing change adds a `CHANGELOG.md` entry under `[Unreleased]`
  (Keep a Changelog format, SemVer).
- Version bumps + changelog finalization happen in their own `chore/release-*`
  branch at release time.

## Local development

```bash
uv sync                 # install deps + dev tools
make lint               # ruff check
make format             # ruff format
uv run python -m pytest # full test suite
```

Questions? Open an issue first for anything that changes public API, adds a
dependency, or touches the trace schema (`schema/`).
