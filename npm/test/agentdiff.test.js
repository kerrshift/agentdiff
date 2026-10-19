"use strict";
// Exercises the launcher's runner selection with stub executables on PATH.
// Each stub appends its argv to a log file so the test can see what ran.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const BIN = path.join(__dirname, "..", "bin", "agentdiff.js");
const { version } = require("../package.json");
const SPEC = `agent-trajectory-diff==${version}`;

const skipOnWindows = { skip: process.platform === "win32" };

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agentdiff-npm-"));
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  return { dir, bin, log: path.join(dir, "calls.log") };
}

function stub(binDir, name, body) {
  const file = path.join(binDir, name);
  fs.writeFileSync(file, `#!/bin/sh\n${body}\n`, { mode: 0o755 });
}

function logArgs(log, name) {
  return `echo "${name} $*" >> "${log}"`;
}

function launch(sb, args) {
  return spawnSync(process.execPath, [BIN, ...args], {
    env: { PATH: `${sb.bin}:/bin`, HOME: sb.dir, AGENTDIFF_CACHE_DIR: path.join(sb.dir, "cache") },
    encoding: "utf8",
  });
}

function calls(sb) {
  return fs.existsSync(sb.log) ? fs.readFileSync(sb.log, "utf8").trim().split("\n") : [];
}

test("prefers uvx and pins the matching PyPI version", skipOnWindows, () => {
  const sb = sandbox();
  stub(sb.bin, "uvx", logArgs(sb.log, "uvx"));
  stub(sb.bin, "pipx", logArgs(sb.log, "pipx"));
  const result = launch(sb, ["--since", "30d"]);
  assert.equal(result.status, 0);
  assert.deepEqual(calls(sb), [`uvx -q --from ${SPEC} agentdiff --since 30d`]);
});

test("falls back to pipx when uv is missing", skipOnWindows, () => {
  const sb = sandbox();
  stub(sb.bin, "pipx", logArgs(sb.log, "pipx"));
  const result = launch(sb, ["--json"]);
  assert.equal(result.status, 0);
  assert.deepEqual(calls(sb), [
    `pipx run --spec ${SPEC} agentdiff --help`,
    `pipx run --spec ${SPEC} agentdiff --json`,
  ]);
});

test("builds a private virtualenv with plain Python, once", skipOnWindows, () => {
  const sb = sandbox();
  // Fake python3: passes the version check, and `-m venv DIR` creates a venv
  // whose python (pip install) and agentdiff log their calls.
  stub(
    sb.bin,
    "python3",
    `${logArgs(sb.log, "python3")}
if [ "$1" = "-m" ] && [ "$2" = "venv" ]; then
  mkdir -p "$3/bin"
  printf '#!/bin/sh\\necho "venv-python $*" >> "${sb.log}"\\n' > "$3/bin/python"
  printf '#!/bin/sh\\necho "venv-agentdiff $*" >> "${sb.log}"\\nexit 3\\n' > "$3/bin/agentdiff"
  chmod +x "$3/bin/python" "$3/bin/agentdiff"
fi
exit 0`,
  );
  const first = launch(sb, ["--top", "2"]);
  assert.equal(first.status, 3, "propagates the CLI's exit code");
  assert.match(first.stderr, /first run only/);
  const venv = path.join(sb.dir, "cache", `venv-${version}`);
  assert.deepEqual(calls(sb), [
    "python3 -c import sys; sys.exit(sys.version_info < (3, 10))",
    `python3 -m venv ${venv}`,
    `venv-python -m pip install --quiet ${SPEC}`,
    "venv-agentdiff --top 2",
  ]);

  fs.writeFileSync(sb.log, "");
  launch(sb, []);
  assert.deepEqual(calls(sb).filter(Boolean).slice(-1), ["venv-agentdiff"]);
  assert.ok(!calls(sb).some((c) => c.includes("pip install")), "reuses the venv");
});

test("explains what to install when nothing is available", skipOnWindows, () => {
  const sb = sandbox();
  const result = launch(sb, []);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /needs Python 3\.10\+ \(or uv\)/);
});
