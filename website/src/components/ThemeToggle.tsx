"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Shared light/dark toggle. The `.dark` class on <html> is owned globally:
 * an inline script in the root layout applies the persisted (or system)
 * theme before paint, and this control flips + persists it. Used by both
 * the landing header and the docs shell.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync with whatever the pre-paint script decided.
  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.add("theme-transitioning");
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    html.classList.toggle("dark", next === "dark");
    html.style.colorScheme = next;
    try {
      localStorage.setItem("agentdiff-theme", next);
    } catch {
      /* private mode: theme just won't persist */
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => html.classList.remove("theme-transitioning"))
    );
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-(--muted) border border-(--border) bg-(--surface) hover:text-(--fg) hover:border-(--border-strong) transition-colors duration-150 ${className}`}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
