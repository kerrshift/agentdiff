"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { Menu, X, Moon, Sun } from "lucide-react";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Initialized deterministically so server + client first render match.
  // The saved theme is applied from the DOM in an effect after hydration.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && docs.some((p) => p.slug === hash)) {
        setActiveSlug(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [docs]);

  const activePage = docs.find((p) => p.slug === activeSlug) || docs[0];

  const categories = Array.from(new Set(docs.map((p) => p.category)));

  const handlePageSelect = (slug: string) => {
    setActiveSlug(slug);
    setSidebarOpen(false);
    history.replaceState(null, "", `#${slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem("agentdiff-theme", next);
    } catch {
      /* ignore */
    }
  };

  const getCleanTitle = (title: string) => title.replace(/^\d+-\s*/, "");

  const renderNav = () => (
    <div className="flex flex-col gap-6">
      {categories.map((category) => (
        <div key={category} className="flex flex-col gap-1.5">
          <div className="text-xs font-mono uppercase tracking-[0.14em] text-[var(--faint)] font-semibold mb-1">
            {getCleanTitle(category)}
          </div>
          <div className="flex flex-col gap-1">
            {docs
              .filter((p) => p.category === category)
              .map((p) => (
                <button
                  key={p.slug}
                  onClick={() => handlePageSelect(p.slug)}
                  className={`text-left text-sm py-1.5 px-2.5 rounded-md transition-colors duration-150 ${
                    activeSlug === p.slug
                      ? "text-[var(--fg)] font-medium bg-[var(--surface-2)]"
                      : "text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {getCleanTitle(p.title)}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-screen bg-[var(--bg)] text-[var(--fg)] font-sans flex flex-col overflow-hidden selection:bg-[var(--surface-2)] selection:text-[var(--fg)]">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col relative overflow-hidden">

        {/* Docs Header */}
        <header className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="px-5 sm:px-8 h-16 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {/* Mobile nav toggle */}
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="md:hidden p-1.5 text-[var(--muted)] hover:text-[var(--fg)] transition-colors duration-150"
                aria-label="Toggle navigation"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              <Link
                href="/"
                className="font-semibold text-[var(--fg)] tracking-tight text-base hover:opacity-80 transition-opacity duration-150 flex items-center gap-2"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--fg)] text-[var(--bg)]">
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M3 4.5h4.5M3 8h6.5M3 11.5h3.5" />
                  </svg>
                </span>
                <span>agentdiff</span>
                <span className="text-[10px] font-mono font-normal text-[var(--faint)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                  Docs
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-1.5 text-[var(--muted)] hover:text-[var(--fg)] transition-colors duration-150 rounded-md hover:bg-[var(--surface-2)]"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <span className="text-xs text-[var(--faint)] font-mono">v{version}</span>
            </div>
          </div>
        </header>

        {/* Docs Intro Strip */}
        <div className="border-b border-[var(--border)] px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="text-xs text-[var(--muted)] leading-relaxed max-w-2xl">
            Trajectory regression testing for AI agents — compare execution DAGs in CI/CD and gate on drift, loops, and cost.
          </div>
          <Link
            href="/"
            className="text-xs text-[var(--fg)] hover:text-[var(--muted)] font-medium flex-shrink-0 hidden sm:inline"
          >
            ← Back to home
          </Link>
        </div>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
            <aside className="relative z-10 w-72 max-w-[85%] h-full bg-[var(--surface)] border-r border-[var(--border)] overflow-y-auto p-6 flex flex-col">
              {renderNav()}
            </aside>
          </div>
        )}

        {/* 2-Column Sidebar Layout — both panes scroll independently */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Left Sidebar — desktop */}
          <aside className="hidden md:flex w-56 shrink-0 border-r border-[var(--border)] overflow-y-auto p-6 flex-col gap-6 bg-[var(--surface)]">
            {renderNav()}
          </aside>

          {/* Right Main Document Pane */}
          <main className="flex-1 overflow-y-auto">
            <div className="px-5 sm:px-8 lg:px-12 py-8 sm:py-10 w-full">
              {activePage ? (
                <MarkdownRenderer content={activePage.content} dark={theme === "dark"} />
              ) : (
                <div className="text-[var(--faint)] font-mono">Select a documentation page.</div>
              )}
            </div>
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
  dark?: boolean;
}

interface MarkdownCodeProps extends CodeComponentProps {
  node?: unknown;
}

function CodeComponent({ inline, className, children, dark = false, ...props }: CodeComponentProps) {
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
      <div className="relative group my-6 rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--code-bg)]">
        {/* Copy button overlay */}
        <div className="absolute right-3 top-3 flex items-center gap-2.5 select-none z-10">
          <span className="text-[10px] text-[var(--faint)] uppercase font-mono tracking-wider font-semibold">
            {match[1]}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--faint)] hover:text-[var(--fg)] transition-all duration-150 cursor-pointer"
            title="Copy Code"
          >
            {copied ? (
              <span className="text-[var(--accent)] text-[10px] font-mono uppercase tracking-wider font-semibold">
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
          style={dark ? oneDark : oneLight}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: 0,
            border: "none",
            background: "transparent",
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

// Markdown-to-HTML rendering powered by react-markdown & react-syntax-highlighter
function MarkdownRenderer({ content, dark }: { content: string; dark: boolean }) {
  const markdownComponents = {
    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    code: ({ node, ...props }: MarkdownCodeProps) => {
      void node;
      return <CodeComponent {...props} dark={dark} />;
    },
  };

  return (
    <div className="markdown-content">
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