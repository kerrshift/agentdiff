import json
from unittest import mock

import pytest

from agentdiff.ci.github import (
    post_pr_comment,
    resolve_repo,
    resolve_token,
)


class _FakeResponse:
    def __init__(self, body: bytes):
        self._body = body

    def read(self) -> bytes:
        return self._body

    def readable(self) -> bool:
        return True


def test_resolve_repo_requires_env(monkeypatch):
    monkeypatch.delenv("GITHUB_REPOSITORY", raising=False)
    with pytest.raises(ValueError):
        resolve_repo()


def test_resolve_repo_from_env(monkeypatch):
    monkeypatch.setenv("GITHUB_REPOSITORY", "org/repo")
    assert resolve_repo() == "org/repo"


def test_resolve_token_from_env(monkeypatch):
    monkeypatch.setenv("GITHUB_TOKEN", "sekret")
    assert resolve_token() == "sekret"


def test_resolve_token_missing_raises(monkeypatch):
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    monkeypatch.delenv("GH_TOKEN", raising=False)
    with pytest.raises(ValueError):
        resolve_token()


def test_post_pr_comment_success(monkeypatch):
    created = {"html_url": "https://github.com/org/repo/pull/7#issuecomment-1"}
    monkeypatch.setenv("GITHUB_REPOSITORY", "org/repo")
    monkeypatch.setenv("GITHUB_TOKEN", "t")

    captured = {}

    class _FakeUrlopen:
        def __init__(self, *a, **kw):
            captured["request"] = a[0]

        def __enter__(self):
            return _FakeResponse(json.dumps(created).encode())

        def __exit__(self, *a):
            return False

    with mock.patch("urllib.request.urlopen", _FakeUrlopen):
        result = post_pr_comment("body text", 7)

    assert result == created
    req = captured["request"]
    assert "issues/7/comments" in req.full_url
    assert "Authorization" in req.headers
    body = json.loads(req.data.decode())
    assert body["body"] == "body text"


def test_post_pr_comment_http_error(monkeypatch):
    import io
    import urllib.error

    monkeypatch.setenv("GITHUB_REPOSITORY", "org/repo")
    monkeypatch.setenv("GITHUB_TOKEN", "t")

    err = urllib.error.HTTPError(
        "https://api.github.com/repos/org/repo/issues/7/comments",
        401,
        "Unauthorized",
        {},
        io.BytesIO(b"nope"),
    )
    with mock.patch("urllib.request.urlopen", side_effect=err):
        with pytest.raises(RuntimeError, match="401"):
            post_pr_comment("body", 7)
