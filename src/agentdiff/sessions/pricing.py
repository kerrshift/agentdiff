"""Per-model token prices used to reconstruct coding-agent session cost.

Prices are USD per million tokens at first-party list rates (Anthropic API,
OpenAI API Standard tier, as published 2026-10-19). Cache writes are priced
at 1.25x input (5-minute TTL) and 2x input (1-hour TTL); cache reads at the
model's published cached-input rate.

OpenAI bills prompts above 272K input tokens at a long-context tier (2x input
and cached input, 1.5x output); ``long_context_tokens`` marks the models it
applies to.

Reconstructed Claude Code totals are cross-checked against its own
``cost-state`` counter when a session log carries one. Codex logs carry no
cost, so Codex figures are API-equivalent estimates.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ModelPrice:
    input: float
    output: float
    cache_read: float
    long_context_tokens: int | None = None
    long_input_mult: float = 2.0
    long_output_mult: float = 1.5

    @property
    def cache_write_5m(self) -> float:
        return self.input * 1.25

    @property
    def cache_write_1h(self) -> float:
        return self.input * 2.0


# Longest matching prefix wins, so specific versions come before families.
PRICES: dict[str, ModelPrice] = {
    "claude-fable-5-1": ModelPrice(10.0, 50.0, 0.25),
    "claude-mythos-5-1": ModelPrice(10.0, 50.0, 0.25),
    "claude-fable-5": ModelPrice(10.0, 50.0, 1.0),
    "claude-mythos-5": ModelPrice(10.0, 50.0, 1.0),
    "claude-opus-5-5": ModelPrice(4.0, 20.0, 0.20),
    "claude-opus-5": ModelPrice(5.0, 25.0, 0.50),
    "claude-opus-4-8": ModelPrice(5.0, 25.0, 0.50),
    "claude-opus-4-7": ModelPrice(5.0, 25.0, 0.50),
    "claude-opus-4-6": ModelPrice(5.0, 25.0, 0.50),
    "claude-opus-4-5": ModelPrice(5.0, 25.0, 0.50),
    "claude-opus-4": ModelPrice(15.0, 75.0, 1.50),
    "claude-sonnet-5-5": ModelPrice(2.0, 10.0, 0.20),
    "claude-sonnet-5": ModelPrice(2.0, 10.0, 0.20),
    "claude-sonnet-4": ModelPrice(3.0, 15.0, 0.30),
    "claude-haiku-5-5": ModelPrice(0.10, 0.50, 0.01),
    "claude-haiku-4-5": ModelPrice(1.0, 5.0, 0.10),
    "claude-3-5-haiku": ModelPrice(0.80, 4.0, 0.08),
    # OpenAI (Codex CLI). developers.openai.com/api/docs/pricing, 2026-10-19.
    "gpt-6.1-sol": ModelPrice(2.0, 10.0, 0.10, long_context_tokens=272_000),
    "gpt-6-astra": ModelPrice(10.0, 50.0, 1.0, long_context_tokens=272_000),
    "gpt-6-sol": ModelPrice(2.0, 10.0, 0.20, long_context_tokens=272_000),
    "gpt-6-luna": ModelPrice(0.10, 0.50, 0.01, long_context_tokens=272_000),
    "gpt-5.6-sol": ModelPrice(4.0, 20.0, 0.40, long_context_tokens=272_000),
    "gpt-5.6-terra": ModelPrice(2.0, 12.0, 0.20, long_context_tokens=272_000),
    "gpt-5.6-luna": ModelPrice(0.20, 1.20, 0.02, long_context_tokens=272_000),
    "gpt-5.5": ModelPrice(5.0, 30.0, 0.50),
    "gpt-5.3-codex": ModelPrice(1.75, 14.0, 0.175),
    "gpt-5.2-codex": ModelPrice(1.75, 14.0, 0.175),
    "gpt-5.1-codex-mini": ModelPrice(0.25, 2.0, 0.025),
    "gpt-5.1-codex": ModelPrice(1.25, 10.0, 0.125),
    "gpt-5-codex": ModelPrice(1.25, 10.0, 0.125),
    "gpt-5.1": ModelPrice(1.25, 10.0, 0.125),
    "gpt-5-mini": ModelPrice(0.25, 2.0, 0.025),
    "gpt-5": ModelPrice(1.25, 10.0, 0.125),
    "codex-mini-latest": ModelPrice(1.50, 6.0, 0.375),
    "o4-mini": ModelPrice(1.10, 4.40, 0.275),
    "o3": ModelPrice(2.0, 8.0, 0.50),
}

# Fast mode (Anthropic) / Fast tier (OpenAI, formerly Priority) bills the same
# model at a premium: 2x on the current models of both vendors.
FAST_MODE_MULTIPLIER = 2.0


def price_for(model: str | None) -> ModelPrice | None:
    """Returns the price entry for a model id, or None when unknown."""
    if not model:
        return None
    model = model.removeprefix("anthropic.")
    best: str | None = None
    for prefix in PRICES:
        if model.startswith(prefix) and (best is None or len(prefix) > len(best)):
            best = prefix
    return PRICES[best] if best else None
