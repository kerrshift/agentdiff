"""Pillar 1 — statistical envelopes, variance bands, and topological equivalence."""

import json

import pytest
from conftest import make_step, make_trace
from typer.testing import CliRunner

from agentdiff.cli import app
from agentdiff.config import AgentDiffConfig, load_config
from agentdiff.engine.aligner import mark_commutative_swaps
from agentdiff.engine.comparator import compare, compare_envelope
from agentdiff.loader import load_baseline
from agentdiff.models.envelope import BaselineEnvelope, compute_bands

BASE = ["a", "b", "c", "d", "e", "f", "g"]


def _trace(trace_id, names):
    return make_trace(
        trace_id, [make_step(n, step_index=i) for i, n in enumerate(names)]
    )


def _envelope(runs):
    return BaselineEnvelope.from_runs(runs)


class TestBands:
    def test_means_and_std_devs(self):
        runs = [_trace("r1", BASE), _trace("r2", [*BASE, "h"]), _trace("r3", BASE)]
        bands = compute_bands(runs)
        assert bands["step_count"].mean == pytest.approx(7.3333, abs=1e-3)
        # values 7,8,7 -> sample std dev
        assert bands["step_count"].std_dev == pytest.approx(0.5774, abs=1e-3)

    def test_tool_bands_keyed_by_name(self):
        runs = [_trace("r1", ["a", "a", "b"]), _trace("r2", ["a", "b"])]
        bands = compute_bands(runs)
        assert bands["tool:a"].mean == pytest.approx(1.5)
        assert bands["tool:b"].mean == pytest.approx(1.0)

    def test_single_run_zero_std_dev(self):
        bands = compute_bands([_trace("r1", BASE)])
        assert bands["step_count"].std_dev == 0.0
        assert bands["step_count"].mean == float(len(BASE))


class TestEnvelopeModel:
    def test_round_trip_through_json(self, tmp_path):
        env = _envelope([_trace("r1", BASE), _trace("r2", [*BASE, "h"])])
        path = tmp_path / "baseline.json"
        path.write_text(env.model_dump_json())
        loaded = load_baseline(str(path))
        assert loaded.n_runs == 2
        assert loaded.mode == "statistical"
        assert loaded.scenario == "default"
        assert [t.trace_id for t in loaded.runs] == ["r1", "r2"]
        assert loaded.envelope["step_count"].mean == pytest.approx(7.5)

    def test_v1_baseline_wraps_as_strict(self, tmp_path):
        path = tmp_path / "v1.json"
        path.write_text(_trace("solo", BASE).model_dump_json())
        loaded = load_baseline(str(path))
        assert loaded.n_runs == 1
        assert loaded.mode == "strict"

    def test_statistical_envelope_with_one_run_demotes_to_strict(self, tmp_path):
        env = BaselineEnvelope.from_runs([_trace("solo", BASE)])
        env.mode = "statistical"
        path = tmp_path / "odd.json"
        path.write_text(env.model_dump_json())
        assert load_baseline(str(path)).mode == "strict"

    def test_schema_fields_on_disk(self, tmp_path):
        env = _envelope([_trace("r1", BASE), _trace("r2", BASE)])
        data = json.loads(env.model_dump_json())
        assert data["kind"] == "agentdiff_baseline_envelope"
        assert data["schema_version"] == "2.0.0"
        assert data["recorded_at"] is not None


class TestCompareEnvelope:
    def test_requires_two_runs(self):
        env = _envelope([_trace("r1", BASE)])
        with pytest.raises(ValueError, match=">= 2 recorded runs"):
            compare_envelope(env, _trace("c", BASE))

    def test_benign_candidate_passes(self):
        env = _envelope(
            [_trace("r1", BASE), _trace("r2", [*BASE, "h"]), _trace("r3", BASE)]
        )
        report, gate = compare_envelope(env, _trace("c", [*BASE, "h"]))
        assert gate.passed
        assert report.passed

    def test_step_count_band_breach_is_hard(self):
        env = _envelope([_trace("r1", BASE), _trace("r2", BASE)])
        runaway = _trace("c", [*BASE, "z", "z", "z", "z"])
        report, gate = compare_envelope(env, runaway)
        assert not gate.passed
        assert any(v.code == "step_count_band" for v in gate.violations)
        assert report.passed is False

    def test_cost_ceiling_is_envelope_relative(self):
        r1 = _trace("r1", BASE)
        r2 = _trace("r2", BASE)
        env = _envelope([r1, r2])
        costly = make_trace(
            "c",
            [make_step(n, step_index=i, cost_usd=1.0) for i, n in enumerate(BASE)],
        )
        _report, gate = compare_envelope(env, costly)
        assert not gate.passed
        assert any(v.code == "cost_spike" for v in gate.violations)

    def test_divergence_ceiling_is_hard(self):
        env = _envelope([_trace("r1", BASE), _trace("r2", BASE)])
        alien = _trace("c", ["x", "y", "z", "w", "v", "u", "t"])
        _report, gate = compare_envelope(env, alien)
        assert not gate.passed
        assert any(v.code == "divergence" for v in gate.violations)

    def test_identical_call_loop_flows_through(self):
        env = _envelope([_trace("r1", BASE), _trace("r2", BASE)])
        looper = _trace("c", [*BASE, "z", "z"])
        _report, gate = compare_envelope(env, looper)
        assert not gate.passed
        assert any(v.code == "tool_loop" for v in gate.violations)

    def test_min_tdi_of_n_picks_best_run(self):
        r1 = _trace("r1", BASE)
        r2 = _trace("r2", [*BASE, "h", "i"])
        env = _envelope([r1, r2])
        report, gate = compare_envelope(env, _trace("c", [*BASE, "h", "i"]))
        assert gate.passed
        assert report.candidate_id == "c"
        assert report.trajectory_divergence_index < 0.2

    def test_soft_path_drift_warning(self):
        env = _envelope([_trace("r1", BASE), _trace("r2", [*BASE, "h", "i"])])
        _report, gate = compare_envelope(env, _trace("c", [*BASE, "h", "i", "j"]))
        assert gate.passed
        assert any(w.code == "path_drift" for w in gate.warnings)


class TestCommutativeSwaps:
    def test_independent_swap_zero_penalty(self):
        baseline = _trace("b", ["a", "b"])
        candidate = _trace("c", ["b", "a"])
        report = compare(baseline, candidate)
        assert report.trajectory_divergence_index == 0.0
        statuses = {sd.diff_status.value for sd in report.step_diffs}
        assert "matched_commutative" in statuses
        assert "added" not in statuses and "removed" not in statuses

    def test_dependent_swap_keeps_penalty(self):
        baseline = make_trace(
            "b",
            [
                make_step("a", step_index=0, step_id="s0"),
                make_step("b", step_index=1, step_id="s1", parent_id="s0"),
            ],
        )
        candidate = make_trace(
            "c",
            [
                make_step("b", step_index=0, step_id="c0"),
                make_step("a", step_index=1, step_id="c1", parent_id="c0"),
            ],
        )
        report = compare(baseline, candidate)
        assert report.trajectory_divergence_index > 0.0

    def test_changed_args_not_merged(self):
        baseline = _trace("b", ["fetch"])
        candidate = make_trace(
            "c", [make_step("fetch", step_index=0, input_payload={"q": "x"})]
        )
        diffs = mark_commutative_swaps(
            # raw alignment first: signature matches (same keys), payloads differ
            __import__(
                "agentdiff.engine.aligner", fromlist=["align_traces"]
            ).align_traces(baseline, candidate, strict_tool_signatures=True),
            baseline,
            candidate,
        )
        statuses = {sd.diff_status.value for sd in diffs}
        assert "matched_commutative" not in statuses

    def test_property_mark_pass_never_merges_dependent(self):
        # targetted version of the hypothesis invariant from test_properties
        baseline = make_trace(
            "b",
            [
                make_step("a", step_index=0, step_id="s0"),
                make_step("b", step_index=1, step_id="s1", parent_id="s0"),
                make_step("c", step_index=2, step_id="s2", parent_id="s1"),
            ],
        )
        candidate = make_trace(
            "c",
            [
                make_step("c", step_index=0, step_id="c0"),
                make_step("b", step_index=1, step_id="c1", parent_id="c0"),
                make_step("a", step_index=2, step_id="c2", parent_id="c1"),
            ],
        )
        report = compare(baseline, candidate)
        assert report.trajectory_divergence_index > 0.0


class TestScenarioConfig:
    def test_scenario_section_loads(self, tmp_path):
        cfg_file = tmp_path / "agentdiff.toml"
        cfg_file.write_text(
            "[scenario.customer_refund]\n"
            'mode = "statistical"\n'
            "sample_runs = 5\n"
            "max_cost_increase_pct = 30.0\n"
            "\n"
            "[scenario.customer_refund.hard_invariants]\n"
            "max_tool_repeats = 1\n"
            "\n"
            "[scenario.customer_refund.tolerances]\n"
            "step_count_std_dev = 3.0\n"
            "divergence_ceiling = 0.5\n"
        )
        cfg = load_config(cfg_file)
        sc = cfg.scenario("customer_refund")
        assert sc is not None
        assert sc.mode == "statistical"
        assert sc.sample_runs == 5
        assert sc.max_cost_increase_pct == 30.0
        assert sc.hard_invariants.max_tool_repeats == 1
        assert sc.tolerances.step_count_std_dev == 3.0
        assert sc.tolerances.divergence_ceiling == 0.5

    def test_sole_scenario_needs_no_name(self, tmp_path):
        cfg_file = tmp_path / "agentdiff.toml"
        cfg_file.write_text("[scenario.only_one]\nmode = 'strict'\n")
        cfg = load_config(cfg_file)
        assert cfg.scenario(None).mode == "strict"

    def test_no_scenario_returns_none(self):
        assert AgentDiffConfig().scenario(None) is None


class TestCliEnvelopeFlow:
    def _write_env(self, tmp_path, name, runs):
        env = _envelope(runs)
        path = tmp_path / name
        path.write_text(env.model_dump_json())
        return str(path)

    def test_statistical_baseline_passes_flaky_candidate(self, tmp_path):
        base = self._write_env(
            tmp_path,
            "env.json",
            [
                _trace("r1", BASE),
                _trace("r2", [*BASE, "h"]),
                _trace("r3", [*BASE, "h", "i"]),
            ],
        )
        cand = tmp_path / "cand.json"
        cand.write_text(_trace("c", [*BASE, "h", "i"]).model_dump_json())
        result = CliRunner().invoke(app, [base, str(cand), "--fail-on-regression"])
        assert result.exit_code == 0, result.output

    def test_strict_thresholds_do_not_apply_to_statistical_mode(self, tmp_path):
        # a single-run baseline would fail at max-divergence 0.3; the envelope
        # judges variance instead — CLI divergence flag is ignored in this mode
        base = self._write_env(
            tmp_path, "env.json", [_trace("r1", BASE), _trace("r2", BASE)]
        )
        cand = tmp_path / "cand.json"
        cand.write_text(_trace("c", BASE).model_dump_json())
        result = CliRunner().invoke(app, [base, str(cand), "--max-divergence", "0.01"])
        assert result.exit_code == 0, result.output

    def test_update_baseline_rotates_envelope(self, tmp_path):
        store = self._write_env(
            tmp_path,
            "store.json",
            [
                _trace("r1", BASE),
                _trace("r2", [*BASE, "h"]),
                _trace("r3", [*BASE, "h", "i"]),
            ],
        )
        cand = tmp_path / "cand.json"
        cand.write_text(_trace("c", BASE).model_dump_json())
        result = CliRunner().invoke(
            app,
            [
                str(cand),
                str(cand),
                "--baseline",
                store,
                "--update-baseline",
                "--baseline-rotation",
                "auto",
            ],
        )
        assert result.exit_code == 0, result.output
        loaded = load_baseline(store)
        # rolling window: 3 recorded + 1 new, trimmed back to sample_runs (3)
        assert loaded.n_runs == 3
        assert loaded.runs[-1].trace_id == "c"
        assert loaded.runs[0].trace_id == "r2"

    def test_record_runs_writes_envelope(self, tmp_path):
        out = tmp_path / "env.json"
        result = CliRunner().invoke(
            app,
            [
                "record",
                "json:loads",
                "--input",
                '{"s": "{\\"a\\": 1}"}',
                "--runs",
                "3",
                "--out",
                str(out),
            ],
        )
        assert result.exit_code == 0, result.output
        loaded = load_baseline(str(out))
        assert loaded.n_runs == 3
        assert loaded.mode == "statistical"
        assert all(t.steps[0].name == "loads" for t in loaded.runs)
