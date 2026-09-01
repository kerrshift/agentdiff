import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL("https://agentdiff.app"),
  title: {
    default: "AgentDiff - Trajectory Regression Testing for AI Agents",
    template: "%s | AgentDiff",
  },
  description:
    "AgentDiff compares agent execution traces as DAGs in CI/CD - automatically detecting trajectory drift, redundant tool loops, and cost regressions.",
  applicationName: "AgentDiff",
  keywords: [
    "AI agents",
    "LLM testing",
    "trajectory diff",
    "CI/CD",
    "regression testing",
    "agent observability",
    "tool loop detection",
    "agent evaluation",
    "langfuse",
    "langsmith",
  ],
  authors: [{ name: "AgentDiff", url: "https://agentdiff.app" }],
  creator: "AgentDiff",
  publisher: "AgentDiff",
  category: "Developer Tools",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "AgentDiff - Trajectory Regression Testing for AI Agents",
    description: "Compare agent execution traces as DAGs. Detect drift, loops, and cost regressions in CI/CD.",
    url: "https://agentdiff.app",
    siteName: "AgentDiff",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "AgentDiff - Trajectory Regression Testing for AI Agents",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentDiff - Trajectory Regression Testing for AI Agents",
    description: "Compare agent execution traces as DAGs. Detect drift, loops, and cost regressions in CI/CD.",
    images: ["/og.png"],
  },
  appleWebApp: {
    title: "AgentDiff",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#FBFBFC",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://agentdiff.app/#website",
      url: "https://agentdiff.app/",
      name: "AgentDiff",
      description:
        "Trajectory regression testing for AI agents. Diff agent execution traces as DAGs and block drift, tool loops, and cost spikes in CI/CD.",
      publisher: { "@id": "https://agentdiff.app/#organization" },
    },
    {
      "@type": "Organization",
      "@id": "https://agentdiff.app/#organization",
      name: "AgentDiff",
      url: "https://agentdiff.app/",
      logo: "https://agentdiff.app/favicon.svg",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://agentdiff.app/#software",
      name: "AgentDiff",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      url: "https://agentdiff.app/",
      description:
        "AgentDiff compares AI agent execution traces as DAGs in CI/CD, detecting trajectory drift, tool loops, and cost regressions.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      softwareVersion: "0.3.0",
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
