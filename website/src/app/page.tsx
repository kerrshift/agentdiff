import Header from "../components/Header";
import Hero from "../components/Hero";
import BlueprintWorkspace from "../components/BlueprintWorkspace";
import FeaturesGrid from "../components/FeaturesGrid";
import IntegrationShowcase from "../components/IntegrationShowcase";
import Footer from "../components/Footer";
import ScrollGlider from "../components/ScrollGlider";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#060608] text-zinc-300 font-sans flex flex-col justify-between selection:bg-zinc-800 selection:text-white no-scrollbar">
      {/* SCANLINE TECHNICAL EFFECT */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <div className="animate-scanline absolute inset-x-0 top-0 h-[2px] bg-zinc-900/40"></div>
      </div>

      <div id="main-grid-container" className="max-w-7xl mx-auto w-full border-l border-r border-[#1E2028]/60 flex-1 flex flex-col bg-[#060608] relative">
        <ScrollGlider />
        <Header />
        <main className="flex-1 divide-y divide-[#1E2028]/60">
          <Hero />
          <BlueprintWorkspace />
          <FeaturesGrid />
          <IntegrationShowcase />
        </main>
        <Footer />
      </div>
    </div>
  );
}
