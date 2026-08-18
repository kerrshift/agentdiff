"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";


export interface DocPage {
  slug: string;
  title: string;
  category: string;
  content: string;
}

interface DocsClientProps {
  docs: DocPage[];
  version: string;
}

export default function DocsClient({ docs, version }: DocsClientProps) {
  const [activeSlug, setActiveSlug] = useState("introduction");

  // Read URL hash on load to set initial active page if present
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && docs.some(p => p.slug === hash)) {
        setActiveSlug(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Run on initial load

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [docs]);

  const activePage = docs.find((p) => p.slug === activeSlug) || docs[0];

  // Group pages by category
  const categories = Array.from(new Set(docs.map((p) => p.category)));

  const handlePageSelect = (slug: string) => {
    setActiveSlug(slug);
    window.location.hash = slug;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getCleanTitle = (title: string) => {
    return title.replace(/^\d+-\s*/, "");
  };

  return (
    <div className="h-screen bg-[#FBFBFC] text-[#18181B] font-sans flex flex-col overflow-hidden selection:bg-[#E4E4E7] selection:text-[#18181B]">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col bg-[#FBFBFC] relative overflow-hidden">

        {/* Docs Header */}
        <header className="border-b border-[#E4E4E7] bg-[#FBFBFC]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="px-6 sm:px-8 h-16 flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Link 
                href="/" 
                className="font-semibold text-[#18181B] tracking-tight text-base hover:opacity-80 transition-opacity duration-150 flex items-center gap-1.5"
              >
                <span>agent<span className="text-[#18181B]">diff</span></span>
                <span className="text-xs font-mono font-normal text-[#A1A1AA] bg-[#F4F4F5] px-1.5 py-0.5 rounded border border-[#E4E4E7] ml-1">Docs</span>
              </Link>
            </div>
            <div className="text-xs text-[#A1A1AA] font-mono">v{version}</div>
          </div>
        </header>

        {/* Docs Intro Strip */}
        <div className="border-b border-[#E4E4E7] px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="text-xs text-[#52525B] leading-relaxed max-w-2xl">
            Trajectory regression testing for AI agents — compare execution DAGs in CI/CD and gate on drift, loops, and cost.
          </div>
          <Link
            href="/"
            className="text-xs text-[#18181B] hover:text-[#52525B] font-medium flex-shrink-0"
          >
            ← Back to home
          </Link>
        </div>

        {/* 2-Column Sidebar Layout — both panes scroll independently */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Left Sidebar — independently scrollable with right border divider */}
          <aside className="w-full md:w-56 shrink-0 border-r border-[#E4E4E7] overflow-y-auto p-6 flex flex-col gap-6 bg-white">
            {categories.map((category) => (
              <div key={category} className="flex flex-col gap-1.5">
                <div className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold mb-1">
                  {getCleanTitle(category)}
                </div>
                <div className="flex flex-col gap-1">
                  {docs
                    .filter((p) => p.category === category)
                    .map((p) => (
                      <button
                        key={p.slug}
                        onClick={() => handlePageSelect(p.slug)}
                        className={`text-left text-sm py-1 px-2.5 rounded transition-colors duration-150 ${
                          activeSlug === p.slug
                            ? "text-[#18181B] font-medium bg-[#F4F4F5]"
                            : "text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5]"
                        }`}
                      >
                        {getCleanTitle(p.title)}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </aside>

          {/* Right Main Document Pane — independently scrollable */}
          <main className="flex-1 overflow-y-auto p-8 sm:p-12">
            {activePage ? (
              <MarkdownRenderer content={activePage.content} />
            ) : (
              <div className="text-[#A1A1AA] font-mono">Select a documentation page.</div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}

interface CodeComponentProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function CodeComponent({ inline, className, children, ...props }: CodeComponentProps) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isInline = inline ?? !match;

  if (!isInline && match) {
    return (
      <div className="relative group my-6 rounded-lg border border-[#1e2028] overflow-hidden">
        {/* Copy button overlay */}
        <div className="absolute right-3 top-3 flex items-center gap-2.5 select-none z-10">
          <span className="text-[10px] text-[#A1A1AA] uppercase font-mono tracking-wider font-semibold">
            {match[1]}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] hover:border-[#18181B] hover:text-[#18181B] text-[#A1A1AA] transition-all duration-150 cursor-pointer"
            title="Copy Code"
          >
            {copied ? (
              <span className="text-[#0FA47F] text-[10px] font-mono uppercase tracking-wider font-semibold">
                Copied!
              </span>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
        </div>
        <SyntaxHighlighter
          style={oneLight}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: 0,
            border: "none",
            background: "#FBFBFC",
            padding: "1.25rem",
            fontSize: "0.84rem",
            lineHeight: "1.7",
          }}
          codeTagProps={{ style: { background: "transparent", fontFamily: "inherit" } }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

const markdownComponents = {
  pre: ({ children }: any) => <>{children}</>,
  code: CodeComponent,
};

// Markdown-to-HTML rendering component powered by react-markdown & react-syntax-highlighter
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown-content text-zinc-300 font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
