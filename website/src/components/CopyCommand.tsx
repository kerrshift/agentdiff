"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

const CMD = "pip install agent-trajectory-diff";

export default function CopyCommand({ dark = false, bare = false }: { dark?: boolean; bare?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`inline-flex items-center gap-2 ${
        bare
          ? "px-1 py-1"
          : `rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 ${
              dark ? "bg-[#0A0B0C] border border-[#2A2D33]" : "bg-(--surface) border border-(--border)"
            }`
      }`}
    >
      <span
        className={`text-xs sm:text-[13px] font-mono whitespace-nowrap ${
          dark ? "text-[#E8EAED]" : "text-(--fg)"
        }`}
      >
        <span className={`${dark ? "text-(--faint)" : "text-(--faint)"} select-none`}>
          ${" "}
        </span>
        {CMD}
      </span>
      <button
        onClick={copy}
        aria-label="Copy install command"
        className={`flex-shrink-0 transition-colors duration-150 ${
          dark ? "text-(--faint) hover:text-white" : "text-(--faint) hover:text-(--fg)"
        }`}
      >
        {copied ? <Check className="w-4 h-4 text-(--accent)" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
