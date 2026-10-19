#!/usr/bin/env bash
# Runs the AgentDiff session report for the /agentdiff:report skill.
#
# Prefers an installed `agentdiff` that has the `sessions` command, then falls
# back to uvx. Always exits 0: a failed skill shell command aborts the whole
# skill, so problems are printed as text for Claude to relay instead.
set -u

export COLUMNS="${COLUMNS:-100}"
export NO_COLOR=1

if command -v agentdiff >/dev/null 2>&1 && agentdiff sessions --help >/dev/null 2>&1; then
  agentdiff sessions "$@" 2>&1 || echo "AgentDiff exited with an error (see above)."
elif command -v uvx >/dev/null 2>&1; then
  uvx -q --from 'agent-trajectory-diff>=0.6.0' agentdiff sessions "$@" 2>&1 \
    || echo "AgentDiff exited with an error (see above)."
else
  cat <<'EOF'
AgentDiff could not run: neither `agentdiff` (0.6.0 or later) nor `uvx` was found.

Install one of these, then run /agentdiff:report again:
  - uv:      https://docs.astral.sh/uv/getting-started/installation/
  - pip:     pip install "agent-trajectory-diff>=0.6.0"
EOF
fi
exit 0
