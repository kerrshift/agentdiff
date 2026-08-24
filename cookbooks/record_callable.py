"""Cookbook: `agentdiff record` — capture a trace from a callable with zero telemetry.

E3 closes the biggest onboarding question: "how do I get a trace?" If your
"agent" is a plain function (or you just want output-regression detection),
`record` runs it once and writes a canonical AgentDiff trace — no adapters,
no OTel, no framework needed.

Run:  uv run cookbooks/record_callable.py
"""

import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).parent
WORK = HERE / "_record_demo"
WORK.mkdir(exist_ok=True)

# 1. A tiny "agent" with no telemetry — a plain callable in its own module.
agent_module = WORK / "support_agent.py"
agent_module.write_text(
    '''
"""A minimal support agent: keyword lookup, no framework."""

def run(question: str, escalate: bool = False):
    kb = {
        "refund": "Refunds process in 3-5 business days.",
        "shipping": "Standard shipping takes 5-7 days.",
    }
    key = next((k for k in kb if k in question.lower()), None)
    if escalate:
        return {"answer": kb.get(key, "Escalating to a human."), "escalated": True}
    return {"answer": kb.get(key, "Sorry, I can't help with that.")}
''',
    encoding="utf-8",
)

AGENT = f"{agent_module.stem}:run"


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    print("$", " ".join(cmd), f"(cwd={WORK.name}/)")
    # record resolves the callable from CWD — run inside the demo dir,
    # exactly like a user would from their project root.
    return subprocess.run(cmd, capture_output=True, text=True, cwd=WORK)


# 2. Record the baseline: the agent behaving correctly.
r1 = run([sys.executable, "-m", "agentdiff", "record", AGENT,
          "--input", '{"question": "How do refunds work?"}',
          "--out", "baseline.json"])
print(r1.stdout.strip())

# 3. Record a candidate: same question, but the escalation flag changed the output shape.
r2 = run([sys.executable, "-m", "agentdiff", "record", AGENT,
          "--input", '{"question": "How do refunds work?", "escalate": true}',
          "--out", "candidate.json"])
print(r2.stdout.strip())

# 4. Diff them — AgentDiff catches the output-shape change.
result = run([sys.executable, "-m", "agentdiff",
              "baseline.json", "candidate.json",
              "--fail-on-regression", "--max-divergence", "0.1"])
print(result.stdout)
if result.returncode != 0:
    print(f"(gate blocked the change — exit {result.returncode}, as expected)")

# 5. Record a failing run — errors are captured too, ready to diff.
r3 = run([sys.executable, "-m", "agentdiff", "record", AGENT,
          "--input", '{"question": 12345}',
          "--out", "failed.json"])
print(r3.stdout.strip() or r3.stderr.strip())

print(__doc__)
print(f"Demo artifacts in {WORK}")
