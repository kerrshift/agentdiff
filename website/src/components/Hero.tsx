"use client";

import React from "react";
import { ArrowRight, Star } from "lucide-react";

export default function Hero() {
  return (
    <section id="hero-section" className="relative overflow-hidden py-20 lg:py-28 font-sans">
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10 flex flex-col items-center">
        
        {/* Status tag */}
        <div className="inline-flex items-center gap-2 border border-indigo-500/30 bg-indigo-950/20 px-3 py-1 rounded-full text-xs text-indigo-300 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          <span>Open source · Early alpha</span>
        </div>

        {/* Center Blueprint Drafting Box Headline */}
        <div className="relative p-4 my-2 inline-block">
          <div className="absolute top-0 left-[-12px] right-[-12px] h-[1px] bg-indigo-500/20 animate-border-pulse"></div>
          <div className="absolute bottom-0 left-[-12px] right-[-12px] h-[1px] bg-indigo-500/20 animate-border-pulse"></div>
          <div className="absolute left-0 top-[-12px] bottom-[-12px] w-[1px] bg-indigo-500/20 animate-border-pulse"></div>
          <div className="absolute right-0 top-[-12px] bottom-[-12px] w-[1px] bg-indigo-500/20 animate-border-pulse"></div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 leading-none">
            Stop guessing.
          </h1>
        </div>

        {/* Subtitle — 'Compare' is off-white, 'agent trajectories.' has gradient + curved underline */}
        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mt-6 mb-12">
          <span className="text-zinc-100">Compare </span>
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-zinc-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent animate-text-gradient">agent trajectories.</span>
            <span className="absolute left-0 bottom-[-4px] w-full h-[2.5px] rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"></span>
          </span>
        </h2>

        <p className="max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed mb-12 font-sans font-light">
          Static string assertions cannot evaluate non-deterministic agents. 
          AgentDiff maps and compares execution traces as DAGs in CI/CD — automatically quantifying trajectory drift, redundant tool loops, and resource regressions.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <a
            href="https://github.com/lostmartian/agentdiff"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 px-6 rounded-full transition-all duration-150 shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.45)]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Star on GitHub
            <Star className="w-3.5 h-3.5 opacity-70" />
          </a>

          <a
            href="/docs"
            className="flex items-center gap-2 border border-[#1E2028] bg-[#0d0e12]/60 hover:border-indigo-500/40 hover:bg-indigo-950/20 text-zinc-300 hover:text-white font-semibold text-sm py-2.5 px-6 rounded-full transition-all duration-150"
          >
            Read the docs
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Supported formats row */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold font-mono">Works with</span>
          <div className="flex flex-wrap justify-center gap-2">
            {["Generic JSON", "DeepEval", "OpenInference", "Langfuse"].map((fmt) => (
              <span
                key={fmt}
                className="text-[11px] font-mono text-indigo-300 border border-indigo-500/25 bg-indigo-950/25 px-3 py-1 rounded-full font-medium"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
