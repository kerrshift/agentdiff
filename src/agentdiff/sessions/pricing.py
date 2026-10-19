"""Per-model token prices used to reconstruct coding-agent session cost.

Prices are USD per million tokens (Anthropic first-party API rates). Cache
writes are priced at 1.25x input (5-minute TTL) and 2x input (1-hour TTL);
cache reads at the model's published cache-read rate.

Reconstructed totals are cross-checked against Claude Code's own
``cost-state`` counter when a session log carries one.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ModelPrice:
    input: float
    output: float
    cache_read: float

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
}

# Fast mode bills the same model at a premium.
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
