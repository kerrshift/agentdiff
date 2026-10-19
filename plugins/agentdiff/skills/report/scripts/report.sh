#!/usr/bin/env bash
# Runs the AgentDiff session report for the /agentdiff:report skill.
#
# Tries, in order: an installed `agentdiff` that has the `sessions` command,
# uvx, pipx, then a private virtualenv built with any Python 3.10+ (created
# once under ~/.cache/agentdiff). Always exits 0: a failed skill shell command
# aborts the whole skill, so problems are printed as text for Claude to relay.
set -u

SPEC='agent-trajectory-diff>=0.6.0'
export COLUMNS="${COLUMNS:-100}"
export NO_COLOR=1

fail() { echo "AgentDiff exited with an error (see above)."; }

has_sessions() { "$1" sessions --help >/dev/null 2>&1; }

find_python() {
  for py in python3 python; do
    if command -v "$py" >/dev/null 2>&1 \
      && "$py" -c 'import sys; sys.exit(sys.version_info < (3, 10))' 2>/dev/null; then
      echo "$py"
      return 0
    fi
  done
  return 1
}

if command -v agentdiff >/dev/null 2>&1 && has_sessions agentdiff; then
  agentdiff sessions "$@" 2>&1 || fail
elif command -v uvx >/dev/null 2>&1; then
  uvx -q --from "$SPEC" agentdiff sessions "$@" 2>&1 || fail
elif command -v pipx >/dev/null 2>&1; then
  # Warm pipx's cache silently so its setup chatter stays out of the report.
  pipx run --spec "$SPEC" agentdiff --help >/dev/null 2>&1
  pipx run --spec "$SPEC" agentdiff sessions "$@" 2>&1 || fail
elif PY=$(find_python); then
  VENV="${XDG_CACHE_HOME:-$HOME/.cache}/agentdiff/venv"
  BIN="$VENV/bin/agentdiff"
  if [ ! -x "$BIN" ] || ! has_sessions "$BIN"; then
    echo "Setting up AgentDiff in $VENV (first run only)..."
    "$PY" -m venv "$VENV" >/dev/null 2>&1 \
      && "$VENV/bin/python" -m pip install --quiet --upgrade "$SPEC" >/dev/null 2>&1 \
      || { echo "Could not install AgentDiff with $PY. Try: pip install \"$SPEC\""; exit 0; }
  fi
  "$BIN" sessions "$@" 2>&1 || fail
else
  cat <<'EOF'
AgentDiff could not run: it needs Python 3.10+ (or uv) and none was found.

Install one of these, then run /agentdiff:report again:
  - uv:      https://docs.astral.sh/uv/getting-started/installation/
  - Python:  https://www.python.org/downloads/
EOF
fi
exit 0
