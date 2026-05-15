import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Plans from $19/mo",
  description:
    "Start free. Upgrade when you're ready. Plans from $19/mo for Etsy, Amazon, and Shopify sellers. Unlimited AI listing optimisation on Growth.",
  openGraph: {
    title: "SellWise Pricing — Plans from $19/mo",
    description:
      "Start free. Upgrade when you're ready. Plans from $19/mo for Etsy, Amazon, and Shopify sellers.",
    url: "/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
