# AgentDiff token service

Stateless Cloudflare Worker that mints short-lived (≤1h) GitHub App
installation tokens for AgentDiff workflows, so the approve bot comments as
the branded **agentdiff[bot]** identity with zero per-repo secrets.

**Trust model:** nothing stored (no KV, no DB, no logs). The caller must
present a GitHub Actions token that already has access to the repo it claims;
the App must be installed on that repo. Tokens expire in ≤1 hour regardless.

## Deploy (one-time, ~10 minutes)

```bash
npm install -g wrangler      # or: npx wrangler
wrangler login

# from this directory:
wrangler secret put AGENTDIFF_APP_ID          # paste the App's numeric ID
wrangler secret put AGENTDIFF_APP_PRIVATE_KEY # paste the full PEM (incl. BEGIN/END lines)

npx wrangler deploy           # → https://agentdiff-token.sahilgangurde08.workers.dev
```

The URL is baked into the generated workflows (`init_wizard.TOKEN_SERVICE_URL`)
— keep the Worker name `agentdiff-token` or update that constant and re-run
`agentdiff init`.

## Smoke test

```bash
curl https://agentdiff-token.sahilgangurde08.workers.dev/
# {"service":"agentdiff-token","status":"ok",...}

curl -X POST .../token -H 'Content-Type: application/json' \
  -d '{"repository":"owner/repo","token":"<a workflow token>"}'
# 200 {token, expires_at}            (App installed)
# 403 not installed / token rejected (falls back to github-actions[bot])
```

## GitHub App checklist (browser, ~5 min)

1. github.com/settings/apps/new → **New GitHub App**
2. Name: `AgentDiff CI` · homepage: repo URL · **webhook: disable** (not needed)
3. Upload avatar: `.github/assets/agentdiff-avatar-1024.png`
4. Permissions:
   - Contents: **Read & write** (baseline commits)
   - Issues: **Read & write** · Pull requests: **Read & write** (comments)
   - Actions: **Read & write** (artifact + variable APIs)
   - Checks: **Read & write** (green-flip check run)
   - Secrets: **Read & write** (installer writes repo secrets)
   - Commit statuses: **Read & write** (optional)
5. Where can this app be installed: **Any account** (public listing)
6. Create → note the **App ID** → **Generate a private key** (.pem)
7. Install on the repos you want gated
