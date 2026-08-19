import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const themeScript = `
(function () {
  try {
    if (!location.pathname.startsWith("/docs")) return;
    var root = document.documentElement;
    var stored = localStorage.getItem("agentdiff-theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored || (prefersDark ? "dark" : "light");
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;

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
      suppressHydrationWarning
      className={`${manrope.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <head>
        <Script id="agentdiff-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
