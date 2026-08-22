import React from "react";

/**
 * AgentDiff logo mark: a trajectory node (DAG) that starts at a dot, runs a
 * trunk, then splits into two diverging branches - one baseline, one candidate.
 * Minimal, geometric, and rendered from `currentColor` by default so it
 * inherits the tile colour in light contexts (Header/Footer). Pass an explicit
 * `color` (e.g. "#FFFFFF") where the tile background is dark and the enclosing
 * text colour is not white (satori OG images).
 */
export default function LogoMark({
  size = 14,
  className = "",
  color = "currentColor",
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="2.9" cy="8" r="1.5" fill={color} stroke="none" />
      <path d="M3.4 8 L8.25 8" />
      <path d="M8.25 8 L13.4 5" />
      <path d="M8.25 8 L13.4 11" />
      <circle cx="13.5" cy="5" r="1.05" fill={color} stroke="none" />
      <circle cx="13.5" cy="11" r="1.05" fill={color} stroke="none" />
    </svg>
  );
}