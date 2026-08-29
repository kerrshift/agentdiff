"use client";

import React, { useState } from "react";
import Reveal from "./Reveal";
import { 
  GitPullRequest, 
  GitMerge, 
  Check, 
  X, 
  MessageSquare, 
  Eye, 
  Star, 
  Search, 
  Bell, 
  Plus, 
  Code, 
  PlayCircle, 
  ShieldAlert, 
  MoreHorizontal,
  Smile,
  ChevronDown,
  ExternalLink,
  Copy,
  Terminal,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  GitCommit,
  Clock,
  ShieldCheck,
  FileText
} from "lucide-react";

interface PRItem {
  id: "blocked" | "clean";
  number: string;
  title: string;
  author: string;
  authorAvatar: string;
  branch: string;
  baseBranch: string;
  time: string;
  commitSha: string;
  statusBadge: string;
  checksDetail: { name: string; status: "failed" | "passed"; duration: string; details: string }[];
  statusTitle: string;
  statusDesc: string;
  comment: {
    botName: string;
    badge: string;
    verdictTitle: string;
    summary: string;
    table: { gate: string; actual: string; threshold: string; status: "FAIL" | "PASS" }[];
    culpritTitle: string;
    culpritDesc: string;
    diffTree: { line: string; isAdd?: boolean; isLoop?: boolean }[];
  };
}

const PR_DATA: Record<"blocked" | "clean", PRItem> = {
  blocked: {
    id: "blocked",
    number: "42",
    title: "refactor(prompt): parse customer records with new schema",
    author: "alex-chen",
    authorAvatar: "https://avatars.githubusercontent.com/u/583231?v=4",
    branch: "feat/parse-schema",
    baseBranch: "main",
    time: "2 minutes ago",
    commitSha: "f8c21a9",
    statusBadge: "Open",
    checksDetail: [
      { name: "agentdiff / evaluate-trajectory (pull_request)", status: "failed", duration: "4.2ms", details: "Exit Code 1 · Stagnant loop detected" },
      { name: "pytest / unit-tests (pull_request)", status: "passed", duration: "1.2s", details: "32 passed in 1.2s" },
      { name: "ruff / lint-and-format (pull_request)", status: "passed", duration: "0.4s", details: "0 errors, 0 warnings" },
    ],
    statusTitle: "All checks have failed",
    statusDesc: "1 failing and 2 successful checks",
    comment: {
      botName: "agentdiff-gate",
      badge: "bot",
      verdictTitle: "⛔ AgentDiff · Trajectory Regression Check (Exit Code 1)",
      summary: "Candidate execution trajectory breached regression tolerances against golden baseline.",
      table: [
        { gate: "TDI (Trajectory Divergence)", actual: "0.4285", threshold: "≤ 0.2500", status: "FAIL" },
        { gate: "Stagnant Tool Retries", actual: "3 loops", threshold: "0 loops", status: "FAIL" },
        { gate: "Token Budget Delta", actual: "+148.2%", threshold: "≤ 10.0%", status: "FAIL" },
      ],
      culpritTitle: "Root Cause Culprit",
      culpritDesc: "execute_sql node repeated 3 consecutive times with identical parameters without state progress.",
      diffTree: [
        { line: "1 · authenticate" },
        { line: "2 · execute_sql" },
        { line: "3 + execute_sql   (↻ loop repetition 1)", isLoop: true },
        { line: "4 + execute_sql   (↻ loop repetition 2)", isLoop: true },
        { line: "5 + execute_sql   (↻ loop repetition 3)", isLoop: true },
        { line: "6 · generate_summary" },
      ],
    },
  },
  clean: {
    id: "clean",
    number: "43",
    title: "perf(tools): optimize postgres indexing & query execution",
    author: "maya-lin",
    authorAvatar: "https://avatars.githubusercontent.com/u/928472?v=4",
    branch: "perf/db-index",
    baseBranch: "main",
    time: "14 minutes ago",
    commitSha: "3d9a11b",
    statusBadge: "Open",
    checksDetail: [
      { name: "agentdiff / evaluate-trajectory (pull_request)", status: "passed", duration: "3.8ms", details: "Exit Code 0 · 0 loops, -18% tokens" },
      { name: "pytest / unit-tests (pull_request)", status: "passed", duration: "1.1s", details: "32 passed in 1.1s" },
      { name: "ruff / lint-and-format (pull_request)", status: "passed", duration: "0.4s", details: "0 errors, 0 warnings" },
    ],
    statusTitle: "All checks have passed",
    statusDesc: "3 successful checks",
    comment: {
      botName: "agentdiff-gate",
      badge: "bot",
      verdictTitle: "✅ AgentDiff · Trajectory Regression Check (Exit Code 0)",
      summary: "Candidate execution trajectory matches the committed golden baseline within accepted limits.",
      table: [
        { gate: "TDI (Trajectory Divergence)", actual: "0.0000", threshold: "≤ 0.2500", status: "PASS" },
        { gate: "Stagnant Tool Retries", actual: "0 loops", threshold: "0 loops", status: "PASS" },
        { gate: "Token Budget Delta", actual: "-18.4%", threshold: "≤ 10.0%", status: "PASS" },
      ],
      culpritTitle: "Clean Execution",
      culpritDesc: "100% isomorphic execution graph with zero redundant loops and -18% token savings.",
      diffTree: [
        { line: "1 · authenticate" },
        { line: "2 · execute_sql" },
        { line: "3 · generate_summary" },
      ],
    },
  },
};

export default function PRCommentShowcase() {
  const [activeTab, setActiveTab] = useState<"blocked" | "clean">("blocked");
  const [prNavTab, setPrNavTab] = useState<"conversation" | "commits" | "checks" | "files">("conversation");
  const [copiedSha, setCopiedSha] = useState(false);
  const [reactions, setReactions] = useState<{ eyes: number; thumbsUp: number; rocket: number }>({ eyes: 4, thumbsUp: 2, rocket: 1 });
  const [hasReacted, setHasReacted] = useState<string | null>(null);

  const pr = PR_DATA[activeTab];
  const isBlocked = activeTab === "blocked";

  const handleCopySha = () => {
    navigator.clipboard.writeText(pr.commitSha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const handleReaction = (type: "eyes" | "thumbsUp" | "rocket") => {
    if (hasReacted === type) {
      setReactions((prev) => ({ ...prev, [type]: prev[type] - 1 }));
      setHasReacted(null);
    } else {
      setReactions((prev) => ({ ...prev, [type]: prev[type] + 1 }));
      setHasReacted(type);
    }
  };

  return (
    <section id="ci-in-action-section" className="py-24 sm:py-32 bg-transparent font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal>
          <div className="max-w-4xl mb-16 sm:mb-20">
            <span className="text-xs uppercase tracking-[0.18em] text-(--faint) block mb-4 font-medium">
              Automated CI/CD Feedback
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-(--fg) leading-[1.1]">
              Instant root-cause diagnosis <span className="text-emerald-500/90 dark:text-emerald-400">right in GitHub PRs</span>.
            </h2>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-(--muted) leading-relaxed font-normal max-w-3xl">
              Engineers never have to hunt through raw terminal logs or third-party web apps. AgentDiff posts an actionable diagnostic comment directly to the Pull Request review timeline.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          {/* PR Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <button
              onClick={() => {
                setActiveTab("blocked");
                setPrNavTab("conversation");
              }}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 border ${
                isBlocked
                  ? "bg-(--surface-2) text-(--fg) border-(--border-strong) font-semibold shadow-2xs"
                  : "bg-transparent text-(--muted) border-(--border) hover:border-(--border-strong) hover:text-(--fg)"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>PR #{PR_DATA.blocked.number} · Regressed Run (Blocked)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("clean");
                setPrNavTab("conversation");
              }}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 border ${
                !isBlocked
                  ? "bg-(--surface-2) text-(--fg) border-(--border-strong) font-semibold shadow-2xs"
                  : "bg-transparent text-(--muted) border-(--border) hover:border-(--border-strong) hover:text-(--fg)"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>PR #{PR_DATA.clean.number} · Clean Run (Passed)</span>
            </button>
          </div>

          {/* Full GitHub Web Application Browser Frame (Light / Dark Adaptive) */}
          <div className="rounded-2xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-[#1f2328] dark:text-[#c9d1d9] overflow-hidden shadow-2xl font-sans text-xs flex flex-col transition-colors">
            
            {/* 1. Global GitHub Top Nav Bar */}
            <div className="px-4 py-3 bg-[#f6f8fa] dark:bg-[#010409] border-b border-[#d0d7de] dark:border-[#30363d] flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Octocat Logo */}
                <svg height="24" viewBox="0 0 16 16" version="1.1" width="24" className="fill-[#1f2328] dark:fill-white shrink-0">
                  <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                </svg>

                <div className="flex items-center gap-2 text-[#1f2328] dark:text-[#e6edf3] font-semibold text-xs truncate">
                  <span className="text-[#656d76] dark:text-[#7d8590] font-normal hover:underline cursor-pointer">acme-corp</span>
                  <span className="text-[#656d76] dark:text-[#7d8590]">/</span>
                  <span className="hover:underline cursor-pointer">customer-support-agent</span>
                  <span className="px-2 py-0.5 rounded-full border border-[#d0d7de] dark:border-[#30363d] text-[10px] text-[#656d76] dark:text-[#7d8590] font-mono ml-1 bg-[#f6f8fa] dark:bg-[#161b22]">Public</span>
                </div>
              </div>

              {/* GitHub Right Header Controls */}
              <div className="flex items-center gap-3 text-[#656d76] dark:text-[#7d8590] text-xs shrink-0">
                <div className="hidden md:flex items-center gap-2 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] px-2.5 py-1 rounded-md text-[11px]">
                  <Search className="w-3.5 h-3.5" />
                  <span>Type <kbd className="font-mono bg-[#f6f8fa] dark:bg-[#21262d] px-1 rounded text-[10px] border border-[#d0d7de] dark:border-[#30363d]">/</kbd> to search</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-md hover:bg-[#eaeef2] dark:hover:bg-[#21262d] cursor-pointer"><Bell className="w-3.5 h-3.5 text-[#1f2328] dark:text-[#e6edf3]" /></span>
                  <span className="p-1.5 rounded-md hover:bg-[#eaeef2] dark:hover:bg-[#21262d] cursor-pointer"><Plus className="w-3.5 h-3.5 text-[#1f2328] dark:text-[#e6edf3]" /></span>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 border border-[#d0d7de] dark:border-[#30363d]" />
                </div>
              </div>
            </div>

            {/* 2. Repository Sub-Navigation (Code, Issues, Pull Requests, Actions) */}
            <div className="px-6 bg-[#f6f8fa] dark:bg-[#010409] border-b border-[#d0d7de] dark:border-[#30363d] flex items-center gap-6 overflow-x-auto text-[13px]">
              <span className="py-2.5 text-[#656d76] dark:text-[#7d8590] hover:text-[#1f2328] dark:hover:text-[#e6edf3] flex items-center gap-2 cursor-pointer">
                <Code className="w-4 h-4" /> Code
              </span>
              <span className="py-2.5 text-[#656d76] dark:text-[#7d8590] hover:text-[#1f2328] dark:hover:text-[#e6edf3] flex items-center gap-2 cursor-pointer">
                <span className="w-4 h-4 rounded-full border border-[#656d76] dark:border-[#7d8590] flex items-center justify-center text-[10px]">●</span> Issues
              </span>
              <span className="py-2.5 text-[#1f2328] dark:text-[#e6edf3] border-b-2 border-[#fd8c73] dark:border-[#f78166] font-semibold flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-[#fd8c73] dark:text-[#f78166]" /> Pull requests
                <span className="px-1.5 py-0.2 rounded-full bg-[#eaeef2] dark:bg-[#21262d] text-[#1f2328] dark:text-[#e6edf3] text-[11px] font-mono">4</span>
              </span>
              <span className="py-2.5 text-[#656d76] dark:text-[#7d8590] hover:text-[#1f2328] dark:hover:text-[#e6edf3] flex items-center gap-2 cursor-pointer hidden sm:flex">
                <PlayCircle className="w-4 h-4" /> Actions
              </span>
              <span className="py-2.5 text-[#656d76] dark:text-[#7d8590] hover:text-[#1f2328] dark:hover:text-[#e6edf3] flex items-center gap-2 cursor-pointer hidden sm:flex">
                <ShieldAlert className="w-4 h-4" /> Security
              </span>
            </div>

            {/* 3. Pull Request Main Content Area */}
            <div className="p-6 sm:p-8 space-y-6 bg-white dark:bg-[#0d1117] min-h-[640px] flex flex-col justify-between">
              
              <div className="space-y-6">
                {/* Title & PR Metadata Bar */}
                <div className="space-y-3 pb-4 border-b border-[#d0d7de] dark:border-[#21262d]">
                  <h3 className="text-xl sm:text-2xl font-normal text-[#1f2328] dark:text-[#e6edf3] tracking-tight flex items-baseline gap-2 flex-wrap">
                    <span>{pr.title}</span> <span className="text-[#656d76] dark:text-[#7d8590] font-light">#{pr.number}</span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#656d76] dark:text-[#7d8590]">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1f883d] dark:bg-[#238636] text-white font-semibold text-xs shadow-2xs">
                      <GitPullRequest className="w-3.5 h-3.5" />
                      {pr.statusBadge}
                    </span>

                    <span>
                      <strong className="text-[#1f2328] dark:text-[#e6edf3] font-semibold hover:underline cursor-pointer">{pr.author}</strong> wants to merge 1 commit into{" "}
                      <code className="px-1.5 py-0.5 rounded bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-[11px] font-mono text-[#0969da] dark:text-[#58a6ff]">
                        {pr.baseBranch}
                      </code>{" "}
                      from{" "}
                      <code className="px-1.5 py-0.5 rounded bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-[11px] font-mono text-[#0969da] dark:text-[#58a6ff]">
                        {pr.branch}
                      </code>
                    </span>
                  </div>
                </div>

                {/* GitHub PR Inner Tabs Bar (Interactive) */}
                <div className="flex items-center gap-6 border-b border-[#d0d7de] dark:border-[#21262d] text-xs font-medium -mt-2">
                  <button
                    onClick={() => setPrNavTab("conversation")}
                    className={`pb-3 flex items-center gap-2 transition-colors ${
                      prNavTab === "conversation"
                        ? "text-[#1f2328] dark:text-[#e6edf3] border-b-2 border-[#fd8c73] dark:border-[#f78166] font-semibold"
                        : "text-[#656d76] dark:text-[#7d8590] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Conversation <span className="px-1.5 py-0.2 rounded-full bg-[#eaeef2] dark:bg-[#21262d] text-[#1f2328] dark:text-[#e6edf3] text-[10px] font-mono">2</span>
                  </button>

                  <button
                    onClick={() => setPrNavTab("commits")}
                    className={`pb-3 flex items-center gap-1.5 transition-colors ${
                      prNavTab === "commits"
                        ? "text-[#1f2328] dark:text-[#e6edf3] border-b-2 border-[#fd8c73] dark:border-[#f78166] font-semibold"
                        : "text-[#656d76] dark:text-[#7d8590] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                    }`}
                  >
                    Commits <span className="px-1.5 py-0.2 rounded-full bg-[#eaeef2] dark:bg-[#21262d] text-[#656d76] dark:text-[#7d8590] text-[10px] font-mono">1</span>
                  </button>

                  <button
                    onClick={() => setPrNavTab("checks")}
                    className={`pb-3 flex items-center gap-1.5 transition-colors ${
                      prNavTab === "checks"
                        ? "text-[#1f2328] dark:text-[#e6edf3] border-b-2 border-[#fd8c73] dark:border-[#f78166] font-semibold"
                        : "text-[#656d76] dark:text-[#7d8590] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                    }`}
                  >
                    Checks <span className={`px-1.5 py-0.2 rounded-full border text-[10px] font-mono font-bold ${isBlocked ? "text-[#cf222e] dark:text-[#f85149] border-[#cf222e]/30 dark:border-[#f85149]/30 bg-[#ffebe9] dark:bg-[#f85149]/10" : "text-[#1a7f37] dark:text-[#3fb950] border-[#1a7f37]/30 dark:border-[#3fb950]/30 bg-[#dafbe1] dark:bg-[#3fb950]/10"}`}>{isBlocked ? "1" : "3"}</span>
                  </button>

                  <button
                    onClick={() => setPrNavTab("files")}
                    className={`pb-3 hidden sm:flex items-center gap-1.5 transition-colors ${
                      prNavTab === "files"
                        ? "text-[#1f2328] dark:text-[#e6edf3] border-b-2 border-[#fd8c73] dark:border-[#f78166] font-semibold"
                        : "text-[#656d76] dark:text-[#7d8590] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                    }`}
                  >
                    Files changed <span className="px-1.5 py-0.2 rounded-full bg-[#eaeef2] dark:bg-[#21262d] text-[#656d76] dark:text-[#7d8590] text-[10px] font-mono">2</span>
                  </button>
                </div>

                {/* CSS Grid Stacked Tab View (Zero Layout Shift, Perfect Height Lock) */}
                <div className="grid grid-cols-1 items-start">
                  
                  {/* 1. Conversation Tab */}
                  <div className={`col-start-1 row-start-1 space-y-6 transition-opacity duration-150 ${prNavTab === "conversation" ? "opacity-100 relative z-10" : "opacity-0 pointer-events-none invisible"}`}>
                    {/* Timeline Thread: AgentDiff Bot Comment Bubble */}
                    <div className="flex items-start gap-3">
                      {/* Bot Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-[#d0d7de] dark:border-[#30363d] shadow-2xs">
                        AD
                      </div>

                      <div className="flex-1 min-w-0 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] shadow-sm overflow-hidden">
                        
                        {/* GitHub Comment Speech Header */}
                        <div className="px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#1f2328] dark:text-[#e6edf3]">agentdiff-bot</span>
                            <span className="text-[10px] uppercase font-bold text-[#656d76] dark:text-[#7d8590] border border-[#d0d7de] dark:border-[#30363d] px-1.5 py-0.2 rounded bg-white dark:bg-[#0d1117]">
                              bot
                            </span>
                            <span className="text-[#656d76] dark:text-[#7d8590] text-[11px]">commented {pr.time}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[#656d76] dark:text-[#7d8590]">
                            <button
                              onClick={handleCopySha}
                              className="inline-flex items-center gap-1 text-[11px] font-mono hover:text-[#0969da] dark:hover:text-[#58a6ff] transition-colors"
                              title="Copy commit SHA"
                            >
                              <span>commit {pr.commitSha}</span>
                              <Copy className="w-3 h-3" />
                            </button>
                            {copiedSha && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Copied!</span>}
                            <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-[#1f2328] dark:hover:text-[#e6edf3]" />
                          </div>
                        </div>

                        {/* Markdown Body */}
                        <div className="p-5 space-y-4 text-xs leading-relaxed text-[#1f2328] dark:text-[#e6edf3]">
                          
                          {/* Header line */}
                          <div>
                            <h4 className="text-sm font-bold text-[#1f2328] dark:text-[#e6edf3] tracking-tight">
                              {pr.comment.verdictTitle}
                            </h4>
                            <p className="text-xs text-[#656d76] dark:text-[#7d8590] mt-1">
                              {pr.comment.summary}
                            </p>
                          </div>

                          {/* GitHub Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse border border-[#d0d7de] dark:border-[#30363d] rounded font-mono">
                              <thead className="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
                                <tr className="text-[#1f2328] dark:text-[#e6edf3] font-semibold">
                                  <th className="py-2 px-3 border-r border-[#d0d7de] dark:border-[#30363d]">Gate</th>
                                  <th className="py-2 px-3 border-r border-[#d0d7de] dark:border-[#30363d]">Measured</th>
                                  <th className="py-2 px-3 border-r border-[#d0d7de] dark:border-[#30363d]">Threshold</th>
                                  <th className="py-2 px-3 text-right">Verdict</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#d0d7de] dark:divide-[#30363d]">
                                {pr.comment.table.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-[#f6f8fa]/60 dark:hover:bg-[#161b22]/50">
                                    <td className="py-2 px-3 font-sans font-medium text-[#1f2328] dark:text-[#e6edf3] border-r border-[#d0d7de] dark:border-[#30363d]">{row.gate}</td>
                                    <td className="py-2 px-3 font-bold text-[#1f2328] dark:text-[#e6edf3] border-r border-[#d0d7de] dark:border-[#30363d]">{row.actual}</td>
                                    <td className="py-2 px-3 text-[#656d76] dark:text-[#7d8590] border-r border-[#d0d7de] dark:border-[#30363d]">{row.threshold}</td>
                                    <td className="py-2 px-3 text-right font-bold">
                                      <span className={row.status === "FAIL" ? "text-[#cf222e] dark:text-[#f85149]" : "text-[#1a7f37] dark:text-[#3fb950]"}>
                                        {row.status === "FAIL" ? "❌ FAIL" : "✅ PASS"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Root cause callout */}
                          <div className="p-3 rounded bg-[#ddf4ff]/50 dark:bg-[#161b22] border-l-4 border-l-[#0969da] dark:border-l-[#58a6ff] border border-[#54aeff]/40 dark:border-[#30363d] space-y-0.5">
                            <div className="text-xs font-bold text-[#0969da] dark:text-[#e6edf3]">
                              {pr.comment.culpritTitle}
                            </div>
                            <p className="text-xs text-[#1f2328] dark:text-[#7d8590]">
                              {pr.comment.culpritDesc}
                            </p>
                          </div>

                          {/* Divergence Tree */}
                          <div className="space-y-1">
                            <div className="text-[11px] font-mono text-[#656d76] dark:text-[#7d8590] uppercase tracking-wider font-semibold">
                              Divergence Tree
                            </div>
                            <div className="p-3 rounded bg-[#f6f8fa] dark:bg-[#010409] border border-[#d0d7de] dark:border-[#30363d] font-mono text-xs text-[#1f2328] dark:text-[#e6edf3] space-y-0.5">
                              {pr.comment.diffTree.map((item, lIdx) => (
                                <div
                                  key={lIdx}
                                  className={item.isLoop ? "text-[#cf222e] dark:text-[#f85149] font-bold bg-[#ffebe9] dark:bg-[#f85149]/10 px-1.5 py-0.5 rounded -mx-1" : "text-[#656d76] dark:text-[#7d8590]"}
                                >
                                  {item.line}
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                        {/* Interactive GitHub Reaction Bar */}
                        <div className="px-4 py-2 border-t border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa]/60 dark:bg-[#161b22]/40 flex items-center gap-2">
                          <button
                            onClick={() => handleReaction("eyes")}
                            className={`px-2 py-1 rounded-full border text-[11px] flex items-center gap-1.5 transition-all ${
                              hasReacted === "eyes"
                                ? "bg-[#ddf4ff] dark:bg-[#388bfd]/20 border-[#0969da] dark:border-[#388bfd] text-[#0969da] dark:text-[#58a6ff]"
                                : "bg-white dark:bg-[#21262d]/50 border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#7d8590] hover:border-[#8c959f] dark:hover:border-[#8b949e]"
                            }`}
                          >
                            <span>👀</span>
                            <span>{reactions.eyes}</span>
                          </button>

                          <button
                            onClick={() => handleReaction("thumbsUp")}
                            className={`px-2 py-1 rounded-full border text-[11px] flex items-center gap-1.5 transition-all ${
                              hasReacted === "thumbsUp"
                                ? "bg-[#ddf4ff] dark:bg-[#388bfd]/20 border-[#0969da] dark:border-[#388bfd] text-[#0969da] dark:text-[#58a6ff]"
                                : "bg-white dark:bg-[#21262d]/50 border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#7d8590] hover:border-[#8c959f] dark:hover:border-[#8b949e]"
                            }`}
                          >
                            <span>👍</span>
                            <span>{reactions.thumbsUp}</span>
                          </button>

                          <button
                            onClick={() => handleReaction("rocket")}
                            className={`px-2 py-1 rounded-full border text-[11px] flex items-center gap-1.5 transition-all ${
                              hasReacted === "rocket"
                                ? "bg-[#ddf4ff] dark:bg-[#388bfd]/20 border-[#0969da] dark:border-[#388bfd] text-[#0969da] dark:text-[#58a6ff]"
                                : "bg-white dark:bg-[#21262d]/50 border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#7d8590] hover:border-[#8c959f] dark:hover:border-[#8b949e]"
                            }`}
                          >
                            <span>🚀</span>
                            <span>{reactions.rocket}</span>
                          </button>

                          <span className="text-[#656d76] dark:text-[#7d8590] text-[11px] ml-auto hidden sm:inline">
                            Click an emoji to react
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* GitHub Merge Status Box */}
                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] overflow-hidden shadow-2xs">
                      <div className="p-4 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isBlocked ? "bg-[#ffebe9] dark:bg-[#f85149]/15 text-[#cf222e] dark:text-[#f85149]" : "bg-[#dafbe1] dark:bg-[#3fb950]/15 text-[#1a7f37] dark:text-[#3fb950]"}`}>
                            {isBlocked ? <X className="w-4 h-4 stroke-[3]" /> : <Check className="w-4 h-4 stroke-[3]" />}
                          </div>

                          <div className="space-y-0.5">
                            <div className="text-sm font-bold text-[#1f2328] dark:text-[#e6edf3]">
                              {pr.statusTitle}
                            </div>
                            <div className="text-xs text-[#656d76] dark:text-[#7d8590]">
                              {pr.statusDesc} — <strong className={isBlocked ? "text-[#cf222e] dark:text-[#f85149] font-mono" : "text-[#1a7f37] dark:text-[#3fb950] font-mono"}>agentdiff-gate {isBlocked ? "failed" : "passed"}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 hidden sm:block">
                          <button
                            disabled={isBlocked}
                            className={`px-3.5 py-1.5 rounded-md font-semibold text-xs border transition-all ${
                              isBlocked
                                ? "bg-[#f6f8fa] dark:bg-[#21262d] text-[#8c959f] dark:text-[#7d8590] border-[#d0d7de] dark:border-[#30363d] cursor-not-allowed opacity-60"
                                : "bg-[#1f883d] dark:bg-[#238636] text-white border-[#1f883d] dark:border-[#2ea043] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] shadow-xs"
                            }`}
                          >
                            Merge pull request
                          </button>
                        </div>
                      </div>

                      {/* Sub check item */}
                      <div className="border-t border-[#d0d7de] dark:border-[#30363d] px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#161b22] flex items-center justify-between text-xs font-mono text-[#656d76] dark:text-[#7d8590]">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isBlocked ? "bg-[#cf222e] dark:bg-[#f85149]" : "bg-[#1a7f37] dark:bg-[#3fb950]"}`} />
                          <span>agentdiff / evaluate-trajectory (push)</span>
                        </div>
                        <span className={isBlocked ? "text-[#cf222e] dark:text-[#f85149] font-bold" : "text-[#1a7f37] dark:text-[#3fb950] font-bold"}>
                          {isBlocked ? "Failed in 4.2ms" : "Passed in 3.8ms"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Checks Tab */}
                  <div className={`col-start-1 row-start-1 space-y-4 transition-opacity duration-150 ${prNavTab === "checks" ? "opacity-100 relative z-10" : "opacity-0 pointer-events-none invisible"}`}>
                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center ${isBlocked ? "bg-[#ffebe9] dark:bg-[#f85149]/20 text-[#cf222e] dark:text-[#f85149]" : "bg-[#dafbe1] dark:bg-[#3fb950]/20 text-[#1a7f37] dark:text-[#3fb950]"}`}>
                          {isBlocked ? <X className="w-3.5 h-3.5 stroke-[3]" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <div>
                          <div className="text-[#1f2328] dark:text-[#e6edf3] font-bold text-sm">GitHub Actions Workflow #{isBlocked ? "9842" : "9843"}</div>
                          <div className="text-[11px] text-[#656d76] dark:text-[#7d8590]">Triggered via pull_request on branch {pr.branch}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#656d76] dark:text-[#7d8590] hidden sm:inline">SHA: {pr.commitSha}</span>
                    </div>

                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] divide-y divide-[#d0d7de] dark:divide-[#30363d]">
                      {pr.checksDetail.map((chk, cIdx) => (
                        <div key={cIdx} className="p-4 flex items-start justify-between hover:bg-[#f6f8fa] dark:hover:bg-[#161b22]/40 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {chk.status === "failed" ? (
                                <X className="w-4 h-4 text-[#cf222e] dark:text-[#f85149] stroke-[3]" />
                              ) : (
                                <Check className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950] stroke-[3]" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="text-[#1f2328] dark:text-[#e6edf3] font-semibold text-xs">{chk.name}</div>
                              <div className="text-[11px] text-[#656d76] dark:text-[#7d8590] font-mono">{chk.details}</div>
                            </div>
                          </div>
                          <div className="text-[11px] font-mono text-[#656d76] dark:text-[#7d8590] flex items-center gap-3 shrink-0">
                            <span>{chk.duration}</span>
                            <span className="text-[#0969da] dark:text-[#58a6ff] hover:underline cursor-pointer">Details</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Step log snippet simulation */}
                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#010409] p-4 font-mono text-[11px] space-y-1 text-[#656d76] dark:text-[#7d8590]">
                      <div className="text-[#1f2328] dark:text-[#e6edf3] font-bold pb-1 border-b border-[#d0d7de] dark:border-[#30363d] flex items-center justify-between">
                        <span>Terminal Output: agentdiff-gate</span>
                        <span className="text-[10px] text-[#656d76] dark:text-[#7d8590]">ANSI 256 Colors</span>
                      </div>
                      <div className="pt-2 text-[#656d76] dark:text-[#7d8590]">2026-08-30T00:46:12Z [INFO] Initializing AgentDiff engine v0.1.0...</div>
                      <div className="text-[#656d76] dark:text-[#7d8590]">2026-08-30T00:46:12Z [INFO] Loaded golden baseline DAG (4 nodes, 1,200 tokens).</div>
                      <div className="text-[#656d76] dark:text-[#7d8590]">2026-08-30T00:46:12Z [INFO] Ingesting candidate run telemetry from LangGraph...</div>
                      {isBlocked ? (
                        <div className="text-[#cf222e] dark:text-[#f85149] font-bold">2026-08-30T00:46:12Z [FATAL] Trajectory regression detected: TDI 0.428 &gt; threshold 0.250. Exiting with status 1.</div>
                      ) : (
                        <div className="text-[#1a7f37] dark:text-[#3fb950] font-bold">2026-08-30T00:46:12Z [SUCCESS] Trajectory aligned with 0 loops and -18% token overhead. Exiting with status 0.</div>
                      )}
                    </div>
                  </div>

                  {/* 3. Commits Tab */}
                  <div className={`col-start-1 row-start-1 space-y-4 transition-opacity duration-150 ${prNavTab === "commits" ? "opacity-100 relative z-10" : "opacity-0 pointer-events-none invisible"}`}>
                    <div className="text-[11px] font-semibold text-[#656d76] dark:text-[#7d8590] uppercase tracking-wider">
                      Commits on {pr.time}
                    </div>

                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] divide-y divide-[#d0d7de] dark:divide-[#30363d]">
                      <div className="p-4 flex items-center justify-between hover:bg-[#f6f8fa] dark:hover:bg-[#161b22]/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <GitCommit className="w-4 h-4 text-[#656d76] dark:text-[#7d8590]" />
                          <div>
                            <div className="text-[#1f2328] dark:text-[#e6edf3] font-semibold text-xs hover:text-[#0969da] dark:hover:text-[#58a6ff] cursor-pointer">{pr.title}</div>
                            <div className="text-[11px] text-[#656d76] dark:text-[#7d8590] mt-0.5">
                              {pr.author} committed 1 commit to <span className="font-mono text-[#0969da] dark:text-[#58a6ff]">{pr.branch}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs text-[#0969da] dark:text-[#58a6ff] bg-[#f6f8fa] dark:bg-[#161b22] px-2.5 py-1 rounded border border-[#d0d7de] dark:border-[#30363d] hover:bg-[#eaeef2] dark:hover:bg-[#21262d] cursor-pointer">
                            {pr.commitSha}
                          </code>
                          <button
                            onClick={handleCopySha}
                            className="p-1.5 rounded hover:bg-[#eaeef2] dark:hover:bg-[#21262d] text-[#656d76] dark:text-[#7d8590] hover:text-[#1f2328] dark:hover:text-[#e6edf3]"
                            title="Copy commit hash"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]/40 text-xs text-[#656d76] dark:text-[#7d8590] flex items-center justify-between">
                      <span>Showing 1 changed commit with 2 additions and 1 deletion.</span>
                      <span className="font-mono text-[11px]">Git tree hash: a4189e</span>
                    </div>
                  </div>

                  {/* 4. Files Tab */}
                  <div className={`col-start-1 row-start-1 space-y-4 transition-opacity duration-150 ${prNavTab === "files" ? "opacity-100 relative z-10" : "opacity-0 pointer-events-none invisible"}`}>
                    {/* Diff Header */}
                    <div className="flex items-center justify-between text-xs text-[#656d76] dark:text-[#7d8590] pb-2 border-b border-[#d0d7de] dark:border-[#30363d]">
                      <span>Showing <strong>2 changed files</strong> with <strong>14 additions</strong> and <strong>2 deletions</strong></span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-[11px]">Unified Diff</span>
                      </div>
                    </div>

                    {/* File 1: Prompt Diff */}
                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] overflow-hidden shadow-2xs">
                      <div className="px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          <FileText className="w-3.5 h-3.5 text-[#656d76] dark:text-[#7d8590]" />
                          <span className="text-[#1f2328] dark:text-[#e6edf3]">src/agents/prompts/customer_agent.py</span>
                        </div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">+14 -2</span>
                      </div>

                      <div className="font-mono text-[11px] leading-[1.6] overflow-x-auto">
                        <div className="px-4 py-1 bg-[#f6f8fa] dark:bg-[#161b22]/70 text-[#656d76] dark:text-[#7d8590]">@@ -42,7 +42,12 @@ SYSTEM_PROMPT = &quot;&quot;&quot;</div>
                        <div className="px-4 py-0.5 text-[#656d76] dark:text-[#7d8590]"> You are a high-speed customer financial intelligence agent.</div>
                        <div className="px-4 py-0.5 bg-[#ffebe9] dark:bg-[#f85149]/15 text-[#cf222e] dark:text-[#f85149]">- execute query directly and return final raw data payload.</div>
                        <div className="px-4 py-0.5 bg-[#dafbe1] dark:bg-[#238636]/15 text-[#1a7f37] dark:text-[#3fb950]">+ retrieve account metadata, verify schema balance, and synthesize</div>
                        <div className="px-4 py-0.5 bg-[#dafbe1] dark:bg-[#238636]/15 text-[#1a7f37] dark:text-[#3fb950]">+ the final user report with strict customer id authentication.</div>
                        <div className="px-4 py-0.5 text-[#656d76] dark:text-[#7d8590]"> Ensure all SQL queries use parameterized arguments.</div>
                      </div>
                    </div>

                    {/* File 2: Golden Baseline Config */}
                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] overflow-hidden shadow-2xs">
                      <div className="px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          <FileText className="w-3.5 h-3.5 text-[#656d76] dark:text-[#7d8590]" />
                          <span className="text-[#1f2328] dark:text-[#e6edf3]">agentdiff.toml</span>
                        </div>
                        <span className="text-[#656d76] dark:text-[#7d8590] font-mono">0 changes (verified against origin/main)</span>
                      </div>

                      <div className="p-4 text-xs text-[#656d76] dark:text-[#7d8590] font-mono bg-[#f6f8fa] dark:bg-[#010409]">
                        [gates.divergence]<br />
                        max_tdi = 0.25<br />
                        max_consecutive_loops = 0<br />
                        max_token_delta_percent = 10.0
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom PR Timeline Status Note */}
              <div className="pt-4 border-t border-[#d0d7de] dark:border-[#21262d] flex flex-wrap items-center justify-between gap-4 text-xs text-[#656d76] dark:text-[#7d8590]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1a7f37] dark:bg-[#238636]" />
                  <span>AgentDiff GitHub Action v0.1.0 installed across 12 repos</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hover:underline cursor-pointer text-[#0969da] dark:text-[#58a6ff]">View workflow runs</span>
                  <span>•</span>
                  <span className="hover:underline cursor-pointer text-[#0969da] dark:text-[#58a6ff]">Documentation</span>
                </div>
              </div>

            </div>

          </div>
        </Reveal>

      </div>
    </section>
  );
}