import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ShopDashboard } from "./shop-dashboard";

export const metadata = { title: "My Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const [{ data: profile }, { data: shops }] = await Promise.all([
    admin.from("profiles").select("plan").eq("id", user.id).single(),
    admin
      .from("shops")
      .select("id, shop_name, shop_url, shop_id, platform, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const plan = profile?.plan ?? "free";
  const params = await searchParams;

  return (
    <ShopDashboard
      plan={plan}
      shops={shops ?? []}
      connected={params.connected === "true"}
      error={params.error}
    />
  );
}
