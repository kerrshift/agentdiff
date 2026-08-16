import React from "react";

export default function FeaturesGrid() {
  return (
    <section id="features-section" className="py-24 bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="max-w-2xl mb-16 pb-6 border-b border-[#1E2028]/60">
          <span className="text-xs text-zinc-550 font-semibold uppercase tracking-wider block mb-4">Capabilities</span>
          
          {/* Drafting Box */}
          <div className="relative p-4 my-2 inline-block">
            <div className="absolute top-0 left-[-12px] right-[-12px] h-[1px] bg-[#1E2028]/85"></div>
            <div className="absolute bottom-0 left-[-12px] right-[-12px] h-[1px] bg-[#1E2028]/85"></div>
            <div className="absolute left-0 top-[-12px] bottom-[-12px] w-[1px] bg-[#1E2028]/85"></div>
            <div className="absolute right-0 top-[-12px] bottom-[-12px] w-[1px] bg-[#1E2028]/85"></div>

            <h2 className="text-2xl font-bold tracking-tight text-zinc-150">
              Engine specifications
            </h2>
          </div>
        </div>

        {/* Spacious 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">

          {/* Feature 1 */}
          <div className="flex flex-col hover:translate-y-[-2px] transition-transform duration-200">
            <span className="text-xs font-semibold text-indigo-400 tracking-wider mb-4 uppercase font-mono">01. Divergence index</span>
            <h3 className="text-xl font-semibold text-zinc-200 mb-3">Trajectory divergence</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Quantifies structural execution difference using graph alignment algorithms. Detects when model upgrades lead to fully divergent tool paths.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col hover:translate-y-[-2px] transition-transform duration-200">
            <span className="text-xs font-semibold text-indigo-400 tracking-wider mb-4 uppercase font-mono">02. Wasted effort</span>
            <h3 className="text-xl font-semibold text-zinc-200 mb-3">Wasted effort index</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Calculates ratios of redundant or abandoned tool execution steps, flagging prompt modifications that cause unproductive token consumption.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col hover:translate-y-[-2px] transition-transform duration-200">
            <span className="text-xs font-semibold text-indigo-400 tracking-wider mb-4 uppercase font-mono">03. Loop buster</span>
            <h3 className="text-xl font-semibold text-zinc-200 mb-3">Loop buster analysis</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Exposes cyclical tool calling patterns where an agent repeatedly queries the same endpoint with identical parameters without state progress.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col hover:translate-y-[-2px] transition-transform duration-200">
            <span className="text-xs font-semibold text-indigo-400 tracking-wider mb-4 uppercase font-mono">04. Automation</span>
            <h3 className="text-xl font-semibold text-zinc-200 mb-3">CI/CD regression block</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Standardized JSON export format integrates natively into GitHub Actions and GitLab pipelines. Fail builds when cost drift or loops cross limits.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
