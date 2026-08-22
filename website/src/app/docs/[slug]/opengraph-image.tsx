import { ImageResponse } from "next/og";
import { getAllDocs, getDoc } from "../../../lib/docs";

/**
 * Branded social card prerendered per guide at build time. Replaces the
 * generic /og.png when any doc route is shared on Slack/X/Discord etc.
 * Works under `output: export` because each card is statically generated.
 */

export const size = { width: 1200, height: 630 };
export const dynamic = "force-static";

export function generateStaticParams() {
  // One prerendered card per guide slug.
  return getAllDocs().map((d) => ({ slug: d.slug }));
}
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getDoc(slug);

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
          background: "#0b0c0e",
          color: "#e8eaed",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#e8eaed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
<div
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                background: "#0b0c0e",
                display: "flex",
              }}
            />
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>
            agentdiff
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#6b7480",
              border: "1px solid #3a3f46",
              borderRadius: 999,
              padding: "2px 14px",
            }}
          >
            {`docs · ${doc?.category ?? "guide"}`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              width: 84,
              height: 8,
              background: "#34d399",
              borderRadius: 999,
              marginBottom: 28,
            }}
          />
          <div
            style={{
              fontSize: doc && doc.title.length > 24 ? 64 : 76,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              maxWidth: 940,
            }}
          >
            {doc?.title ?? slug}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#6b7480",
            fontSize: 22,
          }}
        >
          <span>Trajectory regression testing for AI agents</span>
          <span>{`agentdiff.lostmartian.in/docs/${slug}`}</span>
        </div>
      </div>
    ),
    size,
  );
}
