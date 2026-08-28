"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import Reveal from "./Reveal";
import CopyCommand from "./CopyCommand";

export default function ClosingCTA() {
  return (
    <section id="get-started-section" className="py-20 lg:py-28 bg-transparent font-sans border-t border-(--border)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-3xl border border-(--border) bg-(--surface) p-8 sm:p-12 lg:p-16 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left - statement + primary action */}
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-(--faint)">
                    Get Started in 5 Minutes
                  </span>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-(--fg) leading-tight mt-3">
                    Gate your agent on every Pull Request.
                  </h2>
                </div>
                <p className="text-base text-(--muted) leading-relaxed font-normal">
                  Compare any two agent runs, catch silent trajectory forks, and enforce deterministic regression thresholds before merging code.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/quickstart"
                    className="px-8 py-3.5 rounded-full bg-(--fg) text-(--bg) text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                  >
                    <span>Start Quickstart</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/docs"
                    className="px-7 py-3.5 rounded-full border border-(--border) text-(--fg) text-sm font-medium hover:bg-(--surface-2) transition-colors"
                  >
                    Full Documentation
                  </Link>
                </div>
              </div>

              {/* Right - install terminal + trust */}
              <div className="flex flex-col items-start gap-6">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs font-mono uppercase tracking-[0.14em] text-(--faint)">
                    Instant Install
                  </span>
                  <span className="h-px flex-1 bg-(--border)"></span>
                </div>
                <div className="w-full max-w-md">
                  <div className="flex items-center gap-2 px-4 h-9 border border-b-0 border-(--border) rounded-t-xl bg-(--surface-2)">
                    <span className="w-2 h-2 rounded-full bg-[#FF5F57]" />
                    <span className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
                    <span className="w-2 h-2 rounded-full bg-[#28C840]" />
                    <span className="ml-2 text-[10px] font-mono text-(--faint)">terminal</span>
                  </div>
                  <div className="border border-(--border) rounded-b-xl bg-(--surface) px-4 py-3.5">
                    <CopyCommand bare />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-(--faint)">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Runs 100% locally · Zero telemetry telemetry outbound</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
