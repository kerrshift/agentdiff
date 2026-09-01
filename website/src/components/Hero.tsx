"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import TerminalWindow from "./TerminalWindow";
import Reveal from "./Reveal";
import CopyCommand from "./CopyCommand";
import AdapterLogos from "./AdapterLogos";

export default function Hero() {
  return (
    <section
      id="hero-section"
      className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 font-sans border-b border-(--border)"
    >
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center min-w-0">
        <Reveal animate>
          {/* Headline with standalone inline symbols & playful typography on silent, broken, and ship */}
          <h1 className="text-3xl sm:text-5xl lg:text-[4.25rem] font-extrabold tracking-[-0.035em] text-(--fg) leading-[1.12] mx-auto max-w-4xl text-balance">
            Catch{" "}
            <span className="text-(--muted) font-semibold">
              silent
            </span>{" "}
            <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-extrabold">
              cost surges
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2.8] shrink-0" />
            </span>{" "}
            and{" "}
            <span className="inline-inline-flex items-baseline font-extrabold text-(--fg) select-none cursor-default" title="broken">
              <span className="inline-block transform -rotate-[7deg] translate-y-[-2px] tracking-tighter">bro</span>
              <span className="inline-block transform rotate-[7deg] translate-y-[3px] -translate-x-[2px] tracking-tighter">ken</span>
            </span>{" "}
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-extrabold">
              agent loops
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 sm:w-8 sm:h-8 shrink-0"
              >
                <path d="M 21 12 A 9 9 0 0 0 6 5.3 L 3 8" />
                <polyline points="3 3 3 8 8 8" />
                <path d="M 3 12 A 9 9 0 0 0 18 18.7 L 21 16" />
                <polyline points="16 16 21 16 21 21" />
              </svg>
            </span>{" "}
            before they{" "}
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold relative group cursor-default">
              <span className="underline decoration-emerald-500/50 decoration-wavy decoration-2 underline-offset-4">
                ship
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-emerald-500 transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1"
              >
                <path d="M 4.5 16.5 c-1.5 1.26 -2 5 -2 5 s 3.74 -0.5 5 -2 c 0.71 -0.84 0.7 -2.13 -0.09 -2.91 a 2.18 2.18 0 0 0 -2.91 -0.09 z" />
                <path d="m 12 15 l -3 -3 a 22 22 0 0 1 2 -3.95 A 12.88 12.88 0 0 1 22 2 c 0 2.72 -0.78 7.5 -6 11 a 22.35 22.35 0 0 1 -4 2 z" />
                <path d="M 9 12 H 4 s 0.55 -3.03 2 -4 c 1.62 -1.08 5 0 5 0" />
                <path d="M 12 15 v 5 s 3.03 -0.55 4 -2 c 1.08 -1.62 0 -5 0 -5" />
              </svg>
            </span>
            .
          </h1>

          {/* High-visibility subtitle */}
          <p className="max-w-4xl mx-auto text-base sm:text-lg lg:text-xl text-(--fg)/80 dark:text-(--fg)/85 leading-relaxed mt-5 mb-8 font-normal">
            Statistical baselines and honest CI gates for AI agents. Measure variance bands, block infinite loops, catch silent cost surges, and re-baseline with a single PR comment.
          </p>

          {/* CTAs + Copy Command */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/quickstart"
              className="px-7 py-3.5 rounded-full bg-(--fg) text-(--bg) text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-xs"
            >
              <span>Try in 5 Minutes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div id="install-section" className="scroll-mt-24">
              <CopyCommand />
            </div>
          </div>
        </Reveal>

        <Reveal animate delay={100}>
          {/* Adapter logos */}
          <div className="mt-12 sm:mt-14 hidden md:block">
            <AdapterLogos />
          </div>

          {/* Product terminal visual with clearly visible ambient green glow */}
          <div className="mt-8 flex flex-col items-center relative">
            <div className="w-full max-w-4xl relative">
              {/* Primary Green Terminal Ambient Aura */}
              <div
                className="absolute -inset-6 sm:-inset-10 rounded-3xl blur-2xl sm:blur-3xl pointer-events-none opacity-80 dark:opacity-90"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.40) 0%, rgba(20, 184, 166, 0.18) 45%, transparent 75%)",
                }}
              />

              {/* Secondary Soft Diffusion Aura */}
              <div
                className="absolute -inset-x-12 -inset-y-8 sm:-inset-x-16 sm:-inset-y-12 rounded-full blur-[60px] pointer-events-none opacity-60 dark:opacity-75"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.25) 0%, transparent 70%)",
                }}
              />

              <div className="relative z-10">
                <TerminalWindow />
              </div>
            </div>
            <p className="mt-3.5 text-[11px] font-mono text-(--faint) relative z-10">
              Automated PR checks · Blocks broken runs before code merges
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}