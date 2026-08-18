import fs from "fs";
import path from "path";
import Header from "../components/Header";
import Hero from "../components/Hero";
import BlueprintWorkspace from "../components/BlueprintWorkspace";
import ProblemSolution from "../components/ProblemSolution";
import FeaturesGrid from "../components/FeaturesGrid";
import ActionSection from "../components/ActionSection";
import IntegrationShowcase from "../components/IntegrationShowcase";
import ClosingCTA from "../components/ClosingCTA";
import Footer from "../components/Footer";

/** Read the version string from the root pyproject.toml at build time. */
function readPackageVersion(): string {
  try {
    const tomlPath = path.join(process.cwd(), "..", "pyproject.toml");
    const toml = fs.readFileSync(tomlPath, "utf-8");
    const match = toml.match(/^version\s*=\s*"([^"]+)"/m);
    return match ? match[1] : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#FBFBFC] text-[#18181B] font-sans flex flex-col justify-between selection:bg-[#E4E4E7] selection:text-[#18181B] no-scrollbar">
      <div id="main-grid-container" className="max-w-7xl mx-auto w-full flex-1 flex flex-col bg-[#FBFBFC] relative">
        <Header version={readPackageVersion()} />
        <main className="flex-1">
          <Hero />
          <ProblemSolution />
          <BlueprintWorkspace />
          <FeaturesGrid />
          <ActionSection />
          <IntegrationShowcase />
          <ClosingCTA />
        </main>
        <Footer version={readPackageVersion()} />
      </div>
    </div>
  );
}
