import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not authed" }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: profile }, { data: usage }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).single(),
    admin.from("usage").select("*").eq("user_id", user.id),
  ]);

  return NextResponse.json({ userId: user.id, profile, usage });
}
