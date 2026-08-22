import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import DocsShell from "./DocsShell";
import { getDocMetas } from "../../lib/docs";

/** Read the version string from the package `__init__.py` at build time. */
function readPackageVersion(): string {
  try {
    const initPath = path.join(
      process.cwd(),
      "..",
      "src",
      "agentdiff",
      "__init__.py",
    );
    const source = fs.readFileSync(initPath, "utf-8");
    const match = source.match(/^__version__\s*=\s*"([^"]+)"/m);
    return match ? match[1] : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export const metadata: Metadata = {
  title: {
    default: "Documentation | AgentDiff",
    template: "%s | AgentDiff",
  },
  description:
    "AgentDiff documentation: installation, CLI reference, adapters for LangGraph, CrewAI, OpenAI Agents SDK, Langfuse, LangSmith and OpenInference, scenario suites, A/B benchmarking, CI/CD GitHub Action setup, and cookbooks.",
  alternates: {
    canonical: "/docs",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = getDocMetas();
  const version = readPackageVersion();

  return (
    <DocsShell docs={docs} version={version}>
      {children}
    </DocsShell>
  );
}
