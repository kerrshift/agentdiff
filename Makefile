.PHONY: lint format test bench build ci all

# ── Python ──────────────────────────────────────────────────────────────────

lint:
	uv run ruff check src tests benchmarks

format:
	uv run ruff format src tests benchmarks

test:
	uv run pytest

bench:
	uv run python -m pytest benchmarks/ --benchmark-only --benchmark-autosave

build:
	uv build

# ── CI / Full pipeline ────────────────────────────────────────────────────────
# Runs everything: lint → tests → Python build.
# This mirrors what GitHub Actions does on every push to main.
# (The website lives in kerrshift/agentdiff-website with its own pipeline.)

ci: lint test build

# Alias so `make all` does the same as `make ci`
all: ci
