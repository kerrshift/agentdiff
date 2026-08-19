"use client";

import React from "react";
import { OpenAI, Gemini, Langfuse, LangSmith, Anthropic } from "@lobehub/icons";
import OpenTelemetry from "./OpenTelemetry";

const LOGOS = [
  { Icon: OpenAI, label: "OpenAI Agents" },
  { Icon: Anthropic, label: "Anthropic" },
  { Icon: Gemini, label: "Google Gemini" },
  { Icon: Langfuse, label: "Langfuse" },
  { Icon: LangSmith, label: "LangSmith" },
  { Icon: OpenTelemetry, label: "OpenInference · OTel" },
];

export default function AdapterLogos() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-5 text-[#9CA0A6]">
        {LOGOS.map(({ Icon, label }) => (
          <span
            key={label}
            title={label}
            className="inline-flex items-center gap-2 hover:text-[#18181B] transition-colors duration-150"
          >
            <Icon size={20} />
            <span className="text-[12px] font-medium tracking-tight">{label}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-2 text-[#9CA0A6]">
          <span className="font-mono text-[14px] leading-none">{"{}"}</span>
          <span className="text-[12px] font-medium tracking-tight">generic JSON</span>
        </span>
      </div>
      <p className="text-[11px] text-[#A1A1AA]">
        Generic by default · adapter-ready when you need it
      </p>
    </div>
  );
}
