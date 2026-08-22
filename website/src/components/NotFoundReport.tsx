"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import LogoMark from "./LogoMark";

/**
 * The 404 as an AgentDiff product moment: the visitor's requested URL is
 * diffed against everything we know and fails every gate. Desktop gets the
 * full terminal report; mobile gets a compact verdict card.
 *
 * Client component because the culprit line is the *actual* URL the visitor
 * typed - read at runtime since 404.html is static.
 */

export default function NotFoundReport() {
  const [path, setPath] = useState("/…");
  const [shown, setShown] = useState(1);

  useEffect(() => {
    if (typeof window !== "undefined") setPath(window.location.pathname);
  }, []);

  const lines: { t: string; c?: string }[] = [
    { t: `$ agentdiff request ${path} --against sitemap.json \\`, c: "text-(--fg)" },
    { t: "    --fail-on-regression --strict", c: "text-(--fg)" },
    { t: "" },
    { t: "trajectory diff · request vs known routes", c: "text-(--muted) font-semibold" },
    { t: "──────────────────────────────────────────", c: "text-(--border-strong)" },
    { t: "adapter        route-matcher", c: "text-(--faint)" },
    { t: `baseline       20 indexed routes · 0 matched`, c: "text-(--faint)" },
    { t: `candidate      1 step · "${path}" (uncommitted)`, c: "text-(--faint)" },
    { t: "" },
    { t: "metrics", c: "text-(--muted) font-semibold" },
    { t: "──────────────────────────────────────────", c: "text-(--border-strong)" },
    { t: "TDI     divergence   1.000   limit 0.3    FAIL", c: "text-(--muted)" },
    { t: "LOOPS   refresh-loop ×3      stagnant     FAIL", c: "text-(--muted)" },
    { t: "RSR     recovery     ∞       no way back  FAIL", c: "text-(--muted)" },
    { t: "" },
    { t: `culprit  ${path}  ← pinned. it's this URL.`, c: "text-(--danger)" },
    { t: "verdict  404 · exit code 404", c: "text-(--danger) font-bold" },
  ];

  // Typewriter reveal; all lines occupy space so height never shifts.
  useEffect(() => {
    if (shown >= lines.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), 110);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  return (
    <section className="min-h-[calc(100svh)] flex flex-col items-center justify-center px-4 py-16 font-sans bg-(--bg) text-(--fg)">
      {/* Mobile verdict card */}
      <div className="md:hidden w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-(--fg) text-(--bg)">
            <LogoMark size={26} />
          </span>
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-(--faint)">404 · trajectory divergence</div>
        <div className="mt-4 flex items-baseline justify-center gap-2">
          <span className="text-6xl font-semibold tracking-[-0.03em] text-(--danger)">1.00</span>
          <span className="text-sm font-medium uppercase tracking-wider text-(--danger)">TDI</span>
        </div>
        <h1 className="mt-5 text-xl font-semibold leading-snug tracking-tight">
          This route never made it into the baseline.
        </h1>
        <p className="mt-3 text-sm text-(--muted) leading-relaxed break-all">
          We diffed <span className="font-mono text-(--fg)">{path}</span> against
          everything we know — zero matched steps. Recovery steps available: none.
        </p>
        <div className="mt-8 flex flex-col gap-2.5">
          <Link
            href="/"
            className="w-full text-center text-[15px] font-semibold text-(--bg) bg-(--fg) hover:opacity-90 px-4 py-3 rounded-full transition-opacity duration-150"
          >
            Return to baseline
          </Link>
          <Link
            href="/docs"
            className="w-full text-center text-[15px] font-semibold text-(--fg) border border-(--border) hover:bg-(--surface-2) px-4 py-3 rounded-full transition-colors duration-150"
          >
            Browse the docs
          </Link>
        </div>
      </div>

      {/* Desktop terminal report */}
      <div className="hidden md:flex flex-col items-center w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-(--faint)">
            404 · trajectory divergence detected
          </div>
          <h1 className="mt-3 text-2xl lg:text-3xl font-semibold tracking-tight">
            This page failed every gate. Including ours.
          </h1>
        </div>

        <div className="w-full rounded-xl overflow-hidden border border-(--border) bg-(--surface) text-left shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_12px_32px_-16px_rgba(0,0,0,0.12)]">
          {/* Window chrome */}
          <div className="flex items-center justify-between px-4 sm:px-5 h-11 border-b border-(--border) bg-(--surface-2)">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <span className="hidden sm:inline text-[11px] font-mono text-(--faint)">
              agentdiff — request diff
            </span>
            <span className="text-[10px] font-mono text-(--danger) px-2 py-0.5 rounded-md font-bold bg-(--danger)/10 shrink-0">
              404
            </span>
          </div>

          {/* Report body */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 font-mono text-[11px] sm:text-[13px] leading-[1.75] tracking-tight whitespace-pre overflow-x-auto no-scrollbar">
            {lines.map((line, i) => (
              <div key={i} className={`${line.c ?? "text-(--faint)"} ${i >= shown ? "invisible" : ""}`}>
                {line.t || "\u00A0"}
                {i === shown - 1 && (
                  <span className="inline-block w-[7px] h-[15px] align-middle bg-(--accent)/90 animate-pulse ml-1" />
                )}
              </div>
            ))}
            {shown >= lines.length && (
              <div className="pt-3 text-(--muted)">
                {"suggested fixes:  --update-baseline (go home)  ·  browse /docs"}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center gap-2.5">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-full text-[14px] font-semibold text-(--bg) bg-(--fg) hover:opacity-90 transition-opacity duration-150"
          >
            Return to baseline
          </Link>
          <Link
            href="/docs"
            className="px-4 py-2.5 rounded-full text-[14px] font-semibold text-(--fg) border border-(--border) hover:bg-(--surface-2) transition-colors duration-150"
          >
            Browse the docs
          </Link>
        </div>

        <p className="mt-6 text-[11px] text-(--faint) font-mono">
          tip: on a clean run we&apos;d rotate the baseline. this is not a clean run.
        </p>
      </div>
    </section>
  );
}
