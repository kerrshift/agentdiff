"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SourceChannel {
  id: string;
  name: string;
  sub: string;
  color: string;
  y: number;
  sampleKey: string;
}

const CHANNELS: SourceChannel[] = [
  { id: "langgraph", name: "LangGraph", sub: "Checkpoints", color: "#10B981", y: 35, sampleKey: "checkpoint_id: 8f2b" },
  { id: "openai", name: "OpenAI Agents", sub: "Run Trees", color: "#3B82F6", y: 75, sampleKey: "function_call: query" },
  { id: "crewai", name: "CrewAI", sub: "CrewOutput", color: "#F59E0B", y: 115, sampleKey: "task_output: summary" },
  { id: "otel", name: "OpenTelemetry", sub: "OTel Spans", color: "#8B5CF6", y: 155, sampleKey: "span: gen_ai.tool" },
  { id: "langfuse", name: "Langfuse / Smith", sub: "Traces", color: "#EC4899", y: 195, sampleKey: "generation: gpt-4o" },
];

export default function AnimatedTelemetryHub() {
  const [activeChannelIdx, setActiveChannelIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveChannelIdx((prev) => (prev + 1) % CHANNELS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const activeChannel = CHANNELS[activeChannelIdx];

  return (
    <div className="w-full my-12 py-6 select-none overflow-x-auto no-scrollbar">
      <svg
        viewBox="0 0 960 240"
        className="w-full h-auto min-w-[820px] font-mono"
        role="img"
      >
        <defs>
          {/* Subtle Restrained Backdrop Glow on the Center Hub */}
          <radialGradient id="aurora-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={activeChannel.color} stopOpacity="0.06" />
            <stop offset="100%" stopColor={activeChannel.color} stopOpacity="0" />
          </radialGradient>

          <linearGradient id="canon-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.03" />
          </linearGradient>

          <linearGradient id="hub-core-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--surface-2)" />
            <stop offset="100%" stopColor="var(--surface)" />
          </linearGradient>

          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <marker
            id="hub-arrow"
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 2 L 7 5 L 0 8 z" fill="var(--accent)" />
          </marker>
        </defs>

        {/* Ambient Subtle Glow behind the central pipeline */}
        <circle cx="540" cy="115" r="90" fill="url(#aurora-glow)" className="transition-all duration-700" />

        {/* LEFT CHANNELS: Premium Floating Nodes */}
        {CHANNELS.map((ch, idx) => {
          const isActive = idx === activeChannelIdx;
          return (
            <g
              key={ch.id}
              onClick={() => setActiveChannelIdx(idx)}
              className="cursor-pointer transition-all"
            >
              {/* Highlight Pill on Active */}
              {isActive && (
                <motion.rect
                  layoutId="activePill"
                  x="10"
                  y={ch.y - 15}
                  width="270"
                  height="30"
                  rx="8"
                  fill="var(--surface-2)"
                  stroke={ch.color}
                  strokeWidth="1.5"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              {/* Status Indicator Dot with Glow */}
              <circle
                cx="26"
                cy={ch.y}
                r={isActive ? 4 : 3}
                fill={ch.color}
                opacity={isActive ? 1 : 0.6}
              />
              {isActive && (
                <circle
                  cx="26"
                  cy={ch.y}
                  r="7"
                  fill={ch.color}
                  opacity="0.3"
                  filter="url(#glow-filter)"
                />
              )}

              {/* Primary Framework Label */}
              <text
                x="40"
                y={ch.y + 4}
                fill={isActive ? "var(--fg)" : "var(--muted)"}
                fontSize="11.5"
                fontWeight={isActive ? "700" : "500"}
                letterSpacing="-0.01em"
              >
                {ch.name}
              </text>

              {/* Format Descriptor Badge */}
              <text
                x="268"
                y={ch.y + 4}
                textAnchor="end"
                fill={isActive ? ch.color : "var(--faint)"}
                fontSize="9.5"
                fontWeight={isActive ? "600" : "400"}
              >
                {ch.sub}
              </text>
            </g>
          );
        })}

        {/* CONVERGING STREAM PATHS */}
        {CHANNELS.map((ch, idx) => {
          const isActive = idx === activeChannelIdx;
          const startX = 285;
          const startY = ch.y;
          const endX = 445;
          const endY = 115;
          const pathD = `M ${startX} ${startY} C ${startX + 80} ${startY}, ${endX - 70} ${endY}, ${endX} ${endY}`;

          return (
            <g key={ch.id}>
              {/* Background Path Track */}
              <path
                d={pathD}
                fill="none"
                stroke="var(--border)"
                strokeWidth={isActive ? 2 : 1}
                strokeOpacity={isActive ? 0.7 : 0.25}
              />

              {/* Framer-Motion Animated Flow Wave on Active Channel */}
              {isActive && (
                <motion.path
                  d={pathD}
                  fill="none"
                  stroke={ch.color}
                  strokeWidth="2.5"
                  strokeDasharray="14 14"
                  initial={{ strokeDashoffset: 56 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}

              {/* Travelling Glowing Particle Packet along the curve */}
              {isActive && (
                <g>
                  <circle r="4.5" fill={ch.color}>
                    <animateMotion
                      path={pathD}
                      dur="1.2s"
                      repeatCount="indefinite"
                      rotate="auto"
                    />
                  </circle>
                  <circle r="9" fill={ch.color} opacity="0.4" filter="url(#glow-filter)">
                    <animateMotion
                      path={pathD}
                      dur="1.2s"
                      repeatCount="indefinite"
                      rotate="auto"
                    />
                  </circle>
                </g>
              )}
            </g>
          );
        })}

        {/* CENTER: Premium Normalizer Core */}
        <g transform="translate(450, 48)">
          {/* Main Core Shell */}
          <rect
            x="0"
            y="0"
            width="180"
            height="134"
            rx="14"
            fill="url(#hub-core-grad)"
            stroke="var(--border-strong)"
            strokeWidth="1.5"
          />

          {/* Normalizer Header */}
          <text
            x="18"
            y="30"
            fill="var(--accent)"
            fontSize="10"
            fontWeight="800"
            letterSpacing="0.1em"
          >
            ADAPTER NORMALIZER
          </text>

          {/* Sniffer Specifications */}
          <text x="18" y="54" fill="var(--fg)" fontSize="11" fontWeight="600">
            ⚡ &lt;1.8ms parse
          </text>
          <text x="18" y="72" fill="var(--muted)" fontSize="10.5">
            Auto-sniffs format keys
          </text>
          <text x="18" y="88" fill="var(--muted)" fontSize="10.5">
            Causal DAG synthesis
          </text>

          {/* Dynamic Payload Hash Pill */}
          <rect
            x="14"
            y="98"
            width="152"
            height="24"
            rx="6"
            fill="var(--code-bg)"
            stroke="var(--border)"
          />
          <text
            x="20"
            y="114"
            fill={activeChannel.color}
            fontSize="9.5"
            fontWeight="600"
          >
            {activeChannel.sampleKey}
          </text>
        </g>

        {/* OUTPUT CONNECTOR BEAMS */}
        <g>
          {/* Static Track */}
          <line
            x1="630"
            y1="115"
            x2="720"
            y2="115"
            stroke="var(--border)"
            strokeWidth="2"
          />
          {/* Flowing Laser Stream to Canonical Output */}
          <motion.line
            x1="630"
            y1="115"
            x2="720"
            y2="115"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeDasharray="12 12"
            initial={{ strokeDashoffset: 48 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
            markerEnd="url(#hub-arrow)"
          />

          {/* Moving Output Particle */}
          <circle r="4.5" fill="var(--accent)">
            <animateMotion
              path="M 630 115 L 720 115"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="9" fill="var(--accent)" opacity="0.4" filter="url(#glow-filter)">
            <animateMotion
              path="M 630 115 L 720 115"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* RIGHT: Canonical AgentTrace Output Artifact (Clean, Minimal, Premium) */}
        <g transform="translate(725, 42)">
          <rect
            x="0"
            y="0"
            width="225"
            height="146"
            rx="14"
            fill="var(--surface-2)"
            stroke="var(--border-strong)"
            strokeWidth="1.5"
          />
          <text
            x="18"
            y="28"
            fill="var(--fg)"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.08em"
          >
            CANONICAL DAG SCHEMA
          </text>

          <rect
            x="14"
            y="40"
            width="197"
            height="44"
            rx="8"
            fill="var(--bg)"
            stroke="var(--border)"
          />
          <text x="24" y="58" fill="var(--fg)" fontSize="11" fontWeight="700">
            AgentTrace (v1.0)
          </text>
          <text
            x="24"
            y="73"
            fill="var(--muted)"
            fontSize="10"
            fontWeight="500"
          >
            Strict Causal Graph
          </text>

          <text x="18" y="106" fill="var(--fg)" fontSize="10.5" fontWeight="500">
            → Diff Engine Evaluation
          </text>
          <text x="18" y="124" fill="var(--faint)" fontSize="9.5">
            TDI · WEI · Cycles · RSR · Blame
          </text>
        </g>
      </svg>
    </div>
  );
}
