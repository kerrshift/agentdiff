import { ImageResponse } from "next/og";
import LogoMark from "@/components/LogoMark";

export const alt = "AgentDiff Documentation — Trajectory Regression Testing for AI Agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

// next/og ships a bundled default sans (Geist — close to Manrope), so no
// font files need to live in the repo. Hierarchy is expressed via size/color.

// Light palette — documentation reads as a clean reference page, not a terminal.
const COLORS = {
  bg: "#FBFBFC",
  surface: "#FFFFFF",
  surface2: "#F4F4F5",
  border: "#E4E4E7",
  fg: "#18181B",
  muted: "#52525B",
  faint: "#A1A1AA",
  accent: "#0FA47F",
  codeBg: "#F6F6F7",
};

const SECTIONS = [
  "Getting Started",
  "Core Concepts",
  "Regression Gates",
  "CI/CD Integration",
];

function DocCard() {
  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        background: COLORS.surface,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 0 0 rgba(0,0,0,0.02), 0 18px 40px -24px rgba(0,0,0,0.18)",
      }}
    >
      {/* breadcrumb bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 44,
          padding: "0 18px",
          background: COLORS.surface2,
          borderBottom: `1px solid ${COLORS.border}`,
          fontSize: 12.5,
          color: COLORS.faint,
        }}
      >
        <span>agentdiff / docs / introduction</span>
        <div style={{ flex: 1 }} />
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.accent }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: COLORS.accent }} />
          docs
        </span>
      </div>

      {/* article body */}
      <div style={{ padding: "24px 24px 26px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 26, color: COLORS.fg, letterSpacing: "-0.5px" }}>
          Trajectory Regression Testing
        </div>

        {/* paragraph skeletons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
          <div style={{ height: 9, width: "100%", background: COLORS.border, borderRadius: 999 }} />
          <div style={{ height: 9, width: "88%", background: COLORS.border, borderRadius: 999 }} />
          <div style={{ height: 9, width: "95%", background: COLORS.border, borderRadius: 999 }} />
        </div>

        {/* code snippet — documentation, not a terminal (no prompt, no FAIL) */}
        <div
          style={{
            marginTop: 18,
            background: COLORS.codeBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: "16px 18px",
            fontSize: 14.5,
            lineHeight: 1.75,
            color: COLORS.fg,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>from <span style={{ color: COLORS.accent }}>agentdiff</span> import compare, assert_no_regressions</span>
          <span>report = compare(baseline, candidate)</span>
          <span>assert_no_regressions(report)</span>
        </div>
      </div>
    </div>
  );
}

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        padding: "50px 64px 46px",
      }}
    >
      {/* Top brand row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: COLORS.fg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LogoMark size={24} color="#FFFFFF" />
        </div>
        <span style={{ color: COLORS.fg, fontSize: 26, letterSpacing: "-0.4px" }}>agentdiff</span>
        <span
          style={{
            fontSize: 13,
            color: COLORS.faint,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            padding: "3px 8px",
          }}
        >
          Docs
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: COLORS.faint }}>v0.1.0</span>
      </div>

      {/* Main: copy + docs card */}
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 48, minHeight: 0 }}>
        {/* Left — reference copy */}
        <div style={{ display: "flex", flexDirection: "column", width: 500, flexShrink: 0 }}>
          <div
            style={{
              fontSize: 14,
              color: COLORS.faint,
              textTransform: "uppercase",
              letterSpacing: "2.4px",
            }}
          >
            AgentDiff reference
          </div>

          <div
            style={{
              color: COLORS.fg,
              fontSize: 66,
              lineHeight: 1,
              letterSpacing: "-1.5px",
              marginTop: 18,
            }}
          >
            Documentation
          </div>

          <div
            style={{
              color: COLORS.muted,
              fontSize: 19,
              lineHeight: 1.55,
              marginTop: 16,
            }}
          >
            Compare agent execution traces as DAGs in CI/CD — and gate on drift, loops &amp; cost.
          </div>

          {/* section list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26 }}>
            {SECTIONS.map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: COLORS.accent }} />
                <span style={{ fontSize: 15, color: COLORS.fg }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — docs page card */}
        <DocCard />
      </div>
    </div>,
    {
      ...size,
    },
  );
}