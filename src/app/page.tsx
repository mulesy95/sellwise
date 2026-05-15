import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "SellWise — Coming Soon",
  description:
    "AI-powered SEO for online sellers. Optimise your Etsy, Amazon, and Shopify listings in seconds. Launching soon.",
  openGraph: {
    title: "SellWise — Coming Soon",
    description:
      "AI-powered SEO for online sellers. Optimise your Etsy, Amazon, and Shopify listings in seconds. Launching soon.",
    url: "/",
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (code) redirect(`/auth/callback?code=${code}`);
  return <ComingSoon />;
}
