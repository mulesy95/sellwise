import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SellWise Pricing — Start free, upgrade when ready";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const plans = [
  { name: "Free", price: "$0", detail: "1 optimisation/mo" },
  { name: "Starter", price: "$19", detail: "50 optimisations + all features" },
  { name: "Growth", price: "$29", detail: "Unlimited + shop connect", highlight: true },
  { name: "Studio", price: "$79", detail: "Multi-shop + push-back" },
];

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
          padding: "64px 80px",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: "40px",
            fontWeight: "800",
            marginBottom: "12px",
            letterSpacing: "-1px",
          }}
        >
          <span style={{ color: "#fafafa" }}>Sell</span>
          <span style={{ color: "#f0873b" }}>Wise</span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "38px",
            fontWeight: "700",
            color: "#fafafa",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          Simple pricing, no surprises.
        </div>
        <div
          style={{
            fontSize: "20px",
            color: "#a1a1aa",
            textAlign: "center",
            marginBottom: "44px",
          }}
        >
          Start free. Upgrade when you are ready.
        </div>

        {/* Plan cards */}
        <div style={{ display: "flex", gap: "16px", width: "100%" }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "24px 16px",
                borderRadius: "12px",
                border: plan.highlight ? "2px solid #f0873b" : "1px solid #27272a",
                background: "#18181b",
              }}
            >
              <div style={{ fontSize: "15px", fontWeight: "600", color: "#fafafa", marginBottom: "10px" }}>
                {plan.name}
              </div>
              <div style={{ fontSize: "30px", fontWeight: "800", color: "#fafafa", marginBottom: "8px" }}>
                {plan.price}
                {plan.price !== "$0" && (
                  <span style={{ fontSize: "14px", fontWeight: "400", color: "#71717a" }}>/mo</span>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "#71717a", textAlign: "center", lineHeight: "1.4" }}>
                {plan.detail}
              </div>
              {plan.highlight && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "4px 12px",
                    borderRadius: "999px",
                    background: "#f0873b",
                    color: "#18181b",
                    fontSize: "11px",
                    fontWeight: "700",
                  }}
                >
                  POPULAR
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ fontSize: "15px", color: "#52525b", marginTop: "28px" }}>
          7-day free trial on all paid plans. No card required to start.
        </div>
      </div>
    ),
    { ...size }
  );
}
