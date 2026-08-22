# AGENTS.md — AgentDiff working rules

Instructions for AI coding agents and humans working in this repository.

## Git workflow (mandatory)

- **Never commit or push directly to `main`.** Every change goes through a branch + PR.
- Branch off latest `main` before starting work:
  ```bash
  git checkout main && git pull origin main
  git checkout -b <type>/<short-desc>
  ```
- **One logical change per branch, one branch per PR.** Unrelated fixes get their own branch/PR.
- **Product and website are never mixed.** `website/` changes get their own branch/PR, separate from product code (`src/`, `tests/`, `cookbooks/`, `schema/`).
- Branch naming: `feat|fix|docs|chore|test|refactor/<kebab-case-summary>` (e.g. `feat/recovery-step-ratio`, `docs/readme-faq`).

## Commits & PRs

- Conventional Commits for commits **and** PR titles: `type(scope): summary` — imperative mood, ≤72 chars.
- PR body must follow `.github/PULL_REQUEST_TEMPLATE.md`: What / Why / How / Testing / Checklist — and link the relevant `context/ROADMAP.md` item.
- Open PRs with `gh pr create`; squash-merge; delete the branch after merge; pull fresh `main` before the next task.

## Verification before every commit

```bash
make lint                  # ruff check + format check
uv run python -m pytest    # full suite (must stay green)
```

Any behavior change ships with tests; coverage must not drop.

## Releases & changelog

- Every user-facing change adds a `CHANGELOG.md` entry under `[Unreleased]`.
- Version bumps + release notes happen in their own `chore/release-*` branch.
- PyPI package: `agent-trajectory-diff`. SemVer + Keep a Changelog.

## Project conventions

- `context/ROADMAP.md` is the source of truth for status/phases — update item statuses when work completes; archive stale agenda files into `context/product/` or delete them.
- Python 3.10+; managed with `uv`; lint/format with ruff (`make lint`, `make format`).
- Public API surface lives in `src/agentdiff/__init__.py` — document changes there and in `/docs`.
- Trace schema is a versioned contract (`schema/`, `context/schema_migration.md`) — breaking changes need a schema-version bump and migration note.

## Scope guardrails

- Do not add LLM-judge/semantic scoring, hosted backends, or orchestration features — see non-goals in `context/ROADMAP.md`.
