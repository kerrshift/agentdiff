import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import DocsClient, { DocPage } from "./DocsClient";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "AgentDiff documentation: installation, CLI reference, adapters for OpenAI Agents, Langfuse, LangSmith and OpenInference, CI/CD GitHub Action setup, and cookbooks.",
  alternates: {
    canonical: "/docs",
  },
};

/** Read the version string from the package `__init__.py` at build time. */
function readPackageVersion(): string {
  try {
    // __init__.py sits in the monorepo's src/, one level above website/
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

export default function DocsPage() {
  const docsDir = path.join(process.cwd(), "docs");
  const docs: DocPage[] = [];
  const version = readPackageVersion();

  if (fs.existsSync(docsDir)) {
    // Scan categories (subdirectories) under docs/
    const categories = fs.readdirSync(docsDir).sort();

    for (const category of categories) {
      const catPath = path.join(docsDir, category);
      if (fs.statSync(catPath).isDirectory()) {
        // Scan files inside category folder
        const files = fs.readdirSync(catPath).sort();

        for (const file of files) {
          if (file.endsWith(".md")) {
            const filePath = path.join(catPath, file);
            const content = fs.readFileSync(filePath, "utf-8");
            
            // Strip .md extension
            const titleWithoutExt = file.replace(/\.md$/, "");
            
            // Build a clean, lowercase URL slug by stripping numeric prefix
            const slug = titleWithoutExt
              .replace(/^\d+-\s*/, "")
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, ""); // Keep URL alphanumeric

            docs.push({
              slug,
              title: titleWithoutExt,
              category,
              content
            });
          }
        }
      }
    }
  }

  return <DocsClient docs={docs} version={version} />;
}
