import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "AI Listing Optimiser for Marketplace Sellers";

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
            width: 600,
            height: 600,
            background: "radial-gradient(circle, rgba(240,135,59,0.12) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            fontSize: 80,
            fontWeight: 800,
            letterSpacing: "-3px",
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#f2f2f2" }}>Sell</span>
          <span style={{ color: "#f0873b" }}>Wise</span>
        </div>

        {/* Title / tagline */}
        <div
          style={{
            color: "#a0a0a0",
            fontSize: 28,
            fontWeight: 400,
            marginTop: 20,
            textAlign: "center",
            maxWidth: 720,
            lineHeight: 1.4,
          }}
        >
          {title}
        </div>

        {/* Platform pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 52,
          }}
        >
          {["Etsy", "Amazon", "Shopify", "eBay"].map((p) => (
            <div
              key={p}
              style={{
                background: "#1f1f1f",
                border: "1px solid #2e2e2e",
                borderRadius: 999,
                padding: "10px 24px",
                color: "#c8c8c8",
                fontSize: 20,
                fontWeight: 500,
              }}
            >
              {p}
            </div>
          ))}
        </div>

        {/* URL watermark */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            right: 48,
            color: "#3a3a3a",
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "0.5px",
          }}
        >
          sellwise.au
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
