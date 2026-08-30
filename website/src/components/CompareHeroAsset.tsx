"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────── */
/* SCENE 1 — Close-Up: Alex typing at his desk, discovers 3-word refactor     */
/* ─────────────────────────────────────────────────────────────────────────── */
function Scene1() {
  return (
    <svg viewBox="0 0 800 420" className="w-full h-full">
      {/* ── Environment: wall y=0-270, floor y=270-388 ── */}
      <rect x="0" y="0" width="800" height="270" fill="var(--bg)" />
      <rect x="0" y="270" width="800" height="150" fill="var(--surface-2)" />
      <line x1="0" y1="270" x2="800" y2="270" stroke="var(--border)" strokeWidth="1" />

      {/* ── Wall Clock (4:58 PM) ── */}
      <circle cx="410" cy="55" r="22" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <line x1="410" y1="55" x2="418" y2="67" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" />
      <line x1="410" y1="55" x2="408" y2="37" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="410" cy="55" r="2" fill="var(--fg)" />
      <text x="410" y="90" textAnchor="middle" fontSize="8" fill="var(--muted)" fontFamily="var(--font-mono, monospace)" letterSpacing="0.05em">4:58 PM</text>

      {/* ── Desk Succulent Plant (Terracotta pot & green leaves) ── */}
      <rect x="382" y="246" width="16" height="14" fill="#c2410c" rx="2" />
      <path d="M 390 246 Q 384 235 380 238 Q 388 244 390 246 Z" fill="#059669" />
      <path d="M 390 246 Q 396 233 400 236 Q 394 244 390 246 Z" fill="#10b981" />
      <path d="M 390 246 Q 390 228 392 228 Q 392 242 390 246 Z" fill="#34d399" />

      {/* ── Monitor: x=40-370, y=30-240 (Theme-Adaptive Code Terminal) ── */}
      <rect x="40" y="30" width="330" height="210" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" rx="8" />
      {/* IDE Title bar */}
      <rect x="40" y="30" width="330" height="24" fill="var(--surface-2)" rx="8" />
      <rect x="40" y="46" width="330" height="8" fill="var(--surface-2)" />
      <circle cx="56" cy="42" r="3.5" fill="var(--danger)" />
      <circle cx="68" cy="42" r="3.5" fill="var(--border-strong)" />
      <circle cx="80" cy="42" r="3.5" fill="var(--accent)" />
      <text x="100" y="46" fill="var(--muted)" fontSize="8" fontFamily="var(--font-mono, monospace)">prompt_router.py</text>
      
      {/* Code content */}
      <text x="54" y="72" fill="var(--faint)" fontSize="8" fontFamily="var(--font-mono, monospace)"># System instruction router</text>
      <rect x="54" y="78" width="302" height="16" fill="var(--danger-soft, rgba(229, 72, 77, 0.12))" rx="2" />
      <text x="58" y="90" fill="var(--danger)" fontSize="8.5" fontFamily="var(--font-mono, monospace)">- &quot;Fetch data strictly via postgres&quot;</text>
      <rect x="54" y="97" width="302" height="16" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="0.8" rx="2" />
      <text x="58" y="109" fill="var(--accent)" fontSize="8.5" fontFamily="var(--font-mono, monospace)">+ &quot;Fetch data quickly using dynamic sql&quot;</text>
      <motion.rect
        x="332" y="97" width="4" height="16" fill="var(--accent)"
        animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
      />
      <text x="54" y="132" fill="var(--fg)" fontSize="8.5" fontFamily="var(--font-mono, monospace)">def fetch_report(prompt, conn):</text>
      <text x="54" y="148" fill="var(--muted)" fontSize="8.5" fontFamily="var(--font-mono, monospace)">    result = agent.run(prompt, conn)</text>
      <text x="54" y="164" fill="var(--muted)" fontSize="8.5" fontFamily="var(--font-mono, monospace)">    return format_output(result)</text>
      <line x1="54" y1="182" x2="356" y2="182" stroke="var(--border)" strokeWidth="1" />
      <text x="54" y="198" fill="var(--muted)" fontSize="8" fontFamily="var(--font-mono, monospace)">[OK] 14 unit tests passed  ·  0 failed</text>
      <text x="54" y="214" fill="var(--accent)" fontSize="8" fontFamily="var(--font-mono, monospace)">$ git push origin pr/42 --force</text>
      
      {/* Monitor neck and base */}
      <rect x="185" y="240" width="40" height="20" fill="var(--border-strong)" rx="2" />
      <rect x="165" y="256" width="80" height="5" fill="var(--border-strong)" rx="2" />

      {/* ── Desk: surface at y=260-272 ── */}
      <rect x="25" y="260" width="750" height="12" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1" rx="2" />
      <line x1="25" y1="262" x2="775" y2="262" stroke="var(--accent)" strokeWidth="1.5" opacity="0.6" />
      <rect x="45" y="272" width="12" height="110" fill="var(--border)" rx="2" />
      <rect x="742" y="272" width="12" height="110" fill="var(--border)" rx="2" />

      {/* Keyboard on desk */}
      <rect x="450" y="250" width="95" height="10" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1" rx="2" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={454 + i * 11} y="252" width="8" height="5" fill="var(--border-strong)" rx="1" />
      ))}

      {/* Cobalt Blue Coffee Mug with Animated Steam */}
      <g>
        <rect x="700" y="236" width="20" height="24" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.2" rx="3" />
        <path d="M720 242 Q728 242 728 248 Q728 254 720 253" fill="none" stroke="#2563eb" strokeWidth="1.5" />
        {/* Animated Steam lines */}
        <motion.path
          d="M706 232 Q709 226 706 220 Q703 214 706 208"
          fill="none" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"
          animate={{ y: [0, -6, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M713 231 Q716 225 713 219 Q710 213 713 207"
          fill="none" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"
          animate={{ y: [0, -6, 0], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />
      </g>

      {/* Ergonomic Office Chair */}
      <rect x="536" y="272" width="90" height="8" fill="var(--surface-2)" stroke="var(--border-strong)" strokeWidth="1" rx="3" />
      <rect x="614" y="200" width="12" height="76" fill="var(--surface-2)" stroke="var(--border-strong)" strokeWidth="1" rx="3" />
      <rect x="611" y="180" width="18" height="16" fill="var(--surface-2)" stroke="var(--border-strong)" strokeWidth="1" rx="3" />
      <line x1="552" y1="280" x2="546" y2="315" stroke="var(--border-strong)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="616" y1="280" x2="622" y2="315" stroke="var(--border-strong)" strokeWidth="2.5" strokeLinecap="round" />

      {/* ── Alex Character in Colored Indigo Hoodie & Denim Pants ── */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Head */}
        <circle cx="580" cy="180" r="18" fill="var(--surface)" stroke="var(--fg)" strokeWidth="2" />
        {/* Cyan Glasses */}
        <rect x="572" y="174" width="7" height="6" fill="none" stroke="#0284c7" strokeWidth="1.2" rx="1" />
        <rect x="583" y="174" width="7" height="6" fill="none" stroke="#0284c7" strokeWidth="1.2" rx="1" />
        <line x1="579" y1="177" x2="583" y2="177" stroke="#0284c7" strokeWidth="1.2" />
        {/* Smile */}
        <path d="M 575 187 Q 580 192 585 187" stroke="var(--fg)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        
        {/* Clothes: Indigo Developer Hoodie */}
        <path d="M 568 200 L 592 200 L 594 256 L 566 256 Z" fill="#4f46e5" rx="2" />
        <line x1="580" y1="200" x2="580" y2="218" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" />
        {/* Torso spine */}
        <line x1="580" y1="198" x2="580" y2="256" stroke="var(--fg)" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Animated Left arm typing */}
        <motion.line
          x1="580" y1="212" x2="505" y2="250"
          stroke="#4f46e5" strokeWidth="2.2" strokeLinecap="round"
          animate={{ y2: [250, 247, 250, 248, 250] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
        {/* Animated Right arm typing */}
        <motion.line
          x1="580" y1="212" x2="535" y2="250"
          stroke="#4f46e5" strokeWidth="2.2" strokeLinecap="round"
          animate={{ y2: [248, 251, 247, 250, 248] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: 0.15 }}
        />
        
        {/* Dark Denim Jeans */}
        <line x1="580" y1="256" x2="564" y2="284" stroke="#1e3a8a" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="580" y1="256" x2="596" y2="284" stroke="#1e3a8a" strokeWidth="2.8" strokeLinecap="round" />
      </motion.g>

      {/* ── Speech Bubble (Top-Right, x=460-760, y=36-126) ── */}
      <motion.g
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        style={{ transformOrigin: "610px 80px" }}
      >
        <rect x="460" y="36" width="300" height="90" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" rx="10" />
        <polygon points="568,126 592,126 580,156" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" strokeLinejoin="round" />
        {/* Text content with playful emerald badge on 'green' */}
        <text x="478" y="56" fill="var(--accent)" fontSize="7.5" fontFamily="var(--font-mono, monospace)" fontWeight="600" letterSpacing="0.06em">ALEX · DEVELOPER · 4:58 PM</text>
        <text x="478" y="74" fill="var(--fg)" fontSize="9.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="500">
          &quot;Unit tests are{" "}
          <tspan fill="#10b981" fontWeight="700">green</tspan>
          <tspan fill="#10b981" fontWeight="700"> ✓</tspan>
          . Just 3 words.
        </text>
        <text x="478" y="91" fill="var(--fg)" fontSize="9.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="500">Pushing PR #42 straight to main!&quot;</text>
        <text x="478" y="109" fill="var(--muted)" fontSize="8.5" fontFamily="var(--font-mono, monospace)">CI trajectory diff not run locally</text>
      </motion.g>

      {/* ── Caption bar ── */}
      <rect x="0" y="388" width="800" height="32" fill="var(--surface)" />
      <line x1="0" y1="388" x2="800" y2="388" stroke="var(--border)" strokeWidth="1" />
      <text x="400" y="408" textAnchor="middle" fontSize="10.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="500">
        <tspan fill="var(--accent)" fontWeight="600" fontFamily="var(--font-mono, monospace)">SHOT 1 OF 5</tspan>
        <tspan fill="var(--faint)"> · </tspan>
        <tspan fill="var(--fg)">The 3-word prompt refactor that silently introduces an execution loop</tspan>
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* SCENE 2 — Wide shot: PR agent running to CI, carrying the hidden loop     */
/* ─────────────────────────────────────────────────────────────────────────── */
function Scene2() {
  return (
    <svg viewBox="0 0 800 420" className="w-full h-full">
      <rect x="0" y="0" width="800" height="310" fill="var(--bg)" />
      <rect x="0" y="310" width="800" height="110" fill="var(--surface-2)" />
      <line x1="0" y1="310" x2="800" y2="310" stroke="var(--border)" strokeWidth="1" />

      {/* Track line & highway stripes with pulse */}
      <rect x="0" y="307" width="800" height="6" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.rect
          key={i} x={30 + i * 100} y="309" width="45" height="2" fill="var(--accent)"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}

      {/* ── Station Left: GitHub (x=30-140, y=140-300) ── */}
      <rect x="30" y="140" width="110" height="160" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" rx="8" />
      <rect x="30" y="140" width="110" height="24" fill="var(--surface-2)" rx="8" />
      <text x="85" y="156" textAnchor="middle" fill="var(--muted)" fontSize="7.5" fontFamily="var(--font-mono, monospace)" fontWeight="600" letterSpacing="0.05em">GITHUB REPO</text>
      {/* Git Server Icon */}
      <rect x="65" y="174" width="40" height="28" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1" rx="3" />
      <line x1="72" y1="183" x2="98" y2="183" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="72" y1="191" x2="92" y2="191" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="98" cy="191" r="2" fill="var(--accent)" />
      <text x="85" y="226" textAnchor="middle" fill="var(--fg)" fontSize="8.5" fontFamily="var(--font-mono, monospace)" fontWeight="600">PR #42 Merged</text>
      <rect x="42" y="240" width="86" height="18" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="1" rx="3" />
      <text x="85" y="253" textAnchor="middle" fill="var(--accent)" fontSize="7.5" fontFamily="var(--font-mono, monospace)" fontWeight="600">CI Triggered</text>

      {/* ── Pipeline Milestones along track ── */}
      <g>
        <rect x="220" y="266" width="80" height="26" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1" rx="4" />
        <text x="260" y="283" textAnchor="middle" fill="var(--muted)" fontSize="7.5" fontFamily="var(--font-mono, monospace)">01: AST Parse</text>

        <rect x="360" y="266" width="80" height="26" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1" rx="4" />
        <text x="400" y="283" textAnchor="middle" fill="var(--muted)" fontSize="7.5" fontFamily="var(--font-mono, monospace)">02: Tool Exec</text>

        <rect x="500" y="266" width="105" height="26" fill="var(--surface)" stroke="var(--danger)" strokeWidth="1.2" rx="4" />
        <text x="552" y="283" textAnchor="middle" fill="var(--danger)" fontSize="7.5" fontFamily="var(--font-mono, monospace)" fontWeight="600">03: retry_sql (3x)</text>
      </g>

      {/* ── Station Right: CI Evaluator (x=660-770, y=140-300) ── */}
      <rect x="660" y="140" width="110" height="160" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" rx="8" />
      <rect x="660" y="140" width="110" height="24" fill="var(--surface-2)" rx="8" />
      <text x="715" y="156" textAnchor="middle" fill="var(--muted)" fontSize="7.5" fontFamily="var(--font-mono, monospace)" fontWeight="600" letterSpacing="0.05em">CI RUNNER</text>
      {/* CI Golden Lightning Icon */}
      <polygon points="718,172 708,188 716,188 712,204 724,186 716,186" fill="#f59e0b" />
      <text x="715" y="226" textAnchor="middle" fill="var(--fg)" fontSize="8.5" fontFamily="var(--font-mono, monospace)" fontWeight="600">Eval Suite</text>
      <rect x="672" y="240" width="86" height="18" fill="var(--surface-2)" rx="3" />
      <text x="715" y="253" textAnchor="middle" fill="var(--faint)" fontSize="7.5" fontFamily="var(--font-mono, monospace)">Waiting agent...</text>

      {/* ── PR Agent running with Bright Orange Racing Singlet & Bib #42 ── */}
      <motion.g
        animate={{ x: [0, 360] }}
        transition={{ duration: 4.8, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
      >
        {/* Floating Bubble strictly above agent head */}
        <rect x="90" y="160" width="160" height="54" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" rx="8" />
        <polygon points="160,214 180,214 170,235" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" strokeLinejoin="round" />
        <text x="170" y="177" textAnchor="middle" fill="#ea580c" fontSize="7" fontFamily="var(--font-mono, monospace)" fontWeight="600" letterSpacing="0.05em">PR #42 (ROGUE AGENT)</text>
        <text x="170" y="191" textAnchor="middle" fill="var(--fg)" fontSize="8.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="500">&quot;I silently loop 3x on</text>
        <text x="170" y="205" textAnchor="middle" fill="var(--danger)" fontSize="8.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="600">retry_sql... shh!&quot;</text>

        {/* Stickman running with Bright Colors */}
        <motion.g
          animate={{ y: [0, -5, 0, -5, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          {/* Head & Red Headband */}
          <circle cx="170" cy="250" r="13" fill="var(--surface)" stroke="var(--fg)" strokeWidth="2" />
          <line x1="158" y1="246" x2="182" y2="246" stroke="#ef4444" strokeWidth="2.5" />
          <circle cx="166" cy="251" r="1.5" fill="var(--fg)" />
          <circle cx="174" cy="251" r="1.5" fill="var(--fg)" />
          
          {/* Bright Orange Racing Singlet with Bib #42 */}
          <path d="M 162 264 L 178 264 L 176 288 L 164 288 Z" fill="#ea580c" rx="2" />
          <rect x="165" y="271" width="10" height="9" fill="#ffffff" rx="1" />
          <text x="170" y="278" textAnchor="middle" fill="#ea580c" fontSize="6.5" fontWeight="bold" fontFamily="var(--font-mono, monospace)">42</text>
          
          <line x1="170" y1="263" x2="170" y2="288" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" />
          <line x1="170" y1="271" x2="183" y2="265" stroke="var(--fg)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="170" y1="271" x2="157" y2="275" stroke="var(--fg)" strokeWidth="1.8" strokeLinecap="round" />
          {/* Navy Shorts */}
          <line x1="170" y1="288" x2="181" y2="306" stroke="#1e3a8a" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="170" y1="288" x2="159" y2="304" stroke="#1e3a8a" strokeWidth="2.8" strokeLinecap="round" />
        </motion.g>
      </motion.g>

      {/* Caption bar */}
      <rect x="0" y="388" width="800" height="32" fill="var(--surface)" />
      <line x1="0" y1="388" x2="800" y2="388" stroke="var(--border)" strokeWidth="1" />
      <text x="400" y="408" textAnchor="middle" fontSize="10.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="500">
        <tspan fill="var(--accent)" fontWeight="600" fontFamily="var(--font-mono, monospace)">SHOT 2 OF 5</tspan>
        <tspan fill="var(--faint)"> · </tspan>
        <tspan fill="var(--fg)">The drifted agent races through CI carrying a hidden execution loop</tspan>
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* SCENE 3 — Medium shot: The LLM Judge Casino (dramatic coin-toss CI eval)  */
/* ─────────────────────────────────────────────────────────────────────────── */
function Scene3() {
  return (
    <svg viewBox="0 0 800 420" className="w-full h-full">
      <rect x="0" y="0" width="800" height="310" fill="var(--bg)" />
      <rect x="0" y="310" width="800" height="110" fill="var(--surface-2)" />
      <line x1="0" y1="310" x2="800" y2="310" stroke="var(--border)" strokeWidth="1" />

      {/* Ceiling spotlights */}
      {[120, 400, 680].map((x) => (
        <g key={x}>
          <line x1={x} y1="0" x2={x} y2="24" stroke="var(--border-strong)" strokeWidth="1.5" />
          <circle cx={x} cy="30" r="7" fill="var(--border-strong)" />
        </g>
      ))}

      {/* ── Left Side: Alex Sweating with Indigo Hoodie ── */}
      <g>
        {/* Speech Bubble */}
        <rect x="30" y="115" width="170" height="60" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" rx="8" />
        <polygon points="110,175 130,175 120,205" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" strokeLinejoin="round" />
        <text x="115" y="133" textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="var(--font-mono, monospace)" fontWeight="600" letterSpacing="0.05em">ALEX · WAITING 1,400MS</text>
        <text x="115" y="150" textAnchor="middle" fill="var(--fg)" fontSize="9" fontFamily="var(--font-sans, sans-serif)" fontWeight="500">&quot;Is my prompt safe?&quot;</text>
        <text x="115" y="165" textAnchor="middle" fill="var(--muted)" fontSize="7.5" fontFamily="var(--font-mono, monospace)">Cost: $0.03 / evaluation</text>

        {/* Alex stickman */}
        <circle cx="120" cy="225" r="17" fill="var(--surface)" stroke="var(--fg)" strokeWidth="2" />
        <rect x="112" y="220" width="6" height="5" fill="none" stroke="#0284c7" strokeWidth="1" rx="1" />
        <rect x="122" y="220" width="6" height="5" fill="none" stroke="#0284c7" strokeWidth="1" rx="1" />
        <line x1="118" y1="222" x2="122" y2="222" stroke="#0284c7" strokeWidth="1" />
        <path d="M 115 233 Q 120 229 125 233" stroke="var(--fg)" strokeWidth="1.5" fill="none" />
        {/* Cyan Sweat drops */}
        <motion.circle
          cx="140" cy="214" r="2.5" fill="#38bdf8"
          animate={{ y: [0, 4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        {/* Indigo Hoodie & Denim Pants */}
        <path d="M 110 242 L 130 242 L 128 276 L 112 276 Z" fill="#4f46e5" />
        <line x1="120" y1="242" x2="120" y2="278" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" />
        <line x1="120" y1="253" x2="140" y2="245" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="120" y1="253" x2="102" y2="259" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="120" y1="278" x2="132" y2="308" stroke="#1e3a8a" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="120" y1="278" x2="108" y2="308" stroke="#1e3a8a" strokeWidth="2.8" strokeLinecap="round" />
      </g>

      {/* ── Center: The LLM Judge Podium (x=280-520, y=190-320) ── */}
      <rect x="280" y="190" width="240" height="130" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" rx="8" />
      <rect x="280" y="190" width="240" height="24" fill="var(--surface-2)" rx="8" />
      <text x="400" y="206" textAnchor="middle" fill="var(--muted)" fontSize="7.5" fontFamily="var(--font-mono, monospace)" fontWeight="600" letterSpacing="0.06em">CI EVALUATION BENCH</text>
      
      {/* Score display */}
      <motion.g animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
        <rect x="296" y="222" width="208" height="26" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="1" rx="3" />
        <text x="400" y="239" textAnchor="middle" fill="var(--accent)" fontSize="10.5" fontFamily="var(--font-mono, monospace)" fontWeight="700">Run 1: 0.91 · PASS</text>
      </motion.g>
      <motion.g animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2.5, repeat: Infinity }}>
        <rect x="296" y="254" width="208" height="26" fill="var(--surface-2)" stroke="var(--danger)" strokeWidth="1" rx="3" />
        <text x="400" y="271" textAnchor="middle" fill="var(--danger)" fontSize="10.5" fontFamily="var(--font-mono, monospace)" fontWeight="700">Run 2: 0.58 · FAIL</text>
      </motion.g>
      <text x="400" y="302" textAnchor="middle" fill="var(--faint)" fontSize="8" fontFamily="var(--font-mono, monospace)">Score fluctuates across random seeds</text>

      {/* The LLM Judge with Velvet Crimson Robe, White Cravat & Gavel */}
      <motion.g
        animate={{ y: [0, -3, 0, -3, 0], rotate: [-2, 2, -2, 2, -2] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        style={{ transformOrigin: "400px 140px" }}
      >
        {/* Powdered White Baroque Wig */}
        <path d="M 374 88 Q 400 62 426 88 Q 434 108 426 122 Q 418 116 418 106 L 382 106 Q 382 116 374 122 Q 366 108 374 88 Z" fill="#f1f5f9" stroke="var(--border-strong)" strokeWidth="1.5" />
        {/* Head */}
        <circle cx="400" cy="98" r="19" fill="var(--surface)" stroke="var(--fg)" strokeWidth="2" />
        <line x1="392" y1="95" x2="397" y2="95" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" />
        <line x1="403" y1="95" x2="408" y2="95" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" />
        <path d="M 393 106 Q 400 111 407 106" stroke="var(--fg)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        
        {/* Velvet Crimson Judge Robe */}
        <path d="M 382 118 L 418 118 L 430 190 L 370 190 Z" fill="#991b1b" stroke="#dc2626" strokeWidth="1.5" />
        {/* White Ruffled Cravat */}
        <polygon points="396,118 404,118 406,134 400,138 394,134" fill="#ffffff" />
        
        {/* Mahogany Gavel */}
        <motion.g
          animate={{ rotate: [0, -15, 0] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          style={{ transformOrigin: "416px 138px" }}
        >
          <line x1="416" y1="138" x2="450" y2="128" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" />
          <rect x="446" y="114" width="15" height="28" rx="2" fill="#78350f" stroke="#b45309" strokeWidth="1.5" />
        </motion.g>
        
        {/* Ivory 3D Dice with Red Pips */}
        <line x1="384" y1="138" x2="352" y2="130" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" />
        <motion.g animate={{ rotate: [0, 360] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "340px 120px" }}>
          <rect x="328" y="110" width="20" height="20" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" rx="3" />
          <circle cx="333" cy="115" r="1.5" fill="#ef4444" />
          <circle cx="343" cy="125" r="1.5" fill="#ef4444" />
          <circle cx="343" cy="115" r="1.5" fill="#ef4444" />
        </motion.g>
      </motion.g>

      {/* ── Right Side: Casino Prompt Slot Machine (x=580-770, y=120-310) ── */}
      <rect x="580" y="120" width="190" height="190" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" rx="8" />
      <rect x="580" y="120" width="190" height="24" fill="var(--surface-2)" rx="8" />
      <text x="675" y="136" textAnchor="middle" fill="var(--muted)" fontSize="7.5" fontFamily="var(--font-mono, monospace)" fontWeight="600" letterSpacing="0.06em">PROMPT CASINO</text>
      
      {/* 3 Slot Reels with Subtle Shimmer */}
      <g>
        <rect x="594" y="156" width="46" height="50" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1" rx="4" />
        <rect x="607" y="171" width="20" height="20" fill="#ffffff" stroke="#ef4444" strokeWidth="1.2" rx="3" />
        <circle cx="612" cy="176" r="1.5" fill="#ef4444" />
        <circle cx="622" cy="186" r="1.5" fill="#ef4444" />
        <circle cx="617" cy="181" r="1.5" fill="#ef4444" />

        <rect x="652" y="156" width="46" height="50" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1" rx="4" />
        <polygon points="677,166 669,180 676,180 673,194 683,178 676,178" fill="#f59e0b" />

        <rect x="710" y="156" width="46" height="50" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1" rx="4" />
        <text x="733" y="188" textAnchor="middle" fill="#0284c7" fontSize="18" fontWeight="bold" fontFamily="var(--font-mono, monospace)">?</text>
      </g>
      <rect x="594" y="218" width="162" height="24" fill="var(--surface-2)" rx="3" />
      <text x="675" y="234" textAnchor="middle" fill="var(--muted)" fontSize="7.5" fontFamily="var(--font-mono, monospace)">SEED: RANDOM · TEMP: 0.7</text>
      <text x="675" y="262" textAnchor="middle" fill="var(--muted)" fontSize="8" fontFamily="var(--font-mono, monospace)" fontWeight="600">Non-Deterministic</text>
      <text x="675" y="279" textAnchor="middle" fill="var(--faint)" fontSize="7.5" fontFamily="var(--font-mono, monospace)">Semantic scoring variance</text>

      {/* Caption bar */}
      <rect x="0" y="388" width="800" height="32" fill="var(--surface)" />
      <line x1="0" y1="388" x2="800" y2="388" stroke="var(--border)" strokeWidth="1" />
      <text x="400" y="408" textAnchor="middle" fontSize="10.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="500">
        <tspan fill="var(--accent)" fontWeight="600" fontFamily="var(--font-mono, monospace)">SHOT 3 OF 5</tspan>
        <tspan fill="var(--faint)"> · </tspan>
        <tspan fill="var(--fg)">The LLM Judge Casino: Same code flips between Pass and Fail on seed variance</tspan>
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* SCENE 4 — Dramatic: Midnight production crash server room                  */
/* ─────────────────────────────────────────────────────────────────────────── */
function Scene4() {
  return (
    <svg viewBox="0 0 800 420" className="w-full h-full">
      <rect x="0" y="0" width="800" height="310" fill="var(--bg)" />
      <rect x="0" y="310" width="800" height="110" fill="var(--surface-2)" />
      <line x1="0" y1="310" x2="800" y2="310" stroke="var(--border)" strokeWidth="1" />

      {/* ── Left Server Rack (x=25-125, y=50-310) with LEDs ── */}
      <rect x="25" y="50" width="100" height="260" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" rx="6" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x="35" y={62 + i * 40} width="80" height="30" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1" rx="3" />
          <motion.circle
            cx="103" cy={77 + i * 40} r="3"
            fill={i === 1 || i === 3 ? "var(--danger)" : "var(--accent)"}
            animate={{ opacity: i === 1 || i === 3 ? [1, 0.1, 1] : [0.4, 1, 0.4] }}
            transition={{ duration: i === 1 || i === 3 ? 0.6 : 1.5 + i * 0.2, repeat: Infinity }}
          />
        </g>
      ))}

      {/* ── Center: Sentry Telemetry Monitor (x=160-560, y=50-270) ── */}
      <rect x="160" y="50" width="400" height="220" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" rx="8" />
      <rect x="160" y="50" width="400" height="24" fill="var(--surface-2)" rx="8" />
      <text x="360" y="66" textAnchor="middle" fill="var(--muted)" fontSize="8" fontFamily="var(--font-mono, monospace)" fontWeight="600" letterSpacing="0.05em">PROD OBSERVABILITY · OUTAGE DETECTED</text>

      {/* Heartbeat flatline */}
      <path
        d="M 180 140 L 250 140 L 265 110 L 282 170 L 298 140 L 350 140 L 358 140"
        fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round"
      />
      <line x1="358" y1="140" x2="530" y2="140" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" />

      {/* Stats inside screen */}
      <g>
        <polygon points="215,183 222,171 229,183" fill="var(--danger)" />
        <text x="360" y="185" textAnchor="middle" fill="var(--danger)" fontSize="10.5" fontFamily="var(--font-mono, monospace)" fontWeight="700">OUTAGE SPIKE: LATENCY +340%</text>
      </g>
      <text x="360" y="205" textAnchor="middle" fill="var(--muted)" fontSize="8.5" fontFamily="var(--font-mono, monospace)">Token Burn Rate: +$1,240.00 / hour</text>
      <text x="360" y="224" textAnchor="middle" fill="var(--faint)" fontSize="8" fontFamily="var(--font-mono, monospace)">Root Cause: 3x loop on node 03 retry_sql</text>
      <rect x="230" y="238" width="260" height="18" fill="var(--danger-soft, rgba(229, 72, 77, 0.12))" rx="3" />
      <text x="360" y="251" textAnchor="middle" fill="var(--danger)" fontSize="8" fontFamily="var(--font-mono, monospace)">Outage began 2 hours ago in production</text>

      {/* Monitor stand */}
      <rect x="340" y="270" width="40" height="20" fill="var(--border-strong)" rx="2" />
      <rect x="310" y="286" width="100" height="5" fill="var(--border-strong)" rx="2" />

      {/* ── Right Side: Sentry Detective in Tan Trench Coat & Fedora ── */}
      {/* Speech Bubble */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <rect x="585" y="65" width="200" height="90" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" rx="8" />
        <polygon points="675,155 695,155 685,200" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" strokeLinejoin="round" />
        <text x="685" y="85" textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="var(--font-mono, monospace)" fontWeight="600" letterSpacing="0.05em">SENTRY DETECTIVE</text>
        <text x="685" y="102" textAnchor="middle" fill="var(--fg)" fontSize="8.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="500">&quot;Beautiful flame graph!</text>
        <text x="685" y="118" textAnchor="middle" fill="var(--fg)" fontSize="8.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="500">Too bad the outage already</text>
        <text x="685" y="136" textAnchor="middle" fill="var(--danger)" fontSize="8.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="600">hit users at 2:00 AM!&quot;</text>
      </motion.g>

      {/* Detective Stickman with Tan Trench Coat & Fedora Hat */}
      <motion.g animate={{ x: [-1, 1, -1] }} transition={{ duration: 0.4, repeat: Infinity }}>
        {/* Detective Tan Fedora Hat */}
        <ellipse cx="685" cy="202" rx="18" ry="4" fill="#b45309" />
        <path d="M 673 202 Q 685 188 697 202 Z" fill="#b45309" />
        <rect x="674" y="199" width="22" height="3" fill="#1e293b" />
        
        {/* Head */}
        <circle cx="685" cy="220" r="17" fill="var(--surface)" stroke="var(--fg)" strokeWidth="2" />
        <circle cx="679" cy="216" r="1.8" fill="var(--fg)" />
        <circle cx="691" cy="216" r="1.8" fill="var(--fg)" />
        <circle cx="685" cy="227" r="2.5" fill="var(--fg)" />
        
        {/* Tan Trench Coat */}
        <path d="M 675 237 L 695 237 L 698 280 L 672 280 Z" fill="#d97706" />
        {/* White Shirt & Navy Tie */}
        <polygon points="681,237 685,248 679,248" fill="#ffffff" />
        <polygon points="689,237 685,248 691,248" fill="#ffffff" />
        <polygon points="684,242 686,242 687,258 683,258" fill="#1e3a8a" />

        <line x1="685" y1="237" x2="685" y2="274" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" />
        
        {/* Brass Magnifying glass */}
        <line x1="685" y1="248" x2="650" y2="242" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
        <circle cx="640" cy="240" r="9" fill="none" stroke="#fbbf24" strokeWidth="2" />
        <line x1="634" y1="246" x2="624" y2="256" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
        
        <line x1="685" y1="248" x2="710" y2="254" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
        <line x1="685" y1="274" x2="670" y2="306" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="685" y1="274" x2="700" y2="306" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>

      {/* Caption bar */}
      <rect x="0" y="388" width="800" height="32" fill="var(--surface)" />
      <line x1="0" y1="388" x2="800" y2="388" stroke="var(--border)" strokeWidth="1" />
      <text x="400" y="408" textAnchor="middle" fontSize="10.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="500">
        <tspan fill="var(--accent)" fontWeight="600" fontFamily="var(--font-mono, monospace)">SHOT 4 OF 5</tspan>
        <tspan fill="var(--faint)"> · </tspan>
        <tspan fill="var(--fg)">Observability charts the crash in high resolution after users have already been impacted</tspan>
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* SCENE 5 — Hero climax: AgentDiff Knight blocks the rogue agent in CI      */
/* ─────────────────────────────────────────────────────────────────────────── */
function Scene5() {
  return (
    <svg viewBox="0 0 800 420" className="w-full h-full">
      <defs>
        <linearGradient id="epicGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--surface-2)" />
          <stop offset="100%" stopColor="var(--bg)" />
        </linearGradient>
        <radialGradient id="barrierGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="800" height="310" fill="url(#epicGrad)" />
      <rect x="0" y="310" width="800" height="110" fill="var(--surface-2)" />
      <line x1="0" y1="310" x2="800" y2="310" stroke="var(--accent)" strokeWidth="1.5" opacity="0.35" />

      {/* GitHub Actions Top Bar */}
      <rect x="0" y="0" width="800" height="32" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
      <text x="20" y="20" fill="var(--muted)" fontSize="8.5" fontFamily="var(--font-mono, monospace)">github/actions · pull_request #42</text>
      <motion.text
        x="290" y="20"
        fill="var(--accent)"
        fontSize="8.5"
        fontFamily="var(--font-mono, monospace)"
        fontWeight="600"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        [ACTIVE] DETERMINISTIC LCS DIFF ENGINE
      </motion.text>

      {/* ── ZONE 1 (Left, x: 25-345): AgentDiff Terminal Output ── */}
      <rect x="25" y="44" width="320" height="254" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.2" rx="8" />
      <rect x="25" y="44" width="320" height="22" fill="var(--surface-2)" rx="8" />
      <circle cx="40" cy="55" r="3" fill="var(--danger)" />
      <circle cx="50" cy="55" r="3" fill="var(--border-strong)" />
      <circle cx="60" cy="55" r="3" fill="var(--accent)" />
      <text x="76" y="58" fill="var(--muted)" fontSize="8" fontFamily="var(--font-mono, monospace)">agentdiff check --baseline main --head pr/42</text>
      
      <text x="38" y="80" fill="var(--muted)" fontSize="8" fontFamily="var(--font-mono, monospace)">Computing Topological LCS Diff...</text>
      <text x="38" y="96" fill="var(--accent)" fontSize="8" fontFamily="var(--font-mono, monospace)">[+] Baseline loaded (sha: a3f8b2c)</text>
      <text x="38" y="114" fill="var(--danger)" fontSize="8" fontFamily="var(--font-mono, monospace)">[!] Divergence detected on node 03</text>
      <text x="38" y="130" fill="var(--danger)" fontSize="8" fontFamily="var(--font-mono, monospace)">    Loop: retry_sql (k=3 iterations)</text>
      <text x="38" y="148" fill="var(--muted)" fontSize="8" fontFamily="var(--font-mono, monospace)">    TDI Score: 0.42 (max allowed: 0.25)</text>
      <text x="38" y="166" fill="var(--muted)" fontSize="8" fontFamily="var(--font-mono, monospace)">Execution time: 3.2ms · Cost: $0.00</text>
      
      {/* Blocked Red Banner inside Terminal */}
      <rect x="38" y="182" width="294" height="42" fill="var(--danger-soft, rgba(229, 72, 77, 0.16))" stroke="var(--danger)" strokeWidth="1" rx="4" />
      <text x="185" y="200" textAnchor="middle" fill="var(--danger)" fontSize="10" fontFamily="var(--font-mono, monospace)" fontWeight="700">PR BLOCKED · EXIT CODE 1</text>
      <text x="185" y="215" textAnchor="middle" fill="var(--accent)" fontSize="7.5" fontFamily="var(--font-mono, monospace)">0s LLM latency · 100% deterministic</text>

      {/* Terminal Flamegraph button */}
      <rect x="38" y="234" width="294" height="20" fill="var(--surface-2)" rx="3" />
      <text x="185" y="247" textAnchor="middle" fill="var(--muted)" fontSize="7.5" fontFamily="var(--font-mono, monospace)">Deterministic AST trajectory mapped</text>

      {/* ── ZONE 2 (Center, x: 360-550): AgentDiff Knight Guardian with Armor & Plume ── */}
      {/* Energy barrier glow */}
      <ellipse cx="500" cy="200" rx="40" ry="100" fill="url(#barrierGlow)" />
      {/* Vertical Holographic Energy Forcefield */}
      <motion.line
        x1="500" y1="80" x2="500" y2="310"
        stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="6 4"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />

      {/* Knight Speech Bubble */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <rect x="365" y="44" width="165" height="52" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.2" rx="8" />
        <polygon points="435,96 455,96 445,116" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round" />
        <text x="447" y="60" textAnchor="middle" fill="var(--accent)" fontSize="7" fontFamily="var(--font-mono, monospace)" fontWeight="600" letterSpacing="0.05em">AGENTDIFF GUARDIAN</text>
        <text x="447" y="74" textAnchor="middle" fill="var(--fg)" fontSize="8.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="600">&quot;HALT! TDI 0.42 &gt; 0.25.&quot;</text>
        <text x="447" y="87" textAnchor="middle" fill="var(--accent)" fontSize="7.5" fontFamily="var(--font-mono, monospace)">PR Blocked in 3.2ms</text>
      </motion.g>

      {/* The Knight in Emerald Armor Tabard, Plume & Fluttering Cape */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Fluttering Emerald Cape */}
        <motion.path
          d="M 436 165 Q 418 190 416 230 Q 428 200 440 180"
          fill="#10b981" opacity="0.85"
          animate={{
            d: [
              "M 436 165 Q 418 190 416 230 Q 428 200 440 180",
              "M 436 165 Q 412 195 410 234 Q 424 202 440 180",
              "M 436 165 Q 418 190 416 230 Q 428 200 440 180"
            ]
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Emerald Plume flowing left */}
        <path d="M 440 120 Q 425 105 410 114" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Steel Helmet */}
        <path d="M 430 122 Q 445 110 460 122 L 460 142 L 430 142 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
        <line x1="436" y1="132" x2="454" y2="132" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Head */}
        <circle cx="445" cy="150" r="15" fill="var(--surface)" stroke="var(--fg)" strokeWidth="2" />
        <line x1="440" y1="147" x2="443" y2="147" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="448" y1="147" x2="451" y2="147" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 441 156 Q 445 153 449 156" stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        
        {/* Emerald Armor Tabard with White Cross */}
        <path d="M 436 165 L 454 165 L 456 226 L 434 226 Z" fill="#047857" stroke="#10b981" strokeWidth="1.5" />
        <line x1="445" y1="172" x2="445" y2="192" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <line x1="439" y1="178" x2="451" y2="178" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        
        {/* Torso */}
        <line x1="445" y1="165" x2="445" y2="228" stroke="var(--fg)" strokeWidth="2.8" strokeLinecap="round" />
        
        {/* Left Lance Arm + Steel Spear */}
        <line x1="445" y1="184" x2="410" y2="198" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <line x1="410" y1="95" x2="410" y2="310" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <polygon points="410,90 405,108 415,108" fill="#10b981" />
        
        {/* Right Arm holding Emerald Heater Shield */}
        <line x1="445" y1="184" x2="475" y2="192" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <path d="M 475 160 L 500 160 Q 500 230 488 248 Q 475 230 475 160 Z" fill="#047857" stroke="#10b981" strokeWidth="2.2" />
        <line x1="488" y1="168" x2="488" y2="238" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="478" y1="194" x2="498" y2="194" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Armored Legs */}
        <line x1="445" y1="228" x2="430" y2="295" stroke="#475569" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="445" y1="228" x2="460" y2="295" stroke="#475569" strokeWidth="2.8" strokeLinecap="round" />
      </motion.g>

      {/* ── ZONE 3 (Right, x: 550-780): Blocked Rogue Agent with Burglar Stripes ── */}
      {/* Production Gate Vault */}
      <rect x="735" y="90" width="45" height="220" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" rx="6" />
      <rect x="735" y="90" width="45" height="24" fill="var(--surface-2)" rx="6" />
      <text x="757" y="106" textAnchor="middle" fill="var(--danger)" fontSize="7" fontFamily="var(--font-mono, monospace)" fontWeight="700">PROD</text>
      <text x="757" y="195" textAnchor="middle" fill="var(--muted)" fontSize="7.5" fontFamily="var(--font-mono, monospace)" letterSpacing="0.1em" transform="rotate(-90 757 195)">LOCKED</text>

      {/* Rogue Agent Callout Bubble */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <rect x="560" y="70" width="165" height="54" fill="var(--surface)" stroke="var(--danger)" strokeWidth="1.2" rx="8" />
        <polygon points="610,124 630,124 620,165" fill="var(--surface)" stroke="var(--danger)" strokeWidth="1.2" strokeLinejoin="round" />
        <text x="642" y="85" textAnchor="middle" fill="var(--danger)" fontSize="7" fontFamily="var(--font-mono, monospace)" fontWeight="600" letterSpacing="0.05em">PR #42 (ROGUE AGENT)</text>
        <text x="642" y="100" textAnchor="middle" fill="var(--fg)" fontSize="8.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="500">&quot;Caught by AST LCS diff!&quot;</text>
        <text x="642" y="113" textAnchor="middle" fill="var(--danger)" fontSize="7.5" fontFamily="var(--font-mono, monospace)">Blocked before deployment</text>
      </motion.g>

      {/* Rogue Agent bouncing off the forcefield with Burglar Mask & Stripes */}
      <motion.g
        animate={{ x: [0, 8, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 0.4, repeat: Infinity }}
        style={{ transformOrigin: "620px 220px" }}
      >
        {/* Animated Stun sparks at forcefield impact */}
        <motion.polygon
          points="505,195 515,190 510,200 520,202 510,206 514,215 504,208"
          fill="var(--accent)"
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 0.3, repeat: Infinity }}
          style={{ transformOrigin: "510px 200px" }}
        />
        
        {/* Rogue stickman */}
        <circle cx="620" cy="200" r="15" fill="var(--surface)" stroke="var(--danger)" strokeWidth="2" />
        {/* Burglar Bandit Mask */}
        <path d="M 609 196 Q 620 190 631 196 Q 631 202 620 204 Q 609 202 609 196 Z" fill="var(--danger)" />
        <circle cx="616" cy="198" r="1.2" fill="var(--surface)" />
        <circle cx="624" cy="198" r="1.2" fill="var(--surface)" />
        
        {/* Burglar Striped Shirt */}
        <path d="M 612 215 L 628 215 L 626 258 L 614 258 Z" fill="#1e293b" />
        <line x1="613" y1="225" x2="627" y2="225" stroke="#ef4444" strokeWidth="1.8" />
        <line x1="613" y1="237" x2="627" y2="237" stroke="#ef4444" strokeWidth="1.8" />
        <line x1="614" y1="249" x2="626" y2="249" stroke="#ef4444" strokeWidth="1.8" />

        <line x1="620" y1="215" x2="620" y2="258" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" />
        {/* Flailing arms */}
        <line x1="620" y1="228" x2="592" y2="215" stroke="var(--danger)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="620" y1="228" x2="646" y2="215" stroke="var(--danger)" strokeWidth="1.8" strokeLinecap="round" />
        {/* Legs */}
        <line x1="620" y1="258" x2="606" y2="295" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="620" y1="258" x2="634" y2="295" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>

      {/* Caption bar */}
      <rect x="0" y="388" width="800" height="32" fill="var(--surface)" />
      <line x1="0" y1="388" x2="800" y2="388" stroke="var(--border)" strokeWidth="1" />
      <text x="400" y="408" textAnchor="middle" fontSize="10.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="500">
        <tspan fill="var(--accent)" fontWeight="600" fontFamily="var(--font-mono, monospace)">SHOT 5 OF 5</tspan>
        <tspan fill="var(--faint)"> · </tspan>
        <tspan fill="var(--fg)">AgentDiff blocks silent trajectory drift in CI deterministically at zero LLM cost</tspan>
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* MAIN PLAYER                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */
const SCENES = [
  { id: 0, duration: 6000, component: <Scene1 /> },
  { id: 1, duration: 6000, component: <Scene2 /> },
  { id: 2, duration: 7000, component: <Scene3 /> },
  { id: 3, duration: 7000, component: <Scene4 /> },
  { id: 4, duration: 8000, component: <Scene5 /> },
];

export default function CompareHeroAsset() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const scene = SCENES[currentScene];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      const next = currentScene + 1;
      if (next >= SCENES.length) {
        setIsPlaying(false);
      } else {
        setCurrentScene(next);
      }
    }, scene.duration);
    return () => clearTimeout(timer);
  }, [isPlaying, currentScene, scene.duration]);

  return (
    <div className="w-full my-4 select-none relative">
      {/* Ambient glow behind canvas */}
      <div className="absolute inset-0 bg-emerald-500/8 dark:bg-emerald-400/10 rounded-2xl blur-3xl pointer-events-none" />

      {/* Free-flowing film canvas — open & borderless */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "800/420" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            {scene.component}
          </motion.div>
        </AnimatePresence>

        {/* Replay button — only visible once film ends (Adaptive Light/Dark Theme) */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={() => { setCurrentScene(0); setIsPlaying(true); }}
              className="absolute bottom-12 right-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-(--surface)/90 dark:bg-(--surface)/90 backdrop-blur-md border border-(--border-strong) text-(--fg) text-xs font-mono tracking-tight hover:bg-(--surface-2) transition-colors cursor-pointer z-20 shadow-md"
            >
              <RotateCcw className="w-3 h-3 text-emerald-500" />
              <span>Replay Film</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Thin progress line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-(--border) z-10">
          <motion.div
            key={currentScene}
            className="h-full bg-gradient-to-r from-(--accent) to-(--accent-strong)"
            initial={{ width: `${(currentScene / SCENES.length) * 100}%` }}
            animate={{ width: `${((currentScene + 1) / SCENES.length) * 100}%` }}
            transition={{ duration: scene.duration / 1000, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
