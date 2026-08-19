import { ImageResponse } from "next/og";
import LogoMark from "@/components/LogoMark";

export const alt = "AgentDiff — Trajectory Regression Testing for AI Agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

// next/og ships a bundled default sans (Geist — close to Manrope), so no
// font files need to live in the repo. Hierarchy is expressed via size/color.

// Landing palette (light theme, matching the marketing page).
const COLORS = {
  bg: "#FBFBFC",
  surface: "#FFFFFF",
  border: "#E4E4E7",
  fg: "#18181B",
  muted: "#52525B",
  faint: "#A1A1AA",
  accent: "#0FA47F",
  termBg: "#0A0B0C",
  termChrome: "#0D0E10",
  termBorder: "#2A2D33",
  termLine: "#23262B",
  termText: "#A1A1AA",
  termBright: "#C9CDD3",
  fail: "#E5484D",
};

// Compact diff-report rows shown in the hero terminal card.
const TERMINAL_ROWS: Array<{ label: string; value: string }> = [
  { label: "TDI", value: "divergence     0.42" },
  { label: "WEI", value: "wasted effort  0.22" },
  { label: "LOOPS", value: "tool loop       ×3" },
  { label: "ΔCOST", value: "cost           +148%" },
];

const FORMATS = [
  "Generic JSON",
  "OpenInference",
  "Langfuse",
  "LangSmith",
  "OpenAI Agents",
];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: COLORS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "48px 60px 42px",
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
          <span style={{ color: COLORS.fg, fontSize: 26, letterSpacing: "-0.3px" }}>agentdiff</span>
          <span
            style={{
              fontSize: 13,
              color: COLORS.faint,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              padding: "3px 8px",
            }}
          >
            v0.1.0
          </span>
        </div>

        {/* Main: copy + terminal */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 48, minHeight: 0 }}>
          {/* Left — pitch copy */}
          <div style={{ display: "flex", flexDirection: "column", width: 604, flexShrink: 0 }}>
            <div
              style={{
                fontSize: 15,
                color: COLORS.faint,
                textTransform: "uppercase",
                letterSpacing: "2.4px",
              }}
            >
              Trajectory regression testing for AI agents
            </div>

            <div
              style={{
                color: COLORS.fg,
                fontSize: 58,
                lineHeight: 1.04,
                letterSpacing: "-1.2px",
                marginTop: 22,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span>Static assertions</span>
              <span>can&apos;t test AI agents.</span>
            </div>

            <div
              style={{
                color: COLORS.muted,
                fontSize: 21,
                lineHeight: 1.5,
                marginTop: 20,
                maxWidth: 560,
              }}
            >
              AgentDiff diffs every agent run against a baseline as a DAG — and blocks drift, tool loops, and cost spikes in CI/CD.
            </div>

            {/* Install pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 30,
                alignSelf: "flex-start",
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                borderRadius: 12,
                padding: "15px 20px",
                fontSize: 19,
              }}
            >
              <span style={{ color: COLORS.accent }}>$</span>
              <span style={{ color: COLORS.fg }}>pip install agent-trajectory-diff</span>
            </div>
          </div>

          {/* Right — product terminal */}
          <div
            style={{
              flex: 1,
              border: `1px solid ${COLORS.termBorder}`,
              borderRadius: 14,
              background: COLORS.termBg,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* chrome */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 42,
                padding: "0 16px",
                background: COLORS.termChrome,
                borderBottom: `1px solid ${COLORS.termLine}`,
                fontSize: 12,
                color: "#6B7480",
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 999, background: COLORS.termBorder }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: COLORS.termBorder }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: COLORS.termBorder }} />
              <span style={{ marginLeft: 10 }}>agentdiff — main</span>
              <div style={{ flex: 1 }} />
              <span
                style={{
                  fontSize: 11,
                  color: COLORS.fail,
                  background: "rgba(229,72,77,0.12)",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                FAIL
              </span>
            </div>

            {/* body */}
            <div style={{ padding: "22px 22px 24px", display: "flex", flexDirection: "column", gap: 3, fontSize: 15 }}>
              <div style={{ color: COLORS.termText, lineHeight: 1.6 }}>
                $ agentdiff baseline.json candidate.json \
              </div>
              <div style={{ color: COLORS.termText, lineHeight: 1.6, marginBottom: 6 }}>
                &nbsp;&nbsp;&nbsp;&nbsp;--fail-on-regression --max-divergence 0.25
              </div>

              <div style={{ fontSize: 15, color: COLORS.termText, marginTop: 4 }}>metrics</div>
              <div style={{ color: COLORS.termLine, fontSize: 15 }}>────────────────────────</div>

              {TERMINAL_ROWS.map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 15,
                    lineHeight: 1.9,
                  }}
                >
                  <span style={{ color: COLORS.termBright, width: 84, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ color: COLORS.termText, flex: 1 }}>{row.value}</span>
                  <span
                    style={{
                      color: COLORS.fail,
                      fontSize: 13,
                      background: "rgba(229,72,77,0.12)",
                      padding: "1px 7px",
                      borderRadius: 5,
                    }}
                  >
                    FAIL
                  </span>
                </div>
              ))}

              <div style={{ color: COLORS.termLine, fontSize: 15 }}>────────────────────────</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2, fontSize: 15 }}>
                <span style={{ color: COLORS.fail }}>verdict&nbsp;&nbsp;FAIL</span>
                <span style={{ color: "#6B7480", fontSize: 13 }}>exit code 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom — supported formats */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 30, height: 3, borderRadius: 999, background: COLORS.accent }} />
          <span
            style={{
              fontSize: 14,
              color: COLORS.faint,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {FORMATS.map((f, i) => (
              <span key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {i > 0 && <span style={{ color: COLORS.border }}>·</span>}
                <span>{f}</span>
              </span>
            ))}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}