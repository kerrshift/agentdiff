"""Token service (worker/) — static contract checks + template wiring."""

from pathlib import Path

WORKER = Path(__file__).resolve().parents[1] / "worker" / "src" / "worker.js"


class TestWorkerSource:
    def test_worker_exists_with_routes(self):
        src = WORKER.read_text()
        assert 'url.pathname === "/token"' in src
        assert 'url.pathname === "/app"' in src
        assert 'url.pathname === "/"' in src

    def test_security_contract(self):
        src = WORKER.read_text()
        # caller token is verified against the GitHub API before minting
        assert (
            "repos/${repository}" in src
            or "repos/${{repository}" in src
            or ("${GH_API}/repos/${repository}" in src)
        )
        # App must be installed on the repo (installation check)
        assert "/installation" in src
        # short-lived JWT for the App auth
        assert "RSASSA-PKCS1-v1_5" in src
        assert "iss: env.AGENTDIFF_APP_ID" in src and "exp: now + 540" in src
        # PKCS#1 -> PKCS#8 normalization (GitHub issues PKCS#1 PEMs)
        assert "BEGIN RSA PRIVATE KEY" in src or "pemToPkcs8" in src

    def test_wrangler_config_is_stateless(self):
        cfg = (WORKER.parent.parent / "wrangler.toml").read_text()
        assert 'name = "agentdiff-token"' in cfg
        # no storage bindings: stateless by construction
        assert "kv_namespaces" not in cfg
        assert "d1_databases" not in cfg

    def test_readme_documents_deployment_and_permissions(self):
        readme = (WORKER.parent.parent / "README.md").read_text()
        assert "wrangler secret put AGENTDIFF_APP_ID" in readme
        assert "wrangler secret put AGENTDIFF_APP_PRIVATE_KEY" in readme
        assert "Checks" in readme  # green-flip permission
        assert "disable" in readme.lower()  # webhook off


class TestTemplateWiring:
    def test_approve_template_uses_hosted_service_with_fallback(self, tmp_path):
        import yaml

        from agentdiff.init_wizard import GENERIC, TOKEN_SERVICE_URL, write_config

        created = write_config(tmp_path, framework=GENERIC, with_approve=True)
        approve = next(p for p in created if p.name == "agentdiff-approve.yml")
        text = approve.read_text()
        assert TOKEN_SERVICE_URL in text
        # three-tier ladder: self-managed App > hosted minter > GITHUB_TOKEN
        assert "steps.app_token.outputs.token" in text
        assert "steps.minted_token.outputs.token" in text
        parsed = yaml.safe_load(text)
        step_names = [s.get("name", "") for s in parsed["jobs"]["approve"]["steps"]]
        assert any("self-managed" in n for n in step_names)
        assert any("hosted service" in n for n in step_names)
        assert any("Select token" in n for n in step_names)

    def test_token_service_url_constant(self):
        from agentdiff.init_wizard import TOKEN_SERVICE_URL

        assert TOKEN_SERVICE_URL == "https://token.agentdiff.app"
        # parseable as a URL
        from urllib.parse import urlparse

        parsed = urlparse(TOKEN_SERVICE_URL)
        assert parsed.scheme == "https" and parsed.netloc
