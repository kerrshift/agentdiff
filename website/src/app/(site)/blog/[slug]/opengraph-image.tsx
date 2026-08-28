import { ImageResponse } from "next/og";
import { getAllPosts, getPost, formatDate } from "../../../../lib/blog";

/**
 * Branded social card prerendered per blog post at build time. Same brand
 * treatment as the docs cards (light editorial surface, black logo tile,
 * green accent) with a type badge + date so each post's card reads as an
 * article, not a doc page.
 */

export const size = { width: 1200, height: 630 };
export const dynamic = "force-static";
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

const TYPE_COLORS: Record<string, string> = {
  engineering: "#0fa47f",
  guide: "#3b82f6",
  product: "#d97706",
};

function LogoMark() {
  return (
    <div
      style={{
        width: 26,
        height: 26,
        position: "relative",
        display: "flex",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 11, width: 5, height: 5, borderRadius: 999, background: "#fbfbfc", display: "flex" }} />
      <div style={{ position: "absolute", left: 4, top: 12, width: 13, height: 2.6, background: "#fbfbfc", borderRadius: 999, display: "flex" }} />
      <div style={{ position: "absolute", left: 14, top: 9.5, width: 10, height: 2.6, background: "#fbfbfc", borderRadius: 999, transform: "rotate(-19deg)", transformOrigin: "left center", display: "flex" }} />
      <div style={{ position: "absolute", left: 14, top: 12.5, width: 10, height: 2.6, background: "#fbfbfc", borderRadius: 999, transform: "rotate(19deg)", transformOrigin: "left center", display: "flex" }} />
      <div style={{ position: "absolute", left: 21, top: 5.5, width: 3.5, height: 3.5, borderRadius: 999, background: "#fbfbfc", display: "flex" }} />
      <div style={{ position: "absolute", left: 21, top: 17, width: 3.5, height: 3.5, borderRadius: 999, background: "#fbfbfc", display: "flex" }} />
    </div>
  );
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  const typeColor = TYPE_COLORS[post?.type ?? ""] ?? "#a1a1aa";

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
              color: typeColor,
              border: `1px solid ${typeColor}55`,
              borderRadius: 999,
              padding: "2px 14px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {post?.type ?? "post"}
          </div>
          <div style={{ fontSize: 20, color: "#a1a1aa", fontFamily: "monospace" }}>
            {formatDate(post?.date ?? "")}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              width: 84,
              height: 8,
              background: typeColor,
              borderRadius: 999,
              marginBottom: 28,
            }}
          />
          <div
            style={{
              fontSize: post && post.title.length > 42 ? 54 : post && post.title.length > 24 ? 64 : 76,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.12,
              maxWidth: 980,
            }}
          >
            {post?.title ?? slug}
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
          <span>{`agentdiff.lostmartian.in/blog/${slug}`}</span>
        </div>
      </div>
    ),
    size,
  );
}
