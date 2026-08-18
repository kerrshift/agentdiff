import json
from unittest import mock

from conftest import make_step, make_trace
from typer.testing import CliRunner

from agentdiff.cli import app


def _write_trace(tmp_path, name, trace):
    path = tmp_path / name
    path.write_text(trace.model_dump_json())
    return str(path)


def test_diff_identical_traces_passes(tmp_path):
    steps = [make_step("a"), make_step("b")]
    base = _write_trace(tmp_path, "base.json", make_trace("b", steps))
    cand = _write_trace(tmp_path, "cand.json", make_trace("c", steps))

    result = CliRunner().invoke(app, [base, cand])

    assert result.exit_code == 0
    assert "PASSED" in result.stdout


def test_diff_regression_returns_exit_1(tmp_path):
    base = _write_trace(
        tmp_path, "base.json", make_trace("b", [make_step("a"), make_step("b")])
    )
    cand = _write_trace(
        tmp_path,
        "cand.json",
        make_trace("c", [make_step("a"), make_step("a"), make_step("a")]),
    )

    result = CliRunner().invoke(
        app, [base, cand, "--fail-on-regression", "--max-divergence", "0.1"]
    )

    assert result.exit_code == 1
    assert "FAILED" in result.stdout


def test_diff_pass_without_fail_flag_returns_0(tmp_path):
    base = _write_trace(
        tmp_path, "base.json", make_trace("b", [make_step("a"), make_step("b")])
    )
    cand = _write_trace(
        tmp_path,
        "cand.json",
        make_trace("c", [make_step("a"), make_step("a"), make_step("a")]),
    )

    # no --fail-on-regression: reports regression but exits 0
    result = CliRunner().invoke(app, [base, cand, "--max-divergence", "0.1"])
    assert result.exit_code == 0


def test_diff_json_output(tmp_path):
    steps = [make_step("a")]
    base = _write_trace(tmp_path, "base.json", make_trace("b", steps))
    cand = _write_trace(tmp_path, "cand.json", make_trace("c", steps))

    result = CliRunner().invoke(app, [base, cand, "--format", "json"])

    assert result.exit_code == 0
    payload = json.loads(result.stdout)
    assert payload["baseline_id"] == "b"
    assert payload["candidate_id"] == "c"


def test_diff_markdown_output(tmp_path):
    steps = [make_step("a")]
    base = _write_trace(tmp_path, "base.json", make_trace("b", steps))
    cand = _write_trace(tmp_path, "cand.json", make_trace("c", steps))

    result = CliRunner().invoke(app, [base, cand, "--format", "markdown"])

    assert result.exit_code == 0
    assert "# AgentDiff Comparison Report" in result.stdout


def test_diff_writes_output_file(tmp_path):
    steps = [make_step("a")]
    base = _write_trace(tmp_path, "base.json", make_trace("b", steps))
    cand = _write_trace(tmp_path, "cand.json", make_trace("c", steps))
    out = tmp_path / "report.json"

    result = CliRunner().invoke(
        app, [base, cand, "--format", "json", "--output-file", str(out)]
    )

    assert result.exit_code == 0
    assert out.exists()
    assert json.loads(out.read_text())["baseline_id"] == "b"


def test_diff_missing_file_returns_2(tmp_path):
    result = CliRunner().invoke(
        app, [str(tmp_path / "missing.json"), str(tmp_path / "x.json")]
    )
    assert result.exit_code == 2


def test_diff_invalid_format_returns_2(tmp_path):
    steps = [make_step("a")]
    base = _write_trace(tmp_path, "base.json", make_trace("b", steps))
    cand = _write_trace(tmp_path, "cand.json", make_trace("c", steps))

    result = CliRunner().invoke(app, [base, cand, "--format", "xml"])
    assert result.exit_code == 2


# ── Baseline storage ─────────────────────────────────────────────────────────


def test_baseline_established_on_first_run(tmp_path):
    steps = [make_step("a"), make_step("b")]
    cand = _write_trace(tmp_path, "cand.json", make_trace("c", steps))
    store = tmp_path / "baseline.json"

    result = CliRunner().invoke(
        app, [cand, cand, "--baseline", str(store), "--update-baseline"]
    )

    assert result.exit_code == 0
    assert "Baseline established" in result.stdout
    assert store.exists()


def test_baseline_missing_without_update_returns_2(tmp_path):
    steps = [make_step("a")]
    cand = _write_trace(tmp_path, "cand.json", make_trace("c", steps))
    store = tmp_path / "missing.json"

    result = CliRunner().invoke(app, [cand, cand, "--baseline", str(store)])

    assert result.exit_code == 2
    assert "Baseline not found" in (result.stdout + result.stderr)
    assert not store.exists()


def test_baseline_updated_on_clean_diff(tmp_path):
    steps = [make_step("a"), make_step("b")]
    store = _write_trace(tmp_path, "baseline.json", make_trace("b", steps))
    cand = _write_trace(tmp_path, "cand.json", make_trace("c", steps))

    result = CliRunner().invoke(
        app, [store, cand, "--baseline", store, "--update-baseline"]
    )

    assert result.exit_code == 0
    assert "Baseline updated" in result.stdout
    # clean diff (identical steps) -> candidate replaces baseline content
    assert (tmp_path / "baseline.json").read_text() == (
        tmp_path / "cand.json"
    ).read_text()


def test_baseline_not_updated_on_regression(tmp_path):
    base_steps = [make_step("a"), make_step("b")]
    store = _write_trace(tmp_path, "baseline.json", make_trace("b", base_steps))
    cand = _write_trace(
        tmp_path,
        "cand.json",
        make_trace("c", [make_step("a"), make_step("a"), make_step("a")]),
    )
    before = (tmp_path / "baseline.json").read_text()

    CliRunner().invoke(
        app,
        [
            store,
            cand,
            "--baseline",
            store,
            "--update-baseline",
            "--max-divergence",
            "0.1",
        ],
    )

    # regression detected -> baseline left untouched
    assert (tmp_path / "baseline.json").read_text() == before


def test_baseline_store_compared_against_candidate(tmp_path):
    base_steps = [make_step("a"), make_step("b")]
    store = _write_trace(tmp_path, "baseline.json", make_trace("b", base_steps))
    cand = _write_trace(
        tmp_path,
        "cand.json",
        make_trace("c", [make_step("a"), make_step("a"), make_step("a")]),
    )

    result = CliRunner().invoke(
        app, [store, cand, "--baseline", store, "--fail-on-regression"]
    )

    # divergence between the stored baseline and candidate -> fails
    assert result.exit_code == 1
    assert "FAILED" in result.stdout


def test_diff_pr_posts_markdown_comment(tmp_path):
    base = _write_trace(
        tmp_path, "base.json", make_trace("b", [make_step("a"), make_step("b")])
    )
    cand = _write_trace(
        tmp_path, "cand.json", make_trace("c", [make_step("a"), make_step("x")])
    )

    with mock.patch(
        "agentdiff.cli.post_pr_comment",
        return_value={"html_url": "https://github.com/o/r/pull/3#c-1"},
    ) as mocked:
        result = CliRunner().invoke(
            app, [base, cand, "--pr", "3", "--fail-on-regression"]
        )

    assert result.exit_code == 1
    mocked.assert_called_once()
    body = mocked.call_args.args[0]
    assert "AgentDiff" in body
    assert "Posted AgentDiff comment to PR #3" in result.stdout
