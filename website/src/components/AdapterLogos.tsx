"use client";

import React from "react";
import { OpenAI, Gemini, Langfuse, LangSmith, Anthropic, LangGraph, CrewAI } from "@lobehub/icons";
import OpenTelemetry from "./OpenTelemetry";

const LOGOS = [
  { Icon: OpenAI, label: "OpenAI Agents" },
  { Icon: Anthropic, label: "Anthropic" },
  { Icon: Gemini, label: "Google Gemini" },
  { Icon: LangGraph, label: "LangGraph" },
  { Icon: CrewAI, label: "CrewAI" },
  { Icon: Langfuse, label: "Langfuse" },
  { Icon: LangSmith, label: "LangSmith" },
  { Icon: OpenTelemetry, label: "OpenInference · OTel" },
];

export default function AdapterLogos() {
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Two centered rows with crisp, high-visibility text */}
      <div className="flex flex-col gap-y-4 text-(--fg)/75 dark:text-(--fg)/80">
        {[LOGOS.slice(0, Math.floor(LOGOS.length / 2) + 1), LOGOS.slice(Math.floor(LOGOS.length / 2) + 1)].map(
          (row, ri) => (
            <div key={ri} className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {row.map(({ Icon, label }) => (
                <span
                  key={label}
                  title={label}
                  className="group inline-flex items-center gap-2.5 text-(--muted) hover:text-(--fg) transition-colors duration-150 cursor-default"
                >
                  <span className="opacity-75 group-hover:opacity-100 transition-opacity">
                    <Icon size={18} />
                  </span>
                  <span className="text-[13px] font-medium tracking-tight text-(--fg)/85 dark:text-(--fg)/90 group-hover:text-(--fg)">
                    {label}
                  </span>
                </span>
              ))}
            </div>
          )
        )}
      </div>
      <p className="text-[12px] text-(--muted) font-normal">
        Native LangGraph &amp; CrewAI ingestion · OTel/Langfuse/LangSmith adapters · generic JSON by default · registry-ready for your own format
      </p>
    </div>
  );
}
