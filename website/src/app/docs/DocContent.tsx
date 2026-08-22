"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
// Register only the languages the docs actually use — pulls ~100KB of unused
// grammars out of the docs bundle versus the full Prism build.
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import diff from "react-syntax-highlighter/dist/esm/languages/prism/diff";
import ini from "react-syntax-highlighter/dist/esm/languages/prism/ini";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import toml from "react-syntax-highlighter/dist/esm/languages/prism/toml";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("shell", bash);
SyntaxHighlighter.registerLanguage("diff", diff);
SyntaxHighlighter.registerLanguage("ini", ini);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("md", markdown);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("toml", toml);
SyntaxHighlighter.registerLanguage("yaml", yaml);
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";

/**
 * Theme-aware markdown renderer for a single doc page. Lives client-side
 * only because the syntax highlighter swaps between oneLight/oneDark with
 * the global theme; the page text itself is prerendered server-side.
 */
export default function DocContent({ content }: { content: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      )
    );
    return () => cancelAnimationFrame(id);
  }, []);

  const dark = theme === "dark";

  const markdownComponents = {
    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    code: ({
      node,
      className,
      children,
      ...props
    }: {
      node?: unknown;
      className?: string;
      children?: React.ReactNode;
    }) => {
      void node;
      return (
        <CodeComponent className={className} dark={dark} {...props}>
          {children}
        </CodeComponent>
      );
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

interface CodeComponentProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  dark?: boolean;
}

function CodeComponent({
  inline,
  className,
  children,
  dark = false,
  ...props
}: CodeComponentProps) {
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
