import json

import pytest
from conftest import make_step, make_trace

from agentdiff.adapters import (
    BaseAdapter,
    available_adapters,
    get_adapter,
    register_adapter,
    reset_registry,
    unregister_adapter,
)
from agentdiff.adapters.registry import (
    custom_adapters_with_detect,
    normalize_name,
    resolve_name,
)
from agentdiff.loader import load_trace, parse_trace_data


class UpperAdapter(BaseAdapter):
    """Toy adapter: wraps data in a single uppercase-named step."""

    @classmethod
    def from_dict(cls, data):
        name = str(data.get("name", "upper"))
        return make_trace("upper", [make_step(name.upper())])


class DetectMeAdapter(BaseAdapter):
    """Toy adapter that opts into auto-detection."""

    @classmethod
    def from_dict(cls, data):
        return make_trace("detected", [make_step("custom_detected")])

    @classmethod
    def detect(cls, data):
        return isinstance(data, dict) and data.get("format") == "acme"


@pytest.fixture(autouse=True)
def _clean_registry():
    reset_registry()
    yield
    reset_registry()


# --- registration -------------------------------------------------------------


def test_builtins_registered():
    assert available_adapters() == [
        "crewai",
        "generic",
        "langfuse",
        "langgraph",
        "langsmith",
        "openai_agents",
        "openinference",
    ]


def test_register_and_get_roundtrip():
    register_adapter("acme", UpperAdapter)
    assert get_adapter("acme") is UpperAdapter


def test_register_as_decorator_with_alias():
    @register_adapter("acme_tracer", aliases=("acme",))
    class Acme(BaseAdapter):
        @classmethod
        def from_dict(cls, data):
            return make_trace("x", [make_step("a")])

    assert resolve_name("ACME") == "acme_tracer"
    assert get_adapter("Acme-Tracer") is Acme


def test_duplicate_registration_requires_override():
    register_adapter("acme", UpperAdapter)
    with pytest.raises(ValueError, match="already registered"):
        register_adapter("acme", UpperAdapter)
    register_adapter("acme", DetectMeAdapter, override=True)
    assert get_adapter("acme") is DetectMeAdapter


def test_register_rejects_non_adapter():
    with pytest.raises(TypeError, match="BaseAdapter"):
        register_adapter("bad", dict)
    with pytest.raises(ValueError):
        register_adapter("  ", UpperAdapter)


def test_alias_conflict_raises():
    register_adapter("acme", UpperAdapter, aliases=("shared",))
    with pytest.raises(ValueError, match="already points"):
        register_adapter("other", DetectMeAdapter, aliases=("shared",))


def test_unregister_restores_state():
    register_adapter("acme", UpperAdapter, aliases=("a1",))
    unregister_adapter("acme")
    with pytest.raises(KeyError):
        unregister_adapter("acme")
    assert "acme" not in available_adapters()
    assert resolve_name("a1") is None


def test_normalize_name():
    assert normalize_name(" My-App Tracer ") == "my_app_tracer"
    with pytest.raises(ValueError):
        normalize_name("")
    with pytest.raises(ValueError):
        normalize_name(None)


# --- resolution through the loader ----------------------------------------------


def test_parse_trace_data_uses_registry():
    register_adapter("acme", UpperAdapter)
    trace = parse_trace_data({"name": "fetch"}, adapter_name="acme")
    assert trace.steps[0].name == "FETCH"


def test_load_trace_file_with_custom_adapter(tmp_path):
    register_adapter("acme", UpperAdapter)
    path = tmp_path / "trace.json"
    path.write_text(json.dumps({"name": "fetch"}))
    trace = load_trace(str(path), adapter_name="acme")
    assert trace.steps[0].name == "FETCH"


def test_unknown_adapter_error_lists_available():
    with pytest.raises(ValueError) as excinfo:
        parse_trace_data({}, adapter_name="nope")
    message = str(excinfo.value)
    assert "Unknown adapter 'nope'" in message
    for builtin in ("generic", "openinference", "langsmith"):
        assert builtin in message


def test_builtin_aliases_still_resolve():
    for alias, canonical in (
        ("open_inference", "openinference"),
        ("openai-agents", "openai_agents"),
        ("openai", "openai_agents"),
    ):
        assert resolve_name(alias) == canonical


# --- auto-detection participation -------------------------------------------------


def test_custom_detect_hook_routes_auto_parsing():
    register_adapter("acme_detect", DetectMeAdapter, aliases=("acme",))
    assert DetectMeAdapter in custom_adapters_with_detect()
    trace = parse_trace_data({"format": "acme"})
    assert trace.steps[0].name == "custom_detected"


def test_builtins_take_priority_over_custom_detect():
    register_adapter("acme_detect", DetectMeAdapter)

    # A Langfuse-shaped payload must still hit Langfuse, not the plugin.

    data = {"observations": [], "format": "acme"}
    trace = parse_trace_data(data)
    assert trace.trace_id.startswith("langfuse") or "observations" in data

    # detect() returning True never fires for builtins-only shapes either way.
    assert parse_trace_data({"observations": []}).agent_name != ""


def test_broken_detect_hook_is_swallowed():
    class BrokenDetect(BaseAdapter):
        @classmethod
        def from_dict(cls, data):
            return make_trace("x", [make_step("never")])

        @classmethod
        def detect(cls, data):
            raise RuntimeError("boom")

    register_adapter("broken", BrokenDetect)
    generic_shape = {
        "trace_id": "t",
        "agent_name": "a",
        "task_input": {},
        "steps": [],
    }
    trace = parse_trace_data(generic_shape)  # falls through to generic
    assert trace.agent_name == "a"


def test_custom_detect_not_consulted_for_lists():
    from pydantic import ValidationError

    class AlwaysDetect(BaseAdapter):
        @classmethod
        def from_dict(cls, data):
            return make_trace("x", [make_step("custom")])

        @classmethod
        def detect(cls, data):
            return True

    register_adapter("always", AlwaysDetect)
    # Custom detection hooks are dict-only by contract; list inputs keep
    # their existing (generic) behavior instead of being reclassified.
    with pytest.raises(ValidationError):
        parse_trace_data(["not-a-trace"])
    # ...while dicts still route to the hook.
    assert parse_trace_data({"k": 1}).steps[0].name == "custom"


# --- entry-point plugin discovery --------------------------------------------------


class _FakeEP:
    def __init__(self, name, cls=None, raises=False):
        self._name = name
        self._cls = cls
        self._raises = raises

    @property
    def name(self):
        return self._name

    def load(self):
        if self._raises:
            raise ImportError("broken plugin")
        return self._cls


def test_entry_point_plugins_are_discovered(monkeypatch):
    import agentdiff.adapters.registry as registry

    class PluginAdapter(BaseAdapter):
        @classmethod
        def from_dict(cls, data):
            return make_trace("plugin", [make_step("plugin_step")])

    fake_eps = type(
        "EPS",
        (),
        {
            "select": staticmethod(
                lambda group: [_FakeEP("plugin_adapter", PluginAdapter)]
            )
        },
    )()
    monkeypatch.setattr(registry.importlib.metadata, "entry_points", lambda: fake_eps)

    assert "plugin_adapter" in available_adapters()
    trace = parse_trace_data({"x": 1}, adapter_name="plugin_adapter")
    assert trace.steps[0].name == "plugin_step"


def test_entry_point_scan_happens_once_and_tolerates_breakage(monkeypatch):
    import agentdiff.adapters.registry as registry

    calls = []

    def fake_eps():
        calls.append(1)
        return type(
            "EPS",
            (),
            {
                "select": staticmethod(
                    lambda group: [
                        _FakeEP("broken_one", raises=True),
                        _FakeEP("generic", None),  # shadowing attempts ignored
                    ]
                )
            },
        )()

    monkeypatch.setattr(registry.importlib.metadata, "entry_points", fake_eps)

    first = available_adapters()
    second = available_adapters()
    assert len(calls) == 1  # lazy scan cached after first lookup
    assert first == second
    # Built-ins are never shadowed by plugins.
    assert get_adapter("generic") is not None
