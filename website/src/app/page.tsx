import fs from "fs";
import path from "path";
import Header from "../components/Header";
import Hero from "../components/Hero";
import ProblemSolution from "../components/ProblemSolution";
import BlueprintWorkspace from "../components/BlueprintWorkspace";
import FeaturesGrid from "../components/FeaturesGrid";
import PRCommentShowcase from "../components/PRCommentShowcase";
import ProofBand from "../components/ProofBand";
import IntegrationShowcase from "../components/IntegrationShowcase";
import StackFitSection from "../components/StackFitSection";
import ScaleSection from "../components/ScaleSection";
import FAQSection from "../components/FAQSection";
import ClosingCTA from "../components/ClosingCTA";
import Footer from "../components/Footer";

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

export default function Home() {
  return (
    <div className="relative min-h-screen bg-(--bg) text-(--fg) font-sans flex flex-col justify-between selection:bg-(--border) selection:text-(--fg) no-scrollbar overflow-x-clip">
      <div id="main-grid-container" className="max-w-7xl mx-auto w-full flex-1 flex flex-col bg-(--bg) relative">
        <Header version={readPackageVersion()} />
        <main className="flex-1">
          <Hero />
          <ProblemSolution />
          <BlueprintWorkspace />
          <FeaturesGrid />
          <PRCommentShowcase />
          <ProofBand />
          <IntegrationShowcase />
          <StackFitSection />
          <ScaleSection />
          <FAQSection />
          <ClosingCTA />
        </main>
        <Footer version={readPackageVersion()} />
      </div>
    </div>
  );
}
