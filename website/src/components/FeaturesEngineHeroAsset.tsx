"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

export default function FeaturesEngineHeroAsset() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="w-full my-6 select-none relative font-sans">
      {/* Soft ambient background flare */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[260px] bg-emerald-500/10 dark:bg-emerald-400/12 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Clean open canvas */}
      <div className="w-full py-4 relative">
        
        {/* Minimal Floating Story Nav Pills */}
        <div className="flex items-center justify-between gap-4 pb-5 mb-4 border-b border-(--border)">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs uppercase tracking-[0.16em] text-(--faint) font-semibold">
              Execution Lifecycle
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-(--surface-2)/60 p-1 rounded-full border border-(--border) text-xs">
              {[
                { id: 0, label: "Golden Run" },
                { id: 1, label: "Loop Trap" },
                { id: 2, label: "Knight's Gate" },
              ].map((tab) => {
                const isActive = activeScene === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveScene(tab.id);
                      setIsPlaying(false);
                    }}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                      isActive
                        ? "bg-(--fg) text-(--bg) shadow-2xs"
                        : "text-(--muted) hover:text-(--fg)"
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-full border border-(--border) bg-(--surface) hover:bg-(--surface-2) text-(--muted) hover:text-(--fg) transition-colors cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* The Open Illustration Arena */}
        <div className="relative min-h-[220px] w-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            
            {/* SCENE 1: Happy Agent Running Free on Ground Line */}
            {activeScene === 0 && (
              <motion.div
                key="scene-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-2xl flex flex-col items-center justify-center py-4"
              >
                <div className="w-full relative h-32 flex items-center justify-between px-6 sm:px-12">
                  
                  {/* Open Horizon Line */}
                  <div className="absolute bottom-6 left-4 right-4 h-px bg-(--border)" />
                  <motion.div
                    className="absolute bottom-6 left-4 right-4 h-[2px] bg-emerald-500 shadow-[0_0_8px_#10b981]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformOrigin: "left" }}
                  />

                  {/* Left Label */}
                  <div className="text-left z-10 pb-4">
                    <div className="text-xs uppercase tracking-wider text-(--faint) font-semibold">Start</div>
                    <div className="text-sm font-bold text-(--fg) tracking-tight">User Request</div>
                  </div>

                  {/* Running Stickman */}
                  <motion.div
                    className="flex flex-col items-center z-20 pb-4"
                    animate={{
                      x: [-120, 120],
                      y: [0, -8, 0, -8, 0],
                    }}
                    transition={{
                      x: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                      y: { duration: 0.4, repeat: Infinity, ease: "easeInOut" },
                    }}
                  >
                    <svg width="40" height="52" viewBox="0 0 40 52" fill="none">
                      {/* Happy Face with Smile */}
                      <circle cx="20" cy="11" r="8" stroke="#10B981" strokeWidth="2.5" fill="var(--bg)" />
                      <circle cx="17" cy="10" r="1" fill="#10B981" />
                      <circle cx="23" cy="10" r="1" fill="#10B981" />
                      <path d="M 17 14 Q 20 17 23 14" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                      
                      {/* Body */}
                      <line x1="20" y1="19" x2="20" y2="33" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                      
                      {/* Running Arms */}
                      <line x1="20" y1="23" x2="30" y2="19" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
                      <line x1="20" y1="23" x2="10" y2="27" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
                      
                      {/* Running Legs */}
                      <line x1="20" y1="33" x2="30" y2="47" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="20" y1="33" x2="10" y2="45" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </motion.div>

                  {/* Right Goal */}
                  <div className="text-right z-10 pb-4">
                    <div className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">180ms · $0.002</div>
                    <div className="text-sm font-bold text-(--fg) tracking-tight">Output Delivered</div>
                  </div>

                </div>

                <p className="text-sm text-(--muted) text-center mt-3 leading-relaxed">
                  <strong className="text-(--fg) font-semibold">Baseline Golden Run:</strong> 4 steps executed in a clean deterministic sequence with zero wasted token overhead.
                </p>
              </motion.div>
            )}

            {/* SCENE 2: Dizzy Stickman in Spinning Wheel */}
            {activeScene === 1 && (
              <motion.div
                key="scene-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-2xl flex flex-col items-center justify-center py-4"
              >
                <div className="w-full relative h-32 flex items-center justify-around px-6">
                  
                  <div className="text-left">
                    <div className="text-xs uppercase tracking-wider text-amber-500 font-semibold">Pull Request</div>
                    <div className="text-sm font-bold text-(--fg) tracking-tight">Prompt Edit</div>
                  </div>

                  {/* Spinning Ring Treadmill */}
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full border border-dashed border-rose-500/50 flex items-center justify-center relative">
                      
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-transparent border-t-rose-500"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                      />

                      <motion.div
                        animate={{
                          y: [0, -4, 0, -4, 0],
                          rotate: [-5, 5, -5],
                        }}
                        transition={{
                          y: { duration: 0.3, repeat: Infinity, ease: "easeInOut" },
                          rotate: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
                        }}
                      >
                        <svg width="36" height="46" viewBox="0 0 40 52" fill="none">
                          <circle cx="20" cy="11" r="8" stroke="#F43F5E" strokeWidth="2.5" fill="var(--bg)" />
                          <line x1="16" y1="8" x2="19" y2="11" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round" />
                          <line x1="19" y1="8" x2="16" y2="11" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round" />
                          <line x1="21" y1="8" x2="24" y2="11" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round" />
                          <line x1="24" y1="8" x2="21" y2="11" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round" />
                          <circle cx="20" cy="15" r="1.2" fill="#F43F5E" />
                          
                          <line x1="20" y1="19" x2="20" y2="33" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
                          <line x1="20" y1="23" x2="31" y2="15" stroke="#F43F5E" strokeWidth="2.2" strokeLinecap="round" />
                          <line x1="20" y1="23" x2="9" y2="15" stroke="#F43F5E" strokeWidth="2.2" strokeLinecap="round" />
                          <line x1="20" y1="33" x2="29" y2="45" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
                          <line x1="20" y1="33" x2="11" y2="45" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </motion.div>
                    </div>

                    <span className="text-xs text-rose-500 font-semibold tracking-tight mt-1">
                      3× Retry Loop
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-rose-500 font-semibold">+340% Cost</div>
                    <div className="text-sm font-bold text-rose-500 tracking-tight">Burning Tokens</div>
                  </div>

                </div>

                <p className="text-sm text-(--muted) text-center mt-3 leading-relaxed">
                  <strong className="text-rose-500 font-semibold">The Silent Regression:</strong> The answer string matches, but the agent spins in an unnecessary retry cycle wasting cloud budget.
                </p>
              </motion.div>
            )}

            {/* SCENE 3: The Knight Stickman Blocking Drifted Run */}
            {activeScene === 2 && (
              <motion.div
                key="scene-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-2xl flex flex-col items-center justify-center py-4"
              >
                <div className="w-full relative h-36 flex items-center justify-between px-6 sm:px-12">
                  
                  {/* Surprised / Stopped Drifted Stickman */}
                  <div className="flex flex-col items-center">
                    <div className="text-xs uppercase tracking-wider text-rose-400 font-semibold mb-1">Drifted Run</div>
                    
                    <svg width="40" height="52" viewBox="0 0 40 52" fill="none">
                      {/* Surprised Head */}
                      <circle cx="20" cy="11" r="8" stroke="#F43F5E" strokeWidth="2.5" fill="var(--bg)" />
                      <circle cx="17" cy="10" r="1.2" fill="#F43F5E" />
                      <circle cx="23" cy="10" r="1.2" fill="#F43F5E" />
                      <circle cx="20" cy="15" r="1.8" fill="#F43F5E" />
                      
                      {/* Body */}
                      <line x1="20" y1="19" x2="20" y2="33" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
                      
                      {/* Thrown-up Hands */}
                      <line x1="20" y1="23" x2="30" y2="25" stroke="#F43F5E" strokeWidth="2.2" strokeLinecap="round" />
                      <line x1="20" y1="23" x2="10" y2="25" stroke="#F43F5E" strokeWidth="2.2" strokeLinecap="round" />
                      
                      {/* Stopped Legs */}
                      <line x1="20" y1="33" x2="28" y2="47" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="20" y1="33" x2="12" y2="47" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>

                    <span className="text-[11px] font-mono text-rose-400 mt-1">TDI: 0.42 &gt; 0.25</span>
                  </div>

                  {/* The Guardian Knight Stickman with Helmet, Lance & Emerald Shield */}
                  <div className="flex flex-col items-center">
                    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
                      {/* Knight Plume on Helmet */}
                      <path d="M 28 8 Q 24 2, 20 6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                      
                      {/* Knight Helmet */}
                      <path d="M 22 10 Q 28 6, 34 10 L 34 19 L 22 19 Z" stroke="#10B981" strokeWidth="2.4" fill="var(--surface-2)" />
                      {/* Helmet Visor Slit */}
                      <line x1="25" y1="14" x2="31" y2="14" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" />
                      
                      {/* Knight Body */}
                      <line x1="28" y1="20" x2="28" y2="38" stroke="#10B981" strokeWidth="2.8" strokeLinecap="round" />
                      
                      {/* Strong Stance Legs */}
                      <line x1="28" y1="38" x2="38" y2="56" stroke="#10B981" strokeWidth="2.8" strokeLinecap="round" />
                      <line x1="28" y1="38" x2="18" y2="56" stroke="#10B981" strokeWidth="2.8" strokeLinecap="round" />

                      {/* Right Hand Holding Halberd / Guard Lance */}
                      <line x1="28" y1="26" x2="42" y2="30" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
                      <line x1="42" y1="6" x2="42" y2="58" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
                      <polygon points="42,2 38,10 46,10" fill="#10B981" />

                      {/* Left Arm Holding Big Emerald Shield (Blocking Path) */}
                      <line x1="28" y1="26" x2="10" y2="28" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
                      
                      {/* Guardian Shield */}
                      <path
                        d="M 4 20 L 16 20 Q 16 38, 10 44 Q 4 38, 4 20 Z"
                        fill="var(--bg)"
                        stroke="#10B981"
                        strokeWidth="2.5"
                      />
                      {/* Shield Cross / Emblem */}
                      <line x1="10" y1="24" x2="10" y2="38" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="6" y1="30" x2="14" y2="30" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>

                    <div className="mt-1 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-semibold text-xs tracking-tight">
                      EXIT CODE 1 (BLOCKED)
                    </div>
                  </div>

                  {/* Production Realm */}
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">Zero Regressions</div>
                    <div className="text-sm font-bold text-(--fg) tracking-tight">Production Safe 🛡️</div>
                  </div>

                </div>

                <p className="text-sm text-(--muted) text-center mt-3 leading-relaxed">
                  <strong className="text-emerald-500 font-semibold">The CI Gatekeeper:</strong> The AgentDiff knight raises its shield in GitHub Actions, halting broken agent runs before they merge.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
