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
      {/* Two centered rows: one extra logo on top, one fewer below
          (e.g. 5/3 for eight sources). Hidden below md by the parent. */}
      <div className="flex flex-col gap-y-5 text-(--faint)">
        {[LOGOS.slice(0, Math.floor(LOGOS.length / 2) + 1), LOGOS.slice(Math.floor(LOGOS.length / 2) + 1)].map(
          (row, ri) => (
            <div key={ri} className="flex flex-wrap items-center justify-center gap-x-9 gap-y-5">
              {row.map(({ Icon, label }) => (
                <span
                  key={label}
                  title={label}
                  className="inline-flex items-center gap-2 hover:text-(--fg) transition-colors duration-150"
                >
                  <Icon size={20} />
                  <span className="text-[12px] font-medium tracking-tight">{label}</span>
                </span>
              ))}
            </div>
          )
        )}
      </div>
      <p className="text-[11px] text-(--faint)">
        Native LangGraph &amp; CrewAI ingestion · OTel/Langfuse/LangSmith adapters · generic JSON by default · registry-ready for your own format
      </p>
    </div>
  );
}
