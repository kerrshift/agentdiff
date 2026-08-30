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
import { Check, Copy } from "lucide-react";

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
SyntaxHighlighter.registerLanguage("yml", yaml);

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
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const dark = theme === "dark";

  function slugifyHeading(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  function textFromChildren(c: React.ReactNode): string {
    if (typeof c === "string") return c;
    if (typeof c === "number") return String(c);
    if (Array.isArray(c)) return (c as React.ReactNode[]).map(textFromChildren).join("");
    if (c && typeof c === "object" && (c as any).props !== undefined) {
      const p = (c as { props: { children?: React.ReactNode } }).props;
      return p.children ? textFromChildren(p.children) : "";
    }
    return "";
  }

  const markdownComponents = {
    h2: ({ children }: any) => {
      const id = slugifyHeading(textFromChildren(children));
      return <h2 id={id}>{children}</h2>;
    },
    h3: ({ children }: any) => {
      const id = slugifyHeading(textFromChildren(children));
      return <h3 id={id}>{children}</h3>;
    },
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
      <div className="relative group my-6 rounded-xl border border-(--border) overflow-hidden bg-(--code-bg) shadow-2xs">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-(--border) bg-(--surface-2)/60 text-xs font-mono select-none">
          <span className="text-(--muted) font-semibold text-[11px] uppercase tracking-wider">
            {match[1]}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-(--muted) hover:text-(--fg) hover:bg-(--surface-2) transition-all cursor-pointer"
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
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
            fontSize: "0.85rem",
            lineHeight: "1.75",
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
