import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "#0f0f0f",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Orange accent bar — bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#f0873b",
          }}
        />
        {/* Large spark dot — top right */}
        <div
          style={{
            position: "absolute",
            top: 22,
            right: 22,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#f0873b",
          }}
        />
        {/* Small spark dot — top right inner */}
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 48,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "rgba(240,135,59,0.5)",
          }}
        />
        {/* "S" mark */}
        <span
          style={{
            color: "white",
            fontSize: 96,
            fontWeight: 900,
            fontFamily: "system-ui, -apple-system, sans-serif",
            letterSpacing: "-4px",
            lineHeight: 1,
            marginBottom: 14,
          }}
        >
          S
        </span>
        {/* SELLWISE wordmark below */}
        <span
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "system-ui, -apple-system, sans-serif",
            letterSpacing: "3px",
            lineHeight: 1,
          }}
        >
          SELLWISE
        </span>
      </div>
    ),
    { ...size }
  );
}
