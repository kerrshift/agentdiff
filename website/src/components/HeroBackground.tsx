"use client";

import React from "react";
import { motion } from "framer-motion";

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* Top Luminous Ambient Horizon Beam */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[1px] bg-gradient-to-r from-transparent via-emerald-500/60 via-teal-400/50 to-transparent" />

      {/* Top Center Ambient Radiant Aura */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[950px] h-[450px] opacity-70 dark:opacity-85"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(16, 185, 129, 0.18) 0%, rgba(20, 184, 166, 0.06) 45%, transparent 75%)",
        }}
      />

      {/* Dynamic Animated Trajectory Wireframe Canvas */}
      <svg
        viewBox="0 0 1200 600"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] opacity-35 dark:opacity-40"
        fill="none"
      >
        <defs>
          <linearGradient id="baselineFlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="25%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="75%" stopColor="#14b8a6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="driftFlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0" />
            <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </linearGradient>

          <filter id="glowBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── Path 1: Golden Baseline Trajectory (Straight Clean Path) ── */}
        <path
          d="M 50 160 C 250 160, 350 110, 600 110 C 850 110, 950 160, 1150 160"
          stroke="url(#baselineFlow)"
          strokeWidth="1.8"
          strokeDasharray="6 6"
        />

        {/* Traveling Golden Pulse Particle */}
        <motion.circle
          r="4"
          fill="#10b981"
          filter="url(#glowBlur)"
          animate={{
            cx: [50, 300, 600, 900, 1150],
            cy: [160, 135, 110, 135, 160],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* ── Path 2: Candidate Drift Loop Path (Branching Regression) ── */}
        <path
          d="M 200 240 C 350 240, 420 310, 520 310 C 600 310, 640 230, 720 230 C 800 230, 850 300, 1000 300"
          stroke="url(#driftFlow)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* Traveling Drift Pulse Particle */}
        <motion.circle
          r="3.5"
          fill="#f43f5e"
          filter="url(#glowBlur)"
          animate={{
            cx: [200, 420, 520, 640, 720, 1000],
            cy: [240, 275, 310, 270, 230, 300],
            opacity: [0, 0.9, 0.9, 0.9, 0.9, 0],
          }}
          transition={{
            duration: 6.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.2,
          }}
        />

        {/* ── Path 3: Lower Ambient Sweeping Grid Curve ── */}
        <path
          d="M 100 380 Q 600 280 1100 380"
          stroke="var(--border-strong)"
          strokeWidth="1"
          strokeDasharray="2 8"
          opacity="0.4"
        />

        {/* Floating AST Node Dots */}
        {[
          { x: 300, y: 135, r: 3, fill: "var(--accent)" },
          { x: 600, y: 110, r: 4.5, fill: "var(--accent)" },
          { x: 900, y: 135, r: 3, fill: "var(--accent)" },
          { x: 420, y: 275, r: 3, fill: "#f43f5e" },
          { x: 600, y: 310, r: 4, fill: "#f43f5e" },
          { x: 720, y: 230, r: 3.5, fill: "#f43f5e" },
          { x: 600, y: 330, r: 2.5, fill: "var(--border-strong)" },
        ].map((node, i) => (
          <g key={i}>
            <circle cx={node.x} cy={node.y} r={node.r + 3} fill={node.fill} opacity="0.18" />
            <circle cx={node.x} cy={node.y} r={node.r} fill={node.fill} />
          </g>
        ))}
      </svg>

      {/* Feathered Engineering Coordinate Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--border-strong) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border-strong) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 65% 55% at 50% 35%, #000 25%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 65% 55% at 50% 35%, #000 25%, transparent 80%)",
        }}
      />
    </div>
  );
}
