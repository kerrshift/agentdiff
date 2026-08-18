from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

DEFAULT_API_URL = "https://api.github.com"


def resolve_repo() -> str:
    """Returns the owner/repo from the environment or raises."""
    repo = os.environ.get("GITHUB_REPOSITORY")
    if not repo or "/" not in repo:
        raise ValueError(
            "Repository not determined. Set GITHUB_REPOSITORY (owner/repo) or pass repo=."
        )
    return repo


def resolve_token() -> str:
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        raise ValueError("A GitHub token is required (GITHUB_TOKEN or GH_TOKEN).")
    return token


def post_pr_comment(
    body: str,
    pr_number: int,
    repo: str | None = None,
    token: str | None = None,
    api_url: str | None = None,
) -> dict:
    """Posts ``body`` as a comment on GitHub PR ``pr_number``.

    Uses the GitHub REST API. Returns the created comment as a dict. Raises
    ``ValueError`` on missing config and ``RuntimeError`` on API failures.
    """
    repo = repo or resolve_repo()
    token = token or resolve_token()
    base = (api_url or os.environ.get("GITHUB_API_URL") or DEFAULT_API_URL).rstrip("/")

    url = f"{base}/repos/{repo}/issues/{pr_number}/comments"
    payload = json.dumps({"body": body}).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8") if e.readable() else str(e)
        raise RuntimeError(
            f"Failed to post PR comment (HTTP {e.code}): {detail}"
        ) from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error posting PR comment: {e.reason}") from e
