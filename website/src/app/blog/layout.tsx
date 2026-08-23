import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

/**
 * Shared shell for every /blog route: the same sticky Header, Footer, and
 * max-w-7xl grid container as the landing page, so the blog reads as part of
 * the site rather than a separate surface.
 */

export const metadata: Metadata = {
  description:
    "Product news, engineering deep dives, and guides on trajectory regression testing for AI agents.",
};

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

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const version = readPackageVersion();

  return (
    <div className="relative min-h-screen bg-(--bg) text-(--fg) font-sans selection:bg-(--border) selection:text-(--fg) no-scrollbar overflow-x-clip">
      <div className="max-w-7xl mx-auto w-full bg-(--bg) relative">
        <Header version={version} />
        <main className="min-h-[90vh]">{children}</main>
        <Footer version={version} />
      </div>
    </div>
  );
}
