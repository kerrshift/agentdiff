import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Automatically picked up by Next.js App Router as the browser favicon
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontSize: 13,
          fontWeight: 700,
          color: "white",
          letterSpacing: "-0.5px",
        }}
      >
        ad
      </div>
    ),
    { ...size }
  );
}
