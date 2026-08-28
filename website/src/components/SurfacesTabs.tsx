"use client";

import { useState } from "react";
import Link from "next/link";

const TABS = [
  {
    id: "cli",
    label: "CLI",
    href: "/quickstart",
    cta: "Quickstart",
    code: "agentdiff record my_agent:run --input '{...}' --out traces/run.json\nagentdiff traces/baseline.json traces/run.json --explain --tree",
    body: "Record, diff, and gate from the terminal. Exit codes 0/1/2/3 for CI.",
  },
  {
    id: "pytest",
    label: "pytest",
    href: "/docs/pytest-plugin",
    cta: "pytest docs",
    code: "def test_support_agent(agentdiff_trace):\n    ...\n# pytest --agentdiff --agentdiff-update-baselines",
    body: "Committed baselines per test, auto-compared. Fails the suite on regression.",
  },
  {
    id: "action",
    label: "GitHub Action",
    href: "/action",
    cta: "Action docs",
    code: "- uses: lostmartian/agentdiff/.github/actions/agentdiff-check@main\n  with:\n    baseline: baselines/current.json\n    candidate: traces/pr.json\n    pr: ${{ github.event.number }}",
    body: "Posts the divergence report as a PR comment; blocks on regression.",
  },
  {
    id: "sdk",
    label: "Python SDK",
    href: "/docs/introduction",
    cta: "SDK docs",
    code: "from agentdiff import compare, load_trace\n\nreport = compare(baseline, candidate)\nif not report.passed: ...",
    body: "Programmatic comparison, scenario runner with per-scenario thresholds.",
  },
];

export default function SurfacesTabs() {
  const [active, setActive] = useState("cli");
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <div className="rounded-2xl border border-(--border) bg-(--surface) overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex gap-1 p-2 border-b border-(--border) bg-(--surface-2) overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === t.id ? "bg-(--fg) text-(--bg)" : "text-(--muted) hover:text-(--fg) hover:bg-(--bg)"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold tracking-tight">{tab.label}</h3>
          <Link href={tab.href} className="text-xs font-medium text-(--muted) hover:text-(--fg) transition-colors">
            {tab.cta} →
          </Link>
        </div>
        <pre className="text-[12px] leading-relaxed bg-(--code-bg) border border-(--border) rounded-lg p-3.5 overflow-x-auto text-(--muted) font-mono">
          {tab.code}
        </pre>
        <p className="mt-4 text-sm text-(--muted) leading-relaxed">{tab.body}</p>
      </div>
    </div>
  );
}
