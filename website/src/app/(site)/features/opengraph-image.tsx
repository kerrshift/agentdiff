import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const dynamic = "force-static";
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#fbfbfc",
          color: "#18181b",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#18181b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 26, height: 26, position: "relative", display: "flex" }}>
              <div style={{ position: "absolute", left: 0, top: 11, width: 5, height: 5, borderRadius: 999, background: "#fbfbfc", display: "flex" }} />
              <div style={{ position: "absolute", left: 4, top: 12, width: 13, height: 2.6, background: "#fbfbfc", borderRadius: 999, display: "flex" }} />
              <div style={{ position: "absolute", left: 14, top: 9.5, width: 10, height: 2.6, background: "#fbfbfc", borderRadius: 999, transform: "rotate(-19deg)", transformOrigin: "left center", display: "flex" }} />
              <div style={{ position: "absolute", left: 14, top: 12.5, width: 10, height: 2.6, background: "#fbfbfc", borderRadius: 999, transform: "rotate(19deg)", transformOrigin: "left center", display: "flex" }} />
              <div style={{ position: "absolute", left: 21, top: 5.5, width: 3.5, height: 3.5, borderRadius: 999, background: "#fbfbfc", display: "flex" }} />
              <div style={{ position: "absolute", left: 21, top: 17, width: 3.5, height: 3.5, borderRadius: 999, background: "#fbfbfc", display: "flex" }} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>agentdiff</div>
          <div style={{ fontSize: 20, color: "#a1a1aa", border: "1px solid #e4e4e7", borderRadius: 999, padding: "2px 14px" }}>features</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ width: 84, height: 8, background: "#0fa47f", borderRadius: 999, marginBottom: 28 }} />
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Everything you need
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#a1a1aa" }}>
            to gate AI agents.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#a1a1aa", fontSize: 22 }}>
          <span>Trajectory regression testing for AI agents</span>
          <span>agentdiff.app/features</span>
        </div>
      </div>
    ),
    size,
  );
}
