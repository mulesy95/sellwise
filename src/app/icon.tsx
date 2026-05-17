import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: "#0f0f0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Orange bottom-left accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 14,
            height: 3,
            background: "#f0873b",
            borderRadius: "0 2px 0 0",
          }}
        />
        {/* Small orange spark dot — top right */}
        <div
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#f0873b",
          }}
        />
        {/* "S" mark */}
        <span
          style={{
            color: "white",
            fontSize: 17,
            fontWeight: 900,
            fontFamily: "system-ui, -apple-system, sans-serif",
            letterSpacing: "-0.5px",
            lineHeight: 1,
            marginBottom: 3,
            marginRight: 1,
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
