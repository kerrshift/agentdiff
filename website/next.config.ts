import type { NextConfig } from "next";

/**
 * Static export applies at BUILD time only (`STATIC_EXPORT=1 pnpm build`).
 * Running `next dev` without it keeps normal framework behavior locally —
 * e.g. unmatched doc slugs render a clean 404 instead of tripping
 * output:export's strict param validation.
 */
const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === "1" ? { output: "export" as const } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
