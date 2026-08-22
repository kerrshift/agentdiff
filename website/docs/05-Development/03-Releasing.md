# Releasing

AgentDiff follows [Semantic Versioning](https://semver.org/) and
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The PyPI package is
[`agent-trajectory-diff`](https://pypi.org/project/agent-trajectory-diff/).

## Release checklist

1. **Finalize the changelog.** Every user-facing change since the last tag
   should already have a `[Unreleased]` entry (that is part of each PR).
   Rename the section to the new version with today's date and summarize the
   release in one line for minor/major bumps:

   ```markdown
   ## [0.3.0] - 2026-08-22

   AgentDiff v0.3.0 - recovery-effort metrics and live framework cookbooks.

   ### Added
   - ...
   ```

2. **Branch, don't commit to `main`.** Releases get their own branch per the
   contribution rules:

   ```bash
   git checkout main && git pull origin main
   git checkout -b chore/release-0.3.0
   ```

3. **Bump the version** in `src/agentdiff/__init__.py` (`__version__`). The
   docs site reads it from there at build time.

4. **Verify green:**

   ```bash
   make lint
   uv run python -m pytest
   make build   # sdist + wheel build cleanly
   ```

5. **Open the PR** (`chore(release): bump version to 0.3.0`), get it merged,
   then tag the merge commit on `main`:

   ```bash
   git checkout main && git pull origin main
   git tag v0.3.0 && git push origin v0.3.0
   ```

6. **CI publishes on tag** - the release workflow builds and uploads to PyPI.
   Verify with:

   ```bash
   pip install agent-trajectory-diff==0.3.0
   ```

7. **GitHub release notes** come from the changelog section; delete any stale
   release branches.

## Version semantics

- **Patch** (`0.2.1 -> 0.2.2`): bug fixes, no new API surface.
- **Minor** (`0.2.2 -> 0.3.0`): new features - new metrics, flags, config keys,
  adapters, cookbooks. Additive report fields count here.
- **Major** (`1.0.0`): breaking changes, including trace-schema version bumps
  (see `schema/` and `context/schema_migration.md`).
