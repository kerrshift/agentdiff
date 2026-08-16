.PHONY: lint format test build website-dev website-build website-install ci all

# ── Python ──────────────────────────────────────────────────────────────────

lint:
	uv run ruff check src tests

format:
	uv run ruff format src tests

test:
	uv run pytest

build:
	uv build

# ── Website ──────────────────────────────────────────────────────────────────

website-install:
	cd website && pnpm install

website-dev:
	cd website && pnpm dev

website-build:
	cd website && pnpm build

# ── CI / Full pipeline ────────────────────────────────────────────────────────
# Runs everything: lint → tests → Python build → website build.
# This mirrors what GitHub Actions does on every push to main.

ci: lint test build website-install website-build

# Alias so `make all` does the same as `make ci`
all: ci
