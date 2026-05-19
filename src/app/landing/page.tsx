import { headers } from "next/headers";
import { MarketingLanding } from "@/components/marketing-landing";

export default async function LandingPreviewPage() {
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country");
  const currency = country === "AU" ? "AUD" : "USD";
  return <MarketingLanding currency={currency} />;
}
