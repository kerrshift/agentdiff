import { ImageResponse } from "next/og";

/**
 * Section-level social card for /blog itself. Also claims the
 * /blog/opengraph-image path explicitly so it never falls through to the
 * [slug] route (which would otherwise try to render a post literally named
 * "opengraph-image"). Mirrors the docs/landing brand treatment: light
 * editorial surface, black logo tile, green accent bar.
 */

export const size = { width: 1200, height: 630 };
export const dynamic = "force-static";
export const contentType = "image/png";

/** The trajectory-DAG logo mark, drawn with divs (satori has no SVG paths). */
function LogoMark({ scale = 1 }: { scale?: number }) {
  return (
    <div
      style={{
        width: 26 * scale,
        height: 26 * scale,
        position: "relative",
        display: "flex",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 11 * scale, width: 5 * scale, height: 5 * scale, borderRadius: 999, background: "#fbfbfc", display: "flex" }} />
      <div style={{ position: "absolute", left: 4 * scale, top: 12 * scale, width: 13 * scale, height: 2.6 * scale, background: "#fbfbfc", borderRadius: 999, display: "flex" }} />
      <div style={{ position: "absolute", left: 14 * scale, top: 9.5 * scale, width: 10 * scale, height: 2.6 * scale, background: "#fbfbfc", borderRadius: 999, transform: "rotate(-19deg)", transformOrigin: "left center", display: "flex" }} />
      <div style={{ position: "absolute", left: 14 * scale, top: 12.5 * scale, width: 10 * scale, height: 2.6 * scale, background: "#fbfbfc", borderRadius: 999, transform: "rotate(19deg)", transformOrigin: "left center", display: "flex" }} />
      <div style={{ position: "absolute", left: 21 * scale, top: 5.5 * scale, width: 3.5 * scale, height: 3.5 * scale, borderRadius: 999, background: "#fbfbfc", display: "flex" }} />
      <div style={{ position: "absolute", left: 21 * scale, top: 17 * scale, width: 3.5 * scale, height: 3.5 * scale, borderRadius: 999, background: "#fbfbfc", display: "flex" }} />
    </div>
  );
}

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
            <LogoMark />
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>
            agentdiff
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#a1a1aa",
              border: "1px solid #e4e4e7",
              borderRadius: 999,
              padding: "2px 14px",
            }}
          >
            blog
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              width: 84,
              height: 8,
              background: "#0fa47f",
              borderRadius: 999,
              marginBottom: 28,
            }}
          />
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
            }}
          >
            Notes on building
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: "#a1a1aa",
            }}
          >
            trustworthy agents.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#a1a1aa",
            fontSize: 22,
          }}
        >
          <span>Trajectory regression testing for AI agents</span>
          <span>agentdiff.app/blog</span>
        </div>
      </div>
    ),
    size,
  );
}
