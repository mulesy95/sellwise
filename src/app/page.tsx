import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ComingSoon } from "@/components/coming-soon";
import { MarketingLanding } from "@/components/marketing-landing";

export const metadata: Metadata = {
  title: "SellWise — AI Listing Optimiser for Online Sellers",
  description:
    "AI-powered listing optimiser for Shopify, eBay, Amazon, and more. Better titles, tags, and descriptions in seconds.",
  openGraph: {
    title: "SellWise — AI Listing Optimiser for Online Sellers",
    description:
      "AI-powered listing optimiser for Shopify, eBay, Amazon, and more. Better titles, tags, and descriptions in seconds.",
    url: "/",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "SellWise — AI Listing Optimiser" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SellWise — AI Listing Optimiser for Online Sellers",
    description:
      "AI-powered listing optimiser for Shopify, eBay, Amazon, and more. Better titles, tags, and descriptions in seconds.",
    images: ["/api/og"],
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (code) redirect(`/auth/callback?code=${code}`);
  const comingSoon = process.env.NEXT_PUBLIC_COMING_SOON === "true";
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country");
  const currency = country === "AU" ? "AUD" : "USD";
  return comingSoon ? <ComingSoon /> : <MarketingLanding currency={currency} />;
}
