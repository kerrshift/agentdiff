"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export default function BlogToc({ headings }: { headings: TocItem[] }) {
  const [active, setActive] = useState<string>(headings[0]?.id ?? "");

  useEffect(() => {
    const onScroll = () => {
      const offset = 120; // header + margin
      let current = headings[0]?.id ?? "";
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top <= offset) current = h.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  return (
    <nav className="flex flex-col gap-1 border-l border-(--border) pl-4">
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={`text-sm leading-relaxed transition-colors ${
            active === h.id ? "font-semibold text-(--fg)" : "text-(--muted) hover:text-(--fg)"
          } ${h.level === 3 ? "ml-3" : ""}`}
        >
          {h.text}
        </a>
      ))}
      {headings.length === 0 && <span className="text-sm text-(--faint)">No sections</span>}
    </nav>
  );
}
