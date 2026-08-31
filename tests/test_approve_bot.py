"""Pillar 3 — /agentdiff approve: in-PR re-baselining with the D3 policy."""

import pytest
from conftest import make_step, make_trace

from agentdiff.ci.approve import approve_candidate
from agentdiff.loader import load_baseline
from agentdiff.models.envelope import BaselineEnvelope

BASE = ["a", "b", "c", "d", "e", "f", "g"]


def _trace(trace_id, names):
    return make_trace(
        trace_id, [make_step(n, step_index=i) for i, n in enumerate(names)]
    )


@pytest.fixture
def envelope_file(tmp_path):
    env = BaselineEnvelope.from_runs([_trace("r1", BASE), _trace("r2", BASE)])
    path = tmp_path / "env.json"
    path.write_text(env.model_dump_json())
    return str(path)


class TestApprovePolicy:
    def test_benign_drift_is_blessable(self, envelope_file, tmp_path):
        cand = tmp_path / "cand.json"
        cand.write_text(_trace("cand", [*BASE, "extra"]).model_dump_json())
        decision = approve_candidate(envelope_file, str(cand))
        assert decision.approved

    def test_loop_is_never_blessable(self, envelope_file, tmp_path):
        looper = tmp_path / "looper.json"
        looper.write_text(_trace("looper", [*BASE, "z", "z"]).model_dump_json())
        decision = approve_candidate(envelope_file, str(looper))
        assert not decision.approved
        codes = {f.code for f in decision.unblessable_findings}
        assert "tool_loop" in codes or "loops" in codes
        # baseline untouched
        assert [t.trace_id for t in load_baseline(envelope_file).runs] == ["r1", "r2"]

    def test_cost_spike_is_human_blessable(self, envelope_file, tmp_path):
        costly = make_trace(
            "costly",
            [make_step(n, step_index=i, cost_usd=1.0) for i, n in enumerate(BASE)],
        )
        cand = tmp_path / "cand.json"
        cand.write_text(costly.model_dump_json())
        decision = approve_candidate(envelope_file, str(cand))
        assert decision.approved
        assert "cost_spike" in decision.reason


class TestApproveRotation:
    def test_envelope_appends_and_rotates(self, envelope_file, tmp_path):
        cand = tmp_path / "cand.json"
        cand.write_text(_trace("cand", BASE).model_dump_json())
        approve_candidate(envelope_file, str(cand), sample_runs=2)
        loaded = load_baseline(envelope_file)
        # window of 2: oldest dropped, candidate most recent
        assert loaded.n_runs == 2
        assert loaded.runs[-1].trace_id == "cand"
        assert loaded.runs[0].trace_id == "r2"

    def test_strict_baseline_is_replaced(self, tmp_path):
        baseline = tmp_path / "baseline.json"
        baseline.write_text(_trace("old", BASE).model_dump_json())
        cand = tmp_path / "cand.json"
        cand.write_text(_trace("cand", [*BASE, "x"]).model_dump_json())
        decision = approve_candidate(str(baseline), str(cand))
        assert decision.approved
        loaded = load_baseline(str(baseline))
        assert loaded.n_runs == 1
        assert loaded.runs[0].trace_id == "cand"


class TestWorkflowTemplates:
    def test_check_workflow_uploads_candidate_artifact(self, tmp_path):
        from agentdiff.init_wizard import GENERIC, write_config

        created = write_config(tmp_path, framework=GENERIC)
        check = next(p for p in created if p.name == "agentdiff.yml")
        text = check.read_text()
        assert "actions/upload-artifact@v4" in text
        assert "agentdiff-candidate-trace" in text

    def test_approve_workflow_guardrails(self, tmp_path):
        from agentdiff.init_wizard import GENERIC, write_config

        created = write_config(tmp_path, framework=GENERIC, with_approve=True)
        approve = next(p for p in created if p.name == "agentdiff-approve.yml")
        text = approve.read_text()
        # command filter + bot exclusion + permission gate + concurrency
        assert "startsWith(github.event.comment.body, '/agentdiff approve')" in text
        assert "github.event.comment.user.type != 'Bot'" in text
        assert "collaborators" in text
        assert "cancel-in-progress: false" in text
        # artifact download wired to the check run
        assert "actions/download-artifact@v4" in text
        assert "run-id:" in text
        # zero-setup default: GITHUB_TOKEN works end-to-end
        assert "checks: write" in text
        assert "check-runs" in text  # green flip via the Checks API
        assert "Re-baselined via /agentdiff approve" in text
        # branded identity remains opt-in
        assert "create-github-app-token" in text
        assert "agentdiff[bot]" in text
        # valid YAML
        import yaml

        parsed = yaml.safe_load(text)
        assert parsed["permissions"]["checks"] == "write"

    def test_approve_workflow_written_only_on_flag(self, tmp_path):
        from agentdiff.init_wizard import GENERIC, write_config

        created = write_config(tmp_path, framework=GENERIC)
        assert not any(p.name == "agentdiff-approve.yml" for p in created)
