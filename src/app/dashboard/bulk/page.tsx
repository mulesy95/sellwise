import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BulkClient } from "./bulk-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bulk Optimiser — SellWise",
  description: "Upload a CSV and optimise all your listings at once.",
};

export default async function BulkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  return <BulkClient plan={profile?.plan ?? "free"} />;
}
