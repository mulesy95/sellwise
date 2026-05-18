import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SellWise — AI Listing Optimiser for Marketplace Sellers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "80px",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: "56px",
            fontWeight: "800",
            marginBottom: "32px",
            letterSpacing: "-1px",
          }}
        >
          <span style={{ color: "#fafafa" }}>Sell</span>
          <span style={{ color: "#f0873b" }}>Wise</span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "42px",
            fontWeight: "700",
            color: "#fafafa",
            textAlign: "center",
            lineHeight: "1.2",
            maxWidth: "820px",
            marginBottom: "20px",
          }}
        >
          Post listings that buyers actually find.
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: "22px",
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "680px",
            marginBottom: "48px",
          }}
        >
          AI-optimised titles, tags and descriptions for Etsy, Amazon, Shopify and eBay.
        </div>

        {/* Platform pills */}
        <div style={{ display: "flex", gap: "12px" }}>
          {["Etsy", "Amazon", "Shopify", "eBay"].map((p) => (
            <div
              key={p}
              style={{
                padding: "10px 24px",
                borderRadius: "999px",
                border: "1px solid #27272a",
                background: "#18181b",
                color: "#a1a1aa",
                fontSize: "17px",
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
