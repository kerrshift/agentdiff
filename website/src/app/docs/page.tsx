import fs from "fs";
import path from "path";
import DocsClient, { DocPage } from "./DocsClient";

/** Read the version string from the root pyproject.toml at build time. */
function readPackageVersion(): string {
  try {
    // pyproject.toml sits at the monorepo root, one level above website/
    const tomlPath = path.join(process.cwd(), "..", "pyproject.toml");
    const toml = fs.readFileSync(tomlPath, "utf-8");
    const match = toml.match(/^version\s*=\s*"([^"]+)"/m);
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
