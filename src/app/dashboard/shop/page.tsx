import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ShopDashboard } from "./shop-dashboard";

export const metadata = { title: "My Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string; platform?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const [{ data: profile }, { data: etsyShop }, { data: shopifyShop }] =
    await Promise.all([
      admin.from("profiles").select("plan").eq("id", user.id).single(),
      admin
        .from("shops")
        .select("id, shop_name, shop_url, shop_id, platform, created_at")
        .eq("user_id", user.id)
        .eq("platform", "etsy")
        .maybeSingle(),
      admin
        .from("shops")
        .select("id, shop_name, shop_url, shop_id, platform, created_at")
        .eq("user_id", user.id)
        .eq("platform", "shopify")
        .maybeSingle(),
    ]);

  const plan = profile?.plan ?? "free";
  const params = await searchParams;

  return (
    <ShopDashboard
      plan={plan}
      etsyShop={etsyShop}
      shopifyShop={shopifyShop}
      connected={params.connected === "true"}
      connectedPlatform={(params.platform as "etsy" | "shopify") ?? undefined}
      error={params.error}
      errorPlatform={(params.platform as "etsy" | "shopify") ?? undefined}
    />
  );
}
