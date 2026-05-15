import type { Metadata } from "next";
import { PricingClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free, upgrade when you're ready. Plans from $0 to $79/month for Etsy, Amazon, and Shopify sellers.",
  openGraph: {
    title: "SellWise Pricing — Plans for Every Seller",
    description:
      "Start free, upgrade when you're ready. Plans from $0 to $79/month for Etsy, Amazon, and Shopify sellers.",
    url: "/pricing",
    images: [{ url: "/api/og?title=Simple%2C+transparent+pricing", width: 1200, height: 630, alt: "SellWise Pricing" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=Simple%2C+transparent+pricing"],
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
