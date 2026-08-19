"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";
import CopyCommand from "./CopyCommand";

export default function ClosingCTA() {
  return (
    <section id="get-started-section" className="py-32 bg-transparent font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-8 sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left — statement + primary action */}
              <div>
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA]">
                  Get started
                </span>
                <h2 className="text-3xl lg:text-5xl font-semibold tracking-[-0.03em] text-[#18181B] leading-tight mt-4">
                  Run it in your pipeline.
                </h2>
                <p className="text-base text-[#52525B] leading-relaxed mt-4 font-normal">
                  Compare any two agent runs, gate on divergence, loops, and cost — and never ship a silent regression again.
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-9">
                  <a
                    href="https://github.com/lostmartian/agentdiff-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#18181B] hover:text-[#52525B] transition-colors duration-150"
                  >
                    See it live in CI
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Right — install terminal + trust */}
              <div className="flex flex-col items-start gap-6">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#A1A1AA] mb-1">
                    Install
                  </span>
                  <span className="h-px flex-1 bg-[#E4E4E7]"></span>
                </div>
                <div className="w-full max-w-md">
                  <div className="flex items-center gap-2 px-4 h-9 border border-b-0 border-[#2A2D33] rounded-t-lg bg-[#0D0E10]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2A2D33]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2A2D33]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2A2D33]" />
                    <span className="ml-2 text-[10px] text-[#6B7480]">terminal</span>
                  </div>
                  <div className="border border-[#2A2D33] rounded-b-lg bg-[#0A0B0C] px-4 py-3.5">
                    <CopyCommand dark bare />
                  </div>
                </div>
                <p className="text-[11px] text-[#A1A1AA]">
                  Runs 100% locally · MIT · no trace data leaves your machine
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
