"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";
import CopyCommand from "./CopyCommand";

export default function ClosingCTA() {
  return (
    <section id="get-started-section" className="py-20 lg:py-32 bg-transparent font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left - statement + primary action */}
              <div>
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-(--faint)">
                  Get started
                </span>
                <h2 className="text-3xl lg:text-5xl font-semibold tracking-[-0.03em] text-(--fg) leading-tight mt-4">
                  Run it in your pipeline.
                </h2>
                <p className="text-base text-(--muted) leading-relaxed mt-4 font-normal">
                  Compare any two agent runs - or benchmark two agents head-to-head. Gate on divergence, loops, cost, and recovery effort, and never ship a silent regression again.
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-9">
                  <a
                    href="https://github.com/lostmartian/agentdiff-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-(--fg) hover:text-(--muted) transition-colors duration-150"
                  >
                    See it live in CI
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Right - install terminal + trust */}
              <div className="flex flex-col items-start gap-6">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-(--faint) mb-1">
                    Install
                  </span>
                  <span className="h-px flex-1 bg-(--border)"></span>
                </div>
                <div className="w-full max-w-md">
                  <div className="flex items-center gap-2 px-4 h-9 border border-b-0 border-(--border) rounded-t-lg bg-(--surface-2)">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                    <span className="ml-2 text-[10px] text-(--faint)">terminal</span>
                  </div>
                  <div className="border border-(--border) rounded-b-lg bg-(--surface) px-4 py-3.5">
                    <CopyCommand bare />
                  </div>
                </div>
                <p className="text-[11px] text-(--faint)">
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
