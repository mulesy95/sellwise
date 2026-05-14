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
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#7c3aed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ color: "white", fontSize: "28px" }}>✦</div>
          </div>
          <div style={{ display: "flex", fontSize: "48px", fontWeight: "700" }}>
            <span style={{ color: "#fafafa" }}>Sell</span>
            <span style={{ color: "#a78bfa" }}>Wise</span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "40px",
            fontWeight: "700",
            color: "#fafafa",
            textAlign: "center",
            lineHeight: "1.2",
            maxWidth: "800px",
            marginBottom: "20px",
          }}
        >
          AI Listing Optimiser for Marketplace Sellers
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: "22px",
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          Titles, tags &amp; descriptions that rank — in seconds.
          Etsy, Amazon, Shopify &amp; eBay.
        </div>

        {/* Platform pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "40px",
          }}
        >
          {["Etsy", "Amazon", "Shopify", "eBay"].map((p) => (
            <div
              key={p}
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                border: "1px solid #3f3f46",
                color: "#a1a1aa",
                fontSize: "16px",
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
