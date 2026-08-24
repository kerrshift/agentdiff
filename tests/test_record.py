"""Tests for the `record` subcommand (E3): recorder module + CLI wiring."""

import json

import pytest
from typer.testing import CliRunner

from agentdiff.cli import app
from agentdiff.models.step import StepStatus
from agentdiff.recorder import record_run, resolve_callable, save_trace

runner = CliRunner()


class TestResolveCallable:
    def test_resolves_module_function(self):
        fn = resolve_callable("json:loads")
        assert callable(fn)

    def test_resolves_dotted_path(self):
        fn = resolve_callable("json.encoder:JSONEncoder.encode")
        assert callable(fn)
        # Instance methods resolve on the unbound class too (callable object)
        fn2 = resolve_callable("json.encoder:JSONEncoder")
        assert callable(fn2)

    def test_rejects_missing_colon(self):
        with pytest.raises(ValueError, match="module:function"):
            resolve_callable("json.loads")

    def test_rejects_missing_module(self):
        with pytest.raises(ValueError, match="Cannot import module"):
            resolve_callable("not_a_real_module_xyz:fn")

    def test_rejects_missing_attribute(self):
        with pytest.raises(ValueError, match="Cannot resolve"):
            resolve_callable("json:not_a_function")

    def test_rejects_non_callable(self):
        with pytest.raises(ValueError, match="non-callable"):
            resolve_callable("json:decoder")


class TestRecordRun:
    def test_records_dict_return(self, tmp_path):
        trace = record_run("json:loads", task_input={"s": '{"a": 1}'})
        assert trace.agent_name == "loads"
        assert trace.final_output == {"a": 1}
        assert len(trace.steps) == 1
        assert trace.steps[0].status == StepStatus.SUCCESS
        assert trace.steps[0].output_payload == {"a": 1}
        assert trace.metadata["recorded_from"] == "json:loads"

    def test_records_string_return_wrapped(self):
        trace = record_run("json:dumps", task_input={"obj": [1, 2]})
        assert trace.final_output == {"output": "[1, 2]"}

    def test_records_error_as_failed_step(self):
        trace = record_run("json:loads", task_input={"s": "not json"})
        assert trace.steps[0].status == StepStatus.ERROR
        assert "JSONDecodeError" in trace.steps[0].error_message
        assert trace.final_output is None

    def test_deterministic_shape_for_identical_runs(self, tmp_path):
        t1 = record_run("json:loads", task_input={"s": '{"x": 1}'})
        t2 = record_run("json:loads", task_input={"s": '{"x": 1}'})
        # Same step id + name so the aligner matches them across runs
        assert t1.steps[0].step_id == t2.steps[0].step_id
        assert t1.steps[0].name == t2.steps[0].name
        assert t1.steps[0].input_payload == t2.steps[0].input_payload

    def test_custom_agent_name(self):
        trace = record_run("json:loads", task_input={"s": "{}"}, agent_name="my-agent")
        assert trace.agent_name == "my-agent"


class TestSaveTrace:
    def test_saves_canonical_json(self, tmp_path):
        trace = record_run("json:loads", task_input={"s": "{}"})
        out = tmp_path / "nested" / "dir" / "run.json"
        result = save_trace(trace, out)
        assert result == out
        data = json.loads(out.read_text())
        assert data["schema_version"] == "1.0.0"
        assert data["metadata"]["recorder"] == "agentdiff record"
        # Round-trips through the normal loader
        from agentdiff.loader import load_trace

        loaded = load_trace(str(out))
        assert loaded.steps[0].name == trace.steps[0].name


class TestRecordCLI:
    def test_record_writes_trace_file(self, tmp_path):
        out = tmp_path / "run.json"
        result = runner.invoke(
            app,
            [
                "record",
                "json:loads",
                "--input",
                '{"s": "{\\"k\\": 5}"}',
                "--out",
                str(out),
            ],
        )
        assert result.exit_code == 0, result.output
        data = json.loads(out.read_text())
        assert data["final_output"] == {"k": 5}

    def test_record_input_from_file(self, tmp_path):
        input_file = tmp_path / "input.json"
        input_file.write_text('{"s": "[1,2]"}')
        out = tmp_path / "run.json"
        result = runner.invoke(
            app,
            ["record", "json:loads", "--input", f"@{input_file}", "--out", str(out)],
        )
        assert result.exit_code == 0, result.output
        data = json.loads(out.read_text())
        assert data["final_output"] == {"output": [1, 2]}

    def test_record_failed_run_exits_1(self, tmp_path):
        out = tmp_path / "run.json"
        result = runner.invoke(
            app,
            ["record", "json:loads", "--input", '{"s": "broken"}', "--out", str(out)],
        )
        assert result.exit_code == 1
        # The failed run is still recorded — that's the trace we want to diff
        data = json.loads(out.read_text())
        assert data["steps"][0]["status"] == "error"

    def test_record_bad_target_exits_2(self):
        result = runner.invoke(app, ["record", "no_colon_here", "--out", "x.json"])
        assert result.exit_code == 2

    def test_record_bad_input_json_exits_2(self, tmp_path):
        result = runner.invoke(
            app,
            [
                "record",
                "json:loads",
                "--input",
                "{not json",
                "--out",
                str(tmp_path / "r.json"),
            ],
        )
        assert result.exit_code == 2

    def test_diff_command_still_works_without_subcommand(
        self, tmp_path, monkeypatch, capsys
    ):
        """E1 compat: `agentdiff base.json cand.json` (no subcommand) still means diff.

        The argv-rewrite lives in main(), so test through main() with patched argv.
        """
        base = tmp_path / "base.json"
        cand = tmp_path / "cand.json"
        base.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        cand.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        monkeypatch.setattr(
            "sys.argv",
            ["agentdiff", str(base), str(cand)],
        )
        from agentdiff.cli import main

        with pytest.raises(SystemExit) as exc:
            main()
        assert exc.value.code == 0
        assert "Comparison Status" in capsys.readouterr().out

    def test_explicit_diff_subcommand(self, tmp_path):
        base = tmp_path / "base.json"
        cand = tmp_path / "cand.json"
        base.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        cand.write_text(
            json.dumps(record_run("json:loads", task_input={"s": "{}"}).model_dump())
        )
        result = runner.invoke(app, ["diff", str(base), str(cand)])
        assert result.exit_code == 0
