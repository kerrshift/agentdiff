import type { Metadata } from "next";
import AdaptersClient from "./AdaptersClient";

const SITE_URL = "https://agentdiff.app";

export const metadata: Metadata = {
  title: "Universal Adapters — Ingest LangGraph, CrewAI, OpenAI, & OTel Traces",
  description:
    "Zero-rewrite trace ingestion for LangGraph, CrewAI, OpenAI Agents SDK, OpenTelemetry / OpenInference, Langfuse, and LangSmith. Auto-detects schemas and diffs DAGs in CI.",
  keywords: [
    "LangGraph trace diff",
    "CrewAI testing",
    "OpenAI Agents SDK traces",
    "OpenTelemetry OpenInference",
    "Langfuse trace export",
    "LangSmith run trees",
    "agent telemetry adapter",
    "DAG diffing",
  ],
  authors: [{ name: "AgentDiff", url: SITE_URL }],
  creator: "AgentDiff",
  publisher: "AgentDiff",
  alternates: { canonical: "/adapters" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Universal Ecosystem Adapters | AgentDiff",
    description:
      "Ingest traces from LangGraph, CrewAI, OpenAI Agents SDK, OpenTelemetry, Langfuse, and LangSmith with zero rewrite.",
    url: `${SITE_URL}/adapters`,
    siteName: "AgentDiff",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Universal Ecosystem Adapters | AgentDiff",
    description:
      "Ingest traces from LangGraph, CrewAI, OpenAI Agents SDK, OpenTelemetry, Langfuse, and LangSmith with zero rewrite.",
  },
};

export default function AdaptersPage() {
  return <AdaptersClient />;
}
