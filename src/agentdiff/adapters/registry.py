"""A7 — adapter registry with config-driven and entry-point plugin discovery.

Adapters are resolved by canonical name through a single registry. The five
built-in adapters are registered at import time; third-party packages (or your
own code) can register additional adapters at runtime, or expose them via the
standard Python entry-point group so they are discovered automatically:

```toml
# in the plugin package's pyproject.toml
[project.entry-points."agentdiff.adapters"]
my_adapter = "my_package.adapter:MyAdapter"
```

Names are normalized: case-insensitive, ``-``/spaces fold to ``_``. Built-in
aliases keep historical spellings working (``open_inference``, ``openai``,
``openai-agents``).

Custom adapters can also participate in ``auto`` detection by defining a
``detect(data) -> bool`` classmethod on the adapter class. Built-ins are
always consulted first, so registering a custom adapter never changes how
existing telemetry is classified.
"""

from __future__ import annotations

import importlib.metadata
from collections.abc import Callable

from agentdiff.adapters.base import BaseAdapter
from agentdiff.adapters.crewai import CrewAIAdapter
from agentdiff.adapters.generic import GenericAdapter
from agentdiff.adapters.langfuse import LangfuseAdapter
from agentdiff.adapters.langgraph import LangGraphAdapter
from agentdiff.adapters.langsmith import LangSmithAdapter
from agentdiff.adapters.openai_agents import OpenAIAgentsAdapter
from agentdiff.adapters.openinference import OpenInferenceAdapter

#: Entry-point group scanned for third-party adapter plugins.
ENTRY_POINT_GROUP = "agentdiff.adapters"

BUILTIN_ADAPTERS: dict[str, type[BaseAdapter]] = {
    "crewai": CrewAIAdapter,
    "generic": GenericAdapter,
    "openinference": OpenInferenceAdapter,
    "langfuse": LangfuseAdapter,
    "langgraph": LangGraphAdapter,
    "langsmith": LangSmithAdapter,
    "openai_agents": OpenAIAgentsAdapter,
}

_BUILTIN_ALIASES: dict[str, str] = {
    "open_inference": "openinference",
    "openai-agents": "openai_agents",
    "openai_agents": "openai_agents",
    "openai": "openai_agents",
}

_registry: dict[str, type[BaseAdapter]] = dict(BUILTIN_ADAPTERS)
_alias_to_canonical: dict[str, str] = {
    alias: canonical
    for alias, canonical in _BUILTIN_ALIASES.items()
    if canonical in _registry
}
_entry_points_scanned = False


def normalize_name(name: str) -> str:
    """Normalizes an adapter name: lowercase, ``-``/whitespace fold to ``_``."""
    if not isinstance(name, str) or not name.strip():
        raise ValueError("Adapter name must be a non-empty string")
    return name.strip().lower().replace("-", "_").replace(" ", "_")


def resolve_name(name: str) -> str | None:
    """Resolves a name or alias to its canonical registry key (or None)."""
    norm = normalize_name(name)
    if norm in _registry:
        return norm
    return _alias_to_canonical.get(norm)


def register_adapter(
    name: str,
    adapter_cls: type[BaseAdapter] | None = None,
    *,
    aliases: tuple[str, ...] = (),
    override: bool = False,
) -> Callable:
    """Registers an adapter class under a canonical name.

    Usable directly or as a decorator::

        @register_adapter("acme_tracer", aliases=("acme",))
        class AcmeAdapter(BaseAdapter):
            ...

        register_adapter("acme_tracer", AcmeAdapter)

    Args:
        name: Canonical adapter name (normalized on registration).
        adapter_cls: The adapter class (omit when used as a decorator).
        aliases: Extra names that resolve to this adapter.
        override: Allow replacing an already-registered canonical name.

    Raises:
        TypeError: If ``adapter_cls`` is not a :class:`BaseAdapter` subclass.
        ValueError: If the name is empty or already registered without
            ``override``.
    """

    def _register(cls: type[BaseAdapter]) -> type[BaseAdapter]:
        if not (isinstance(cls, type) and issubclass(cls, BaseAdapter)):
            raise TypeError(f"{cls!r} is not a BaseAdapter subclass")
        canonical = normalize_name(name)
        if canonical in _registry and not override:
            raise ValueError(
                f"Adapter '{canonical}' is already registered; pass "
                "override=True to replace it"
            )
        _registry[canonical] = cls
        if not override and canonical in BUILTIN_ADAPTERS:
            # Re-registering a builtin name via override keeps it builtin.
            pass
        for alias in aliases:
            alias_norm = normalize_name(alias)
            if alias_norm == canonical:
                continue
            existing = _alias_to_canonical.get(alias_norm)
            if existing is not None and existing != canonical:
                raise ValueError(f"Alias '{alias}' already points at '{existing}'")
            _alias_to_canonical[alias_norm] = canonical
        return cls

    if adapter_cls is None:
        return _register
    return _register(adapter_cls)


def unregister_adapter(name: str) -> None:
    """Removes an adapter registration (used mainly in tests)."""
    canonical = resolve_name(name)
    if canonical is None:
        raise KeyError(f"Adapter '{name}' is not registered")
    del _registry[canonical]
    _alias_to_canonical.pop(canonical, None)
    stale = [a for a, c in _alias_to_canonical.items() if c == canonical]
    for alias in stale:
        del _alias_to_canonical[alias]


def get_adapter(name: str) -> type[BaseAdapter]:
    """Resolves an adapter class by name or alias.

    Entry-point plugins are discovered lazily on first lookup. Raises
    ``ValueError`` listing every available adapter when nothing matches.
    """
    _scan_entry_points()
    resolved = resolve_name(name)
    if resolved is None:
        raise ValueError(
            f"Unknown adapter '{name}'. Available adapters: "
            f"{', '.join(available_adapters())}"
        )
    return _registry[resolved]


def available_adapters() -> list[str]:
    """Returns all registered canonical adapter names, sorted."""
    _scan_entry_points()
    return sorted(_registry)


def custom_adapters_with_detect() -> list[type[BaseAdapter]]:
    """Returns non-builtin adapters that opt into auto-detection, in order."""
    _scan_entry_points()
    out = []
    for canonical, cls in _registry.items():
        if canonical in BUILTIN_ADAPTERS:
            continue
        if callable(getattr(cls, "detect", None)):
            out.append(cls)
    return out


def reset_registry() -> None:
    """Restores the pristine built-in registry (used mainly in tests)."""
    global _entry_points_scanned
    _registry.clear()
    _registry.update(BUILTIN_ADAPTERS)
    _alias_to_canonical.clear()
    _alias_to_canonical.update(
        {a: c for a, c in _BUILTIN_ALIASES.items() if c in _registry}
    )
    _entry_points_scanned = False


def _scan_entry_points() -> None:
    """Discovers entry-point adapter plugins once per process (lazy)."""
    global _entry_points_scanned
    if _entry_points_scanned:
        return
    _entry_points_scanned = True
    try:
        eps = importlib.metadata.entry_points()
        if hasattr(eps, "select"):  # Python 3.10+ API
            found = eps.select(group=ENTRY_POINT_GROUP)
        else:  # pragma: no cover - legacy dict API
            found = eps.get(ENTRY_POINT_GROUP, [])
    except Exception:  # pragma: no cover - metadata scanning must never crash ingestion
        return
    for ep in found:
        canonical = normalize_name(ep.name)
        if canonical in _registry:
            continue  # plugins never shadow built-ins or earlier registrations
        try:
            cls = ep.load()
        except Exception:
            continue  # a broken plugin must not break the registry
        if isinstance(cls, type) and issubclass(cls, BaseAdapter):
            _registry[canonical] = cls


__all__ = [
    "BUILTIN_ADAPTERS",
    "ENTRY_POINT_GROUP",
    "available_adapters",
    "custom_adapters_with_detect",
    "get_adapter",
    "normalize_name",
    "register_adapter",
    "reset_registry",
    "resolve_name",
    "unregister_adapter",
]
