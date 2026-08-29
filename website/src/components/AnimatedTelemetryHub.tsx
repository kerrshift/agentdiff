"use client";

import React from "react";
import { motion } from "framer-motion";

interface SourceChannel {
  id: string;
  name: string;
  sub: string;
  color: string;
  dotColor: string;
  textColor: string;
  y: number;
  speed: number;
  delay: number;
}

const CHANNELS: SourceChannel[] = [
  { id: "langgraph", name: "LangGraph", sub: "Checkpoints", color: "#6366F1", dotColor: "#818CF8", textColor: "#4F46E5", y: 48, speed: 1.6, delay: 0 },
  { id: "openai", name: "OpenAI Agents", sub: "Run Trees", color: "#0284C7", dotColor: "#38BDF8", textColor: "#0369A1", y: 92, speed: 1.4, delay: 0.3 },
  { id: "crewai", name: "CrewAI", sub: "CrewOutput", color: "#D97706", dotColor: "#FBBF24", textColor: "#B45309", y: 136, speed: 1.8, delay: 0.6 },
  { id: "otel", name: "OpenTelemetry", sub: "OTel Spans", color: "#9333EA", dotColor: "#C084FC", textColor: "#7E22CE", y: 180, speed: 1.5, delay: 0.2 },
  { id: "langfuse", name: "Langfuse / Smith", sub: "Traces", color: "#DB2777", dotColor: "#F472B6", textColor: "#BE185D", y: 224, speed: 1.7, delay: 0.5 },
];

export default function AnimatedTelemetryHub() {
  return (
    <div className="w-full my-6 py-6 select-none relative font-sans">
      {/* Restrained Ambient Glow with ample padding */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[380px] h-[220px] bg-emerald-500/10 dark:bg-emerald-400/12 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[340px] h-[200px] bg-indigo-500/8 dark:bg-indigo-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full overflow-x-auto no-scrollbar py-4">
        <svg
          viewBox="0 0 960 280"
          className="w-full h-auto min-w-[860px] font-sans relative z-10"
          style={{ overflow: "visible" }}
          role="img"
        >
          <defs>
            <filter id="laser-blur" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <linearGradient id="normalizer-core-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--surface-2)" />
              <stop offset="100%" stopColor="var(--surface)" />
            </linearGradient>

            <marker
              id="out-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M 0 2 L 6 5 L 0 8 z" fill="var(--fg)" />
            </marker>
          </defs>

          {/* ========================================================= */}
          {/* 1. LEFT: Source Telemetry Channels (Distinct Colors)      */}
          {/* ========================================================= */}
          {CHANNELS.map((ch) => (
            <g key={ch.id}>
              {/* Status Dot with halo */}
              <circle cx="28" cy={ch.y} r="3.5" fill={ch.dotColor} />
              <circle cx="28" cy={ch.y} r="8" fill={ch.dotColor} opacity="0.3" filter="url(#laser-blur)" />

              {/* Framework Name (Primary Foreground Sans-Serif) */}
              <text
                x="44"
                y={ch.y + 4.5}
                fill="var(--fg)"
                fontSize="13"
                fontWeight="600"
                letterSpacing="-0.02em"
              >
                {ch.name}
              </text>

              {/* Schema Descriptor with high contrast in both themes */}
              <text
                x="245"
                y={ch.y + 4.5}
                textAnchor="end"
                fill="var(--muted)"
                fontSize="11"
                fontWeight="500"
              >
                {ch.sub}
              </text>
            </g>
          ))}

          {/* ========================================================= */}
          {/* 2. SIMULTANEOUS CONVERGING FIBER OPTIC STREAMS             */}
          {/* ========================================================= */}
          {CHANNELS.map((ch) => {
            const startX = 260;
            const startY = ch.y;
            const endX = 445;
            const endY = 136;
            const pathD = `M ${startX} ${startY} C ${startX + 80} ${startY}, ${endX - 70} ${endY}, ${endX} ${endY}`;

            return (
              <g key={`stream-${ch.id}`}>
                {/* Neutral Circuit Track */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="1.2"
                  strokeOpacity="0.7"
                />

                {/* Distinct High-Contrast Laser Pulse */}
                <motion.path
                  d={pathD}
                  fill="none"
                  stroke={ch.color}
                  strokeWidth="2.2"
                  strokeDasharray="8 10"
                  initial={{ strokeDashoffset: 36 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{
                    duration: ch.speed,
                    repeat: Infinity,
                    ease: "linear",
                    delay: ch.delay,
                  }}
                />

                {/* Laser Pulse Particle */}
                <g>
                  <circle r="3.5" fill={ch.dotColor}>
                    <animateMotion
                      path={pathD}
                      dur={`${ch.speed * 1.2}s`}
                      repeatCount="indefinite"
                      rotate="auto"
                    />
                  </circle>
                  <circle r="8" fill={ch.dotColor} opacity="0.45" filter="url(#laser-blur)">
                    <animateMotion
                      path={pathD}
                      dur={`${ch.speed * 1.2}s`}
                      repeatCount="indefinite"
                      rotate="auto"
                    />
                  </circle>
                </g>
              </g>
            );
          })}

          {/* ========================================================= */}
          {/* 3. CENTER: Parallel Normalizer Engine (Single Clean Node)  */}
          {/* ========================================================= */}
          <g transform="translate(445, 54)">
            <rect
              x="0"
              y="0"
              width="195"
              height="164"
              rx="16"
              fill="url(#normalizer-core-bg)"
              stroke="var(--border-strong)"
              strokeWidth="1.2"
            />

            {/* Eyebrow */}
            <text
              x="22"
              y="32"
              fill="var(--faint)"
              fontSize="9.5"
              fontWeight="600"
              letterSpacing="0.14em"
            >
              PARALLEL NORMALIZER
            </text>

            {/* Metric Speedometer */}
            <text x="22" y="58" fill="var(--fg)" fontSize="14" fontWeight="700" letterSpacing="-0.025em">
              Sub-2ms Ingestion
            </text>

            {/* Engine Specs */}
            <g transform="translate(22, 72)" fontSize="11" fill="var(--muted)">
              <text x="0" y="14" fill="var(--fg)" fontWeight="500">Auto-detects 5+ schemas</text>
              <text x="0" y="32">Drops ephemeral UUIDs</text>
              <text x="0" y="50">Sorts dictionary keys</text>
            </g>

            {/* Clean Sub-Footer Line */}
            <line x1="20" y1="134" x2="175" y2="134" stroke="var(--border)" strokeWidth="1" />
            <text
              x="22"
              y="148"
              fill="var(--fg)"
              fontSize="9.5"
              fontWeight="600"
              letterSpacing="0.01em"
            >
              <tspan fill="#10B981">● </tspan>Live Synchronous Stream
            </text>
          </g>

          {/* ========================================================= */}
          {/* 4. OUTPUT CONNECTOR LASER STREAM                          */}
          {/* ========================================================= */}
          <g>
            <line
              x1="640"
              y1="136"
              x2="720"
              y2="136"
              stroke="var(--border)"
              strokeWidth="1.2"
            />
            <motion.line
              x1="640"
              y1="136"
              x2="720"
              y2="136"
              stroke="var(--fg)"
              strokeWidth="2"
              strokeDasharray="8 8"
              initial={{ strokeDashoffset: 32 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
              markerEnd="url(#out-arrow)"
            />

            <circle r="3.5" fill="var(--fg)">
              <animateMotion
                path="M 640 136 L 720 136"
                dur="0.5s"
                repeatCount="indefinite"
              />
            </circle>
          </g>

          {/* ========================================================= */}
          {/* 5. RIGHT: Canonical Output DAG (Open Clean Architecture)   */}
          {/* ========================================================= */}
          <g transform="translate(725, 54)">
            <rect
              x="0"
              y="0"
              width="215"
              height="164"
              rx="16"
              fill="var(--surface-2)"
              stroke="var(--border-strong)"
              strokeWidth="1.2"
            />

            {/* Output Eyebrow */}
            <text
              x="22"
              y="32"
              fill="#10B981"
              fontSize="9.5"
              fontWeight="700"
              letterSpacing="0.14em"
            >
              CANONICAL DAG OUTPUT
            </text>

            {/* Unified Primary Artifact Headline */}
            <text x="22" y="60" fill="var(--fg)" fontSize="16" fontWeight="700" letterSpacing="-0.03em">
              AgentTrace <tspan fill="#10B981" fontWeight="600">(v1.0)</tspan>
            </text>
            <text
              x="22"
              y="78"
              fill="var(--muted)"
              fontSize="11"
              fontWeight="400"
            >
              Unified Causal Graph Standard
            </text>

            {/* Clean Separator Rail */}
            <line x1="20" y1="96" x2="195" y2="96" stroke="var(--border)" strokeWidth="1" />

            {/* Direct CI Pipeline Targets */}
            <text x="22" y="118" fill="var(--fg)" fontSize="11" fontWeight="600">
              → Deterministic Diff Engine
            </text>
            <text x="22" y="136" fill="var(--muted)" fontSize="10">
              TDI · Cycles · WEI · RSR · Blame
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
