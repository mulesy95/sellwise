import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing. Start free and upgrade when you're ready. Plans from $19/month for unlimited AI listing optimisation.",
  openGraph: {
    title: "Pricing | SellWise",
    description:
      "Simple, transparent pricing. Start free and upgrade when you're ready. Plans from $19/month.",
    url: "/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
