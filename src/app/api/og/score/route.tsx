import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const score = parseInt(searchParams.get("score") ?? "0");
  const platform = searchParams.get("platform") ?? "etsy";
  const label = searchParams.get("label") ?? "Good";
  const improvements = parseInt(searchParams.get("improvements") ?? "0");

  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);
  const scoreColour = score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
  const glowColour = score >= 70 ? "#34d39918" : score >= 40 ? "#fbbf2418" : "#f8717118";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#141414",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700,
            height: 700,
            background: `radial-gradient(circle, ${glowColour} 0%, transparent 70%)`,
            borderRadius: "50%",
          }}
        />

        {/* Logo — top left */}
        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-1px",
            position: "absolute",
            top: 48,
            left: 60,
          }}
        >
          <span style={{ color: "#f2f2f2" }}>Sell</span>
          <span style={{ color: "#f0873b" }}>Wise</span>
        </div>

        {/* Platform chip — top right */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 44,
            right: 60,
            background: "#1e1e1e",
            border: "1px solid #2c2c2c",
            borderRadius: 999,
            padding: "10px 22px",
            color: "#a0a0a0",
            fontSize: 18,
            fontWeight: 500,
          }}
        >
          {platformLabel} listing audit
        </div>

        {/* Score */}
        <div
          style={{
            display: "flex",
            fontSize: 168,
            fontWeight: 800,
            color: scoreColour,
            lineHeight: 1,
            letterSpacing: "-8px",
          }}
        >
          {score}
        </div>

        {/* Out of 100 */}
        <div
          style={{
            display: "flex",
            color: "#404040",
            fontSize: 28,
            fontWeight: 500,
            marginTop: 8,
            letterSpacing: "0.5px",
          }}
        >
          out of 100
        </div>

        {/* Status label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 20,
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: scoreColour,
            }}
          />
          <span style={{ color: "#c0c0c0", fontSize: 26, fontWeight: 600 }}>
            {label}
          </span>
        </div>

        {/* Improvements pill */}
        {improvements > 0 && (
          <div
            style={{
              display: "flex",
              marginTop: 36,
              background: "#1a1a1a",
              border: "1px solid #282828",
              borderRadius: 14,
              padding: "12px 26px",
              color: "#686868",
              fontSize: 19,
              fontWeight: 400,
            }}
          >
            {improvements} improvement{improvements !== 1 ? "s" : ""} identified
          </div>
        )}

        {/* Footer CTA */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 40,
            color: "#333",
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: "0.3px",
          }}
        >
          Score your listing free at sellwise.au
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
