#!/usr/bin/env node
// `npx agentdiff` — runs the AgentDiff Python CLI (PyPI: agent-trajectory-diff)
// at the same version as this npm package, using whichever Python runner the
// machine already has: uvx, then pipx, then a private virtualenv built once
// with any Python 3.10+. No runtime dependencies.
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { version } = require("../package.json");

const SPEC = `agent-trajectory-diff==${version}`;
const IS_WIN = process.platform === "win32";

function which(cmd) {
  const exts = IS_WIN ? (process.env.PATHEXT || ".EXE;.CMD;.BAT").split(";") : [""];
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const candidate = path.join(dir, cmd + ext);
      try {
        if (fs.statSync(candidate).isFile()) {
          fs.accessSync(candidate, fs.constants.X_OK);
          return candidate;
        }
      } catch {
        // not here
      }
    }
  }
  return null;
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.error) {
    console.error(`agentdiff: could not start ${cmd}: ${result.error.message}`);
    return 1;
  }
  if (result.signal) process.kill(process.pid, result.signal);
  return result.status ?? 1;
}

function quiet(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "ignore" });
  return result.error ? 1 : result.status ?? 1;
}

function findPython() {
  for (const name of ["python3", "python"]) {
    const exe = which(name);
    if (exe && quiet(exe, ["-c", "import sys; sys.exit(sys.version_info < (3, 10))"]) === 0) {
      return exe;
    }
  }
  return null;
}

function cacheDir() {
  if (process.env.AGENTDIFF_CACHE_DIR) return process.env.AGENTDIFF_CACHE_DIR;
  if (IS_WIN) {
    return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "agentdiff");
  }
  return path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache"), "agentdiff");
}

function viaVirtualenv(python, args) {
  const venv = path.join(cacheDir(), `venv-${version}`);
  const binDir = path.join(venv, IS_WIN ? "Scripts" : "bin");
  const agentdiff = path.join(binDir, IS_WIN ? "agentdiff.exe" : "agentdiff");
  if (!fs.existsSync(agentdiff)) {
    console.error(`Setting up AgentDiff ${version} in ${venv} (first run only)...`);
    const venvPython = path.join(binDir, IS_WIN ? "python.exe" : "python");
    if (
      quiet(python, ["-m", "venv", venv]) !== 0 ||
      quiet(venvPython, ["-m", "pip", "install", "--quiet", SPEC]) !== 0
    ) {
      console.error(`agentdiff: could not install ${SPEC} with ${python}.`);
      console.error(`Try: pip install "${SPEC}"`);
      return 1;
    }
  }
  return run(agentdiff, args);
}

function main(args) {
  const uvx = which("uvx");
  if (uvx) return run(uvx, ["-q", "--from", SPEC, "agentdiff", ...args]);

  const pipx = which("pipx");
  if (pipx) {
    // Warm pipx's cache silently so its setup chatter stays out of the output.
    quiet(pipx, ["run", "--spec", SPEC, "agentdiff", "--help"]);
    return run(pipx, ["run", "--spec", SPEC, "agentdiff", ...args]);
  }

  const python = findPython();
  if (python) return viaVirtualenv(python, args);

  console.error(
    [
      "agentdiff needs Python 3.10+ (or uv) and none was found.",
      "  uv:      https://docs.astral.sh/uv/getting-started/installation/",
      "  Python:  https://www.python.org/downloads/",
    ].join("\n"),
  );
  return 1;
}

process.exitCode = main(process.argv.slice(2));
