import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AgentDiff — Trajectory Regression Testing for AI Agents",
    template: "%s | AgentDiff",
  },
  description:
    "AgentDiff compares agent execution traces as DAGs in CI/CD — automatically detecting trajectory drift, redundant tool loops, and cost regressions.",
  keywords: ["AI agents", "LLM testing", "trajectory diff", "CI/CD", "regression testing", "agentdiff"],
  authors: [{ name: "AgentDiff" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "AgentDiff — Trajectory Regression Testing for AI Agents",
    description: "Compare agent execution traces as DAGs. Detect drift, loops, and cost regressions in CI/CD.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
